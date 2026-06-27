export type PluginSource = 'official' | 'local' | 'third-party';
export interface PluginManifest {
    schemaVersion: 1;
    id: string;
    name: string;
    version: string;
    apiVersion: string;
    description?: string;
    source?: PluginSource;
    icon?: string;
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
export type CapabilityName = string;
export interface CapabilityEntry {
    name: CapabilityName;
    description?: string;
    pluginId: string;
    status: 'stable' | 'draft' | 'deprecated';
}
export type Permission = 'vault.read' | 'vault.write' | 'vault.watch' | 'files.read' | 'files.write' | 'files.delete' | 'files.openExternal' | 'workbench.open' | 'storage.namespace' | 'storage.migrations' | 'events.publish' | 'events.subscribe' | 'ui.register' | 'commands.register' | 'network.local' | 'network.remote' | 'process.spawn' | 'secrets.read' | 'secrets.write' | 'sync.participate';
export interface PermissionEntry {
    name: Permission;
    description: string;
    dangerous: boolean;
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
export interface TrashResult {
    originalPath: string;
    trashPath: string;
    trashId: string;
    deletedAt: string;
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
export type OpenResourceKind = 'vault-file';
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
        size?: number;
        changedAt: string;
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