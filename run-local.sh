#!/bin/sh
# Run Faithbound on this computer (macOS or Linux) without Docker. Needs Node.js 18 or newer.
# Saves and accounts are kept in ./data next to this script.
set -e
cd "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { echo "Node.js is not installed. Get it from https://nodejs.org (LTS) or run: brew install node"; exit 1; }
./build.sh
PORT="${PORT:-8040}"
echo "Faithbound runs at http://localhost:$PORT  (press Ctrl+C to stop)"
( sleep 1.5; [ "$(uname)" = Darwin ] && open "http://localhost:$PORT" >/dev/null 2>&1 ) &
PORT="$PORT" PUBLIC_DIR="$PWD/dist" DATA_DIR="$PWD/data" exec node server/server.js
