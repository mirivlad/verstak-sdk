import type { PluginManifest, PluginState } from './types';
/**
 * Создать тестовый manifest для unit-тестов.
 */
export declare function createTestManifest(overrides?: Partial<PluginManifest>): PluginManifest;
/**
 * Создать тестовое состояние плагина.
 */
export declare function createTestPluginState(overrides?: Partial<PluginState>): PluginState;
/**
 * Создать заглушку VerstakPluginAPI для тестов.
 */
export declare function createMockPluginAPI(): {
    registerView: ReturnType<typeof vi.fn>;
    registerCommand: ReturnType<typeof vi.fn>;
    registerSettingsPanel: ReturnType<typeof vi.fn>;
    hasCapability: ReturnType<typeof vi.fn>;
    callBackend: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
    publish: ReturnType<typeof vi.fn>;
};
/**
 * Валидатор plugin manifest.
 */
export declare function validateManifest(manifest: unknown): {
    valid: boolean;
    errors: string[];
};
import { vi } from 'vitest';
export { vi };
//# sourceMappingURL=test-utils.d.ts.map