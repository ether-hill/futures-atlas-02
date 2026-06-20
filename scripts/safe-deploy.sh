#!/usr/bin/env bash
#
# safe-deploy.sh — the ONLY sanctioned way to ship futures-atlas-02.
#
# Branch-aware:
#   • on `staging` → pushes the STAGING preview (safe to ship freely; does NOT
#     touch the public site). Preview URL:
#        https://futures-atlas-02-git-staging-frond-studio.vercel.app
#   • on `main`    → deploys PRODUCTION (https://futures-atlas-02.vercel.app)
#
# Either way it fetches origin and REFUSES if your branch is behind origin (you'd
# overwrite a teammate) or if you have uncommitted changes, then pushes and lets
# Vercel's git integration build & deploy. It deliberately NEVER runs
# `vercel deploy --prebuilt` — that once shipped a stale local tree to prod and
# wiped teammates' work. To put staging live, use ./scripts/promote.sh.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Fetching origin…"
git fetch origin --quiet

BRANCH=$(git rev-parse --abbrev-ref HEAD)
case "$BRANCH" in
  staging) WHERE="STAGING preview → https://futures-atlas-02-git-staging-frond-studio.vercel.app" ;;
  main)    WHERE="PRODUCTION → https://futures-atlas-02.vercel.app" ;;
  *)
    echo "✘ You are on '$BRANCH'. Deploy from 'staging' (preview) or 'main' (production)." >&2
    echo "  Day-to-day work goes on staging:  git checkout staging" >&2
    exit 1 ;;
esac

# Refuse if behind origin/<branch> (would overwrite a teammate's work).
if git rev-parse --verify --quiet "origin/$BRANCH" >/dev/null; then
  BEHIND=$(git rev-list --count "HEAD..origin/$BRANCH")
  if [ "$BEHIND" -gt 0 ]; then
    echo "✘ '$BRANCH' is $BEHIND commit(s) BEHIND origin/$BRANCH." >&2
    echo "  Someone pushed work you don't have. Reconcile first:" >&2
    echo "    git pull --rebase origin $BRANCH" >&2
    exit 1
  fi
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "✘ You have uncommitted changes. Commit them first, then deploy." >&2
  git status --short >&2
  exit 1
fi

if git rev-parse --verify --quiet "origin/$BRANCH" >/dev/null; then
  AHEAD=$(git rev-list --count "origin/$BRANCH..HEAD")
  if [ "$AHEAD" -eq 0 ]; then
    echo "✓ Nothing to deploy — $BRANCH is already in sync with origin/$BRANCH."
    exit 0
  fi
fi

echo "→ Pushing '$BRANCH'  ·  $WHERE"
git push origin "$BRANCH"
echo "✓ Pushed. Watch the build: vercel list futures-atlas-02 --scope frond-studio"
