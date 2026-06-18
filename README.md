# verstak-sdk

Verstak Plugin SDK — manifest schema, TypeScript SDK, RPC protocol, capability contracts, event schemas, test helpers, packaging tools

## Bundled Frontend API Contract

Verstak Desktop creates the real API with `createPluginAPI(pluginId)` and passes
it to bundled plugin components at mount time. The SDK exports TypeScript types
for that host-provided object:

- `settings.read/write/writeAll`
- `capabilities.list/get/has`
- `commands.register/execute`
- `events.publish/subscribe`
- `files.list/metadata/readText/writeText/createFolder/move/trash`
- `workbench.openResource/editResource`
- optional `dispose`

Files paths are canonical vault-relative slash paths. Backslashes, Windows/UNC
absolute paths, traversal, null bytes, `.verstak` variants, and symlink
read/write/move/trash operations are rejected by the host. Files read/write is
UTF-8 text-only in the current runtime.

Open/edit routing uses `OpenResourceRequest` with `kind: "vault-file"` and
contexts `generic-text`, `generic-markdown`, and `notes-markdown`. Plugins that
request routing declare `workbench.open`; editor/viewer plugins contribute
`contributes.openProviders`. A no-match route returns `status: "no-provider"`.

Bundled frontend plugins are trusted/cooperative and run in the desktop JS
context. Current permission checks are contract checks, not a security boundary;
real isolation belongs to a later sidecar/sandbox milestone.
