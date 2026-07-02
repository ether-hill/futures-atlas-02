#!/usr/bin/env bash
#
# build-subapps.sh — build the in-repo sub-apps into public/ from source.
#
# Runs as part of the Vercel build (see package.json "build"), so a plain
# `git push` rebuilds every sub-app from its committed SOURCE — no hand-built
# bundle is committed, and two people can't clobber each other's bundles.
#
#   • generatives      → Vite, outputs to public/generatives
#   • quantum-sandbox  → Vite, outputs to public/quantum-sandbox
#   • social-composer  → Next static export → out/, copied to public/social-composer
#   • hollow-villages  → Next static export → out/, copied to public/hollow-villages
#
# The two remaining "zone" projects (underground-intelligence / odds-of-surviving-ai)
# are NOT built here — they are hand-authored static bundles with no build step,
# so they stay committed under public/<slug>/.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Vite apps build straight into public/<slug> via their vite.config outDir.
for app in generatives quantum-sandbox literal-frequency hyperscale gigawatt trajectories; do
  echo "→ building $app"
  ( cd "$HERE/$app" && npm install --include=dev --no-audit --no-fund && npm run build )
  echo "✓ $app → public/$app"
done

# Social Composer: Next static export → out/, then copy into public/.
echo "→ building social-composer"
( cd "$HERE/social-composer" && npm install --include=dev --no-audit --no-fund && npm run build )
rm -rf "$HERE/public/social-composer"
mkdir -p "$HERE/public/social-composer"
cp -R "$HERE/social-composer/out/." "$HERE/public/social-composer/"
echo "✓ social-composer → public/social-composer"

# Hollow Villages: Next static export → out/, then copy into public/.
echo "→ building hollow-villages"
( cd "$HERE/hollow-villages" && npm install --include=dev --no-audit --no-fund && npm run build )
rm -rf "$HERE/public/hollow-villages"
mkdir -p "$HERE/public/hollow-villages"
cp -R "$HERE/hollow-villages/out/." "$HERE/public/hollow-villages/"
# Re-inject the shared master nav (atlas-nav) into every built page, matching the
# other zone bundles (underground-intelligence / odds-of-surviving-ai carry the
# same two tags). Idempotent; node is always present in the Vercel build.
node "$HERE/scripts/inject-atlas-nav.mjs" "$HERE/public/hollow-villages"
echo "✓ hollow-villages → public/hollow-villages (with atlas-nav)"

# Swipe the Future: Next static export → out/, then copy into public/.
echo "→ building swipe-the-future"
( cd "$HERE/swipe-the-future" && npm install --include=dev --no-audit --no-fund && npm run build )
rm -rf "$HERE/public/swipe-the-future"
mkdir -p "$HERE/public/swipe-the-future"
cp -R "$HERE/swipe-the-future/out/." "$HERE/public/swipe-the-future/"
node "$HERE/scripts/inject-atlas-nav.mjs" "$HERE/public/swipe-the-future"
echo "✓ swipe-the-future → public/swipe-the-future (with atlas-nav)"

# Woodchipper Futures: Next static export → out/, then copy into public/.
echo "→ building woodchipper"
( cd "$HERE/woodchipper" && npm install --include=dev --no-audit --no-fund && npm run build )
rm -rf "$HERE/public/woodchipper"
mkdir -p "$HERE/public/woodchipper"
cp -R "$HERE/woodchipper/out/." "$HERE/public/woodchipper/"
node "$HERE/scripts/inject-atlas-nav.mjs" "$HERE/public/woodchipper"
echo "✓ woodchipper → public/woodchipper (with atlas-nav)"

# Quantum Spark: Next static export → out/, then copy into public/.
# (Its generation API lives in the HOST app at /api/quantum-spark/*.)
echo "→ building quantum-spark"
( cd "$HERE/quantum-spark" && npm install --include=dev --no-audit --no-fund && npm run build )
rm -rf "$HERE/public/quantum-spark"
mkdir -p "$HERE/public/quantum-spark"
cp -R "$HERE/quantum-spark/out/." "$HERE/public/quantum-spark/"
node "$HERE/scripts/inject-atlas-nav.mjs" "$HERE/public/quantum-spark"
echo "✓ quantum-spark → public/quantum-spark (with atlas-nav)"

# Signal Reactor: Next static export → out/, then copy into public/.
# (Its generation API lives in the HOST app at /api/signal-reactor/*.)
echo "→ building signal-reactor"
( cd "$HERE/signal-reactor" && npm install --include=dev --no-audit --no-fund && npm run build )
rm -rf "$HERE/public/signal-reactor"
mkdir -p "$HERE/public/signal-reactor"
cp -R "$HERE/signal-reactor/out/." "$HERE/public/signal-reactor/"
node "$HERE/scripts/inject-atlas-nav.mjs" "$HERE/public/signal-reactor"
echo "✓ signal-reactor → public/signal-reactor (with atlas-nav)"

# Quantum Dominance: Next static export → out/, then copy into public/.
echo "→ building quantum-dominance"
( cd "$HERE/quantum-dominance" && npm install --include=dev --no-audit --no-fund && npm run build )
rm -rf "$HERE/public/quantum-dominance"
mkdir -p "$HERE/public/quantum-dominance"
cp -R "$HERE/quantum-dominance/out/." "$HERE/public/quantum-dominance/"
node "$HERE/scripts/inject-atlas-nav.mjs" "$HERE/public/quantum-dominance"
echo "✓ quantum-dominance → public/quantum-dominance (with atlas-nav)"

echo "✓ all sub-apps built"
