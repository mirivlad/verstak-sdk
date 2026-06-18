// Verstak Plugin SDK — bundled frontend plugin API contract.
//
// The desktop host creates the real API with createPluginAPI(pluginId) inside
// VerstakPluginAPI.js and passes it to bundled plugin components at mount time.
// This SDK file intentionally exposes the TypeScript contract only; it is not
// a standalone security boundary or RPC client.
export function createPluginAPI(_pluginId) {
    throw new Error('createPluginAPI is provided by Verstak Desktop at plugin runtime');
}
//# sourceMappingURL=plugin-api.js.map