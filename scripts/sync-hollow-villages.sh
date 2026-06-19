#!/usr/bin/env bash
# Rebuild The Hollow Villages and refresh its bundle inside this project.
#
# Villages is served as a self-contained static export at /hollow-villages
# (basePath baked in), mounted under public/hollow-villages/. Its source lives
# in the sibling repo because it needs a Next build; run this whenever that
# source changes, then deploy futures-atlas-02 as usual.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Build from the hollow-villages-zone repo: it carries the consolidated SiteNav
# + futures-atlas-core theming + basePath, and is the source that was live.
SRC="${1:-$HERE/../hollow-villages-zone}"

if [ ! -d "$SRC" ]; then
  echo "villages source not found at: $SRC" >&2
  echo "pass the path as the first arg: ./scripts/sync-hollow-villages.sh /path/to/village-revitalisation-oracle" >&2
  exit 1
fi

echo "→ building villages export in $SRC"
( cd "$SRC" && rm -rf out .next && npm run build )

echo "→ refreshing $HERE/public/hollow-villages"
rm -rf "$HERE/public/hollow-villages"
cp -R "$SRC/out" "$HERE/public/hollow-villages"

echo "✓ hollow-villages bundle synced"
