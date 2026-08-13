#!/usr/bin/env bash
# Drop the incremental build cache before the host build — on Vercel only.
#
# Vercel restores .next/cache from the previous deployment of this project.
# Because staging is shared, that cache is written by whoever deployed last and
# read by whoever deploys next, so a single bad entry becomes everyone's
# problem and stays that way: every build from then on fails in the same place,
# five seconds in, with
#
#   TypeError: The "data" argument must be of type string or an instance of
#   Buffer, TypedArray, or DataView. Received undefined
#
# — webpack hashing a module whose source came back undefined. It is not the
# code. Every commit in the failing run builds cleanly on a fresh tree here,
# cold and warm, with and without the sub-apps. Nor is it the hasher: taking
# webpack off its wasm xxhash64 in next.config.ts only changed the wording of
# the error, because the bad input was upstream of the hash all along.
#
# The host build is a small part of the deploy (the thirteen sub-apps are the
# bulk of it), so losing its incremental cache costs seconds and buys a build
# that cannot inherit someone else's bad state. Local `npm run build` keeps its
# cache — this only fires in CI, where the cache crosses between people.
set -euo pipefail

if [ -n "${VERCEL:-}" ]; then
  rm -rf .next/cache
  echo "→ dropped the restored .next/cache (shared-branch poisoning guard)"
else
  echo "→ local build, keeping .next/cache"
fi
