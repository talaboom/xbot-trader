#!/usr/bin/env bash
# autoflow: format the file Claude just edited, using the project's available formatter.
# Silent on success; never blocks the tool call.
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

ext="${file_path##*.}"
base=$(basename "$file_path")

# Resolve formatter for this extension. Honors AUTOFLOW_DISABLE_FORMAT=1 to skip.
[ "${AUTOFLOW_DISABLE_FORMAT:-0}" = "1" ] && exit 0

run() { "$@" >/dev/null 2>&1 || true; }

case "$ext" in
  js|jsx|ts|tsx|mjs|cjs|json|jsonc|css|scss|less|html|vue|svelte|md|mdx|yaml|yml)
    if command -v prettier >/dev/null 2>&1; then
      run prettier --write --log-level=silent "$file_path"
    elif command -v npx >/dev/null 2>&1 && [ -f "package.json" ]; then
      run npx --no-install prettier --write --log-level=silent "$file_path"
    fi
    ;;
  py)
    if command -v ruff >/dev/null 2>&1; then
      run ruff format "$file_path"
      run ruff check --fix --quiet "$file_path"
    elif command -v black >/dev/null 2>&1; then
      run black --quiet "$file_path"
    fi
    ;;
  go)
    command -v gofmt >/dev/null 2>&1 && run gofmt -w "$file_path"
    command -v goimports >/dev/null 2>&1 && run goimports -w "$file_path"
    ;;
  rs)
    command -v rustfmt >/dev/null 2>&1 && run rustfmt --edition=2021 "$file_path"
    ;;
  sh|bash)
    command -v shfmt >/dev/null 2>&1 && run shfmt -w "$file_path"
    ;;
  rb)
    command -v rubocop >/dev/null 2>&1 && run rubocop -A --force-exclusion "$file_path"
    ;;
  *)
    case "$base" in
      Dockerfile|*.dockerfile)
        command -v dockfmt >/dev/null 2>&1 && run dockfmt fmt -w "$file_path"
        ;;
    esac
    ;;
esac

exit 0
