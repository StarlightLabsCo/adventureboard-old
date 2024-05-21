import { DurableObject } from 'cloudflare:workers';

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	GAME_INSTANCES: DurableObjectNamespace<GameInstance>;
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

interface Connections {
	[connectionId: string]: Connection;
}

interface Connection {
	connectionId: string;
	presence: Presence;
}

interface Presence {
	cursor: { x: number; y: number } | null;
	// Add other presence-related fields here
}

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

		await this.addConnection(connectionId);

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

		this.broadcast(ws, message);
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string) {
		ws.close(code, reason);

		const tags = this.ctx.getTags(ws);
		const connectionId = tags ? tags[0] : null;

		if (connectionId) {
			await this.removeConnection(connectionId);
		}
	}

	broadcast(ws: WebSocket, message: string) {
		this.ctx.getWebSockets().forEach((client) => {
			if (client !== ws) client.send(message);
		});
	}

	/* Connections */
	async addConnection(connectionId: string) {
		const connections = (await this.ctx.storage.get<Connections>('connections')) || {};
		connections[connectionId] = { connectionId, presence: { cursor: null } };
		this.ctx.storage.put('connections', connections);

		// TODO: Broadcast change
	}

	async removeConnection(connectionId: string) {
		const connections = (await this.ctx.storage.get<Connections>('connections')) || {};
		delete connections[connectionId];
		this.ctx.storage.put('connections', connections);

		// TODO: Broadcast change
	}

	/* Presence */
	async updatePresence(connectionId: string, presence: Presence) {
		const connections = (await this.ctx.storage.get<Connections>('connections')) || {};
		connections[connectionId].presence = presence;
		this.ctx.storage.put('connections', connections);

		// TODO: Broadcast change
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		const pathParts = url.pathname.split('/');
		if (pathParts[1] === 'game' && pathParts[2]) {
			const id = env.GAME_INSTANCES.idFromName(pathParts[2]);
			const stub = env.GAME_INSTANCES.get(id);
			return stub.fetch(request);
		}

		return new Response('Not found', { status: 404 });
	},
};
