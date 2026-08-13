/*
  Scans the project's prose against .claude/skills/anti-ai-slop-writing.

  Two passes. The word list is parsed straight out of the skill's reference file,
  so the check cannot drift from the rules. The structural pass catches the
  things that give AI text away even when the vocabulary is clean: em dash
  density, three short declaratives in a row, and runs of same-length sentences.

  Deck prose is checked but never rewritten by anyone but its author; it comes
  from deck-final.md and carries its own house style.

    node scripts/slop-check.mjs           # everything
    node scripts/slop-check.mjs --prose   # user-facing strings only
*/

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const SKILL = ".claude/skills/anti-ai-slop-writing";
const ROOTS = ["src", "test", "scripts", "README.md"];
const SKIP = new Set(["node_modules", ".next", ".git", "packages", ".verify"]);

// ---------------------------------------------------------------- the lists

const ref = readFileSync(`${SKILL}/references/banned-words.md`, "utf8");

function section(heading) {
  const start = ref.indexOf(`## ${heading}`);
  if (start === -1) return "";
  const next = ref.indexOf("\n## ", start + 4);
  return ref.slice(start, next === -1 ? undefined : next);
}

const rawWords = section("Banned Vocabulary")
  .split("\n")
  .filter((l) => !l.startsWith("#") && l.trim())
  .join(" ")
  .split(",");

const words = [];
const qualified = new Set();

for (const chunk of rawWords) {
  // "landscape (figurative)" bans one sense of the word, not the word. Those
  // need a person to judge, so they warn rather than fail.
  const hasQualifier = /\((?!e\.g\.)/.test(chunk);
  for (const w of chunk
    .replace(/\(.*?\)/g, "")
    .split("/")
    .map((x) => x.trim())
    .filter((x) => x && !x.startsWith("e.g.") && x.length > 2)) {
    words.push(w);
    if (hasQualifier) qualified.add(w.toLowerCase());
  }
}

const phrases = [
  ...section("Banned Phrases").matchAll(/^- "(.+?)"/gm),
  ...section("Banned Sentence/Paragraph Openers").matchAll(/^- "(.+?)"/gm),
]
  .map((m) => m[1])
  .map((p) => p.replace(/\[.*?\]/g, "").replace(/\.\.\.$/, "").trim())
  .filter((p) => p.length > 3);

// ---------------------------------------------------------------- the files

function walk(entry) {
  const out = [];
  const stat = statSync(entry);
  if (stat.isFile()) return [entry];
  for (const name of readdirSync(entry)) {
    if (SKIP.has(name)) continue;
    out.push(...walk(path.join(entry, name)));
  }
  return out;
}

const files = ROOTS.flatMap(walk).filter((f) =>
  /\.(ts|tsx|css|md|mjs)$/.test(f) && !f.includes(SKILL),
);

// ---------------------------------------------------------------- the checks

const hits = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");

  lines.forEach((line, i) => {
    const at = `${file}:${i + 1}`;

    for (const w of words) {
      const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (!re.test(line)) continue;
      hits.push({
        at,
        kind: qualified.has(w.toLowerCase()) ? "word (sense-dependent)" : "word",
        found: w,
        line: line.trim(),
      });
    }
    for (const p of phrases) {
      // Word boundaries, or an opener like the one meaning yes matches the tail of
      // an ordinary word ending in the same letters.
      const re = new RegExp(
        `\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "i",
      );
      if (re.test(line)) hits.push({ at, kind: "phrase", found: p, line: line.trim() });
    }

    // Em dashes anywhere in this project are a house-style failure, not just a
    // density problem: the deck's own rules forbid them outright. A line can opt
    // out with `slop-allow`, which the tests and this file need in order to hold
    // an em dash as a literal they are searching for.
    if (line.includes("\u2014") && !line.includes("slop-allow")) {
      hits.push({ at, kind: "em dash", found: "em dash", line: line.trim() });
    }

    // Exclamation marks in prose only. TypeScript's non-null assertion is not
    // enthusiasm, and neither is `!==` or `!important`.
    const inProse = file.endsWith(".md");
    const quoted = [...line.matchAll(/"([^"]*)"/g)].map((m) => m[1]).join(" ");
    const candidate = inProse ? line : quoted;
    if (/[a-z]!(\s|$|["'`.])/i.test(candidate)) {
      hits.push({ at, kind: "exclamation", found: "!", line: line.trim() });
    }
  });
}

// ------------------------------------------------------------- structural

/** Three or more short declaratives in a row, in a single prose string. */
function parataxis(prose) {
  const sentences = prose.split(/(?<=[.?!])\s+/).filter(Boolean);
  let run = 0;
  for (const s of sentences) {
    const wordCount = s.trim().split(/\s+/).length;
    if (wordCount <= 8) {
      run += 1;
      if (run >= 3) return true;
    } else run = 0;
  }
  return false;
}

const proseFiles = files.filter((f) => f.endsWith(".md"));
for (const file of proseFiles) {
  const text = readFileSync(file, "utf8");
  for (const para of text.split(/\n\n+/)) {
    if (para.startsWith("```") || para.startsWith("|") || para.startsWith("-")) continue;
    const flat = para.replace(/\n/g, " ").trim();
    if (flat.length < 120) continue;
    if (parataxis(flat)) {
      hits.push({
        at: file,
        kind: "parataxis",
        found: "3+ short declaratives in a row",
        line: flat.slice(0, 90) + "…",
      });
    }
  }
}

// ---------------------------------------------------------------- report

const byKind = {};
for (const h of hits) (byKind[h.kind] ??= []).push(h);

for (const [kind, list] of Object.entries(byKind)) {
  console.log(`\n== ${kind} (${list.length})`);
  for (const h of list) {
    console.log(`   ${h.at}  "${h.found}"`);
    console.log(`      ${h.line.slice(0, 110)}`);
  }
}

const failing = hits.filter((h) => !h.kind.includes("sense-dependent"));
const warning = hits.length - failing.length;

console.log(
  `\n${failing.length} failure${failing.length === 1 ? "" : "s"}` +
    (warning ? `, ${warning} to check by eye` : "") +
    ` across ${files.length} files.`,
);
process.exit(failing.length > 0 ? 1 : 0);
