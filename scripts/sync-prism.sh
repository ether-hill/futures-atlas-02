#!/usr/bin/env bash
# Rebuild Prism and refresh its bundle inside this project.
#
# Prism's source lives in-repo at ./prism (a self-contained Vite app with two
# entries: the dashboard and the embeddable player). It builds to a static
# bundle at public/prism (base path /prism baked in), served by the Next site
# via the rewrite in next.config.ts. Run this whenever the source changes,
# commit the refreshed bundle, then deploy.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$HERE/prism"

echo "→ building prism in $SRC"
( cd "$SRC" && npm install && npm run build )

echo "✓ prism bundle synced to public/prism"
