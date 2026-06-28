# verstak-sdk

Verstak Plugin SDK — manifest schema, TypeScript SDK, RPC protocol, capability contracts, event schemas, test helpers, packaging tools

## Bundled Frontend API Contract

Verstak Desktop creates the real API with `createPluginAPI(pluginId)` and passes
it to bundled plugin components at mount time. The SDK exports TypeScript types
for that host-provided object:

- `settings.read/write/writeAll`
- `capabilities.list/get/has`
- `commands.register/execute/executeFor`
- `contributions.list`
- `events.publish/subscribe`
- `files.list/metadata/readText/writeText/createFolder/move/trash/listTrash/restoreTrash`
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

`contributions.list(point)` returns host-flattened contribution records with
`pluginId`. Files and Notes use this with `commands.executeFor(pluginId,
handler, args)` to run action providers declared by other plugins.

Workspace lifecycle events are `workspace.created`, `workspace.renamed`,
`workspace.trashed`, and `workspace.selected`. Payloads include
`workspaceRootPath` and `workspaceName`; rename/trash events include previous
or trash metadata.

Bundled frontend plugins are trusted/cooperative and run in the desktop JS
context. Current permission checks are contract checks, not a security boundary;
real isolation belongs to a later sidecar/sandbox milestone.
