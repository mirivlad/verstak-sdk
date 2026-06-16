// Verstak Plugin SDK — RPC Client for Sidecar Communication

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
export class RPCServer {
  private handlers = new Map<string, (params: unknown[]) => Promise<unknown>>();

  constructor() {
  }

  /**
   * Зарегистрировать обработчик RPC метода.
   */
  registerMethod(method: string, handler: (params: unknown[]) => Promise<unknown>): void {
    this.handlers.set(method, handler);
  }

  /**
   * Обработать входящий RPC запрос.
   */
  async handleRequest(request: RPCRequest): Promise<RPCResponse> {
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
    } catch (err) {
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
  createRequest(method: string, params: unknown[] = []): RPCRequest {
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
  parseResponse(data: string): RPCResponse {
    return JSON.parse(data) as RPCResponse;
  }
}

/**
 * RPC клиент (для core, вызывает методы sidecar).
 */
export class RPCClient {
  private requestId = 0;

  /**
   * Создать JSON-RPC запрос.
   */
  call(method: string, params: unknown[] = []): string {
    const request: RPCRequest = {
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
  parseResponse(data: string): RPCResponse {
    return JSON.parse(data.trim()) as RPCResponse;
  }
}
