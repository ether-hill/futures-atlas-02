/*
  Node's ESM resolver wants extensions and knows nothing about the `@/` alias.
  Next's bundler supplies both, so this hook gives `node --test` the same two
  rules rather than making the app's imports uglier to suit the test runner.
*/

import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));

export function resolve(specifier, context, nextResolve) {
  let spec = specifier;

  if (spec.startsWith("@/")) {
    spec = pathToFileURL(path.join(SRC, spec.slice(2))).href;
  }

  const looksLocal = spec.startsWith(".") || spec.startsWith("file:");
  if (looksLocal && !/\.[a-z]+$/i.test(spec)) {
    const base = context.parentURL
      ? new URL(spec, context.parentURL)
      : new URL(spec);
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      const candidate = new URL(base.href + ext);
      if (existsSync(fileURLToPath(candidate))) {
        return nextResolve(candidate.href, context);
      }
    }
  }

  return nextResolve(spec, context);
}
