/*
  Paths to files in /public.

  Next rewrites routes, links and next/image for `basePath`, but it does not
  touch a raw `<img src>` string. This instrument is served standalone at the
  root here and under /quantum-lag inside the Futures Atlas, so the photographs
  have to carry the prefix themselves or they 404 in the bundled build.

  The variable is unset locally, so this is a no-op outside the Atlas.
*/

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  return `${BASE}${path}`;
}
