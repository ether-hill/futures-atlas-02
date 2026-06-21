#!/usr/bin/env bash
# Rebuild Generatives and refresh its bundle inside this project.
#
# Generatives' source lives in-repo at ./generatives (a self-contained Vite app
# with two entries: the dashboard and the embeddable player). It builds to a
# static bundle at public/generatives (base path /generatives baked in), served
# by the Next site via the rewrite in next.config.ts. Run this whenever the
# source changes, commit the refreshed bundle, then deploy.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$HERE/generatives"

echo "→ building generatives in $SRC"
( cd "$SRC" && npm install && npm run build )

echo "✓ generatives bundle synced to public/generatives"
