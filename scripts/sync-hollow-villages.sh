#!/usr/bin/env bash
# Rebuild The Hollow Villages bundle locally for preview.
#
# Villages' source now lives IN this repo at ./hollow-villages (a Next app with
# output:export + basePath /hollow-villages), with its design-system dependency
# vendored at ./hollow-villages/vendor/futures-atlas-core. On deploy it is built
# automatically by scripts/build-subapps.sh; this script just reproduces that
# one build locally (the public/village-oracle bundle is git-ignored, not
# committed). Pass a path as $1 to build from somewhere else.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${1:-$HERE/hollow-villages}"

echo "→ building villages export in $SRC"
( cd "$SRC" && npm install --include=dev --no-audit --no-fund && rm -rf out .next && npm run build )

echo "→ refreshing $HERE/public/village-oracle"
rm -rf "$HERE/public/village-oracle"
mkdir -p "$HERE/public/village-oracle"
cp -R "$SRC/out/." "$HERE/public/village-oracle/"
node "$HERE/scripts/inject-atlas-nav.mjs" "$HERE/public/village-oracle"

echo "✓ hollow-villages bundle synced"
