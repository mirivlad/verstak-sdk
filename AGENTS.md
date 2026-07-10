# AGENTS.md — Verstak SDK

## Назначение

`verstak-sdk` — общие контракты для разработки плагинов. Содержит схемы манифестов, TypeScript SDK, RPC протокол, capability contracts, event schemas и инструменты сборки.

## Состав

```
verstak-sdk/
  AGENTS.md
  schemas/
    manifest.json        — JSON Schema для plugin.json
    capabilities.json    — реестр известных capability names
    contributions.json   — contribution points схема
    permissions.json     — permissions схема
    events/              — event schemas
      browser.json
      vault.json
      lifecycle.json
    sync.json            — sync operation schemas
  src/
    plugin-api.ts        — VerstakPluginAPI (frontend runtime)
    types.ts             — TypeScript types для manifest, capabilities, etc.
    rpc.ts               — RPC client для sidecar
    test-utils.ts        — test helpers
  examples/
    minimal-plugin/
  package.json
  tsconfig.json
```

## Правила

- Схемы — source of truth. TypeScript типы генерируются из JSON Schema.
- SDK не должен зависеть от конкретных плагинов.
- VerstakPluginAPI — единственный способ для frontend плагина общаться с core.
- RPC протокол должен быть языково-нейтральным.
- Новые capability names регистрируются в schemas/capabilities.json.

## Capability Registry (известные)

```
editor.text
editor.text.markdown
editor.note.markdown
viewer.file
viewer.image
viewer.text
preview.markdown
preview.file
workspace.files
workspace.notes
vault.files
entity.file
entity.note
note.registry
file.browser
trash.management
activity.log
activity.provider
activity.reconstruction
worklog
journal
report.worklog
capture.browser
browser.inbox
domain.binding
search
search.provider
search.indexer
secret-store
secrets.read-ui
secrets.write-ui
case.templates
link.resolver
```

## Contribution Points

```
sidebar.items
main.views
case.tabs
file.actions
note.actions
context.menu
commands
settings.panels
search.providers
activity.providers
status.bar.items
importers
exporters
protocol.receivers
```
