/**
 * Stages 2 to 4 of the pipeline: harvest, score, verify.
 *
 * The product is pool.json. After this file has run, nothing may ask the
 * library for text again — the pool is the single source of truth for every
 * word the plays are allowed to quote.
 */
import { cacheStats, resetCacheStats } from "./cache";
import {
  bookImages,
  getQuote,
  leafImages,
  nonTextDropped,
  resetNonTextDropped,
  searchInBook,
  type PageHit,
} from "./sl";
import {
  closesMidSentence,
  isSpeakable,
  joinAcrossBreak,
  opensMidSentence,
  splitSentences,
  words,
} from "./text";
import type { Asset, BookRef, Collection, Passage, SourceLine, ThemeSpec } from "./types";

export type HarvestOptions = {
  /** Every chosen book must contribute at least this many passages. */
  floorPerBook?: number;
  /** No book may contribute more than this, so one volume cannot dominate. */
  capPerBook?: number;
  /** Stop fetching once the pool reaches this size. */
  targetPassages?: number;
  onEvent?: (kind: "start" | "ok" | "warn" | "fail", message: string, detail?: string) => void;
  /** Images the operator pasted a URL to, carried into the collection as-is. */
  extraAssets?: Asset[];
};

type Candidate = {
  bookId: string;
  page: number;
  score: number;
  matchedBy: Set<"term" | "concept">;
  snippet: string;
};

/** Stage 2 — search each book for the theme's terms and concepts. */
async function gather(book: BookRef, theme: ThemeSpec, log: NonNullable<HarvestOptions["onEvent"]>) {
  const byPage = new Map<number, Candidate>();

  const add = (hit: PageHit, kind: "term" | "concept", weight: number) => {
    const existing = byPage.get(hit.page);
    const semantic = hit.foundBy === "semantic" || hit.foundBy === "both";
    const bump = weight * (hit.score || 0.5) + (semantic ? 0.35 : 0) + 0.25;
    if (existing) {
      existing.score += bump;
      existing.matchedBy.add(kind);
      if (!existing.snippet) existing.snippet = hit.snippet;
      return;
    }
    byPage.set(hit.page, {
      bookId: book.bookId,
      page: hit.page,
      score: bump,
      matchedBy: new Set([kind]),
      snippet: hit.snippet,
    });
  };

  for (const term of theme.seedTerms) {
    const hits = await searchInBook(book.bookId, term, 30);
    hits.forEach((h) => add(h, "term", 1));
  }
  for (const prompt of theme.conceptPrompts) {
    const hits = await searchInBook(book.bookId, prompt, 20);
    hits.forEach((h) => add(h, "concept", 0.8));
  }

  // A page whose snippet is dominated by an excluded term is dragging the pool
  // off-theme; demote rather than delete, so a strong page can still survive.
  for (const c of byPage.values()) {
    const lower = c.snippet.toLowerCase();
    for (const bad of theme.exclude) {
      if (bad && lower.includes(bad.toLowerCase())) c.score -= 0.8;
    }
    // A page matched by both lanes is worth more than one matched twice by one.
    if (c.matchedBy.has("term") && c.matchedBy.has("concept")) c.score += 0.5;
  }

  const list = [...byPage.values()].filter((c) => c.score > 0);
  log("ok", `${book.displayTitle ?? book.title}: ${list.length} candidate pages`);
  return list;
}

/**
 * Stage 3 — rank, then spread. Greedy selection that refuses a page sitting
 * within `minGap` leaves of one already taken, so a play draws on a whole book
 * rather than one dense chapter. The gap relaxes if a book would miss its floor.
 */
function select(candidates: Candidate[], cap: number, floor: number): Candidate[] {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const picked: Candidate[] = [];
  for (const gap of [8, 3, 0]) {
    for (const c of sorted) {
      if (picked.length >= cap) break;
      if (picked.some((p) => p.page === c.page)) continue;
      if (gap > 0 && picked.some((p) => Math.abs(p.page - c.page) < gap)) continue;
      picked.push(c);
    }
    if (picked.length >= Math.min(floor, sorted.length)) break;
  }
  return picked.slice(0, cap);
}

/**
 * Stage 4 — verify. Fetch each chosen page, split it into quotable sentences,
 * and resolve continuity: a sentence that runs across a page break is completed
 * from the neighbouring leaf, or it is not quoted at all. A fragment presented
 * as a whole thought is a misattribution even with the right page number.
 */
async function verifyPage(
  book: BookRef,
  candidate: Candidate,
  index: number,
  leaves: Map<number, string>,
  log: NonNullable<HarvestOptions["onEvent"]>,
): Promise<{ passage: Passage | null; continuityResolved: number }> {
  const quote = await getQuote(book.bookId, candidate.page);
  if (!quote.body || words(quote.body) < 20) return { passage: null, continuityResolved: 0 };

  const passageId = `b${index}p${candidate.page}`;
  let sentences = splitSentences(quote.body);
  let resolved = 0;

  const headRunsOn = opensMidSentence(quote.body);
  const tailRunsOn = closesMidSentence(quote.body);
  // Whether the first and last sentences were actually COMPLETED across the
  // break, which is not the same as whether they ran on: a sentence that could
  // not be completed is dropped, and dropping one shifts every index after it.
  let headJoined = false;
  let tailJoined = false;

  if ((headRunsOn || tailRunsOn) && sentences.length > 0) {
    const withContext = await getQuote(book.bookId, candidate.page, true);
    if (headRunsOn) {
      const prev = withContext.previousPage ? splitSentences(withContext.previousPage) : [];
      const tailOfPrev =
        withContext.previousPage && closesMidSentence(withContext.previousPage)
          ? prev[prev.length - 1]
          : null;
      if (tailOfPrev) {
        sentences[0] = joinAcrossBreak(tailOfPrev, sentences[0]);
        headJoined = true;
        resolved++;
      } else {
        sentences = sentences.slice(1); // cannot complete it, so do not quote it
      }
    }
    if (tailRunsOn && sentences.length > 0) {
      const next = withContext.nextPage ? splitSentences(withContext.nextPage) : [];
      const headOfNext =
        withContext.nextPage && opensMidSentence(withContext.nextPage) ? next[0] : null;
      if (headOfNext) {
        sentences[sentences.length - 1] = joinAcrossBreak(sentences[sentences.length - 1], headOfNext);
        tailJoined = true;
        resolved++;
      } else {
        sentences = sentences.slice(0, -1);
      }
    }
  }

  const lines: SourceLine[] = [];
  sentences.forEach((text, i) => {
    if (!isSpeakable(text)) return;
    const spansBack = i === 0 && headJoined;
    const spansOn = i === sentences.length - 1 && tailJoined;
    lines.push({
      id: `${passageId}l${i}`,
      passageId,
      bookId: book.bookId,
      page: candidate.page,
      text,
      spansPages: spansBack || spansOn,
      pages: spansBack
        ? [candidate.page - 1, candidate.page]
        : spansOn
          ? [candidate.page, candidate.page + 1]
          : [candidate.page],
      citationLink: quote.citationLink,
      words: words(text),
      uncertain: quote.uncertain,
    });
  });

  if (lines.length === 0) return { passage: null, continuityResolved: resolved };

  const passage: Passage = {
    id: passageId,
    bookId: book.bookId,
    page: candidate.page,
    lang: quote.lang,
    verbatim: quote.body,
    textSource: quote.textSource,
    translationNote: quote.translationNote,
    marginalia: quote.marginalia,
    uncertain: quote.uncertain,
    citationLink: quote.citationLink,
    readerUrl: quote.readerUrl,
    citationFootnote: quote.footnote,
    pageImageUrl: leaves.get(candidate.page),
    score: Number(candidate.score.toFixed(3)),
    matchedBy: [...candidate.matchedBy],
    lines,
  };
  log("ok", `${book.displayTitle ?? book.title} p.${candidate.page}: ${lines.length} quotable lines`);
  return { passage, continuityResolved: resolved };
}

export async function collect(
  books: BookRef[],
  theme: ThemeSpec,
  options: HarvestOptions = {},
): Promise<Collection> {
  const log = options.onEvent ?? (() => {});
  const floor = options.floorPerBook ?? 5;
  const cap = options.capPerBook ?? 20;
  const target = options.targetPassages ?? 60;
  resetCacheStats();
  resetNonTextDropped();

  const perBookCap = Math.max(floor, Math.ceil(target / Math.max(books.length, 1)) + 4);
  const passages: Passage[] = [];
  const perBook: Record<string, number> = {};
  let continuityResolved = 0;

  for (const [index, book] of books.entries()) {
    log("start", `Reading ${book.displayTitle ?? book.title}`);
    const candidates = await gather(book, theme, log);
    if (candidates.length === 0) {
      log("warn", `${book.displayTitle ?? book.title} returned nothing for this theme`);
      perBook[book.bookId] = 0;
      continue;
    }
    const chosen = select(candidates, Math.min(cap, perBookCap), floor);
    const leaves = await leafImages(book.bookId).catch(() => new Map<number, string>());
    let kept = 0;
    for (const candidate of chosen) {
      const { passage, continuityResolved: r } = await verifyPage(book, candidate, index + 1, leaves, log);
      continuityResolved += r;
      if (passage) {
        passages.push(passage);
        kept++;
      }
    }
    perBook[book.bookId] = kept;
    if (kept < floor) {
      log("warn", `${book.displayTitle ?? book.title} yielded only ${kept} passages (floor is ${floor})`);
    }
  }

  const lines = passages.flatMap((p) => p.lines);
  const stats = cacheStats();

  return {
    id: theme.id,
    theme,
    createdAt: new Date().toISOString(),
    books,
    passages,
    lines,
    extraAssets: options.extraAssets ?? [],
    stats: {
      perBook,
      pagesRead: stats.misses,
      cacheHits: stats.hits,
      droppedSummaries: nonTextDropped(),
      continuityResolved,
    },
  };
}

/** Plates for the reader: illustrations the chosen books actually carry. */
export async function harvestPlates(books: BookRef[], theme: ThemeSpec) {
  const out: Array<{ bookId: string; page: number; thumb: string; full: string; description: string }> = [];
  for (const book of books) {
    for (const term of theme.seedTerms.slice(0, 2)) {
      try {
        const images = await bookImages(book.bookId, term, 4);
        out.push(...images.map((i) => ({ ...i, bookId: book.bookId })));
      } catch {
        // A book with no extracted plates is normal; the reader falls back to
        // the leaf scan, and an unreachable image is never rendered as a claim.
      }
    }
  }
  return out;
}
