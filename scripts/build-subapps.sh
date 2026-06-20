#!/usr/bin/env bash
#
# build-subapps.sh — build the in-repo sub-apps into public/ from source.
#
# Runs as part of the Vercel build (see package.json "build"), so a plain
# `git push` rebuilds every sub-app from its committed SOURCE — no hand-built
# bundle is committed, and two people can't clobber each other's bundles.
#
#   • prism            → Vite, outputs to public/prism
#   • quantum-sandbox  → Vite, outputs to public/quantum-sandbox
#   • social-composer  → Next static export → out/, copied to public/social-composer
#
# The three "zone" projects (hollow-villages / underground-intelligence /
# odds-of-surviving-ai) are NOT built here — their source lives outside this
# repo, so their bundles stay committed under public/<slug>/.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Vite apps build straight into public/<slug> via their vite.config outDir.
for app in prism quantum-sandbox; do
  echo "→ building $app"
  ( cd "$HERE/$app" && npm install --no-audit --no-fund && npm run build )
  echo "✓ $app → public/$app"
done

# Social Composer: Next static export → out/, then copy into public/.
echo "→ building social-composer"
( cd "$HERE/social-composer" && npm install --no-audit --no-fund && npm run build )
rm -rf "$HERE/public/social-composer"
mkdir -p "$HERE/public/social-composer"
cp -R "$HERE/social-composer/out/." "$HERE/public/social-composer/"
echo "✓ social-composer → public/social-composer"

echo "✓ all sub-apps built"
