import type { PluginSettings } from './types';
/**
 * VerstakPluginAPI — единственный способ для frontend плагина
 * общаться с core платформы.
 *
 * Экземпляр API передаётся плагину при активации через глобальную
 * переменную `window.__VERSTAK_PLUGIN_API__`.
 */
export declare class VerstakPluginAPI {
    private pluginId;
    private capabilities;
    constructor(pluginId: string);
    /**
     * Инициализация API — вызывается core после загрузки frontend bundle.
     * @internal
     */
    _init(capabilities: string[]): void;
    /**
     * Зарегистрировать view для отображения в UI Shell.
     */
    registerView(id: string, component: unknown): void;
    /**
     * Зарегистрировать панель настроек плагина.
     */
    registerSettingsPanel(id: string, title: string, component: unknown): void;
    /**
     * Зарегистрировать команду для command palette.
     */
    registerCommand(id: string, title: string, handler: () => void, keybinding?: string): void;
    /**
     * Зарегистрировать действия для файлов.
     */
    registerFileAction(id: string, label: string, handler: (filePath: string) => void, capability?: string): void;
    /**
     * Зарегистрировать действия для заметок.
     */
    registerNoteAction(id: string, label: string, handler: (noteId: string) => void, capability?: string): void;
    /**
     * Зарегистрировать provider поиска.
     */
    registerSearchProvider(id: string, label: string, handler: (query: string) => unknown[]): void;
    /**
     * Проверить, доступна ли capability.
     */
    hasCapability(name: string): boolean;
    /**
     * Получить список всех доступных capabilities.
     */
    getAvailableCapabilities(): string[];
    /**
     * Вызвать backend метод плагина через RPC.
     */
    callBackend(method: string, args?: unknown[]): Promise<unknown>;
    /**
     * Прочитать настройки плагина.
     */
    readSettings(): Promise<PluginSettings>;
    /**
     * Записать настройки плагина.
     */
    writeSettings(settings: PluginSettings): Promise<void>;
    /**
     * Подписаться на событие event bus.
     */
    subscribe(event: string, handler: (payload: unknown) => void): void;
    /**
     * Опубликовать событие в event bus.
     */
    publish(event: string, payload: unknown): void;
    private _postMessage;
    private _rpcCall;
}
/**
 * Создать экземпляр VerstakPluginAPI.
 * Core вызывает эту функцию после загрузки frontend bundle,
 * передавая pluginId и список доступных capabilities.
 */
export declare function createPluginAPI(pluginId: string): VerstakPluginAPI;
//# sourceMappingURL=plugin-api.d.ts.map