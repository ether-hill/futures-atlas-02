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
  # Everything EXCEPT .next/cache/subapps. The poisoning lives in webpack's
  # persistent module cache; the subapps directory is our own build-fingerprint
  # store (see build-subapps.sh) and is the only thing that makes skipping an
  # unchanged sub-app possible across deploys. Wiping it would be correct but
  # would also mean rebuilding all thirteen every time, which is the four
  # minutes we are trying to get back.
  find .next/cache -mindepth 1 -maxdepth 1 ! -name subapps -exec rm -rf {} + 2>/dev/null || true
  echo "→ dropped the restored .next/cache, kept the sub-app fingerprints"
else
  echo "→ local build, keeping .next/cache"
fi
