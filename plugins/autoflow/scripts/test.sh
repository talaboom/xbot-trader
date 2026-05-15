#!/usr/bin/env bash
# autoflow: run tests related to the file Claude just edited.
# On test failure exits with status 2 so the failure output is fed back to Claude.
# Silent (exit 0) when no test runner is detected or no related tests exist.
set -uo pipefail

input=$(cat)

file_path=$(printf '%s' "$input" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get("tool_input", {}).get("file_path", ""))
except Exception:
    pass
' 2>/dev/null)

[ -z "$file_path" ] && exit 0
[ ! -f "$file_path" ] && exit 0
[ "${AUTOFLOW_DISABLE_TESTS:-0}" = "1" ] && exit 0

ext="${file_path##*.}"
dir=$(dirname "$file_path")

# Don't run tests on test-config or doc edits.
case "$file_path" in
  *.md|*.json|*.yaml|*.yml|*.lock|*.toml) exit 0 ;;
esac

find_up() {
  local start="$1" marker="$2" cur
  cur=$(cd "$start" 2>/dev/null && pwd) || return 1
  while [ "$cur" != "/" ] && [ -n "$cur" ]; do
    [ -e "$cur/$marker" ] && printf '%s' "$cur" && return 0
    cur=$(dirname "$cur")
  done
  return 1
}

report_failure() {
  local label="$1" output="$2"
  echo "autoflow: $label failed for $file_path" >&2
  printf '%s\n' "$output" | tail -80 >&2
  exit 2
}

run_capture() {
  # Run command in given dir, capture combined output, return its exit code.
  local workdir="$1"; shift
  ( cd "$workdir" && "$@" ) 2>&1
}

case "$ext" in
  js|jsx|ts|tsx|mjs|cjs)
    root=$(find_up "$dir" "package.json") || exit 0
    pkg="$root/package.json"
    if grep -q '"jest"' "$pkg" 2>/dev/null || [ -f "$root/jest.config.js" ] || [ -f "$root/jest.config.ts" ] || [ -f "$root/jest.config.mjs" ]; then
      out=$(run_capture "$root" npx --no-install jest --findRelatedTests --passWithNoTests --silent "$file_path") \
        || report_failure "jest" "$out"
    elif grep -q '"vitest"' "$pkg" 2>/dev/null || [ -f "$root/vitest.config.ts" ] || [ -f "$root/vitest.config.js" ] || [ -f "$root/vitest.config.mts" ]; then
      out=$(run_capture "$root" npx --no-install vitest related --run --passWithNoTests "$file_path") \
        || report_failure "vitest" "$out"
    fi
    ;;
  py)
    root=$(find_up "$dir" "pyproject.toml") || root=$(find_up "$dir" "setup.py") || exit 0
    command -v pytest >/dev/null 2>&1 || exit 0
    base=$(basename "$file_path" .py)
    # Find a test file matching the edited module.
    candidates=$(find "$root" \( -path '*/.venv' -o -path '*/node_modules' -o -path '*/.git' \) -prune -o \
      \( -name "test_${base}.py" -o -name "${base}_test.py" \) -print 2>/dev/null | head -3)
    [ -z "$candidates" ] && exit 0
    targets=$(printf '%s' "$candidates" | tr '\n' ' ')
    out=$(run_capture "$root" pytest -x -q $targets) \
      || report_failure "pytest" "$out"
    ;;
  go)
    find_up "$dir" "go.mod" >/dev/null || exit 0
    pkg_dir="$dir"
    out=$(run_capture "$pkg_dir" go test -count=1 ./.) \
      || report_failure "go test" "$out"
    ;;
  rs)
    root=$(find_up "$dir" "Cargo.toml") || exit 0
    out=$(run_capture "$root" cargo test --quiet) \
      || report_failure "cargo test" "$out"
    ;;
esac

exit 0
