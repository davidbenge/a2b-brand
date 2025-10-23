#!/bin/bash
set -euo pipefail

# Deletes all actions in the current AIO runtime namespace for this app.
# Usage:
#   ./scripts/cleanup-runtime-actions.sh           # dry-run: list actions to delete
#   ./scripts/cleanup-runtime-actions.sh --confirm # actually delete
# Requires: logged-in Adobe I/O CLI context (aio app use ... -m)

if ! command -v aio >/dev/null 2>&1; then
  echo "ERROR: 'aio' CLI not found. Install via: npm i -g @adobe/aio-cli" >&2
  exit 1
fi

confirm="${1:-}"

# Prefer JSON output parsing for reliability and to obtain fully qualified names
set +e
json_raw=$(aio rt action list --json)
set -e

# Extract JSON array from potentially noisy stdout (warnings printed before JSON)
actions=$(printf '%s' "$json_raw" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const s=d;const i=s.indexOf('[');const j=s.lastIndexOf(']');if(i>=0&&j>i){try{const arr=JSON.parse(s.slice(i,j+1));if(Array.isArray(arr)){for(const x of arr){if(x&&x.namespace&&x.name){console.log('/'+x.namespace+'/'+x.name)}}}}catch(e){}}})")

if [ -z "${actions:-}" ]; then
  # Fallback: best-effort using table; will likely be short names only
  actions=$(aio rt action list | awk 'NR==1{for(i=1;i<=NF;i++){if($i=="Actions"){col=i;break}} next} NR>1 && $1!~/^ok:/{if(col>0){print $col}}')
fi

if [ -z "${actions:-}" ]; then
  echo "No actions found."
  exit 0
fi

echo "Actions found:"
echo "$actions"

if [ "$confirm" != "--confirm" ]; then
  echo
  echo "Dry run. To delete all listed actions, re-run with --confirm"
  exit 0
fi

echo
echo "Deleting actions..."
while IFS= read -r action; do
  [ -z "$action" ] && continue
  echo "- Deleting $action"
  aio rt action delete "$action" >/dev/null 2>&1 || true
done <<< "$actions"

echo "Done."
