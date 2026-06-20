#!/usr/bin/env node
// Inject the shared master nav (atlas-nav) into a built static bundle's HTML.
//
// The hand-authored zone bundles (underground-intelligence, odds-of-surviving-ai)
// carry these two tags directly in their committed HTML. Hollow Villages is built
// from source on every deploy, so build-subapps.sh runs this afterwards to add the
// same tags — keeping the master nav without hand-editing built output.
//
// Usage: node scripts/inject-atlas-nav.mjs <dir>   (recurses, idempotent)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const TAGS =
  '<link rel="stylesheet" href="/atlas-nav.css" data-fa-nav-css><script src="/atlas-nav.js" defer></script>';

const root = process.argv[2];
if (!root) {
  console.error("inject-atlas-nav: missing target directory");
  process.exit(1);
}

let injected = 0;
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".html")) {
      let html = readFileSync(p, "utf8");
      if (html.includes("/atlas-nav.js")) continue; // already injected
      if (!html.includes("</head>")) continue;
      html = html.replace("</head>", TAGS + "</head>");
      writeFileSync(p, html);
      injected++;
    }
  }
}
walk(root);
console.log(`atlas-nav injected into ${injected} page(s) under ${root}`);
