#!/usr/bin/env bash
#
# safe-deploy.sh — the ONLY sanctioned way to ship futures-atlas-02.
#
# This project is git-connected on Vercel: pushing to `main` auto-builds and
# deploys. Multiple people (mnoesthedens, laubaumau) push to it. A manual
# `vercel deploy --prebuilt --prod` from a local tree that is BEHIND origin will
# silently overwrite production with a stale snapshot and wipe teammates' work.
# That happened once. This guard makes it impossible to do again by accident.
#
# Usage:  ./scripts/safe-deploy.sh
#   Fetches origin, refuses unless your branch is exactly in sync with
#   origin/main, then pushes — letting Vercel's git integration build & deploy.
#   It deliberately does NOT run `vercel deploy --prebuilt`.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Fetching origin…"
git fetch origin --quiet

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "✘ You are on '$BRANCH', not main. Deploys go out from main." >&2
  exit 1
fi

BEHIND=$(git rev-list --count HEAD..origin/main)
if [ "$BEHIND" -gt 0 ]; then
  echo "✘ Your branch is $BEHIND commit(s) BEHIND origin/main." >&2
  echo "  Someone else has pushed work you don't have. Pull/rebase first:" >&2
  echo "    git pull --rebase origin main" >&2
  echo "  Deploying now would overwrite their work. Aborting." >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "✘ You have uncommitted changes. Commit them first, then deploy." >&2
  git status --short >&2
  exit 1
fi

AHEAD=$(git rev-list --count origin/main..HEAD)
if [ "$AHEAD" -eq 0 ]; then
  echo "✓ Nothing to deploy — main is already in sync with origin/main."
  exit 0
fi

echo "→ Pushing $AHEAD commit(s) to origin/main; Vercel will auto-build & deploy."
git push origin main
echo "✓ Pushed. Watch the build: vercel list futures-atlas-02 --scope frond-studio"
