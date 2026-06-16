// Verstak Plugin SDK — RPC Client for Sidecar Communication
/**
 * RPC клиент для общения backend sidecar с core платформы.
 * Использует JSON-RPC 2.0 протокол.
 */
export class RPCServer {
    handlers = new Map();
    constructor() {
    }
    /**
     * Зарегистрировать обработчик RPC метода.
     */
    registerMethod(method, handler) {
        this.handlers.set(method, handler);
    }
    /**
     * Обработать входящий RPC запрос.
     */
    async handleRequest(request) {
        const handler = this.handlers.get(request.method);
        if (!handler) {
            return {
                jsonrpc: '2.0',
                id: request.id,
                error: { code: -32601, message: `Method not found: ${request.method}` }
            };
        }
        try {
            const result = await handler(request.params);
            return { jsonrpc: '2.0', id: request.id, result };
        }
        catch (err) {
            return {
                jsonrpc: '2.0',
                id: request.id,
                error: { code: -32000, message: err instanceof Error ? err.message : String(err) }
            };
        }
    }
    /**
     * Создать RPC запрос.
     */
    createRequest(method, params = []) {
        return {
            jsonrpc: '2.0',
            id: `${Date.now()}:${Math.random()}`,
            method,
            params
        };
    }
    /**
     * Разобрать RPC ответ.
     */
    parseResponse(data) {
        return JSON.parse(data);
    }
}
/**
 * RPC клиент (для core, вызывает методы sidecar).
 */
export class RPCClient {
    requestId = 0;
    /**
     * Создать JSON-RPC запрос.
     */
    call(method, params = []) {
        const request = {
            jsonrpc: '2.0',
            id: `${++this.requestId}`,
            method,
            params
        };
        return JSON.stringify(request) + '\n';
    }
    /**
     * Разобрать ответ.
     */
    parseResponse(data) {
        return JSON.parse(data.trim());
    }
}
//# sourceMappingURL=rpc.js.map