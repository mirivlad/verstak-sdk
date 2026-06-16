// Verstak Plugin SDK — Core TypeScript Types

// ─── Manifest ────────────────────────────────────────────────

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

// ─── Capabilities ────────────────────────────────────────────

export type CapabilityName = string;

export interface CapabilityEntry {
  name: CapabilityName;
  description: string;
  status: 'stable' | 'draft' | 'deprecated';
}

// ─── Permissions ─────────────────────────────────────────────

export type Permission =
  | 'vault.read'
  | 'vault.write'
  | 'vault.watch'
  | 'storage.namespace'
  | 'storage.migrations'
  | 'events.publish'
  | 'events.subscribe'
  | 'ui.register'
  | 'commands.register'
  | 'network.local'
  | 'network.remote'
  | 'process.spawn'
  | 'secrets.read'
  | 'secrets.write'
  | 'sync.participate';

export interface PermissionEntry {
  name: Permission;
  description: string;
  dangerous: boolean;
}

// ─── Contribution Points ─────────────────────────────────────

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

// ─── Plugin State ────────────────────────────────────────────

export type PluginStatus =
  | 'discovered'
  | 'disabled'
  | 'loading'
  | 'loaded'
  | 'degraded'
  | 'failed'
  | 'incompatible'
  | 'missing-required-capability';

export interface PluginState {
  id: string;
  manifest: PluginManifest;
  status: PluginStatus;
  error?: string;
  enabled: boolean;
  loadedAt?: string;
}

// ─── Events ──────────────────────────────────────────────────

export interface VerstakEvent {
  name: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

// Browser events
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

// Vault events
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

// Lifecycle events
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

// ─── Sync Types ──────────────────────────────────────────────

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

// ─── Settings ────────────────────────────────────────────────

export interface PluginSettings {
  [key: string]: unknown;
}
