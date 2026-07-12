#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REQUESTED_VERSION="${1:-}"
PACKAGE_VERSION="$(node -p "require('$ROOT/package.json').version")"

if [[ -z "$REQUESTED_VERSION" ]]; then
  echo "usage: $0 <version>" >&2
  echo "example: $0 v0.1.0" >&2
  exit 2
fi
if [[ "${REQUESTED_VERSION#v}" != "$PACKAGE_VERSION" ]]; then
  echo "requested version $REQUESTED_VERSION does not match package.json $PACKAGE_VERSION" >&2
  exit 1
fi

echo "=== verstak sdk release $PACKAGE_VERSION ==="
(cd "$ROOT" && npm ci --no-audit --no-fund && npm run lint && npm test && npm run build)

RELEASE_ROOT="$ROOT/release"
rm -rf "$RELEASE_ROOT"
mkdir -p "$RELEASE_ROOT"
(cd "$ROOT" && npm pack --pack-destination "$RELEASE_ROOT")
(cd "$RELEASE_ROOT" && sha256sum ./*.tgz > SHA256SUMS)

echo "release package: $RELEASE_ROOT"
echo "checksums:       $RELEASE_ROOT/SHA256SUMS"
