#!/usr/bin/env bash
# Rebuild Quantum Sandbox and refresh its bundle inside this project.
#
# Unlike the other projects, Quantum Sandbox's source lives IN this repo at
# ./quantum-sandbox (a self-contained Vite app). It builds to a static bundle at
# public/quantum-sandbox (base path /quantum-sandbox baked in), served by the
# Next site via the rewrite in next.config.ts. Run this whenever the sandbox
# source changes, commit the refreshed bundle, then deploy as usual.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$HERE/quantum-sandbox"

echo "→ building quantum-sandbox in $SRC"
( cd "$SRC" && npm install && npm run build )

echo "✓ quantum-sandbox bundle synced to public/quantum-sandbox"
