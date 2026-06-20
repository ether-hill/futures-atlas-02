#!/usr/bin/env bash
#
# promote.sh — put the current STAGING build live on PRODUCTION.
#
# Run it from the `staging` branch once you're happy with the staging preview.
# It fast-forwards `main` to `staging` and pushes, so production becomes exactly
# what you reviewed on staging. No --prebuilt, no force-push.
#
#   git checkout staging   # if not already
#   ./scripts/safe-deploy.sh   # (optional) refresh the staging preview first
#   ./scripts/promote.sh       # → production

set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Fetching origin…"
git fetch origin --quiet

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "staging" ]; then
  echo "✘ Promote from 'staging' (that's what you reviewed). Run: git checkout staging" >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "✘ You have uncommitted changes. Commit them first." >&2
  git status --short >&2
  exit 1
fi

# staging must be in sync with origin/staging (push it via safe-deploy first).
BEHIND=$(git rev-list --count HEAD..origin/staging 2>/dev/null || echo 0)
if [ "$BEHIND" -gt 0 ]; then
  echo "✘ Local staging is $BEHIND commit(s) behind origin/staging. Reconcile first:" >&2
  echo "    git pull --rebase origin staging" >&2
  exit 1
fi
AHEAD_OF_ORIGIN=$(git rev-list --count origin/staging..HEAD 2>/dev/null || echo 0)
if [ "$AHEAD_OF_ORIGIN" -gt 0 ]; then
  echo "✘ You have local staging commits that aren't pushed. Run ./scripts/safe-deploy.sh first." >&2
  exit 1
fi

# Nothing new vs production?
NEW=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
if [ "$NEW" -eq 0 ]; then
  echo "✓ Production is already up to date with staging — nothing to promote."
  exit 0
fi

echo "→ Promoting staging → main ($NEW commit(s)); Vercel will build PRODUCTION…"
if ! git push origin HEAD:main; then
  echo "✘ Couldn't fast-forward main — someone pushed to main directly." >&2
  echo "  Reconcile staging with main, then retry:" >&2
  echo "    git pull --rebase origin main && ./scripts/safe-deploy.sh && ./scripts/promote.sh" >&2
  exit 1
fi
echo "✓ Promoted. Production building → https://futures-atlas-02.vercel.app"
