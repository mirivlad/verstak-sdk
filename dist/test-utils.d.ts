import type { PluginManifest, PluginState } from './types';
import type { VerstakPluginAPI } from './plugin-api';
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
export declare function createMockPluginAPI(pluginId?: string): VerstakPluginAPI;
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