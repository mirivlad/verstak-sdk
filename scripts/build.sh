#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAILED=0

report() {
  if [ "$2" -eq 0 ]; then
    echo "  ✅ $1"
  else
    echo "  ❌ $1"
    FAILED=1
  fi
}

echo "=== verstak-sdk build ==="

# ── Dependency checks ──
echo "[deps]"
if ! command -v node &>/dev/null; then
  echo "  ❌ node: not found"
  FAILED=1
else
  echo "  ✅ node $(node --version)"
fi
if ! command -v npm &>/dev/null; then
  echo "  ❌ npm: not found"
  FAILED=1
fi
if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "❌ build failed — missing core dependencies"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "$ROOT/node_modules" ] || [ ! -f "$ROOT/node_modules/.package-lock.json" ]; then
  if [ -f "$ROOT/package-lock.json" ]; then
    (cd "$ROOT" && npm ci --no-audit --no-fund)
    report "npm ci" $?
  else
    (cd "$ROOT" && npm install --no-audit --no-fund)
    report "npm install" $?
  fi
fi

# Build TypeScript
(cd "$ROOT" && npm run build)
report "tsc build" $?

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "✅ build passed"
else
  echo "❌ build failed"
fi
exit "$FAILED"
