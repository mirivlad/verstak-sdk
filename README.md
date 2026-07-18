<div align="center">

# Verstak Plugin SDK

### TypeScript API, JSON schemas and contract tests for Verstak plugins.

**English** · [Русский](README.ru.md)

[![Release](https://img.shields.io/github/v/release/mirivlad/verstak-sdk?include_prereleases\&label=release)](https://github.com/mirivlad/verstak-sdk/releases)
![Status](https://img.shields.io/badge/status-alpha-orange)
[![License](https://img.shields.io/github/license/mirivlad/verstak-sdk)](LICENSE)

</div>

> **Alpha contract.** Keep SDK, Desktop and official-plugin versions in the
> same release line while APIs are evolving.

TypeScript API, JSON schemas and contract tests for plugins running in Verstak
Desktop. The SDK is versioned independently so plugin authors can validate
their manifests and compile against the public host API.

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

## Publish a GitHub Release

```bash
./scripts/publish-github-release.sh v0.1.0
```

This runs the same local packaging command, then requires a clean, up-to-date
`main` and an authenticated [`gh`](https://cli.github.com/) CLI. It creates and
pushes the annotated version tag when needed and uploads the npm tarball and
`SHA256SUMS` to GitHub Releases. The requested version must match
`package.json`.

## Contracts relevant to the alpha

- Workspaces have durable UUID identities; paths are addresses, not identity.
- Activity may be scoped to `workspaceId` or to explicit `unassigned` work.
- The `hostname-normalization-v1.json` vectors define the shared canonical
  browser-domain representation used by Desktop and the extension.
- Browser activity batches contain only a normalized hostname and bounded
  duration. Manual captures use a separate Inbox protocol.

## Core sync contract

`schemas/sync.json` describes the operation-log wire format used by Desktop
core and sync-server. The server orders opaque operations by
`server_sequence`; it does not merge file contents or become the source of
truth. Sync plugins only use `api.sync` for configuration and status.

- File and folder operations are `create`, `update`, `delete`, or `move`.
  Small UTF-8 text may be inline; binary and large files carry a `blob`
  `{sha256,size}` reference. The bytes are uploaded/downloaded through the
  scoped Blob API before an operation is accepted/applied, never base64 in the
  operation log.
- Workspace (`Deal`) operations are core-owned `workspace` entities with
  `create`, `rename`, `trash`, and `restore`. Their payload carries the durable
  `workspaceId`; `.verstak/workspace.json` remains unavailable to plugins and
  is not ordinary file sync data.
- A pairing may name an existing remote `vaultId`. Omitting it creates/uses the
  local vault identity. `SyncStatus.vaultId` reports the selected remote scope.
- Pull uses `since_sequence` and a bounded `page_limit`; each response has
  `page_last_sequence` and `has_more`. Clients persist a cursor only after an
  operation is safely applied and stop at the first failed sequence.
- `SyncStatus.lastWarning` reports a persistent unresolved scanner problem.
  A file over the configured blob limit or otherwise unsupported is not marked
  synchronized and is retried on later scans.

The snapshot stored by core is implementation state, not a plugin API. It
excludes `.verstak`, trash, temporary files, and symlinks. Blob ownership,
quotas and pagination are part of the current wire contract. Operation-log
retention remains a future checkpoint milestone: deleting it now could prevent
a newly paired device from reconstructing a vault.

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
