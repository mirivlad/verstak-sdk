// Verstak Plugin SDK — Test Utilities

import type {
  CapabilityEntry,
  DealOperationRequest,
  DealScope,
  DealScopedProviderCapability,
  ImportPlan,
  ImportProgress,
  ImportSourceEntry,
  ImportSourceSession,
  MovePathOptions,
  PathTransfer,
  PluginManifest,
  PluginState,
  RegisteredContributionPoints,
  TransferOutcome,
  TransferProgress,
} from './types';
import type { PluginCommandHandler, PluginLocale, PluginWorkspace, TranslationParams, VerstakPluginAPI } from './plugin-api';

const mockCommandHandlers = new Map<string, PluginCommandHandler>();

const dealScopedOperations: Record<DealScopedProviderCapability, readonly string[]> = {
  'verstak/notes/v2': ['list', 'create', 'open'],
  'verstak/files/v2': ['list', 'create', 'open'],
  'verstak/todo/v2': ['list', 'create', 'setStatus'],
  'verstak/activity/v2': ['list', 'search'],
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isDealScopedProviderCapability(capability: string): capability is DealScopedProviderCapability {
  return Object.prototype.hasOwnProperty.call(dealScopedOperations, capability);
}

function assertDealOperationRequest(args: Record<string, unknown>): asserts args is DealOperationRequest {
  const scope = args.scope as Partial<DealScope> | undefined;
  if (scope?.kind !== 'deal') throw new Error('DealScope.kind must be deal');
  if (!uuidPattern.test(String(scope.workspaceId || ''))) throw new Error('DealScope.workspaceId must be a UUID');
}

function commandKey(pluginId: string, commandId: string): string {
  return `${pluginId}:${commandId}`;
}

export interface MockCapabilityProvider {
  pluginId: string;
  status?: CapabilityEntry['status'];
  operations?: Record<string, string>;
}

export interface MockPluginAPIOptions {
  capabilities?: Record<string, MockCapabilityProvider>;
  contributions?: RegisteredContributionPoints;
  locale?: PluginLocale;
  defaultLocale?: PluginLocale;
  messages?: Partial<Record<PluginLocale, Record<string, string>>>;
  workspaces?: PluginWorkspace[];
  toolConfigs?: Record<string, Record<string, unknown>>;
  importSources?: Array<{
    session: ImportSourceSession;
    entries: ImportSourceEntry[];
    textByEntryId: Record<string, string>;
  }>;
}

function interpolateMessage(message: string, params?: TranslationParams): string {
  if (!params) return message;
  return message.replace(/\{([A-Za-z0-9_.-]+)\}/g, (placeholder, name: string) => (
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : placeholder
  ));
}

/**
 * Создать тестовый manifest для unit-тестов.
 */
export function createTestManifest(overrides?: Partial<PluginManifest>): PluginManifest {
  return {
    schemaVersion: 1,
    id: 'test.plugin',
    name: 'Test Plugin',
    version: '0.1.0',
    apiVersion: '0.1.0',
    description: 'A test plugin for platform verification',
    source: 'local',
    provides: ['test.capability'],
    requires: [],
    optionalRequires: [],
    permissions: ['events.publish', 'events.subscribe'],
    ...overrides
  };
}

/**
 * Создать тестовое состояние плагина.
 */
export function createTestPluginState(overrides?: Partial<PluginState>): PluginState {
  return {
    id: 'test.plugin',
    manifest: createTestManifest(),
    status: 'loaded',
    enabled: true,
    loadedAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Создать заглушку VerstakPluginAPI для тестов.
 */
export function createMockPluginAPI(pluginId = 'test.plugin', options: MockPluginAPIOptions = {}): VerstakPluginAPI {
  const locale = options.locale || 'en';
  const defaultLocale = options.defaultLocale || 'en';
  const messages = options.messages || {};
  const settings: Record<string, unknown> = {};
  const toolConfigs = new Map(Object.entries(options.toolConfigs || {}).map(([workspaceId, config]) => [workspaceId, { ...config }]));
  const pluginData = new Map<string, Record<string, unknown>>();
  const commands = new Map<string, PluginCommandHandler>();
  const eventHandlers = new Map<string, Array<(event: any) => void>>();
  const importProgressHandlers = new Map<string, Array<(progress: ImportProgress) => void>>();
  const closedImportSources = new Set<string>();
  const files = new Map<string, { type: 'file' | 'folder'; content?: string; modifiedAt: string }>();
  const trashEntries: Array<{ originalPath: string; trashPath: string; trashId: string; deletedAt: string; originalType: 'file' | 'folder'; basename: string }> = [];
  const trashPayloads = new Map<string, Array<{ suffix: string; node: { type: 'file' | 'folder'; content?: string; modifiedAt: string } }>>();
  const cancelledTransfers = new Set<string>();
  const transferProgressListeners = new Set<(progress: TransferProgress) => void>();

  const movePath = async (fromRelativePath: string, toRelativePath: string, options: MovePathOptions = {}) => {
    const from = normalizePath(fromRelativePath);
    const to = normalizePath(toRelativePath);
    const node = files.get(from);
    if (!node) throw new Error(`not-found: ${from}`);
    if (node.type === 'folder' && (to === from || to.startsWith(`${from}/`))) {
      throw new Error(`move-into-self: ${from} -> ${to}`);
    }
    if (files.has(to) && !options.overwrite) throw new Error(`conflict: ${to}`);
    const parent = parentPath(to);
    if (!files.get(parent) || files.get(parent)?.type !== 'folder') throw new Error(`parent-not-found: ${parent}`);
    Array.from(files.entries())
      .filter(([path]) => path === from || path.startsWith(`${from}/`))
      .forEach(([path, moving]) => {
        files.set(`${to}${path.slice(from.length)}`, moving);
        files.delete(path);
      });
  };

  const copyPath = async (fromRelativePath: string, toRelativePath: string, options: MovePathOptions = {}) => {
    const from = normalizePath(fromRelativePath);
    const to = normalizePath(toRelativePath);
    const node = files.get(from);
    if (!node) throw new Error(`not-found: ${from}`);
    if (node.type === 'folder' && (to === from || to.startsWith(`${from}/`))) {
      throw new Error(`copy-into-self: ${from} -> ${to}`);
    }
    if (files.has(to) && !options.overwrite) throw new Error(`conflict: ${to}`);
    const parent = parentPath(to);
    if (!files.get(parent) || files.get(parent)?.type !== 'folder') throw new Error(`parent-not-found: ${parent}`);
    Array.from(files.entries())
      .filter(([path]) => path === from || path.startsWith(`${from}/`))
      .forEach(([path, copying]) => {
        files.set(`${to}${path.slice(from.length)}`, { ...copying });
      });
  };

  // Mirrors the host: a failing item does not abandon the batch, cancellation
  // stops it without undoing what already happened, and progress is reported
  // after every item.
  const runTransfers = async (
    transfers: PathTransfer[],
    options: MovePathOptions & { transferId?: string },
    apply: (transfer: PathTransfer) => Promise<void>
  ): Promise<TransferOutcome> => {
    const transferId = options.transferId || '';
    const outcome: TransferOutcome = { results: [], succeeded: 0, failed: 0, cancelled: false };
    for (let index = 0; index < transfers.length; index += 1) {
      if (transferId && cancelledTransfers.has(transferId)) {
        outcome.cancelled = true;
        transfers.slice(index).forEach((remaining) => {
          outcome.results.push({ from: remaining.from, to: remaining.to, skipped: true });
        });
        break;
      }
      const transfer = transfers[index];
      try {
        await apply(transfer);
        outcome.succeeded += 1;
        outcome.results.push({ from: transfer.from, to: transfer.to });
      } catch (error) {
        outcome.failed += 1;
        outcome.results.push({ from: transfer.from, to: transfer.to, error: String((error as Error).message || error) });
      }
      transferProgressListeners.forEach((listener) => listener({
        transferId,
        completed: index + 1,
        total: transfers.length,
        succeeded: outcome.succeeded,
        failed: outcome.failed,
        path: transfer.to,
      }));
    }
    cancelledTransfers.delete(transferId);
    return outcome;
  };
  files.set('', { type: 'folder', modifiedAt: new Date().toISOString() });

  function normalizePath(path: string, allowRoot = false): string {
    const raw = String(path || '');
    if (raw.includes('\0')) throw new Error('invalid-path: null-byte');
    if (raw.includes('\\')) throw new Error('invalid-path: backslash not allowed');
    const normalized = raw.replace(/^\.\//, '');
    const parts = normalized.split('/').filter(Boolean);
    if (!allowRoot && parts.length === 0) throw new Error('invalid-path: empty path');
    if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) throw new Error('invalid-path: absolute path rejected');
    if (parts.includes('..')) throw new Error('invalid-path: path-traversal');
    if (parts[0] && parts[0].toLowerCase() === '.verstak') throw new Error('reserved-path: .verstak is internal');
    return parts.join('/');
  }

  function parentPath(path: string): string {
    const idx = path.lastIndexOf('/');
    return idx === -1 ? '' : path.slice(0, idx);
  }

  function baseName(path: string): string {
    const idx = path.lastIndexOf('/');
    return idx === -1 ? path : path.slice(idx + 1);
  }

  function base64FromString(value: string): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < value.length) {
      const a = value.charCodeAt(i++) & 0xff;
      const b = i < value.length ? value.charCodeAt(i++) & 0xff : NaN;
      const c = i < value.length ? value.charCodeAt(i++) & 0xff : NaN;
      result += alphabet[a >> 2];
      result += alphabet[((a & 3) << 4) | (Number.isNaN(b) ? 0 : b >> 4)];
      result += Number.isNaN(b) ? '=' : alphabet[((b & 15) << 2) | (Number.isNaN(c) ? 0 : c >> 6)];
      result += Number.isNaN(c) ? '=' : alphabet[c & 63];
    }
    return result;
  }

  function stringFromBase64(value: string): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const clean = String(value || '').replace(/\s+/g, '');
    if (clean.length % 4 === 1) throw new Error('invalid-base64');
    let result = '';
    for (let i = 0; i < clean.length; i += 4) {
      const a = alphabet.indexOf(clean[i]);
      const b = alphabet.indexOf(clean[i + 1]);
      const c = clean[i + 2] === '=' ? -1 : alphabet.indexOf(clean[i + 2]);
      const d = clean[i + 3] === '=' ? -1 : alphabet.indexOf(clean[i + 3]);
      if (a < 0 || b < 0 || (clean[i + 2] !== '=' && c < 0) || (clean[i + 3] !== '=' && d < 0)) {
        throw new Error('invalid-base64');
      }
      result += String.fromCharCode((a << 2) | (b >> 4));
      if (c >= 0) result += String.fromCharCode(((b & 15) << 4) | (c >> 2));
      if (d >= 0) result += String.fromCharCode(((c & 3) << 6) | d);
    }
    return result;
  }

  function entry(path: string, node: { type: 'file' | 'folder'; content?: string; modifiedAt: string }) {
    const name = baseName(path);
    const dot = name.lastIndexOf('.');
    const extension = dot > 0 ? name.slice(dot + 1) : '';
    return {
      name,
      relativePath: path,
      type: node.type,
      size: node.type === 'file' ? (node.content || '').length : 0,
      modifiedAt: node.modifiedAt,
      extension,
      isHidden: name.startsWith('.'),
      isReserved: false,
      canRead: true,
      canWrite: true,
    };
  }

  return {
    pluginId,
    navigation: {
      registerHandler: vi.fn((_handler) => () => {}),
      openWorkspace: vi.fn(async (request) => {
        if (!uuidPattern.test(String(request?.workspaceId || ''))) {
          throw new Error('navigation.openWorkspace requires workspaceId UUID');
        }
      }),
    },
    i18n: {
      getLocale: vi.fn(() => locale),
      t: vi.fn((key: string, params?: TranslationParams, fallback?: string) => {
        const message = messages[locale]?.[key]
          ?? messages[defaultLocale]?.[key]
          ?? fallback
          ?? key;
        return interpolateMessage(message, params);
      }),
      onDidChangeLocale: vi.fn((_listener: (nextLocale: PluginLocale) => void) => () => {}),
    },
    settings: {
      read: vi.fn(async (key?: string) => key ? settings[key] : { ...settings }) as VerstakPluginAPI['settings']['read'],
      write: vi.fn(async (key: string, value: unknown) => {
        settings[key] = value;
        return { ...settings };
      }),
      writeAll: vi.fn(async (nextSettings: Record<string, unknown>) => {
        Object.keys(settings).forEach((key) => delete settings[key]);
        Object.assign(settings, nextSettings);
      }),
    },
    storage: {
      data: {
        read: vi.fn(async (name: string) => ({ ...(pluginData.get(name) || {}) })),
        write: vi.fn(async (name: string, data: Record<string, unknown>) => {
          pluginData.set(name, { ...(data || {}) });
        }),
      },
    },
    ui: {
      openSettings: vi.fn(async (panelId?: string) => {
        const event = {
          name: 'ui.openSettings',
          pluginId,
          payload: { pluginId, panelId: panelId || '' },
          timestamp: new Date().toISOString(),
        };
        (eventHandlers.get('ui.openSettings') || []).slice().forEach((handler) => handler(event));
      }),
    },
    capabilities: {
      has: vi.fn(async (name: string) => !!options.capabilities?.[name]),
      get: vi.fn(async (name: string) => {
        const provider = options.capabilities?.[name];
        if (!provider) return { available: false, name };
        return { available: true, name, pluginId: provider.pluginId, status: provider.status || 'draft' };
      }),
      list: vi.fn(async () => Object.entries(options.capabilities || {}).map(([name, provider]) => ({
        name,
        pluginId: provider.pluginId,
        status: provider.status || 'draft',
      }))),
      invoke: vi.fn(async (name: string, operation: string, args: Record<string, unknown> = {}) => {
        if (isDealScopedProviderCapability(name)) {
          if (!dealScopedOperations[name].includes(operation)) {
            throw new Error(`capability-operation-unavailable: ${name}:${operation}`);
          }
          assertDealOperationRequest(args);
        }
        const provider = options.capabilities?.[name];
        if (!provider) throw new Error(`capability-unavailable: ${name}`);
        const commandId = provider.operations?.[operation];
        if (!commandId) throw new Error(`capability-operation-unavailable: ${name}:${operation}`);
        const handler = mockCommandHandlers.get(commandKey(provider.pluginId, commandId));
        if (!handler) throw new Error(`declared-but-unhandled: ${provider.pluginId}:${commandId}`);
        return {
          status: 'handled' as const,
          pluginId: provider.pluginId,
          commandId,
          result: await handler(args, { status: 'declared', pluginId: provider.pluginId, commandId, args }),
        };
      }),
    },
    commands: {
      register: vi.fn(async (commandId: string, handler: PluginCommandHandler) => {
        commands.set(commandId, handler);
        mockCommandHandlers.set(commandKey(pluginId, commandId), handler);
        return () => {
          commands.delete(commandId);
          mockCommandHandlers.delete(commandKey(pluginId, commandId));
        };
      }),
      execute: vi.fn(async (commandId: string, args: Record<string, unknown> = {}) => {
        const handler = commands.get(commandId);
        if (!handler) {
          throw new Error(`declared-but-unhandled: ${commandId}`);
        }
        return { status: 'handled' as const, pluginId, commandId, result: await handler(args, { status: 'declared', pluginId, commandId, args }) };
      }),
      executeFor: vi.fn(async (targetPluginId: string, commandId: string, args: Record<string, unknown> = {}) => {
        const handler = mockCommandHandlers.get(commandKey(targetPluginId, commandId));
        if (!handler) {
          throw new Error(`declared-but-unhandled: ${targetPluginId}:${commandId}`);
        }
        return {
          status: 'handled' as const,
          pluginId: targetPluginId,
          commandId,
          result: await handler(args, { status: 'declared', pluginId: targetPluginId, commandId, args }),
        };
      }),
    },
    contributions: {
      list: vi.fn(async (point?: keyof RegisteredContributionPoints) => {
        if (!point) return { ...(options.contributions || {}) };
        return ([...((options.contributions && options.contributions[point]) || [])]) as any;
      }) as VerstakPluginAPI['contributions']['list'],
    },
    workspaces: {
      list: vi.fn(async () => [...(options.workspaces || [])]),
      readToolConfig: vi.fn(async (workspaceId: string) => ({ ...(toolConfigs.get(workspaceId) || {}) })),
      writeToolConfig: vi.fn(async (workspaceId: string, config: Record<string, unknown>) => {
        toolConfigs.set(workspaceId, { ...(config || {}) });
      }),
      create: vi.fn(async (_parentFolderId: string, name: string) => ({ workspaceId: '11111111-1111-4111-8111-111111111111', name })),
      resolvePath: vi.fn(async (relativePath: string) => {
        const path = normalizePath(relativePath);
        const candidates = (options.workspaces || [])
          .filter((workspace) => path === normalizePath(workspace.rootPath) || path.startsWith(`${normalizePath(workspace.rootPath)}/`))
          .sort((a, b) => normalizePath(b.rootPath).length - normalizePath(a.rootPath).length);
        const workspace = candidates[0];
        if (!workspace) return { found: false };
        const workspaceRootPath = normalizePath(workspace.rootPath);
        return {
          found: true,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          workspaceRootPath,
          relativePath: path === workspaceRootPath ? '' : path.slice(workspaceRootPath.length + 1),
        };
      }),
    },
    events: {
      publish: vi.fn(async (eventName: string, payload: Record<string, unknown> = {}) => {
        const event = { name: eventName, pluginId, payload, timestamp: new Date().toISOString() };
        (eventHandlers.get(eventName) || []).slice().forEach((handler) => handler(event));
      }),
      subscribe: vi.fn(async (eventName: string, handler: (event: any) => void) => {
        const handlers = eventHandlers.get(eventName) || [];
        handlers.push(handler);
        eventHandlers.set(eventName, handlers);
        return () => {
          eventHandlers.set(eventName, (eventHandlers.get(eventName) || []).filter((item) => item !== handler));
        };
      }),
    },
    imports: {
      selectDirectory: vi.fn(async () => (
        options.importSources?.find((source) => source.session.kind === 'directory')?.session ?? null
      )),
      selectArchive: vi.fn(async () => (
        options.importSources?.find((source) => source.session.kind === 'archive')?.session ?? null
      )),
      listEntries: vi.fn(async (sourceHandle: string, cursor = '') => {
        const source = options.importSources?.find((candidate) => candidate.session.sourceHandle === sourceHandle);
        if (!source || closedImportSources.has(sourceHandle)) throw new Error(`source-session-not-found: ${sourceHandle}`);
        const offset = cursor ? Number(cursor) : 0;
        const entries = source.entries.slice(offset, offset + 500);
        const nextOffset = offset + entries.length;
        return {
          entries,
          nextCursor: nextOffset < source.entries.length ? String(nextOffset) : '',
          fingerprint: source.session.fingerprint,
        };
      }),
      readText: vi.fn(async (sourceHandle: string, entryId: string) => {
        const source = options.importSources?.find((candidate) => candidate.session.sourceHandle === sourceHandle);
        if (!source || closedImportSources.has(sourceHandle)) throw new Error(`source-session-not-found: ${sourceHandle}`);
        if (!Object.prototype.hasOwnProperty.call(source.textByEntryId, entryId)) {
          throw new Error(`source-entry-not-found: ${entryId}`);
        }
        return source.textByEntryId[entryId];
      }),
      onProgress: vi.fn((sourceHandle: string, listener: (progress: ImportProgress) => void) => {
        const handlers = importProgressHandlers.get(sourceHandle) || [];
        handlers.push(listener);
        importProgressHandlers.set(sourceHandle, handlers);
        return () => {
          importProgressHandlers.set(sourceHandle, (importProgressHandlers.get(sourceHandle) || []).filter((item) => item !== listener));
        };
      }),
      applyPlan: vi.fn(async (sourceHandle: string, plan: ImportPlan) => {
        const source = options.importSources?.find((candidate) => candidate.session.sourceHandle === sourceHandle);
        if (!source || closedImportSources.has(sourceHandle)) throw new Error(`source-session-not-found: ${sourceHandle}`);
        if (plan.sourceHandle !== sourceHandle) throw new Error(`source-handle-mismatch: ${plan.sourceHandle}`);
        const progress: ImportProgress = {
          sourceHandle,
          phase: 'staging',
          completed: plan.nodes.length,
          total: plan.nodes.length,
          cancellable: true,
          message: '',
        };
        (importProgressHandlers.get(sourceHandle) || []).slice().forEach((handler) => handler(progress));
        return {
          runPath: `Импортировано/${plan.runName}`,
          folders: plan.nodes.filter((node) => node.kind === 'folder').length,
          workspaces: plan.nodes.filter((node) => node.kind === 'workspace').length,
          notes: plan.nodes.filter((node) => node.kind === 'note').length,
          files: plan.nodes.filter((node) => node.kind === 'file').length,
          skipped: plan.nodes.filter((node) => node.kind === 'skip').length,
          warnings: [],
        };
      }),
      cancel: vi.fn(async (sourceHandle: string) => {
        if (!options.importSources?.some((source) => source.session.sourceHandle === sourceHandle)) {
          throw new Error(`source-session-not-found: ${sourceHandle}`);
        }
      }),
      closeSource: vi.fn(async (sourceHandle: string) => {
        closedImportSources.add(sourceHandle);
        importProgressHandlers.delete(sourceHandle);
      }),
    },
    files: {
      list: vi.fn(async (relativeDir = '') => {
        const dir = normalizePath(relativeDir, true);
        const node = files.get(dir);
        if (!node || node.type !== 'folder') throw new Error(`not-found: ${dir}`);
        const prefix = dir ? `${dir}/` : '';
        return Array.from(files.entries())
          .filter(([path]) => path !== dir && path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
          .map(([path, node]) => entry(path, node));
      }),
      metadata: vi.fn(async (relativePath: string) => {
        const path = normalizePath(relativePath);
        const node = files.get(path);
        if (!node) throw new Error(`not-found: ${path}`);
        return { ...entry(path, node), mimeHint: '', isText: node.type === 'file' };
      }),
      readText: vi.fn(async (relativePath: string) => {
        const path = normalizePath(relativePath);
        const node = files.get(path);
        if (!node) throw new Error(`not-found: ${path}`);
        if (node.type !== 'file') throw new Error(`not-regular-file: ${path}`);
        return node.content || '';
      }),
      readBytes: vi.fn(async (relativePath: string) => {
        const path = normalizePath(relativePath);
        const node = files.get(path);
        if (!node) throw new Error(`not-found: ${path}`);
        if (node.type !== 'file') throw new Error(`not-regular-file: ${path}`);
        const content = node.content || '';
        return {
          relativePath: path,
          size: content.length,
          mimeHint: path.toLowerCase().endsWith('.txt') ? 'text/plain; charset=utf-8' : '',
          dataBase64: base64FromString(content),
        };
      }),
      writeText: vi.fn(async (relativePath: string, content: string, options = {}) => {
        const path = normalizePath(relativePath);
        const node = files.get(path);
        if (node && node.type !== 'file') throw new Error(`not-regular-file: ${path}`);
        if (node && !options.overwrite) throw new Error(`conflict: ${path}`);
        if (!node && !options.createIfMissing) throw new Error(`not-found: ${path}`);
        const parent = parentPath(path);
        if (!files.get(parent) || files.get(parent)?.type !== 'folder') throw new Error(`parent-not-found: ${parent}`);
        files.set(path, { type: 'file', content, modifiedAt: new Date().toISOString() });
      }),
      writeBytes: vi.fn(async (relativePath: string, dataBase64: string, options = {}) => {
        const path = normalizePath(relativePath);
        const node = files.get(path);
        if (node && node.type !== 'file') throw new Error(`not-regular-file: ${path}`);
        if (node && !options.overwrite) throw new Error(`conflict: ${path}`);
        if (!node && !options.createIfMissing) throw new Error(`not-found: ${path}`);
        const parent = parentPath(path);
        if (!files.get(parent) || files.get(parent)?.type !== 'folder') throw new Error(`parent-not-found: ${parent}`);
        files.set(path, { type: 'file', content: stringFromBase64(dataBase64), modifiedAt: new Date().toISOString() });
      }),
      createFolder: vi.fn(async (relativePath: string) => {
        const path = normalizePath(relativePath);
        if (files.has(path)) throw new Error(`conflict: ${path}`);
        const parent = parentPath(path);
        if (!files.get(parent) || files.get(parent)?.type !== 'folder') throw new Error(`parent-not-found: ${parent}`);
        files.set(path, { type: 'folder', modifiedAt: new Date().toISOString() });
      }),
      move: vi.fn(movePath),
      copy: vi.fn(copyPath),
      moveMany: vi.fn((transfers: PathTransfer[], options: MovePathOptions & { transferId?: string } = {}) =>
        runTransfers(transfers, options, (transfer) => movePath(transfer.from, transfer.to, options))
      ),
      copyMany: vi.fn((transfers: PathTransfer[], options: MovePathOptions & { transferId?: string } = {}) =>
        runTransfers(transfers, options, (transfer) => copyPath(transfer.from, transfer.to, options))
      ),
      cancelTransfer: vi.fn(async (transferId: string) => {
        cancelledTransfers.add(transferId);
      }),
      onTransferProgress: vi.fn((listener: (progress: TransferProgress) => void) => {
        transferProgressListeners.add(listener);
        return () => { transferProgressListeners.delete(listener); };
      }),
      trash: vi.fn(async (relativePath: string) => {
        const path = normalizePath(relativePath);
        const node = files.get(path);
        if (!node) throw new Error(`not-found: ${path}`);
        const trashId = `mock-${Date.now()}`;
        const entry = {
          originalPath: path,
          trashPath: `.verstak/trash/files/${trashId}/${baseName(path)}`,
          trashId,
          deletedAt: new Date().toISOString(),
          originalType: node.type,
          basename: baseName(path),
          size: node.type === 'file' ? (node.content || '').length : 0,
        };
        const moving = Array.from(files.entries()).filter(([candidate]) => candidate === path || candidate.startsWith(`${path}/`));
        trashPayloads.set(trashId, moving.map(([candidate, movingNode]) => ({
          suffix: candidate.slice(path.length),
          node: { ...movingNode },
        })));
        moving.forEach(([candidate]) => files.delete(candidate));
        trashEntries.unshift(entry);
        return entry;
      }),
      listTrash: vi.fn(async () => trashEntries.slice()),
      restoreTrash: vi.fn(async (trashId: string, options = {}) => {
        const entry = trashEntries.find((item) => item.trashId === trashId);
        if (!entry) throw new Error(`not-found: trash entry ${trashId}`);
        const target = normalizePath((options as { targetPath?: string }).targetPath || entry.originalPath);
        const overwrite = !!(options as { overwrite?: boolean }).overwrite;
        if (files.has(target) && !overwrite) throw new Error(`conflict: ${target}`);
        const parent = parentPath(target);
        if (!files.get(parent) || files.get(parent)?.type !== 'folder') throw new Error(`parent-not-found: ${parent}`);
        if (overwrite) {
          Array.from(files.keys())
            .filter((candidate) => candidate === target || candidate.startsWith(`${target}/`))
            .forEach((candidate) => files.delete(candidate));
        }
        (trashPayloads.get(trashId) || []).forEach(({ suffix, node }) => {
          files.set(`${target}${suffix}`, { ...node, modifiedAt: new Date().toISOString() });
        });
        trashPayloads.delete(trashId);
        const index = trashEntries.findIndex((item) => item.trashId === trashId);
        if (index >= 0) trashEntries.splice(index, 1);
        return target;
      }),
      deleteTrash: vi.fn(async (trashId: string) => {
        const index = trashEntries.findIndex((item) => item.trashId === trashId);
        if (index < 0) throw new Error(`not-found: trash entry ${trashId}`);
        trashEntries.splice(index, 1);
        trashPayloads.delete(trashId);
      }),
      openExternal: vi.fn(async (relativePath: string) => {
        const path = normalizePath(relativePath);
        if (!files.has(path)) throw new Error(`not-found: ${path}`);
      }),
      showInFolder: vi.fn(async (relativePath: string) => {
        const path = normalizePath(relativePath);
        if (!files.has(path)) throw new Error(`not-found: ${path}`);
      }),
    },
    workbench: {
      openResource: vi.fn(async (request) => ({
        status: 'opened' as const,
        providerId: request.context?.notesMode ? 'mock.notes-markdown-provider' : 'mock.open-provider',
        providerPluginId: 'mock.editor',
        providerComponent: 'MockEditor',
        request: { ...request, mode: request.mode || 'view' },
      })),
      editResource: vi.fn(async (request) => ({
        status: 'opened' as const,
        providerId: request.context?.notesMode ? 'mock.notes-markdown-provider' : 'mock.open-provider',
        providerPluginId: 'mock.editor',
        providerComponent: 'MockEditor',
        request: { ...request, mode: 'edit' as const },
      })),
    },
    sync: {
      status: vi.fn(async () => ({
        configured: false,
        serverUrl: '',
        vaultId: '',
        deviceId: '',
        deviceName: '',
        connected: false,
        revoked: false,
        tokenStored: false,
        unpushedOps: 0,
        lastSyncAt: '',
        syncInterval: 0,
        lastError: '',
        lastWarning: '',
        statusLabel: 'disabled',
      })),
      configure: vi.fn(async () => {}),
      disconnect: vi.fn(async () => {}),
      testConnection: vi.fn(async () => {}),
      setInterval: vi.fn(async () => {}),
      resetKey: vi.fn(async () => {}),
      now: vi.fn(async () => ({ pushed: 0, pulled: 0, serverSequence: 0 })),
    },
    git: {
      clone: vi.fn(async () => ({ checkoutPath: 'Deal/Repositories/mock' })),
      registerExisting: vi.fn(async () => ({ checkoutPath: 'Deal/Repositories/mock' })),
      status: vi.fn(async () => ({ state: 'not-cloned' as const, clean: true, changedCount: 0, untrackedCount: 0, changedFiles: [], ahead: 0, behind: 0, recentCommits: [] })),
      fetch: vi.fn(async () => {}),
      pull: vi.fn(async () => {}),
      push: vi.fn(async () => {}),
      openDirectory: vi.fn(async () => {}),
    },
    browserReceiver: {
      pairing: vi.fn(async () => ({
        receiverUrl: 'http://127.0.0.1:47731/api/browser-inbox/v1/captures',
        receiverToken: 'mock-browser-receiver-token',
      })),
      rotateToken: vi.fn(async () => ({
        receiverUrl: 'http://127.0.0.1:47731/api/browser-inbox/v1/captures',
        receiverToken: 'mock-browser-receiver-token-rotated',
      })),
    },
    dispose: vi.fn(),
  };
}

/**
 * Валидатор plugin manifest.
 */
export function validateManifest(manifest: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be an object'] };
  }

  const m = manifest as Record<string, unknown>;

  if (m.schemaVersion !== 1) {
    errors.push(`schemaVersion must be 1, got ${m.schemaVersion}`);
  }
  if (typeof m.id !== 'string' || !m.id) {
    errors.push('id must be a non-empty string');
  }
  if (typeof m.name !== 'string' || !m.name) {
    errors.push('name must be a non-empty string');
  }
  if (typeof m.version !== 'string' || !/^\d+\.\d+\.\d+/.test(m.version as string)) {
    errors.push('version must be a valid semver (e.g. 0.1.0)');
  }
  if (typeof m.apiVersion !== 'string' || !m.apiVersion) {
    errors.push('apiVersion must be a non-empty string');
  }
  if (!Array.isArray(m.provides) || m.provides.length === 0) {
    errors.push('provides must be a non-empty array');
  }
  if (!Array.isArray(m.permissions) || m.permissions.length === 0) {
    errors.push('permissions must be a non-empty array');
  }

  return { valid: errors.length === 0, errors };
}

// Re-export vi for test files
import { vi } from 'vitest';
export { vi };
