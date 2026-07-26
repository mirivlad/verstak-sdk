// Verstak Plugin SDK — bundled frontend plugin API contract.
//
// The desktop host creates the real API with createPluginAPI(pluginId) inside
// VerstakPluginAPI.js and passes it to bundled plugin components at mount time.
// This SDK file intentionally exposes the TypeScript contract only; it is not
// a standalone security boundary or RPC client.

import type {
  CapabilityEntry,
  FileBytes,
  FileEntry,
  FileMetadata,
  ImportApplyResult,
  ImportEntryPage,
  ImportPlan,
  ImportProgress,
  ImportSourceSession,
  MovePathOptions,
  OpenResourceRequest,
  OpenResourceResult,
  PathTransfer,
  PluginSettings,
  RegisteredContributionPoints,
  RestoreTrashOptions,
  TransferOutcome,
  TransferProgress,
  TrashEntry,
  TrashResult,
  WriteTextOptions,
} from './types';

export type PluginCommandArgs = Record<string, unknown>;
export type PluginDataJSON = Record<string, unknown>;
export type PluginLocale = 'ru' | 'en';
export type TranslationParams = Record<string, string | number>;
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
  /** Remote sync scope selected during pairing. It can differ from this device's local vault UUID. */
  vaultId: string;
  deviceId: string;
  deviceName: string;
  connected: boolean;
  revoked: boolean;
  tokenStored: boolean;
  unpushedOps: number;
  lastSyncAt: string;
  syncInterval: number;
  lastError: string;
  /** A persistent unresolved scanner warning, for example an over-limit file. */
  lastWarning: string;
  statusLabel: string;
}

/** Core operation-log contract. Plugins can display status but cannot create these operations. */
export type SyncEntityType = 'file' | 'folder' | 'workspace';
export type SyncOperationType = 'create' | 'update' | 'delete' | 'move' | 'rename' | 'trash' | 'restore';

export interface SyncOperation {
  opId: string;
  serverSequence?: number;
  deviceId: string;
  entityType: SyncEntityType;
  entityId: string;
  opType: SyncOperationType;
  payloadJson: string;
  createdAt: string;
  clientSequence?: number;
  lastSeenServerSeq?: number;
}

export interface SyncFilePayload {
  path: string;
  content?: string;
  dataBase64?: string;
  contentHash?: string;
  fromPath?: string;
  toPath?: string;
}

export interface SyncWorkspacePayload {
  workspaceId: string;
  path: string;
  previousPath?: string;
  name: string;
  metadata?: Record<string, unknown>;
}

export interface SyncSnapshotEntry {
  path: string;
  type: 'file' | 'folder';
  size: number;
  modifiedAt: string;
  hash?: string;
}

export interface SyncConflict {
  op_id?: string;
  opId?: string;
  entity_type?: string;
  entityType?: string;
  entity_id?: string;
  entityId?: string;
  path?: string;
  reason?: string;
  message?: string;
  [key: string]: unknown;
}

export interface SyncNowResult {
  pushed: number;
  pulled: number;
  serverSequence: number;
  conflicts?: SyncConflict[];
  applyErrors?: string[];
}

export interface BrowserReceiverPairing {
  receiverUrl: string;
  receiverToken: string;
}

export interface VerstakPluginAPI {
  readonly pluginId: string;

  i18n: {
    getLocale(): PluginLocale;
    t(key: string, params?: TranslationParams, fallback?: string): string;
    onDidChangeLocale(listener: (locale: PluginLocale) => void): Unsubscribe;
  };

  settings: {
    read(): Promise<PluginSettings>;
    read<T = unknown>(key: string): Promise<T | undefined>;
    write(key: string, value: unknown): Promise<PluginSettings>;
    writeAll(settings: PluginSettings): Promise<void>;
  };

  storage: {
    data: {
      read(name: string): Promise<PluginDataJSON>;
      write(name: string, data: PluginDataJSON): Promise<void>;
    };
  };

  ui: {
    openSettings(panelId?: string): Promise<void>;
  };

  capabilities: {
    has(capability: string): Promise<boolean>;
    get(capability: string): Promise<{ available: boolean; name?: string; pluginId?: string; status?: string }>;
    list(): Promise<CapabilityEntry[]>;
  };

  commands: {
    register(commandId: string, handler: PluginCommandHandler): Promise<Unsubscribe>;
    execute(commandId: string, args?: PluginCommandArgs): Promise<PluginCommandResult>;
    executeFor(targetPluginId: string, commandId: string, args?: PluginCommandArgs): Promise<PluginCommandResult>;
  };

  contributions: {
    list(): Promise<RegisteredContributionPoints>;
    list<K extends keyof RegisteredContributionPoints>(
      point: K
    ): Promise<NonNullable<RegisteredContributionPoints[K]>>;
  };

  events: {
    publish(eventName: string, payload?: Record<string, unknown>): Promise<void>;
    subscribe<TPayload = Record<string, unknown>>(
      eventName: string,
      handler: (event: PluginEvent<TPayload>) => void
    ): Promise<Unsubscribe>;
  };

  imports: {
    selectDirectory(): Promise<ImportSourceSession | null>;
    selectArchive(): Promise<ImportSourceSession | null>;
    listEntries(sourceHandle: string, cursor?: string): Promise<ImportEntryPage>;
    readText(sourceHandle: string, entryId: string): Promise<string>;
    onProgress(sourceHandle: string, listener: (progress: ImportProgress) => void): Unsubscribe;
    applyPlan(sourceHandle: string, plan: ImportPlan): Promise<ImportApplyResult>;
    cancel(sourceHandle: string): Promise<void>;
    closeSource(sourceHandle: string): Promise<void>;
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
    readBytes(relativePath: string): Promise<FileBytes>;
    writeText(relativePath: string, content: string, options?: WriteTextOptions): Promise<void>;
    writeBytes(relativePath: string, dataBase64: string, options?: WriteTextOptions): Promise<void>;
    createFolder(relativePath: string): Promise<void>;
    move(fromRelativePath: string, toRelativePath: string, options?: MovePathOptions): Promise<void>;
    copy(fromRelativePath: string, toRelativePath: string, options?: MovePathOptions): Promise<void>;
    /**
     * Move many paths in one call.
     *
     * Prefer this to a loop over `move`. Each individual call costs the host a
     * sync recording of its own; one call records the whole batch once, which
     * is the difference between a large paste completing promptly and appearing
     * to hang. Pass a `transferId` to receive progress via `onTransferProgress`
     * and to be able to `cancelTransfer`.
     */
    moveMany(transfers: PathTransfer[], options?: MovePathOptions & { transferId?: string }): Promise<TransferOutcome>;
    /** Copy many paths in one call. See `moveMany`. */
    copyMany(transfers: PathTransfer[], options?: MovePathOptions & { transferId?: string }): Promise<TransferOutcome>;
    /**
     * Ask a running bulk transfer to stop. Items already transferred stay where
     * they are: this stops the operation, it does not undo it.
     */
    cancelTransfer(transferId: string): Promise<void>;
    /** Observe the progress of bulk transfers started by this plugin. */
    onTransferProgress(listener: (progress: TransferProgress) => void): Unsubscribe;
    trash(relativePath: string): Promise<TrashResult>;
    listTrash(): Promise<TrashEntry[]>;
    restoreTrash(trashId: string, options?: RestoreTrashOptions): Promise<string>;
    deleteTrash(trashId: string): Promise<void>;
    openExternal(relativePath: string): Promise<void>;
    showInFolder(relativePath: string): Promise<void>;
  };

  workbench: {
    openResource(request: OpenResourceRequest): Promise<OpenResourceResult>;
    editResource(request: OpenResourceRequest): Promise<OpenResourceResult>;
  };

  sync: {
    status(): Promise<SyncStatus>;
    configure(serverUrl: string, username: string, password: string, remoteVaultId?: string): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(serverUrl: string, username: string, password: string): Promise<void>;
    setInterval(minutes: number): Promise<void>;
    resetKey(): Promise<void>;
    now(): Promise<SyncNowResult>;
  };

  browserReceiver: {
    pairing(): Promise<BrowserReceiverPairing>;
    rotateToken(): Promise<BrowserReceiverPairing>;
  };

  dispose?: () => void;
}

export function createPluginAPI(_pluginId: string): VerstakPluginAPI {
  throw new Error('createPluginAPI is provided by Verstak Desktop at plugin runtime');
}
