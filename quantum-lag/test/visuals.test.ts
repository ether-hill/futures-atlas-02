import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

import { DECK } from "../src/content/deck.ts";

/*
  The figure registry is a .tsx file, so it cannot be imported here without a
  JSX pipeline. Reading the ids out of it is enough: the point is that every id
  a story names actually resolves, and that nothing is drawn but never used.
*/

const registry = readFileSync("src/components/visuals/index.tsx", "utf8");
const registered = new Set(
  [...registry.matchAll(/^\s*"([a-z0-9-]+)":\s/gm)].map((m) => m[1]!),
);

const used = new Set(
  DECK.flatMap((c) =>
    c.story.filter((b) => b.kind === "visual").map((b) => (b as { id: string }).id),
  ),
);

test("every figure a story names is registered", () => {
  const missing = [...used].filter((id) => !registered.has(id));
  assert.deepEqual(missing, [], `unregistered figure ids: ${missing.join(", ")}`);
});

test("every registered figure is used by a story", () => {
  const orphans = [...registered].filter((id) => !used.has(id));
  assert.deepEqual(orphans, [], `figures drawn but never shown: ${orphans.join(", ")}`);
});

test("every figure caption is a sentence, not a title", () => {
  for (const claim of DECK) {
    for (const block of claim.story) {
      if (block.kind !== "visual") continue;
      assert.ok(
        block.caption.length > 24,
        `${claim.id}/${block.id} caption is too thin: "${block.caption}"`,
      );
    }
  }
});

test("the figure components carry a reduced-motion escape", () => {
  const css = readFileSync("src/app/visuals.css", "utf8");
  assert.match(
    css,
    /prefers-reduced-motion: reduce/,
    "visuals.css has no reduced-motion block",
  );
});

test("no figure file sets a raw colour", () => {
  // Colour is a token decision, per futures-atlas-core's rules.
  const dir = "src/components/visuals";
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".tsx")) continue;
    const src = readFileSync(`${dir}/${file}`, "utf8");
    const hits = src.match(/#[0-9a-fA-F]{3,8}\b|oklch\(|rgb\(/g) ?? [];
    assert.deepEqual(hits, [], `${file} contains raw colour: ${hits.join(", ")}`);
  }
});

test("figure captions vary in construction and length", () => {
  // Written one after another, captions drift into a single template: noun
  // phrase, comma, trailing clause. Read together they then scan as filled-in
  // slots rather than as writing.
  const captions = DECK.flatMap((c) =>
    c.story.filter((b) => b.kind === "visual").map((b) => (b as { caption: string }).caption),
  );

  const lengths = captions.map((c) => c.trim().split(/\s+/).length);
  let run = 1;
  for (let i = 1; i < lengths.length; i++) {
    run = lengths[i] === lengths[i - 1] ? run + 1 : 1;
    assert.ok(run < 3, `three captions of ${lengths[i]} words in a row, at ${i}`);
  }

  const shape = (c: string) =>
    c.includes(". ") ? "two-sentence" : c.includes(",") ? "comma-clause" : "simple";
  const tally = new Map<string, number>();
  for (const c of captions) tally.set(shape(c), (tally.get(shape(c)) ?? 0) + 1);
  for (const [kind, n] of tally) {
    assert.ok(
      n <= captions.length * 0.6,
      `${n} of ${captions.length} captions are "${kind}"; vary the construction`,
    );
  }
});
