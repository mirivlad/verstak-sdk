# Verstak Plugin SDK

TypeScript API, JSON schemas and contract tests for plugins running in Verstak
Desktop. The SDK is versioned independently so plugin authors can validate
their manifests and compile against the public host API.

> **Alpha contract.** This is the first public alpha. Keep SDK, Desktop and
> official-plugin versions in the same release line while APIs are evolving.

## Install and verify

```bash
npm ci
npm run lint
npm test
npm run build
```

The build emits `dist/`. A packed npm artifact can be made locally with:

```bash
./scripts/release.sh v0.1.0
```

It validates the requested version against `package.json`, then writes an npm
tarball and `SHA256SUMS` to `release/`.

## Contracts relevant to the alpha

- Workspaces have durable UUID identities; paths are addresses, not identity.
- Activity may be scoped to `workspaceId` or to explicit `unassigned` work.
- The `hostname-normalization-v1.json` vectors define the shared canonical
  browser-domain representation used by Desktop and the extension.
- Browser activity batches contain only a normalized hostname and bounded
  duration. Manual captures use a separate Inbox protocol.

## Bundled Frontend API Contract

Verstak Desktop creates the real API with `createPluginAPI(pluginId)` and passes
it to bundled plugin components at mount time. The SDK exports TypeScript types
for that host-provided object:

- `settings.read/write/writeAll`
- `capabilities.list/get/has`
- `commands.register/execute/executeFor`
- `contributions.list`
- `events.publish/subscribe`
- `files.list/metadata/readText/readBytes/writeText/createFolder/move/trash/listTrash/restoreTrash/deleteTrash`
- `workbench.openResource/editResource`
- optional `dispose`

Files paths are canonical vault-relative slash paths. Backslashes, Windows/UNC
absolute paths, traversal, null bytes, `.verstak` variants, and symlink
read/write/move/trash operations are rejected by the host. Text read/write is
UTF-8 only; `readText` is limited to 2 MB and `readBytes` returns a bounded
base64 payload for regular files up to 8 MB.

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

## License

Copyright © 2026 Verstak contributors. Licensed under
[GNU AGPLv3 or later](LICENSE).
