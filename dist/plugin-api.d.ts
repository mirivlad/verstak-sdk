import type { CapabilityEntry, DealOperationRequest, DealScope, DealScopedProviderCapability, FileBytes, FileEntry, FileMetadata, ImportApplyResult, ImportEntryPage, ImportPlan, ImportProgress, ImportSourceSession, MovePathOptions, OpenResourceRequest, OpenResourceResult, PathTransfer, PluginSettings, RegisteredContributionPoints, RestoreTrashOptions, TransferOutcome, TransferProgress, TrashEntry, TrashResult, WriteTextOptions } from './types';
export type PluginCommandArgs = Record<string, unknown>;
export type PluginDataJSON = Record<string, unknown>;
export type PluginLocale = 'ru' | 'en';
export type TranslationParams = Record<string, string | number>;
export type PluginCommandHandler = (args: PluginCommandArgs, declaration: PluginCommandDeclaration) => unknown | Promise<unknown>;
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
export interface PluginWorkspace {
    id: string;
    name: string;
    rootPath: string;
}
/**
 * Read-only Deal tree entry exposed to plugins. Folder nodes organize the
 * hierarchy; workspace nodes are Deals. `path` is a readable vault-relative
 * path, while workspace `id` is the stable identity plugins should persist.
 */
export interface PluginWorkspaceTreeNode {
    key?: string;
    kind: 'folder' | 'workspace';
    id: string;
    name: string;
    path: string;
    children: PluginWorkspaceTreeNode[];
}
export interface PluginWorkspaceTreeSnapshot {
    roots: PluginWorkspaceTreeNode[];
    currentWorkspaceId: string;
    revision: number;
    warnings?: string[];
}
export interface WorkspacePathResolution {
    found: boolean;
    workspaceId?: string;
    workspaceName?: string;
    workspaceRootPath?: string;
    relativePath?: string;
}
export interface WorkspaceNavigationRequest {
    /** Stable Deal UUID. This is the only identity accepted for navigation. */
    workspaceId: DealScope['workspaceId'];
    /** Workspace contribution to open after selecting the Deal. */
    workspaceItemId?: string;
    /** Opaque request passed only to the opened workspace contribution. */
    toolRequest?: Record<string, unknown>;
}
export interface PluginNavigationHandler {
    canGoBack?: () => boolean;
    goBack?: () => void;
    canGoForward?: () => boolean;
    goForward?: () => void;
}
export interface VerstakPluginAPI {
    readonly pluginId: string;
    navigation: {
        registerHandler(handler: PluginNavigationHandler): Unsubscribe;
        /**
         * Select a Deal and optionally open one of its workspace contributions.
         * Core owns the navigation transition; plugins pass stable target IDs and
         * may attach opaque tool state such as a selected project UUID.
         */
        openWorkspace(request: WorkspaceNavigationRequest): Promise<void>;
    };
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
        get(capability: string): Promise<{
            available: boolean;
            name?: string;
            pluginId?: string;
            status?: string;
        }>;
        list(): Promise<CapabilityEntry[]>;
        /**
         * Invoke a provider-independent operation on a declared required or optional capability.
         * The host resolves the current provider and its command mapping; consumers never need
         * to know the provider plugin id.
         */
        invoke(capability: DealScopedProviderCapability, operation: string, args: DealOperationRequest): Promise<PluginCommandResult>;
        invoke(capability: string, operation: string, args?: PluginCommandArgs): Promise<PluginCommandResult>;
    };
    commands: {
        register(commandId: string, handler: PluginCommandHandler): Promise<Unsubscribe>;
        execute(commandId: string, args?: PluginCommandArgs): Promise<PluginCommandResult>;
        executeFor(targetPluginId: string, commandId: string, args?: PluginCommandArgs): Promise<PluginCommandResult>;
    };
    contributions: {
        list(): Promise<RegisteredContributionPoints>;
        list<K extends keyof RegisteredContributionPoints>(point: K): Promise<NonNullable<RegisteredContributionPoints[K]>>;
    };
    workspaces: {
        /** Deal nodes where this plugin is active. */
        list(): Promise<PluginWorkspace[]>;
        /** Read only this plugin's namespaced metadata from a canonical Deal record. */
        readToolConfig(workspaceId: string): Promise<Record<string, unknown>>;
        /** Atomically replace only this plugin's metadata namespace in a Deal record. */
        writeToolConfig(workspaceId: string, config: Record<string, unknown>): Promise<void>;
        /**
         * Full user-visible Deal/folder hierarchy. Unlike `list`, this is not
         * filtered by whether the calling plugin contributes a tool to a Deal.
         * Optional for hosts older than the contract; new plugins should degrade
         * safely when it is absent.
         */
        tree?(): Promise<PluginWorkspaceTreeSnapshot>;
        /**
         * Resolve a readable vault-relative path to its owning Deal.
         * This does not imply that this plugin contributes a workspace item there.
         */
        resolvePath(relativePath: string): Promise<WorkspacePathResolution>;
    };
    events: {
        publish(eventName: string, payload?: Record<string, unknown>): Promise<void>;
        subscribe<TPayload = Record<string, unknown>>(eventName: string, handler: (event: PluginEvent<TPayload>) => void): Promise<Unsubscribe>;
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
        moveMany(transfers: PathTransfer[], options?: MovePathOptions & {
            transferId?: string;
        }): Promise<TransferOutcome>;
        /** Copy many paths in one call. See `moveMany`. */
        copyMany(transfers: PathTransfer[], options?: MovePathOptions & {
            transferId?: string;
        }): Promise<TransferOutcome>;
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
export declare function createPluginAPI(_pluginId: string): VerstakPluginAPI;
//# sourceMappingURL=plugin-api.d.ts.map