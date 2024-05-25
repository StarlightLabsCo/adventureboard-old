import { DurableObject } from 'cloudflare:workers';
import { Connections, Connection, Presence } from 'adventureboard-ws-types';
import { HistoryEntry, TLRecord, TLStoreSnapshot, createTLSchema, throttle } from 'tldraw';

export interface Env {
	GAME_INSTANCES: DurableObjectNamespace<GameInstance>;
	DISCORD_API_BASE: string;
}

// TODO: implement yjs for shared state
// TODO: - presence (cusor, selection, etc)
// TODO: - canvas objects

// TODO: figure out a cleaner way to handle connections rather than sending the entire list every time

export class GameInstance extends DurableObject {
	private connections: Connections = {};
	private schema = createTLSchema();
	private records: Record<string, TLRecord> = {};

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		this.ctx.blockConcurrencyWhile(async () => {
			const storedConnections = await this.ctx.storage.get<Connections>('connections');
			this.connections = storedConnections || {};

			const snapshot = (await this.ctx.storage.get('snapshot')) as TLStoreSnapshot | undefined;
			if (!snapshot) return;

			const migrationResult = this.schema.migrateStoreSnapshot(snapshot);
			if (migrationResult.type === 'error') {
				throw new Error(migrationResult.reason);
			}

			this.records = migrationResult.value;
		});
	}

	async fetch(request: Request) {
		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response('Expected websocket', { status: 426 });
		}

		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		const connectionId = crypto.randomUUID();
		this.ctx.acceptWebSocket(server, [connectionId]);

		this.addConnection(connectionId);

		server.send(JSON.stringify({ type: 'connectionId', connectionId }));
		server.send(
			JSON.stringify({
				type: 'init',
				snapshot: { store: this.records, schema: this.schema.serialize() },
			}),
		);

		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(ws: WebSocket, message: string) {
		const data = JSON.parse(message);
		const connectionId = this.ctx.getTags(ws)[0];

		switch (data.type) {
			case 'presence':
				this.updatePresence(connectionId, data.presence);
				break;
			case 'update':
				try {
					data.updates.forEach((update: HistoryEntry<TLRecord>) => {
						const { added, updated, removed } = update.changes;
						Object.values(added).forEach((record) => (this.records[record.id] = record));
						Object.values(updated).forEach(([, to]) => (this.records[to.id] = to));
						Object.values(removed).forEach((record) => delete this.records[record.id]);
					});
					this.broadcast(message, [connectionId]);
					this.saveSnapshot();
				} catch (e) {
					ws.send(
						JSON.stringify({
							type: 'recovery',
							snapshot: { store: this.records, schema: this.schema.serialize() },
						}),
					);
				}
				break;
			case 'recovery':
				ws.send(
					JSON.stringify({
						type: 'recovery',
						snapshot: { store: this.records, schema: this.schema.serialize() },
					}),
				);
				break;
			default:
				break;
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string) {
		ws.close(code, reason);

		const tags = this.ctx.getTags(ws);
		const connectionId = tags ? tags[0] : null;

		if (connectionId) {
			this.removeConnection(connectionId);
		}
	}

	async broadcast(message: string, connectionIdsToExclude: string[] = []) {
		const webSockets = this.ctx.getWebSockets();

		webSockets.forEach((ws) => {
			const tags = this.ctx.getTags(ws);
			const connectionId = tags ? tags[0] : null;

			if (connectionId && !connectionIdsToExclude.includes(connectionId)) {
				ws.send(message);
			}
		});
	}

	saveSnapshot = throttle(async () => {
		await this.ctx.storage.put('snapshot', { store: this.records, schema: this.schema.serialize() });
	}, 1000);

	/* Connections */
	// We only put in storage on add/remove because we don't want to hit the storage on every presence update
	addConnection(connectionId: string) {
		this.connections[connectionId] = { connectionId, presence: { cursor: null } };
		this.broadcast(JSON.stringify({ type: 'connections', connections: this.connections }));
		this.ctx.storage.put('connections', this.connections);
	}

	removeConnection(connectionId: string) {
		delete this.connections[connectionId];
		this.broadcast(JSON.stringify({ type: 'connections', connections: this.connections }));
		this.ctx.storage.put('connections', this.connections);
	}

	/* Presence */
	updatePresence(connectionId: string, presence: Presence) {
		this.connections[connectionId].presence = presence;
		this.broadcast(JSON.stringify({ type: 'presence', connectionId, presence }));
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Authenticate as valid Discord user
		const accessToken = url.searchParams.get('access_token');

		if (!accessToken) {
			return new Response('Unauthorized', { status: 401 });
		}

		const userResponse = await fetch(`${env.DISCORD_API_BASE}/users/@me`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!userResponse.ok) {
			return new Response('Unauthorized', { status: 401 });
		}

		// Connect to game instance
		const pathParts = url.pathname.split('/');
		if (pathParts[1] === 'game' && pathParts[2]) {
			const id = env.GAME_INSTANCES.idFromName(pathParts[2]);
			const stub = env.GAME_INSTANCES.get(id);
			return stub.fetch(request);
		}

		return new Response('Not found', { status: 404 });
	},
};
