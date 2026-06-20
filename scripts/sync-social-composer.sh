#!/usr/bin/env bash
# Rebuild Social Composer and refresh its bundle inside this project.
#
# Social Composer's source lives in-repo at ./social-composer (a self-contained
# Next 16 app). Unlike the Vite sub-apps it builds via `next build` with
# `output: 'export'` to an `out/` directory (basePath /social-composer +
# trailingSlash baked in), which we copy into public/social-composer. Its three
# server routes (transmutate / img / vid) can't live in a static export, so they
# run in the HOST app at /api/social-composer/*. The bundle is served by the Next
# site via the rewrite in next.config.ts. Run this whenever the source changes,
# commit the refreshed bundle, then deploy.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$HERE/social-composer"
DEST="$HERE/public/social-composer"

echo "→ building social-composer in $SRC"
( cd "$SRC" && npm install && npm run build )

echo "→ syncing $SRC/out → $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC/out/." "$DEST/"

echo "✓ social-composer bundle synced to public/social-composer"
