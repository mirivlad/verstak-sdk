// Verstak Plugin SDK — bundled frontend plugin API contract.
//
// The desktop host creates the real API with createPluginAPI(pluginId) inside
// VerstakPluginAPI.js and passes it to bundled plugin components at mount time.
// This SDK file intentionally exposes the TypeScript contract only; it is not
// a standalone security boundary or RPC client.

import type {
  CapabilityEntry,
  FileEntry,
  FileMetadata,
  MovePathOptions,
  OpenResourceRequest,
  OpenResourceResult,
  PluginSettings,
  TrashResult,
  WriteTextOptions,
} from './types';

export type PluginCommandArgs = Record<string, unknown>;
export type PluginCommandHandler = (
  args: PluginCommandArgs,
  declaration: PluginCommandDeclaration
) => unknown | Promise<unknown>;
export type Unsubscribe = () => void;

export interface PluginCommandDeclaration {
  status: 'declared';
  pluginId: string;
  commandId: string;
  handler?: string;
  args?: PluginCommandArgs;
}

export interface PluginCommandResult {
  status: 'handled';
  pluginId: string;
  commandId: string;
  result: unknown;
}

export interface PluginEvent<TPayload = Record<string, unknown>> {
  name: string;
  pluginId: string;
  payload: TPayload;
  timestamp: string;
}

export interface SyncStatus {
  configured: boolean;
  serverUrl: string;
  deviceId: string;
  deviceName: string;
  connected: boolean;
  revoked: boolean;
  tokenStored: boolean;
  unpushedOps: number;
  lastSyncAt: string;
  syncInterval: number;
  lastError: string;
  statusLabel: string;
}

export interface SyncNowResult {
  pushed: number;
  pulled: number;
  serverSequence: number;
  conflicts?: unknown[];
  applyErrors?: string[];
}

export interface VerstakPluginAPI {
  readonly pluginId: string;

  settings: {
    read(): Promise<PluginSettings>;
    read<T = unknown>(key: string): Promise<T | undefined>;
    write(key: string, value: unknown): Promise<PluginSettings>;
    writeAll(settings: PluginSettings): Promise<void>;
  };

  capabilities: {
    has(capability: string): Promise<boolean>;
    get(capability: string): Promise<{ available: boolean; name?: string; pluginId?: string; status?: string }>;
    list(): Promise<CapabilityEntry[]>;
  };

  commands: {
    register(commandId: string, handler: PluginCommandHandler): Promise<Unsubscribe>;
    execute(commandId: string, args?: PluginCommandArgs): Promise<PluginCommandResult>;
  };

  events: {
    publish(eventName: string, payload?: Record<string, unknown>): Promise<void>;
    subscribe<TPayload = Record<string, unknown>>(
      eventName: string,
      handler: (event: PluginEvent<TPayload>) => void
    ): Promise<Unsubscribe>;
  };

  files: {
    /**
     * Files API uses canonical vault-relative slash paths. Backslashes,
     * Windows/UNC absolute paths, traversal, null bytes, `.verstak` variants,
     * and symlink read/write/move/trash operations are rejected by the host.
     */
    list(relativeDir?: string): Promise<FileEntry[]>;
    metadata(relativePath: string): Promise<FileMetadata>;
    readText(relativePath: string): Promise<string>;
    writeText(relativePath: string, content: string, options?: WriteTextOptions): Promise<void>;
    createFolder(relativePath: string): Promise<void>;
    move(fromRelativePath: string, toRelativePath: string, options?: MovePathOptions): Promise<void>;
    trash(relativePath: string): Promise<TrashResult>;
    openExternal(relativePath: string): Promise<void>;
    showInFolder(relativePath: string): Promise<void>;
  };

  workbench: {
    openResource(request: OpenResourceRequest): Promise<OpenResourceResult>;
    editResource(request: OpenResourceRequest): Promise<OpenResourceResult>;
  };

  sync: {
    status(): Promise<SyncStatus>;
    configure(serverUrl: string, username: string, password: string): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(serverUrl: string, username: string, password: string): Promise<void>;
    setInterval(minutes: number): Promise<void>;
    resetKey(): Promise<void>;
    now(): Promise<SyncNowResult>;
  };

  dispose?: () => void;
}

export function createPluginAPI(_pluginId: string): VerstakPluginAPI {
  throw new Error('createPluginAPI is provided by Verstak Desktop at plugin runtime');
}
