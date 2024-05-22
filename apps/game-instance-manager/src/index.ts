import { DurableObject } from 'cloudflare:workers';
import { Connections, Connection, Presence } from 'adventureboard-ws-types';

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	GAME_INSTANCES: DurableObjectNamespace<GameInstance>;
	DISCORD_API_BASE: string;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

// TODO: implement yjs for shared state
// TODO: - presence (cusor, selection, etc)
// TODO: - canvas objects

// TODO: figure out a cleaner way to handle connections rather than sending the entire list every time

export class GameInstance extends DurableObject {
	private connections: Connections = {};

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		this.ctx.blockConcurrencyWhile(async () => {
			const storedConnections = await this.ctx.storage.get<Connections>('connections');
			this.connections = storedConnections || {};
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

		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(ws: WebSocket, message: string) {
		const data = JSON.parse(message);
		switch (data.type) {
			case 'presence':
				this.updatePresence(this.ctx.getTags(ws)[0], data.presence);
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
		this.broadcast(JSON.stringify({ type: 'connections', connections: this.connections }));
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
