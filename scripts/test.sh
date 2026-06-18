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

echo "=== verstak-sdk test ==="

# ── Dependency checks ──
if ! command -v node &>/dev/null; then
  echo "  ❌ node: not found"
  FAILED=1
fi
if ! command -v npm &>/dev/null; then
  echo "  ❌ npm: not found"
  FAILED=1
fi
if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "❌ tests failed — missing core dependencies"
  exit 1
fi

# Install deps if missing
if [ ! -d "$ROOT/node_modules" ]; then
  if [ -f "$ROOT/package-lock.json" ]; then
    (cd "$ROOT" && npm ci --no-audit --no-fund)
    report "npm ci" $?
  else
    (cd "$ROOT" && npm install --no-audit --no-fund)
    report "npm install" $?
  fi
fi

# Run vitest tests. The SDK has contract tests; "no test files" is a failure.
(cd "$ROOT" && npm test)
report "vitest" $?

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "✅ all tests passed"
else
  echo "❌ some tests failed"
fi
exit "$FAILED"
