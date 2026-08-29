import type { CapabilityEntry, ImportSourceEntry, ImportSourceSession, PluginManifest, PluginState, RegisteredContributionPoints } from './types';
import type { PluginLocale, PluginWorkspace, VerstakPluginAPI } from './plugin-api';
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
export declare function createMockPluginAPI(pluginId?: string, options?: MockPluginAPIOptions): VerstakPluginAPI;
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