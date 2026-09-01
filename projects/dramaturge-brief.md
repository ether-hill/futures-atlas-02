# Dramaturge — build brief

A workflow and small app that takes a hand-picked set of Source Library books plus a theme, and produces several stage plays in which every quoted line is a verbatim, citation-linked passage from those books.

## 0. Terminology (read first)

Two unrelated things in this brief share a name. Do not conflate them.

- **Playwright** — always means the Microsoft browser-automation library. It has three jobs, listed in §5.
- **script / play / scene / beat** — always means the dramatic output. Never call the output "a Playwright".

## 1. Non-negotiables

These are correctness rules, not preferences. Violating any of them is a build failure, not a style note.

1. Every line inside quotation marks is verbatim text returned by the quote endpoint, and carries its `citation_link`. No paraphrase is ever presented as a quotation.
2. Invented dialogue is structurally and typographically distinct from sourced lines. A reader must be able to tell at a glance what the book said and what the play imagined.
3. Passages with `snippet_type: "summary"` are AI-generated description, not source text. Filter them out at harvest and never quote them.
4. Attribution follows `text_source`. `translation` → attribute the wording to the translator/edition. `ocr_original` → the source's own words (expect period spelling and long-s). Where `translation_note` is present, state the chain in the citations appendix.
5. Continuity is checked before quoting. If `continues_on_next` or `continues_from_previous` is true, re-fetch with `context: true` and quote the whole sentence. A fragment quoted as a complete thought is a misattribution even with the right page number.
6. Never invent a page number, a book id, or a canonical reference. Canonical citations resolve through `get_locus`, not by arithmetic on pagination.
7. Page reads are a metered resource. Cache every page fetch on disk keyed `{book_id}:{page}:{lang}`; a second run of the same theme must be a pure cache hit.

## 2. Stack

- Next.js (App Router), TypeScript, deployed on Vercel.
- Source Library REST API for harvest and quoting; the MCP server for interactive exploration during authoring.
- Anthropic API (`claude-sonnet-4-6`) for spine and scene generation.
- Playwright for facsimile capture, PDF export, and E2E tests.
- No client-side API keys. All Source Library and Anthropic calls run server-side in route handlers.

### Source Library surface

Base URL `https://sourcelibrary.org/api`. No key needed to start; page-level bulk reads are keyed — request a key at `sourcelibrary.org/developers` and put it in `SOURCE_LIBRARY_API_KEY` as a Bearer token. Docs: `https://sourcelibrary.org/developers`.

| Purpose | Call |
| --- | --- |
| Full-text search across books and page content | `GET /search?q=...&language=...&limit=` |
| Catalogue browse/filter | `GET /books?limit=` and `GET /books/library?sort=recent-translation&has_translation=true` |
| Bulk read | `GET /books/:id/text?content=translation&from=1&to=50` |
| Book metadata, chapters, editions, cover | `GET /books/:id` |

Reader URLs: book `https://sourcelibrary.org/book/{id}`, page `https://sourcelibrary.org/book/{id}?page={n}`. Citation shortlinks are `sourcelibrary.org/q/...` and are the canonical thing to display.

Where the REST surface is thinner than the MCP surface (semantic search, image search, batch quoting), drive the MCP server directly from a Node script during M0 and treat the harvested `pool.json` as the app's input. Do not block on REST parity.

Daily page budgets apply across all read endpoints: 500/24h anonymous, 1,000 signed in, 2,000 on a free Explorer key, uncapped on a paid key. Queue all reads with concurrency 2 and exponential backoff on 429.

## 3. Data model

```ts
type ThemeSpec = {
  id: string;                 // "gold"
  label: string;              // "The theme of gold"
  seedTerms: string[];        // exact-match terms: aurum, chrysopoeia, sol, tincture, gilding
  conceptPrompts: string[];   // meaning-match: "a metal that does not corrupt", "the sun's body on earth"
  iconography: string[];      // image search: "sun", "king crowned", "ouroboros"
  exclude: string[];          // terms that drag the pool off-theme
};

type Passage = {
  bookId: string;
  page: number;
  lang: string;
  verbatim: string;           // exactly as returned; never edited
  textSource: "translation" | "ocr_original";
  translationNote?: string;
  citationLink: string;       // sourcelibrary.org/q/...
  pageImageUrl?: string;
  score: number;
  matchedBy: ("term" | "concept")[];
};

type Beat = {
  id: string;
  summary: string;            // what happens, in plain prose
  citations: string[];        // passage ids — at least one, always
};

type Spine = {
  title: string;
  logline: string;
  dramatisPersonae: { name: string; origin: "source" | "invented"; note: string }[];
  acts: { title: string; beats: Beat[] }[];
};
```

## 4. Pipeline

**Stage 1 — Selection.** Operator picks 2–6 `book_id`s and one `ThemeSpec`. Books are chosen by hand; this tool does not pick the corpus.

**Stage 2 — Harvest.** Per book: exact-term search over `seedTerms`, then semantic search over `conceptPrompts` with a per-book cap so one book cannot dominate the pool, then image search scoped to that book for plates matching `iconography`. Union the results, drop `summary` snippets, dedupe by `{bookId, page}`.

**Stage 3 — Score.** Rank on similarity, term density, and spread. Enforce a floor of passages per book so every chosen book earns its place in the play. Target pool: 40–80 verified passages for 3 plays.

**Stage 4 — Verify.** Batch-quote the shortlist (max 25 pages per call). Resolve every continuity flag with a `context: true` re-fetch. Write `pool.json`. This file is the single source of truth downstream; nothing after this stage may call the library for text.

**Stage 5 — Spine.** One Anthropic call per play. Input: the full pool as JSON, the theme, and a constraint block. Output: JSON only, no prose, no fences, matching the `Spine` type. Every beat must cite at least one passage id from the pool. Reject and retry once on a beat with no citation or a citation id not present in the pool.

**Stage 6 — Script.** One call per scene, given the spine, the scene's beats, and the verbatim text of only that scene's cited passages. Output is [Fountain](https://fountain.io) — plain text, diffable, renders to PDF. Sourced lines are marked with a note containing the passage id; invented lines are unmarked. The renderer does the visual distinction, not the model.

**Stage 7 — Render.** Reader route per play, plus a citations appendix listing every sourced line with author, edition, page, `citation_link`, and translation chain.

## 5. Playwright's three jobs

**A. Facsimile capture.** For each cited leaf, prefer `pageImageUrl` from the API. Where a leaf has none, navigate to `https://sourcelibrary.org/book/{bookId}?page={n}`, wait for the scan to settle, and capture the leaf element to `public/leaves/{bookId}-{page}.webp`. Idempotent and cached — skip any file that already exists.

**B. Script export.** Render the print route and `page.pdf()` it to a stage-ready script with the citations appendix bound in.

**C. E2E acceptance tests.** The phase gates below are Playwright specs, not manual checks.

## 6. Generation contracts

Both prompts carry the same constraint block:

> You are assembling a stage play from a fixed pool of historical passages. You may invent connective dialogue, staging, and characters. You may not invent, alter, modernise, or paraphrase any text you present as a quotation — quoted lines must be copied character-for-character from the pool. You may not cite a passage id that is not in the pool. If the pool cannot support a beat, drop the beat rather than inventing support. Return JSON only: no preamble, no markdown fences, no commentary.

Parse defensively: strip fences if present, `JSON.parse` in a try/catch, one repair retry, then fail loudly.

## 7. The verbatim validator

A build-time check, wired into `next build` and into CI. It walks every script, extracts every line marked as sourced, and byte-compares it against `pool.json`. Any mismatch — a smart quote, a trimmed ellipsis, a silently modernised spelling — fails the build with the passage id and a diff. This check is the reason the output can be trusted; do not make it a warning.

## 8. Phases and acceptance criteria

**M0 — Harvest and verify (CLI only, no UI).**
- `pnpm harvest --books a,b,c --theme gold` emits `pool.json`.
- Pool holds ≥40 passages, every one carrying bookId, page, verbatim text, `textSource`, and `citationLink`.
- Zero entries with `snippet_type: "summary"`.
- Every continuity flag resolved; no passage begins or ends mid-sentence unresolved.
- Per-book floor and cap both satisfied.
- Second run makes zero network calls to Source Library.

**M1 — Spines and scripts.**
- `pnpm compose --plays 3` emits three distinct spines and their Fountain scripts.
- Every beat carries ≥1 valid passage id. Zero dangling ids.
- Verbatim validator passes on all three scripts.
- Each script uses passages from every selected book.

**M2 — Reader, facsimile, export.**
- Reader route per play; sourced and invented lines visibly distinct without relying on colour alone.
- Every sourced line links to its `citation_link`; every link resolves.
- Leaf images lazy-loaded, `width`/`height` set, no layout shift.
- PDF export produces script plus appendix.
- Lighthouse ≥90 across the board; axe-core clean; motion is CSS-first and respects `prefers-reduced-motion`.

## 9. Design direction for the reader

The subject is a printed play built out of scanned leaves, so the page should read as a text that was set, not a card grid. Two typefaces at most. The one bold move is the relationship between the sourced line and its leaf: the facsimile is the evidence, so give it real presence rather than a thumbnail. Sourced and invented lines are distinguished structurally — indentation, rule, and marginal citation — not by tinted boxes. Avoid the generic tells: no all-caps eyebrows above every heading, no identical rounded cards, no fade-up on every section. One orchestrated reveal at most.

## 10. Decisions still open

- Whether this mounts as a route inside the existing Folium projects page or ships standalone first.
- Whether spines should be generated in one call with a diversity instruction, or three independent calls with different framing seeds. Start with three independent calls and compare.
- Whether the storyboard export shares a schema with PortFolium.
