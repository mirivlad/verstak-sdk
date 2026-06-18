// Verstak Plugin SDK — Test Utilities

import type { PluginManifest, PluginState } from './types';
import type { VerstakPluginAPI } from './plugin-api';

/**
 * Создать тестовый manifest для unit-тестов.
 */
export function createTestManifest(overrides?: Partial<PluginManifest>): PluginManifest {
  return {
    schemaVersion: 1,
    id: 'test.plugin',
    name: 'Test Plugin',
    version: '0.1.0',
    apiVersion: '1',
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
export function createMockPluginAPI(pluginId = 'test.plugin'): VerstakPluginAPI {
  const settings: Record<string, unknown> = {};
  const commands = new Map<string, (args: Record<string, unknown>) => unknown>();
  const eventHandlers = new Map<string, Array<(event: any) => void>>();
  const files = new Map<string, { type: 'file' | 'folder'; content?: string; modifiedAt: string }>();
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
    capabilities: {
      has: vi.fn(async () => false),
      get: vi.fn(async (name: string) => ({ available: false, name })),
      list: vi.fn(async () => []),
    },
    commands: {
      register: vi.fn(async (commandId: string, handler: (args: Record<string, unknown>) => unknown) => {
        commands.set(commandId, handler);
        return () => { commands.delete(commandId); };
      }),
      execute: vi.fn(async (commandId: string, args: Record<string, unknown> = {}) => {
        const handler = commands.get(commandId);
        if (!handler) {
          throw new Error(`declared-but-unhandled: ${commandId}`);
        }
        return { status: 'handled' as const, pluginId, commandId, result: await handler(args) };
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
      createFolder: vi.fn(async (relativePath: string) => {
        const path = normalizePath(relativePath);
        if (files.has(path)) throw new Error(`conflict: ${path}`);
        const parent = parentPath(path);
        if (!files.get(parent) || files.get(parent)?.type !== 'folder') throw new Error(`parent-not-found: ${parent}`);
        files.set(path, { type: 'folder', modifiedAt: new Date().toISOString() });
      }),
      move: vi.fn(async (fromRelativePath: string, toRelativePath: string, options = {}) => {
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
        const moving = Array.from(files.entries()).filter(([path]) => path === from || path.startsWith(`${from}/`));
        moving.forEach(([path, movingNode]) => {
          const suffix = path.slice(from.length);
          files.set(`${to}${suffix}`, movingNode);
          files.delete(path);
        });
      }),
      trash: vi.fn(async (relativePath: string) => {
        const path = normalizePath(relativePath);
        if (!files.has(path)) throw new Error(`not-found: ${path}`);
        files.delete(path);
        const trashId = `mock-${Date.now()}`;
        return {
          originalPath: path,
          trashPath: `.verstak/trash/files/${trashId}/${baseName(path)}`,
          trashId,
          deletedAt: new Date().toISOString(),
        };
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
