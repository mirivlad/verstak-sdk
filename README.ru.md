<div align="center">

# Verstak Plugin SDK

### TypeScript API, JSON-схемы и контрактные тесты для плагинов Верстака.

[English](README.md) · **Русский**

[![Release](https://img.shields.io/github/v/release/mirivlad/verstak-sdk?include_prereleases\&label=release)](https://github.com/mirivlad/verstak-sdk/releases)
![Статус](https://img.shields.io/badge/status-alpha-orange)
[![Лицензия](https://img.shields.io/github/license/mirivlad/verstak-sdk)](LICENSE)

</div>

> **Контракт alpha-версии.** Держите SDK, Desktop и официальные плагины
> в одной релизной линейке, пока API развиваются.

TypeScript API, JSON-схемы и контрактные тесты для плагинов в Verstak Desktop.
SDK версионируется независимо, чтобы авторы плагинов могли валидировать
свои manifest и компилироваться против публичного host API.

## Установка и проверка

```bash
npm ci
npm run lint
npm test
npm run build
```

Сборка создаёт `dist/`. Упакованный npm-артефакт можно сделать локально:

```bash
./scripts/release.sh v0.1.0
```

Скрипт проверяет версию на соответствие `package.json`, затем записывает
npm-тарбол и `SHA256SUMS` в `release/`.

## Публикация GitHub Release

```bash
./scripts/publish-github-release.sh v0.1.0
```

Выполняет локальную упаковку, затем требует чистый актуальный `main` и
авторизованный [`gh`](https://cli.github.com/) CLI. Создаёт и отправляет
аннотированный тег, затем загружает npm-тарбол и `SHA256SUMS` в GitHub Releases.
Запрошенная версия должна совпадать с `package.json`.

## Контракты, актуальные для alpha

- Дела имеют постоянные UUID-идентификаторы; пути — это адреса, а не идентификаторы.
- Активность может быть привязана к `workspaceId` или к явной области `unassigned`.
- `hostname-normalization-v1.json` определяет общее каноническое представление
  доменов браузера, используемое Desktop и расширением.
- Пакеты активности браузера содержат только нормализованный домен и ограниченную
  длительность. Ручные захваты используют отдельный протокол Inbox.

## Контракт синхронизации

`schemas/sync.json` описывает формат журнала операций, используемый Desktop core
и sync-сервером. Сервер упорядочивает операции по `server_sequence`, не сливает
содержимое файлов и не становится источником истины.

- Операции с файлами и папками: `create`, `update`, `delete`, `move`. Небольшой
  UTF-8 текст может быть встроенным; бинарные и большие файлы содержат ссылку
  `blob` `{sha256,size}`.
- Операции с делами (`Deal`) — это сущности `workspace`, принадлежащие core:
  `create`, `rename`, `trash`, `restore` с постоянным `workspaceId`.
- Pull использует `since_sequence` и `page_limit`; клиент сохраняет курсор
  только после успешного применения каждой операции и останавливается на первой
  неудачной.
- Файл, превышающий лимит blob или иначе неподдерживаемый, не помечается
  синхронизированным и повторяется при следующих сканированиях.

## Контракт Frontend API

Verstak Desktop создаёт реальный API через `createPluginAPI(pluginId)` и
передаёт его компонентам плагинов при монтировании. SDK экспортирует
TypeScript-типы для этого объекта:

- `settings.read/write/writeAll`
- `capabilities.list/get/has`
- `commands.register/execute/executeFor`
- `contributions.list`
- `events.publish/subscribe`
- `files.list/metadata/readText/readBytes/writeText/createFolder/move/trash/listTrash/restoreTrash/deleteTrash`
- `workbench.openResource/editResource`
- опциональный `dispose`

Пути к файлам — канонические vault-относительные слеш-пути. Обратные слеши,
абсолютные пути Windows/UNC, переходы по директориям, нулевые байты, варианты
`.verstak` и операции через symlink отклоняются. Чтение/запись текста — только
UTF-8; `readText` ограничен 2 МБ, `readBytes` возвращает base64 для обычных
файлов до 8 МБ.

Запись помечается `service: true`, когда плагин сохраняет собственные учётные
данные, а не то, что создал пользователь. Такая запись всё равно попадает в
Активность, но помечена служебной — и ни один инструмент не считает её работой.

Bundled frontend-плагины являются доверенными и выполняются в контексте JS
рабочего стола. Текущие проверки прав — это контрактные проверки, а не граница
безопасности; настоящая изоляция — в будущем milestone sidecar/sandbox.

## Лицензия

Copyright © 2026 Verstak contributors. Распространяется на условиях
[GNU AGPLv3 или новее](LICENSE).
