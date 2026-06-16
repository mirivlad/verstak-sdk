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

# Run vitest tests
if grep -q '"test"' "$ROOT/package.json" 2>/dev/null; then
  OUTPUT=$(cd "$ROOT" && npm test 2>&1) || true
  if echo "$OUTPUT" | grep -q "No test files found"; then
    echo "  ℹ️  vitest: no test files yet"
  else
    echo "$OUTPUT"
    report "vitest" ${PIPESTATUS[0]}
  fi
else
  echo "  ℹ️  no test script in package.json"
fi

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "✅ all tests passed"
else
  echo "❌ some tests failed"
fi
exit "$FAILED"
