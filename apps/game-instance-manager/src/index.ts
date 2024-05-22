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
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async fetch(request: Request) {
		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response('Expected websocket', { status: 426 });
		}

		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		const connectionId = crypto.randomUUID();
		this.ctx.acceptWebSocket(server, [connectionId]);

		this.ctx.waitUntil(
			(async () => {
				await this.addConnection(connectionId);
				server.send(JSON.stringify({ type: 'connectionId', connectionId }));
			})(),
		);

		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(ws: WebSocket, message: string) {
		const data = JSON.parse(message);
		switch (data.type) {
			case 'presence':
				await this.updatePresence(data.connectionId, data.presence);
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
			await this.removeConnection(connectionId);
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
	async addConnection(connectionId: string) {
		const connections = (await this.ctx.storage.get<Connections>('connections')) || {};
		connections[connectionId] = { connectionId, presence: { cursor: null } };
		this.ctx.storage.put('connections', connections);

		this.broadcast(JSON.stringify({ type: 'connections', connections }));
	}

	async removeConnection(connectionId: string) {
		const connections = (await this.ctx.storage.get<Connections>('connections')) || {};
		delete connections[connectionId];
		this.ctx.storage.put('connections', connections);

		this.broadcast(JSON.stringify({ type: 'connections', connections }));
	}

	/* Presence */
	async updatePresence(connectionId: string, presence: Presence) {
		const connections = (await this.ctx.storage.get<Connections>('connections')) || {};
		connections[connectionId].presence = presence;
		this.ctx.storage.put('connections', connections);

		this.broadcast(JSON.stringify({ type: 'connections', connections }));
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
