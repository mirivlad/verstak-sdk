import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import manifestSchema from '../schemas/manifest.json';
import vaultEventsSchema from '../schemas/events/vault.json';
import type { OpenResourceRequest, PluginManifest } from './types';
import { createMockPluginAPI } from './test-utils';

describe('VerstakPluginAPI contract', () => {
  test('mock API exposes the bundled runtime shape', async () => {
    const api = createMockPluginAPI('verstak.platform-test');

    expect(api.pluginId).toBe('verstak.platform-test');
    expect(typeof api.settings.read).toBe('function');
    expect(typeof api.settings.write).toBe('function');
    expect(typeof api.storage.data.read).toBe('function');
    expect(typeof api.storage.data.write).toBe('function');
    expect(typeof api.ui.openSettings).toBe('function');
    expect(typeof api.capabilities.list).toBe('function');
    expect(typeof api.commands.register).toBe('function');
    expect(typeof api.commands.execute).toBe('function');
    expect(typeof api.commands.executeFor).toBe('function');
    expect(typeof api.contributions.list).toBe('function');
    expect(typeof api.events.publish).toBe('function');
    expect(typeof api.events.subscribe).toBe('function');
    expect(typeof api.files.list).toBe('function');
    expect(typeof api.files.metadata).toBe('function');
    expect(typeof api.files.readText).toBe('function');
    expect(typeof api.files.readBytes).toBe('function');
    expect(typeof api.files.writeText).toBe('function');
    expect(typeof api.files.writeBytes).toBe('function');
    expect(typeof api.files.createFolder).toBe('function');
    expect(typeof api.files.move).toBe('function');
    expect(typeof api.files.trash).toBe('function');
    expect(typeof api.files.listTrash).toBe('function');
    expect(typeof api.files.restoreTrash).toBe('function');
    expect(typeof api.files.openExternal).toBe('function');
    expect(typeof api.files.showInFolder).toBe('function');
    expect(typeof api.workbench.openResource).toBe('function');
    expect(typeof api.workbench.editResource).toBe('function');
    expect(typeof api.sync.status).toBe('function');
    expect(typeof api.sync.configure).toBe('function');
    expect(typeof api.sync.resetKey).toBe('function');
    expect(typeof api.sync.now).toBe('function');
  });

  test('manifest schema accepts files permissions used by platform-test', () => {
    const permissionEnum = ((manifestSchema as any).properties.permissions.items.enum || []) as string[];

    expect(permissionEnum).toContain('files.read');
    expect(permissionEnum).toContain('files.write');
    expect(permissionEnum).toContain('files.delete');
    expect(permissionEnum).toContain('files.openExternal');
    expect(permissionEnum).toContain('workbench.open');
  });

  test('file.changed schema documents watcher refresh payload', () => {
    const fileChanged = (vaultEventsSchema as any).events.find((event: any) => event.name === 'file.changed');

    expect(fileChanged.schema.required).toContain('operation');
    expect(fileChanged.schema.properties.operation.enum).toContain('external.create');
    expect(fileChanged.schema.properties.operation.enum).toContain('external.update');
    expect(fileChanged.schema.properties.operation.enum).toContain('external.delete');
    expect(fileChanged.schema.properties.workspaceRootPath.type).toBe('string');
    expect(fileChanged.schema.properties.external.type).toBe('boolean');
  });

  test('official plugin manifests comply with SDK apiVersion and permission schema', () => {
    const pluginsDir = new URL('../../verstak-official-plugins/plugins/', import.meta.url);
    if (!existsSync(pluginsDir)) {
      return;
    }

    const apiVersionPattern = new RegExp((manifestSchema as any).properties.apiVersion.pattern);
    const permissionEnum = ((manifestSchema as any).properties.permissions.items.enum || []) as string[];
    const problems: string[] = [];

    for (const entry of readdirSync(pluginsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const manifestPath = new URL(`${entry.name}/plugin.json`, pluginsDir);
      if (!existsSync(manifestPath)) {
        continue;
      }

      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PluginManifest;
      if (!apiVersionPattern.test(manifest.apiVersion)) {
        problems.push(`${manifest.id}: apiVersion ${manifest.apiVersion} does not match SDK schema`);
      }
      for (const permission of manifest.permissions) {
        if (!permissionEnum.includes(permission)) {
          problems.push(`${manifest.id}: permission ${permission} is not in SDK schema`);
        }
      }
    }

    expect(problems).toEqual([]);
  });

  test('manifest types accept open provider contributions', () => {
    const manifest: PluginManifest = {
      schemaVersion: 1,
      id: 'verstak.default-editor',
      name: 'Default Editor',
      version: '0.1.0',
      apiVersion: '0.1.0',
      provides: ['editor.text', 'editor.text.markdown'],
      permissions: ['ui.register', 'files.read', 'files.write', 'workbench.open'],
      contributes: {
        openProviders: [
          {
            id: 'verstak.default-editor.markdown',
            title: 'Default Markdown Editor',
            priority: 100,
            component: 'MarkdownEditor',
            supports: [
              {
                kind: 'vault-file',
                extensions: ['.md', '.markdown'],
                contexts: ['generic-markdown', 'notes-markdown'],
                modes: ['view'],
              },
              {
                kind: 'vault-file',
                mime: ['text/plain'],
                extensions: ['.txt', '.log'],
                contexts: ['generic-text'],
              },
            ],
          },
        ],
      },
    };

    expect(manifest.contributes?.openProviders?.[0].supports[0].contexts).toContain('notes-markdown');
    expect(manifest.contributes?.openProviders?.[0].supports[0].modes).toContain('view');
    expect(manifest.contributes?.openProviders?.[0].supports[1].contexts).toContain('generic-text');
  });

  test('OpenResourceRequest and no-provider result shape are typed', () => {
    const request: OpenResourceRequest = {
      kind: 'vault-file',
      path: 'Docs/todo.txt',
      mode: 'edit',
      mime: 'text/plain',
      extension: '.txt',
      context: {
        sourcePluginId: 'files.plugin',
        sourceView: 'files',
      },
    };

    const result = {
      status: 'no-provider' as const,
      request,
      message: 'no open provider for resource',
    };

    expect(result.status).toBe('no-provider');
    expect(result.request.context?.sourceView).toBe('files');
  });

  test('workbench mock routes open and edit resources', async () => {
    const api = createMockPluginAPI('files.plugin');
    const request: OpenResourceRequest = {
      kind: 'vault-file',
      path: 'Notes/Overview.md',
      mode: 'view',
      extension: '.md',
      context: {
        sourceView: 'notes',
        isInsideNotesFolder: true,
        notesMode: true,
      },
    };

    await expect(api.workbench.openResource(request)).resolves.toEqual(expect.objectContaining({
      status: 'opened',
      providerId: expect.any(String),
      request: expect.objectContaining({ path: 'Notes/Overview.md', mode: 'view' }),
    }));
    await expect(api.workbench.editResource({ ...request, mode: 'edit' })).resolves.toEqual(expect.objectContaining({
      status: 'opened',
      request: expect.objectContaining({ mode: 'edit' }),
    }));
  });

  test('settings persist in the mock API namespace', async () => {
    const api = createMockPluginAPI();

    await api.settings.write('savedText', 'hello');

    await expect(api.settings.read('savedText')).resolves.toBe('hello');
    await expect(api.settings.read()).resolves.toEqual({ savedText: 'hello' });
  });

  test('plugin data persists separately from settings in the mock API namespace', async () => {
    const api = createMockPluginAPI('storage.plugin');

    await api.settings.write('search-index', { source: 'settings' });
    await api.storage.data.write('search-index', {
      version: 1,
      workspaceRootPath: 'Project',
      entries: [{ path: 'Project/Docs/case.md' }],
    });

    await expect(api.storage.data.read('search-index')).resolves.toEqual({
      version: 1,
      workspaceRootPath: 'Project',
      entries: [{ path: 'Project/Docs/case.md' }],
    });
    await expect(api.settings.read('search-index')).resolves.toEqual({ source: 'settings' });
    await expect(api.storage.data.read('missing')).resolves.toEqual({});
  });

  test('ui openSettings publishes the requested settings target in the mock API namespace', async () => {
    const api = createMockPluginAPI('ui.plugin');
    const received: unknown[] = [];

    const unsubscribe = await api.events.subscribe('ui.openSettings', (event) => {
      received.push(event.payload);
    });

    await api.ui.openSettings('ui.plugin.settings');

    expect(received).toEqual([{ pluginId: 'ui.plugin', panelId: 'ui.plugin.settings' }]);
    unsubscribe();
  });

  test('commands register, execute, and unregister', async () => {
    const api = createMockPluginAPI('cmd.plugin');

    const unregister = await api.commands.register('cmd.plugin.echo', async (args) => args.value);
    await expect(api.commands.execute('cmd.plugin.echo', { value: 'ok' })).resolves.toEqual({
      status: 'handled',
      pluginId: 'cmd.plugin',
      commandId: 'cmd.plugin.echo',
      result: 'ok',
    });

    unregister();
    await expect(api.commands.execute('cmd.plugin.echo', {})).rejects.toThrow('declared-but-unhandled');
  });

  test('contributions list and provider command execution', async () => {
    const api = createMockPluginAPI('consumer.plugin', {
      contributions: {
        fileActions: [{
          pluginId: 'provider.plugin',
          id: 'provider.file.action',
          label: 'Provider File Action',
          handler: 'provider.command',
        }],
      },
    });
    const providerApi = createMockPluginAPI('provider.plugin');

    await providerApi.commands.register('provider.command', async (args) => args.path);

    await expect(api.contributions.list('fileActions')).resolves.toEqual([
      expect.objectContaining({ pluginId: 'provider.plugin', id: 'provider.file.action' }),
    ]);
    await expect(api.commands.executeFor('provider.plugin', 'provider.command', { path: 'Docs/readme.md' })).resolves.toEqual({
      status: 'handled',
      pluginId: 'provider.plugin',
      commandId: 'provider.command',
      result: 'Docs/readme.md',
    });
  });

  test('events publish to subscribers and unsubscribe cleanly', async () => {
    const api = createMockPluginAPI('event.plugin');
    const received: unknown[] = [];

    const unsubscribe = await api.events.subscribe('event.plugin.echo', (event) => {
      received.push(event.payload.message);
    });
    await api.events.publish('event.plugin.echo', { message: 'first' });
    unsubscribe();
    await api.events.publish('event.plugin.echo', { message: 'second' });

    expect(received).toEqual(['first']);
  });

  test('files mock supports text write, read, list, move, trash, and external open', async () => {
    const api = createMockPluginAPI('files.plugin');

    await api.files.createFolder('PlatformTest');
    await api.files.writeText('PlatformTest/one.txt', 'hello', { createIfMissing: true });
    await api.files.writeBytes('PlatformTest/image.bin', 'AQID', { createIfMissing: true });
    await expect(api.files.readText('PlatformTest/one.txt')).resolves.toBe('hello');
    await expect(api.files.readBytes('PlatformTest/one.txt')).resolves.toEqual({
      relativePath: 'PlatformTest/one.txt',
      size: 5,
      mimeHint: 'text/plain; charset=utf-8',
      dataBase64: 'aGVsbG8=',
    });
    await expect(api.files.readBytes('PlatformTest/image.bin')).resolves.toEqual({
      relativePath: 'PlatformTest/image.bin',
      size: 3,
      mimeHint: '',
      dataBase64: 'AQID',
    });
    await expect(api.files.list('PlatformTest')).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ relativePath: 'PlatformTest/one.txt', type: 'file' }),
      expect.objectContaining({ relativePath: 'PlatformTest/image.bin', type: 'file' }),
    ]));
    await expect(api.files.openExternal('PlatformTest/one.txt')).resolves.toBeUndefined();
    await expect(api.files.showInFolder('PlatformTest/one.txt')).resolves.toBeUndefined();
    await api.files.move('PlatformTest/one.txt', 'PlatformTest/two.txt');
    const trash = await api.files.trash('PlatformTest/two.txt');

    expect(trash.originalPath).toBe('PlatformTest/two.txt');
    expect(trash.trashId).toBeTruthy();
    expect(trash.trashPath).toMatch(/^\.verstak\/trash\/files\/.+\/two\.txt$/);
    await expect(api.files.listTrash()).resolves.toEqual([
      expect.objectContaining({ originalPath: 'PlatformTest/two.txt', trashId: trash.trashId }),
    ]);
    await expect(api.files.restoreTrash(trash.trashId)).resolves.toBe('PlatformTest/two.txt');
    await expect(api.files.list('PlatformTest')).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ relativePath: 'PlatformTest/two.txt', type: 'file' }),
      expect.objectContaining({ relativePath: 'PlatformTest/image.bin', type: 'file' }),
    ]));
    await expect(api.files.listTrash()).resolves.toEqual([]);
  });

  test('files mock rejects non-canonical and reserved paths', async () => {
    const api = createMockPluginAPI('files.plugin');

    await expect(api.files.readText(String.raw`PlatformTest\one.txt`)).rejects.toThrow('backslash');
    await expect(api.files.readText('//server/share')).rejects.toThrow('absolute');
    await expect(api.files.readText('C:/Windows/system.ini')).rejects.toThrow('absolute');
    await expect(api.files.readText('../secret')).rejects.toThrow('path-traversal');
    await expect(api.files.readText('bad\0path')).rejects.toThrow('null-byte');
    await expect(api.files.readText('.Verstak/vault.json')).rejects.toThrow('reserved-path');
  });

  test('files mock rejects moving a folder into itself', async () => {
    const api = createMockPluginAPI('files.plugin');

    await api.files.createFolder('Folder');

    await expect(api.files.move('Folder', 'Folder/Child')).rejects.toThrow('move-into-self');
  });
});
