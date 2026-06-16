// Verstak Plugin SDK — VerstakPluginAPI
// The official runtime API available to all plugins in the frontend context.
/**
 * VerstakPluginAPI — единственный способ для frontend плагина
 * общаться с core платформы.
 *
 * Экземпляр API передаётся плагину при активации через глобальную
 * переменную `window.__VERSTAK_PLUGIN_API__`.
 */
export class VerstakPluginAPI {
    pluginId;
    capabilities = new Set();
    constructor(pluginId) {
        this.pluginId = pluginId;
    }
    /**
     * Инициализация API — вызывается core после загрузки frontend bundle.
     * @internal
     */
    _init(capabilities) {
        this.capabilities = new Set(capabilities);
    }
    // ─── View Registration ─────────────────────────────────────
    /**
     * Зарегистрировать view для отображения в UI Shell.
     */
    registerView(id, component) {
        this._postMessage('register.view', { id, component });
    }
    /**
     * Зарегистрировать панель настроек плагина.
     */
    registerSettingsPanel(id, title, component) {
        this._postMessage('register.settingsPanel', { id, title, component });
    }
    /**
     * Зарегистрировать команду для command palette.
     */
    registerCommand(id, title, handler, keybinding) {
        this._postMessage('register.command', { id, title, keybinding, handler: handler.toString() });
    }
    /**
     * Зарегистрировать действия для файлов.
     */
    registerFileAction(id, label, handler, capability) {
        this._postMessage('register.fileAction', { id, label, handler: handler.toString(), capability });
    }
    /**
     * Зарегистрировать действия для заметок.
     */
    registerNoteAction(id, label, handler, capability) {
        this._postMessage('register.noteAction', { id, label, handler: handler.toString(), capability });
    }
    /**
     * Зарегистрировать provider поиска.
     */
    registerSearchProvider(id, label, handler) {
        this._postMessage('register.searchProvider', { id, label, handler: handler.toString() });
    }
    // ─── Capabilities ──────────────────────────────────────────
    /**
     * Проверить, доступна ли capability.
     */
    hasCapability(name) {
        return this.capabilities.has(name);
    }
    /**
     * Получить список всех доступных capabilities.
     */
    getAvailableCapabilities() {
        return Array.from(this.capabilities);
    }
    // ─── Backend Communication ─────────────────────────────────
    /**
     * Вызвать backend метод плагина через RPC.
     */
    async callBackend(method, args = []) {
        return this._rpcCall(method, args);
    }
    // ─── Settings ──────────────────────────────────────────────
    /**
     * Прочитать настройки плагина.
     */
    async readSettings() {
        const result = await this._rpcCall('readSettings', []);
        return result;
    }
    /**
     * Записать настройки плагина.
     */
    async writeSettings(settings) {
        await this._rpcCall('writeSettings', [settings]);
    }
    // ─── Event Bus ─────────────────────────────────────────────
    /**
     * Подписаться на событие event bus.
     */
    subscribe(event, handler) {
        this._postMessage('subscribe', { event, handler: handler.toString() });
    }
    /**
     * Опубликовать событие в event bus.
     */
    publish(event, payload) {
        this._postMessage('publish', { event, payload });
    }
    // ─── Internal ──────────────────────────────────────────────
    _postMessage(type, data) {
        window.dispatchEvent(new CustomEvent('verstak:plugin', {
            detail: { pluginId: this.pluginId, type, data }
        }));
    }
    async _rpcCall(method, args) {
        return new Promise((resolve, reject) => {
            const callId = `${this.pluginId}:${Date.now()}:${Math.random()}`;
            const handler = (event) => {
                if (event.detail.callId === callId) {
                    window.removeEventListener('verstak:rpc:response', handler);
                    if (event.detail.error) {
                        reject(new Error(event.detail.error));
                    }
                    else {
                        resolve(event.detail.result);
                    }
                }
            };
            window.addEventListener('verstak:rpc:response', handler);
            this._postMessage('rpc', { callId, method, args });
        });
    }
}
/**
 * Создать экземпляр VerstakPluginAPI.
 * Core вызывает эту функцию после загрузки frontend bundle,
 * передавая pluginId и список доступных capabilities.
 */
export function createPluginAPI(pluginId) {
    const api = new VerstakPluginAPI(pluginId);
    return api;
}
//# sourceMappingURL=plugin-api.js.map