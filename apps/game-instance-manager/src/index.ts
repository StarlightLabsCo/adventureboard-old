import { DurableObject } from 'cloudflare:workers';
import { Connections, Presence } from 'adventureboard-ws-types';
import { HistoryEntry, TLRecord, TLStoreSnapshot, createTLSchema, throttle } from 'tldraw';
import { fetchDiscordUser, stripPrivateInfo } from '@/discord';
import { APIUser } from 'discord-api-types/v10';

export interface Env {
	GAME_INSTANCES: DurableObjectNamespace<GameInstance>;
	ADVENTUREBOARD_KV: KVNamespace; // KV keys: hostId-campaigns, hostId-selectedCampaignId, hostId-campaignId-snapshot
	DISCORD_API_BASE: string;
}

export class GameInstance extends DurableObject {
	env: Env;

	private connections: Connections = {};
	private schema = createTLSchema();
	private records: Record<string, TLRecord> = {};

	private host: string | null = null;
	private campaignId: string | null = null;

	// ------ Init ------
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		this.env = env;

		this.ctx.blockConcurrencyWhile(async () => {
			try {
				await this.loadConnections();

				await this.loadHost();
				await this.loadCampaign();
				await this.loadSnapshot();
			} catch (e) {
				console.error(e);
			}
		});
	}

	async loadConnections() {
		const storedConnections = await this.ctx.storage.get<Connections>('connections');
		this.connections = storedConnections || {};
	}

	async loadHost() {
		const storedHost = await this.ctx.storage.get<string | null>('host');
		this.host = storedHost || null;
	}

	async loadCampaign() {
		if (!this.host) return;

		const selectedCampaignId = await this.env.ADVENTUREBOARD_KV.get<string | null>(`${this.host}-selectedCampaignId`);
		if (selectedCampaignId) {
			this.campaignId = selectedCampaignId;
		} else {
			this.campaignId = crypto.randomUUID();
			try {
				await this.env.ADVENTUREBOARD_KV.put(`${this.host}-campaigns`, JSON.stringify([this.campaignId]));
				await this.env.ADVENTUREBOARD_KV.put(`${this.host}-selectedCampaignId`, this.campaignId);
			} catch (e) {
				console.error(e);
			}
		}
	}

	async loadSnapshot() {
		if (!this.host || !this.campaignId) return;

		const snapshotKey = `${this.host}-${this.campaignId}-snapshot`;
		const snapshot = await this.env.ADVENTUREBOARD_KV.get<TLStoreSnapshot>(snapshotKey, 'json');
		if (!snapshot) {
			// TODO: load default snapshot
			console.log(`No snapshot found. Instead found: ${typeof snapshot}`);
			return;
		}

		const migrationResult = this.schema.migrateStoreSnapshot(snapshot);
		if (migrationResult.type === 'error') {
			throw new Error(migrationResult.reason);
		}

		this.records = migrationResult.value;
	}

	// ------ New Connection ------
	async fetch(request: Request) {
		// Validation
		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response('Expected websocket', { status: 426 });
		}

		const discordUser = JSON.parse(request.headers.get('X-Discord-User') || '{}') as APIUser;
		if (!discordUser.id) {
			return new Response('Unauthorized', { status: 401 });
		}

		// Init GameInstance if brand new
		if (!this.host) {
			this.host = discordUser.id;
			await this.ctx.storage.put('host', this.host);

			await this.loadCampaign();
			await this.loadSnapshot();
		}

		// Init WebSocket
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		const connectionId = crypto.randomUUID();
		this.ctx.acceptWebSocket(server, [connectionId]);

		server.send(JSON.stringify({ type: 'connectionId', connectionId }));
		server.send(
			JSON.stringify({
				type: 'init',
				snapshot: { store: this.records, schema: this.schema.serialize() },
			}),
		);

		this.addConnection(connectionId, discordUser);

		return new Response(null, { status: 101, webSocket: client });
	}

	// ------ Existing Connection ------
	async webSocketMessage(ws: WebSocket, message: string) {
		const data = JSON.parse(message);
		const connectionId = this.ctx.getTags(ws)[0];

		switch (data.type) {
			case 'presence':
				this.updatePresence(connectionId, data.presence);
				break;
			case 'update':
				this.updateRecords(connectionId, data.updates, ws);
				break;
			case 'recovery':
				this.sendRecovery(ws);
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

	// ------ Helpers ------
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

	/* Connections */
	// We only put in storage on add/remove because we don't want to hit the storage on every presence update
	addConnection(connectionId: string, discordUser: APIUser) {
		this.connections[connectionId] = {
			connectionId,
			discordUser: stripPrivateInfo(discordUser),
			presence: { cursor: null },
			isHost: this.host === discordUser.id,
		};
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
		this.broadcast(JSON.stringify({ type: 'presence', connectionId, presence }), [connectionId]);
	}

	/* Records */
	saveSnapshot = throttle(async () => {
		if (!this.host || !this.campaignId) return;

		const snapshotKey = `${this.host}-${this.campaignId}-snapshot`;
		await this.env.ADVENTUREBOARD_KV.put(snapshotKey, JSON.stringify({ store: this.records, schema: this.schema.serialize() }));
	}, 1000);

	updateRecords(connectionId: string, updates: HistoryEntry<TLRecord>[], ws: WebSocket) {
		try {
			updates.forEach((update) => {
				const { added, updated, removed } = update.changes;
				Object.values(added).forEach((record) => (this.records[record.id] = record));
				Object.values(updated).forEach(([, to]) => (this.records[to.id] = to));
				Object.values(removed).forEach((record) => delete this.records[record.id]);
			});
			this.broadcast(JSON.stringify({ type: 'update', updates }), [connectionId]);
			this.saveSnapshot();
		} catch (e) {
			this.sendRecovery(ws);
		}
	}

	/* Recovery */
	sendRecovery(ws: WebSocket) {
		ws.send(
			JSON.stringify({
				type: 'recovery',
				snapshot: { store: this.records, schema: this.schema.serialize() },
			}),
		);
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const pathParts = url.pathname.split('/');

		if (pathParts[1] === 'game' && pathParts[2]) {
			const id = env.GAME_INSTANCES.idFromName(pathParts[2]);
			const stub = env.GAME_INSTANCES.get(id);

			const accessToken = url.searchParams.get('access_token');
			if (!accessToken) {
				return new Response('Unauthorized', { status: 401 });
			}

			const discordUser = await fetchDiscordUser(accessToken, env.DISCORD_API_BASE);
			if (!discordUser) {
				return new Response('Unauthorized', { status: 401 });
			}

			const newRequest = new Request(request, {
				headers: {
					...Object.fromEntries(request.headers),
					'X-Discord-User': JSON.stringify(discordUser),
				},
			});

			return stub.fetch(newRequest);
		}

		return new Response('Not found', { status: 404 });
	},
};
