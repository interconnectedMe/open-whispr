#!/bin/bash
set -euo pipefail

# Run from the directory this script lives in so the repo can be moved
# without changing hard-coded paths elsewhere.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
cd "$SCRIPT_DIR"
unset ELECTRON_RUN_AS_NODE
unset ELECTRON_NO_ATTACH_CONSOLE
if [ -d .whisper-venv ]; then
  source .whisper-venv/bin/activate
fi
NODE_ENV=production npm start --silent -- "$@"
