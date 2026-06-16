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

echo "=== verstak-sdk check ==="

# ── Dependency checks ──
if ! command -v node &>/dev/null; then
  echo "  ❌ node: not found"
  FAILED=1
fi
if ! command -v npm &>/dev/null; then
  echo "  ❌ npm: not found"
  FAILED=1
fi

# Validate that all JSON schemas are valid JSON
echo "[schema validation]"
if command -v python3 &>/dev/null; then
  SCHEMA_DIR="$ROOT/schemas"
  python3 -c "
import json, glob, sys
schemas = glob.glob('$SCHEMA_DIR/**/*.json', recursive=True) + glob.glob('$SCHEMA_DIR/*.json', recursive=False)
errors = []
for path in schemas:
    try:
        with open(path) as f:
            data = json.load(f)
        if '\$schema' not in data:
            errors.append(path + ': missing \$schema')
        if 'type' not in data:
            errors.append(path + ': missing type')
    except json.JSONDecodeError as e:
        errors.append(path + ': ' + str(e))
    except Exception as e:
        errors.append(path + ': ' + str(e))
if errors:
    for e in errors:
        print('  \u274c ' + e)
    sys.exit(1)
else:
    print('  \u2705', len(schemas), 'schemas: valid JSON with \$schema and type')
"
  report "JSON schemas valid" $?
else
  echo "  ℹ️  python3 not available — skipping schema validation"
fi

# TypeScript check (noEmit)
echo "[typescript]"
if [ "$FAILED" -eq 0 ]; then
  if [ ! -d "$ROOT/node_modules" ]; then
    if [ -f "$ROOT/package-lock.json" ]; then
      (cd "$ROOT" && npm ci --no-audit --no-fund)
      report "npm ci" $?
    else
      (cd "$ROOT" && npm install --no-audit --no-fund)
      report "npm install" $?
    fi
  fi
  (cd "$ROOT" && npx tsc --noEmit)
  report "tsc --noEmit" $?
fi

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "✅ all checks passed"
else
  echo "❌ some checks failed"
fi
exit "$FAILED"
