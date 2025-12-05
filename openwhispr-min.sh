#!/bin/bash

# Force Electron dark mode
export ELECTRON_FORCE_DARK_MODE=1
export GTK_THEME=Adwaita:dark

# Resolve app directory relative to this script so the repo can move
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
TRAY="${APP_DIR}/openwhispr-tray.py"
LAUNCHER="${APP_DIR}/run-openwhispr.sh"
WINDOW_CLASS="open-whispr"

# Start tray indicator if not already running
if ! pgrep -f "openwhispr-tray.py" >/dev/null 2>&1; then
  "${TRAY}" &
fi

# Start OpenWhispr
"${LAUNCHER}" &

# Wait for the first visible OpenWhispr window, then minimise it.
# We retry to handle the window mapping late or changing IDs during startup.
wait_for_window() {
  for _ in $(seq 1 120); do
    mapfile -t ids < <(xdotool search --onlyvisible --class "${WINDOW_CLASS}" 2>/dev/null | tr ' ' '\n' | sed '/^$/d')
    if [ "${#ids[@]}" -gt 0 ]; then
      echo "${ids[@]}"
      return 0
    fi
    sleep 0.5
  done
  return 1
}

minimize_window() {
  local id="$1"
  for _ in $(seq 1 3); do
    xdotool windowminimize "${id}" 2>/dev/null
    sleep 0.2
    # If the window is no longer visible, consider it handled.
    if ! xdotool search --onlyvisible --class "${WINDOW_CLASS}" 2>/dev/null | grep -qw "${id}"; then
      return 0
    fi
  done
  return 0
}

if windows=$(wait_for_window); then
  for id in ${windows}; do
    minimize_window "${id}"
  done
fi
