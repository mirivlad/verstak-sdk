// Verstak Plugin SDK — Public API

export * from './types';
export { VerstakPluginAPI, createPluginAPI } from './plugin-api';
export type {
  PluginNotificationRequest,
  SecretRecord,
  SecretScope,
  SecretWriteRequest,
  SecretsStatus,
  ShortcutSpec,
} from './plugin-api';
export { RPCServer, RPCClient } from './rpc';
export {
  createTestManifest,
  createTestPluginState,
  createMockPluginAPI,
  validateManifest,
} from './test-utils';
