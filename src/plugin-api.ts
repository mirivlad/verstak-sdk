// Verstak Plugin SDK — VerstakPluginAPI
// The official runtime API available to all plugins in the frontend context.

import type { PluginSettings } from './types';

/**
 * VerstakPluginAPI — единственный способ для frontend плагина
 * общаться с core платформы.
 *
 * Экземпляр API передаётся плагину при активации через глобальную
 * переменную `window.__VERSTAK_PLUGIN_API__`.
 */
export class VerstakPluginAPI {
  private pluginId: string;
  private capabilities = new Set<string>();

  constructor(pluginId: string) {
    this.pluginId = pluginId;
  }

  /**
   * Инициализация API — вызывается core после загрузки frontend bundle.
   * @internal
   */
  _init(capabilities: string[]): void {
    this.capabilities = new Set(capabilities);
  }

  // ─── View Registration ─────────────────────────────────────

  /**
   * Зарегистрировать view для отображения в UI Shell.
   */
  registerView(id: string, component: unknown): void {
    this._postMessage('register.view', { id, component });
  }

  /**
   * Зарегистрировать панель настроек плагина.
   */
  registerSettingsPanel(id: string, title: string, component: unknown): void {
    this._postMessage('register.settingsPanel', { id, title, component });
  }

  /**
   * Зарегистрировать команду для command palette.
   */
  registerCommand(id: string, title: string, handler: () => void, keybinding?: string): void {
    this._postMessage('register.command', { id, title, keybinding, handler: handler.toString() });
  }

  /**
   * Зарегистрировать действия для файлов.
   */
  registerFileAction(id: string, label: string, handler: (filePath: string) => void, capability?: string): void {
    this._postMessage('register.fileAction', { id, label, handler: handler.toString(), capability });
  }

  /**
   * Зарегистрировать действия для заметок.
   */
  registerNoteAction(id: string, label: string, handler: (noteId: string) => void, capability?: string): void {
    this._postMessage('register.noteAction', { id, label, handler: handler.toString(), capability });
  }

  /**
   * Зарегистрировать provider поиска.
   */
  registerSearchProvider(id: string, label: string, handler: (query: string) => unknown[]): void {
    this._postMessage('register.searchProvider', { id, label, handler: handler.toString() });
  }

  // ─── Capabilities ──────────────────────────────────────────

  /**
   * Проверить, доступна ли capability.
   */
  hasCapability(name: string): boolean {
    return this.capabilities.has(name);
  }

  /**
   * Получить список всех доступных capabilities.
   */
  getAvailableCapabilities(): string[] {
    return Array.from(this.capabilities);
  }

  // ─── Backend Communication ─────────────────────────────────

  /**
   * Вызвать backend метод плагина через RPC.
   */
  async callBackend(method: string, args: unknown[] = []): Promise<unknown> {
    return this._rpcCall(method, args);
  }

  // ─── Settings ──────────────────────────────────────────────

  /**
   * Прочитать настройки плагина.
   */
  async readSettings(): Promise<PluginSettings> {
    const result = await this._rpcCall('readSettings', []);
    return result as PluginSettings;
  }

  /**
   * Записать настройки плагина.
   */
  async writeSettings(settings: PluginSettings): Promise<void> {
    await this._rpcCall('writeSettings', [settings]);
  }

  // ─── Event Bus ─────────────────────────────────────────────

  /**
   * Подписаться на событие event bus.
   */
  subscribe(event: string, handler: (payload: unknown) => void): void {
    this._postMessage('subscribe', { event, handler: handler.toString() });
  }

  /**
   * Опубликовать событие в event bus.
   */
  publish(event: string, payload: unknown): void {
    this._postMessage('publish', { event, payload });
  }

  // ─── Internal ──────────────────────────────────────────────

  private _postMessage(type: string, data: Record<string, unknown>): void {
    window.dispatchEvent(new CustomEvent('verstak:plugin', {
      detail: { pluginId: this.pluginId, type, data }
    }));
  }

  private async _rpcCall(method: string, args: unknown[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const callId = `${this.pluginId}:${Date.now()}:${Math.random()}`;
      const handler = (event: CustomEvent) => {
        if (event.detail.callId === callId) {
          window.removeEventListener('verstak:rpc:response', handler as EventListener);
          if (event.detail.error) {
            reject(new Error(event.detail.error));
          } else {
            resolve(event.detail.result);
          }
        }
      };
      window.addEventListener('verstak:rpc:response', handler as EventListener);
      this._postMessage('rpc', { callId, method, args });
    });
  }
}

/**
 * Создать экземпляр VerstakPluginAPI.
 * Core вызывает эту функцию после загрузки frontend bundle,
 * передавая pluginId и список доступных capabilities.
 */
export function createPluginAPI(pluginId: string): VerstakPluginAPI {
  const api = new VerstakPluginAPI(pluginId);
  return api;
}
