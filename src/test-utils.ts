// Verstak Plugin SDK — Test Utilities

import type { PluginManifest, PluginState } from './types';

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
export function createMockPluginAPI(): {
  registerView: ReturnType<typeof vi.fn>;
  registerCommand: ReturnType<typeof vi.fn>;
  registerSettingsPanel: ReturnType<typeof vi.fn>;
  hasCapability: ReturnType<typeof vi.fn>;
  callBackend: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  publish: ReturnType<typeof vi.fn>;
} {
  return {
    registerView: vi.fn(),
    registerCommand: vi.fn(),
    registerSettingsPanel: vi.fn(),
    hasCapability: vi.fn().mockReturnValue(false),
    callBackend: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
    publish: vi.fn(),
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
