export type PluginSource = 'official' | 'local' | 'third-party';
export interface PluginLocalizationConfig {
    defaultLocale: string;
    locales: Record<string, string>;
}
export interface PluginManifest {
    schemaVersion: 1;
    id: string;
    name: string;
    version: string;
    apiVersion: string;
    description?: string;
    source?: PluginSource;
    icon?: string;
    localization?: PluginLocalizationConfig;
    provides: string[];
    requires?: string[];
    optionalRequires?: string[];
    permissions: Permission[];
    frontend?: FrontendConfig;
    backend?: BackendConfig;
    migrations?: MigrationConfig;
    contributes?: ContributionPoints;
    sync?: SyncConfig;
}
export interface FrontendConfig {
    entry: string;
    style?: string;
}
export interface BackendConfig {
    type: 'sidecar';
    entry: Record<string, string>;
    healthCheck?: HealthCheckConfig;
}
export interface HealthCheckConfig {
    type?: 'rpc' | 'stdio' | 'tcp';
    timeout?: number;
}
export interface MigrationConfig {
    path: string;
}
export interface SyncConfig {
    namespaces?: string[];
    participate?: boolean;
}
/** A content-addressed binary payload. Blob bytes are uploaded before the
 * operation that references them and are never base64-embedded in the log. */
export interface SyncBlobReference {
    sha256: string;
    size: number;
}
export interface SyncFilePayload {
    path: string;
    content?: string;
    blob?: SyncBlobReference;
    contentHash?: string;
    fromPath?: string;
    toPath?: string;
}
export interface SyncOperation {
    op_id: string;
    server_sequence?: number;
    device_id?: string;
    entity_type: 'file' | 'folder' | 'workspace';
    entity_id: string;
    op_type: 'create' | 'update' | 'delete' | 'move' | 'rename' | 'trash' | 'restore';
    payload_json: string;
    created_at: string;
    client_sequence?: number;
    last_seen_server_seq?: number;
}
export interface SyncPushRequest {
    device_id: string;
    idempotency_key?: string;
    ops: Omit<SyncOperation, 'server_sequence' | 'device_id'>[];
}
export interface SyncPullRequest {
    since_sequence: number;
    page_limit?: number;
}
export interface SyncPullResponse {
    server_sequence: number;
    page_last_sequence: number;
    has_more: boolean;
    ops: SyncOperation[];
}
/** Stable public errors. UI must map `code` to localized copy rather than
 * displaying server diagnostics. */
export interface SyncServerError {
    error: string;
    code: string;
}
export type CapabilityName = string;
export interface CapabilityEntry {
    name: CapabilityName;
    description?: string;
    pluginId: string;
    status: 'stable' | 'draft' | 'deprecated';
}
export type Permission = 'vault.read' | 'vault.write' | 'vault.watch' | 'files.read' | 'files.write' | 'files.delete' | 'files.openExternal' | 'imports.readExternal' | 'imports.apply' | 'workbench.open' | 'storage.namespace' | 'storage.migrations' | 'events.publish' | 'events.subscribe' | 'ui.register' | 'commands.register' | 'network.local' | 'network.remote' | 'process.spawn' | 'secrets.read' | 'secrets.write' | 'sync.participate' | 'browser.receiver.manage' | 'notifications.schedule';
export interface PermissionEntry {
    name: Permission;
    description: string;
    dangerous: boolean;
}
export type ImportSourceKind = 'directory' | 'archive';
export type ImportEntryKind = 'directory' | 'file';
export type ImportPlanNodeKind = 'folder' | 'workspace' | 'note' | 'file' | 'skip';
export interface ImportSourceSession {
    sourceHandle: string;
    kind: ImportSourceKind;
    displayPath: string;
    displayName: string;
    fingerprint: string;
    entryCount: number;
    totalBytes: number;
}
export interface ImportSourceEntry {
    id: string;
    path: string;
    kind: ImportEntryKind;
    size: number;
    modifiedAt: string;
    mediaHint: string;
}
export interface ImportEntryPage {
    entries: ImportSourceEntry[];
    nextCursor: string;
    fingerprint: string;
}
export interface ImportPlanNode {
    id: string;
    parentId: string;
    kind: ImportPlanNodeKind;
    name: string;
    targetSubpath?: string;
    templateId?: string;
    text?: string;
    sourceEntryId?: string;
    sourcePath?: string;
    modifiedAt?: string;
}
export interface ImportPlan {
    schemaVersion: 1;
    sourceHandle: string;
    sourceFingerprint: string;
    runName: string;
    nodes: ImportPlanNode[];
}
export interface ImportProgress {
    sourceHandle: string;
    phase: 'indexing' | 'validating' | 'staging' | 'publishing' | 'refreshing';
    completed: number;
    total: number;
    cancellable: boolean;
    message: string;
}
export interface ImportApplyResult {
    runPath: string;
    folders: number;
    workspaces: number;
    notes: number;
    files: number;
    skipped: number;
    warnings: string[];
}
export type FileEntryType = 'file' | 'folder' | 'symlink' | 'unknown';
export interface FileEntry {
    name: string;
    relativePath: string;
    type: FileEntryType;
    size: number;
    modifiedAt: string;
    extension: string;
    isHidden: boolean;
    isReserved: boolean;
    canRead: boolean;
    canWrite: boolean;
}
export interface FileMetadata {
    relativePath: string;
    type: FileEntryType;
    size: number;
    modifiedAt: string;
    createdAt?: string;
    extension: string;
    mimeHint: string;
    isText: boolean;
    isHidden: boolean;
    isReserved: boolean;
    canRead: boolean;
    canWrite: boolean;
}
export interface FileBytes {
    relativePath: string;
    size: number;
    mimeHint: string;
    dataBase64: string;
}
export interface WriteTextOptions {
    /** Create the file when it is missing. Parent folder must already exist. */
    createIfMissing?: boolean;
    /** Replace an existing regular file. Existing folders/symlinks are rejected. */
    overwrite?: boolean;
}
export interface MovePathOptions {
    /** Replace an existing target path when the host supports it. */
    overwrite?: boolean;
}
/** One source-to-destination pair in a bulk move or copy. */
export interface PathTransfer {
    from: string;
    to: string;
}
/** What became of a single item in a bulk transfer. */
export interface TransferResult {
    from: string;
    to: string;
    /** Absent when the item succeeded. */
    error?: string;
    /** The batch was cancelled before it reached this item. */
    skipped?: boolean;
}
/**
 * The result of a bulk transfer.
 *
 * One failing item does not abandon the rest, so a plugin can tell the user
 * exactly which files did not land instead of only that "something failed".
 */
export interface TransferOutcome {
    results: TransferResult[];
    succeeded: number;
    failed: number;
    cancelled: boolean;
}
/** Progress of a bulk transfer, reported after each item. */
export interface TransferProgress {
    transferId: string;
    completed: number;
    total: number;
    succeeded: number;
    failed: number;
    /** Destination path of the item just processed. */
    path: string;
}
export interface RestoreTrashOptions {
    /** Restore to another vault-relative path instead of the original path. */
    targetPath?: string;
    /** Replace an existing target path. Hosts reject conflicts by default. */
    overwrite?: boolean;
}
export interface TrashResult {
    originalPath: string;
    trashPath: string;
    trashId: string;
    deletedAt: string;
    /** Original regular-file size in bytes, when the host can provide it. */
    size?: number;
}
export interface TrashEntry extends TrashResult {
    originalType: FileEntry['type'];
    basename: string;
}
export interface ContributionPoints {
    views?: ContributionView[];
    commands?: ContributionCommand[];
    settingsPanels?: ContributionSettingsPanel[];
    sidebarItems?: ContributionSidebarItem[];
    fileActions?: ContributionAction[];
    noteActions?: ContributionAction[];
    contextMenuEntries?: ContributionContextMenuEntry[];
    searchProviders?: ContributionSearchProvider[];
    activityProviders?: ContributionActivityProvider[];
    statusBarItems?: ContributionStatusBarItem[];
    openProviders?: ContributionOpenProvider[];
    workspaceItems?: ContributionWorkspaceItem[];
}
export interface ContributionView {
    id: string;
    title: string;
    icon?: string;
    component: string;
}
export interface ContributionCommand {
    id: string;
    title: string;
    keybinding?: string;
    icon?: string;
    handler?: string;
}
export interface ContributionSettingsPanel {
    id: string;
    title: string;
    component: string;
    icon?: string;
}
export interface ContributionSidebarItem {
    id: string;
    title: string;
    icon?: string;
    view: string;
    position?: number;
}
export interface ContributionAction {
    id: string;
    label: string;
    icon?: string;
    capability?: CapabilityName;
    handler?: string;
}
export interface ContributionContextMenuEntry {
    id: string;
    label: string;
    context: 'file' | 'note' | 'case' | 'folder';
    group?: string;
    capability?: CapabilityName;
    handler?: string;
}
export interface ContributionSearchProvider {
    id: string;
    label: string;
    handler: string;
}
export interface ContributionActivityProvider {
    id: string;
    events?: string[];
    handler: string;
}
export interface ContributionStatusBarItem {
    id: string;
    label: string;
    position?: 'left' | 'right';
    handler?: string;
}
export type OpenResourceKind = 'vault-file' | 'secret';
export type OpenResourceMode = 'view' | 'edit';
export type OpenResourceContextName = 'generic-text' | 'generic-markdown' | 'notes-markdown' | string;
export interface OpenProviderSupport {
    kind: OpenResourceKind;
    extensions?: string[];
    mime?: string[];
    contexts?: OpenResourceContextName[];
    modes?: OpenResourceMode[];
}
export interface ContributionOpenProvider {
    id: string;
    title: string;
    priority?: number;
    component: string;
    supports: OpenProviderSupport[];
}
export interface ContributionWorkspaceItem {
    id: string;
    title: string;
    icon?: string;
    component: string;
}
export type RegisteredContribution<T> = T & {
    pluginId: string;
};
export interface RegisteredContributionPoints {
    views?: RegisteredContribution<ContributionView>[];
    commands?: RegisteredContribution<ContributionCommand>[];
    settingsPanels?: RegisteredContribution<ContributionSettingsPanel>[];
    sidebarItems?: RegisteredContribution<ContributionSidebarItem>[];
    fileActions?: RegisteredContribution<ContributionAction>[];
    noteActions?: RegisteredContribution<ContributionAction>[];
    contextMenuEntries?: RegisteredContribution<ContributionContextMenuEntry>[];
    searchProviders?: RegisteredContribution<ContributionSearchProvider>[];
    activityProviders?: RegisteredContribution<ContributionActivityProvider>[];
    statusBarItems?: RegisteredContribution<ContributionStatusBarItem>[];
    openProviders?: RegisteredContribution<ContributionOpenProvider>[];
    workspaceItems?: RegisteredContribution<ContributionWorkspaceItem>[];
}
export interface OpenResourceContext {
    sourcePluginId?: string;
    sourceView?: 'files' | 'notes' | string;
    isInsideNotesFolder?: boolean;
    notesScopePath?: string;
    notesMode?: boolean;
}
export interface OpenResourceRequest {
    kind: OpenResourceKind;
    path: string;
    mode?: OpenResourceMode;
    mime?: string;
    extension?: string;
    context?: OpenResourceContext;
}
export interface OpenResourceResult {
    status: 'opened' | 'no-provider';
    providerId?: string;
    providerPluginId?: string;
    providerComponent?: string;
    request: OpenResourceRequest;
    message?: string;
}
export type PluginStatus = 'discovered' | 'disabled' | 'loading' | 'loaded' | 'degraded' | 'failed' | 'incompatible' | 'missing-required-capability';
export interface PluginState {
    id: string;
    manifest: PluginManifest;
    status: PluginStatus;
    error?: string;
    enabled: boolean;
    loadedAt?: string;
}
export interface VerstakEvent {
    name: string;
    timestamp: string;
    payload: Record<string, unknown>;
}
export interface BrowserCapturePageEvent extends VerstakEvent {
    name: 'browser.capture.page';
    payload: {
        url: string;
        title: string;
        html?: string;
        text?: string;
        capturedAt: string;
        domain?: string;
    };
}
export interface BrowserCaptureSelectionEvent extends VerstakEvent {
    name: 'browser.capture.selection';
    payload: {
        url: string;
        title: string;
        text: string;
        capturedAt: string;
        domain?: string;
    };
}
export interface BrowserCaptureLinkEvent extends VerstakEvent {
    name: 'browser.capture.link';
    payload: {
        url: string;
        title?: string;
        capturedAt: string;
        domain?: string;
    };
}
export interface VaultOpenedEvent extends VerstakEvent {
    name: 'vault.opened';
    payload: {
        path: string;
        version?: string;
        openedAt: string;
    };
}
export interface CaseSelectedEvent extends VerstakEvent {
    name: 'case.selected';
    payload: {
        caseId: string;
        casePath: string;
        caseType?: string;
        selectedAt: string;
    };
}
export interface FileChangedEvent extends VerstakEvent {
    name: 'file.changed';
    payload: {
        path: string;
        title?: string;
        operation: 'create' | 'update' | 'move' | 'delete' | 'external.create' | 'external.update' | 'external.delete';
        type?: 'file' | 'folder' | 'symlink' | 'unknown';
        workspaceRootPath?: string;
        external?: boolean;
        trashId?: string;
        fromPath?: string;
        changedAt?: string;
    };
}
export interface NoteSavedEvent extends VerstakEvent {
    name: 'note.saved';
    payload: {
        noteId: string;
        title?: string;
        path: string;
        caseId?: string;
        savedAt: string;
    };
}
export interface WorkspaceCreatedEvent extends VerstakEvent {
    name: 'workspace.created';
    payload: {
        operation: 'create';
        workspaceRootPath: string;
        workspaceName: string;
        title?: string;
        templateId?: string;
    };
}
export interface WorkspaceRenamedEvent extends VerstakEvent {
    name: 'workspace.renamed';
    payload: {
        operation: 'rename';
        workspaceRootPath: string;
        workspaceName: string;
        previousWorkspaceRootPath: string;
        previousWorkspaceName: string;
        title?: string;
    };
}
export interface WorkspaceTrashedEvent extends VerstakEvent {
    name: 'workspace.trashed';
    payload: {
        operation: 'trash';
        workspaceRootPath: string;
        workspaceName: string;
        title?: string;
        trashId: string;
        trashPath: string;
        deletedAt: string;
    };
}
export interface WorkspaceSelectedEvent extends VerstakEvent {
    name: 'workspace.selected';
    payload: {
        operation: 'select';
        workspaceRootPath: string;
        workspaceName: string;
        title?: string;
    };
}
export interface PluginEnabledEvent extends VerstakEvent {
    name: 'plugin.enabled';
    payload: {
        pluginId: string;
        version?: string;
        enabledAt: string;
    };
}
export interface PluginDisabledEvent extends VerstakEvent {
    name: 'plugin.disabled';
    payload: {
        pluginId: string;
        disabledAt: string;
    };
}
export type SyncOpType = 'add' | 'modify' | 'delete' | 'rename';
export type SyncEntityType = 'file' | 'note' | 'plugin_state' | 'vault_meta';
export interface SyncOperation {
    op: SyncOpType;
    id: string;
    timestamp: string;
    deviceId?: string;
    entityType?: SyncEntityType;
    entityPath?: string;
    hash?: string;
    size?: number;
    mimeType?: string;
    pluginNamespace?: string;
    oldPath?: string;
    metadata?: Record<string, string>;
}
export interface SyncBatch {
    batchId: string;
    deviceId: string;
    operations: SyncOperation[];
    timestamp: string;
    lastSyncTimestamp?: string;
    sequence?: number;
}
export interface SyncManifestEntry {
    path: string;
    hash: string;
    size?: number;
    updatedAt: string;
    deleted?: boolean;
}
export interface SyncManifest {
    deviceId: string;
    entries: SyncManifestEntry[];
}
export interface Conflict {
    entityPath: string;
    localHash: string;
    remoteHash: string;
    localTimestamp: string;
    remoteTimestamp: string;
    resolution?: 'local_wins' | 'remote_wins' | 'manual';
    resolvedAt?: string;
}
export interface PluginSettings {
    [key: string]: unknown;
}
//# sourceMappingURL=types.d.ts.map