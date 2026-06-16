export type RPCTransport = 'stdio' | 'tcp';
export interface RPCRequest {
    jsonrpc: '2.0';
    id: string;
    method: string;
    params: unknown[];
}
export interface RPCResponse {
    jsonrpc: '2.0';
    id: string;
    result?: unknown;
    error?: RPCError;
}
export interface RPCError {
    code: number;
    message: string;
    data?: unknown;
}
/**
 * RPC клиент для общения backend sidecar с core платформы.
 * Использует JSON-RPC 2.0 протокол.
 */
export declare class RPCServer {
    private handlers;
    constructor();
    /**
     * Зарегистрировать обработчик RPC метода.
     */
    registerMethod(method: string, handler: (params: unknown[]) => Promise<unknown>): void;
    /**
     * Обработать входящий RPC запрос.
     */
    handleRequest(request: RPCRequest): Promise<RPCResponse>;
    /**
     * Создать RPC запрос.
     */
    createRequest(method: string, params?: unknown[]): RPCRequest;
    /**
     * Разобрать RPC ответ.
     */
    parseResponse(data: string): RPCResponse;
}
/**
 * RPC клиент (для core, вызывает методы sidecar).
 */
export declare class RPCClient {
    private requestId;
    /**
     * Создать JSON-RPC запрос.
     */
    call(method: string, params?: unknown[]): string;
    /**
     * Разобрать ответ.
     */
    parseResponse(data: string): RPCResponse;
}
//# sourceMappingURL=rpc.d.ts.map