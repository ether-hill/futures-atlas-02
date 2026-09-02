/**
 * Source Library REST client.
 *
 * Two rules shape this file. Reads are metered, so everything that costs page
 * budget goes through the disk cache; and the service rate-limits by the hour,
 * so requests are queued at concurrency 2 with exponential backoff on 429.
 *
 * Docs: https://sourcelibrary.org/developers
 */
import { cached } from "./cache";
import { cleanPage, stripWatermark } from "./text";
import type { BookRef } from "./types";

const BASE = "https://sourcelibrary.org/api";
const CONCURRENCY = 2;

let active = 0;
const waiting: (() => void)[] = [];

async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= CONCURRENCY) await new Promise<void>((r) => waiting.push(r));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

export class SourceLibraryError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "SourceLibraryError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request<T>(pathname: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(BASE + pathname);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = {
    accept: "application/json",
    "user-agent": "dramaturge (https://sourcelibrary.org/developers)",
  };
  const key = process.env.SOURCE_LIBRARY_API_KEY;
  if (key) headers.authorization = `Bearer ${key}`;

  return slot(async () => {
    let delay = 1000;
    for (let attempt = 0; attempt < 5; attempt++) {
      // Without a deadline a stalled connection holds one of the two slots for
      // ever and the whole harvest deadlocks behind it.
      let res: Response;
      try {
        res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(30_000) });
      } catch (error) {
        if (attempt === 4) throw error;
        await sleep(delay);
        delay *= 2;
        continue;
      }
      if (res.ok) {
        const type = res.headers.get("content-type") ?? "";
        if (!type.includes("json")) {
          // The bare host serves a crawler banner on unknown routes.
          throw new SourceLibraryError(res.status, `expected JSON from ${pathname}, got ${type}`);
        }
        return (await res.json()) as T;
      }
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after"));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : delay);
        delay *= 2;
        continue;
      }
      throw new SourceLibraryError(res.status, `${res.status} from ${pathname}`);
    }
    throw new SourceLibraryError(429, `gave up after 5 attempts on ${pathname}`);
  });
}

/* ── catalogue ──────────────────────────────────────────────────────────── */

type RawBook = Record<string, unknown>;

function toBookRef(b: RawBook): BookRef {
  const id = String(b.id ?? b.book_id ?? b._id ?? "");
  const slug = String(b.slug ?? "");
  return {
    bookId: id,
    slug,
    title: String(b.title ?? ""),
    displayTitle: (b.display_title as string) ?? null,
    author: String(b.author ?? "Unknown"),
    published: String(b.published ?? b.year ?? ""),
    language: String(b.language ?? ""),
    workLanguage: (b.original_language as string) ?? null,
    textRole: (b.text_role as string) ?? null,
    pages: Number(b.pages_count ?? b.page_count ?? 0),
    pagesTranslated: Number(b.pages_translated ?? b.translated_count ?? 0),
    thumbnail: (b.thumbnail_blob as string) ?? (b.thumbnail as string) ?? null,
    url: slug ? `https://sourcelibrary.org/book/${slug}` : `https://sourcelibrary.org/book/${id}`,
  };
}

/** Catalogue search: which BOOKS exist on a subject. Cheap, not page-metered. */
export async function searchBooks(query: string, limit = 24): Promise<BookRef[]> {
  const q = query.trim();
  if (!q) return [];
  return cached(`books:search:${q}:${limit}`, async () => {
    const data = await request<{ books?: RawBook[]; total?: number }>("/books/library", {
      search: q,
      limit,
    });
    return (data.books ?? []).map(toBookRef).filter((b) => b.bookId);
  });
}

/** The raw book record, cached. Projections happen after the cache. */
async function rawBook(idOrSlug: string): Promise<RawBook> {
  return cached(`raw-book:${idOrSlug}`, () =>
    request<RawBook>(`/books/${encodeURIComponent(idOrSlug)}`),
  );
}

export async function getBook(idOrSlug: string): Promise<BookRef> {
  return toBookRef(await rawBook(idOrSlug));
}

/**
 * The scan of each leaf, as the API itself publishes it. The URLs are read off
 * the book record rather than assembled from a pattern: a constructed image URL
 * that 404s is a broken picture and a false claim at once, so a leaf the
 * library does not publish an image for simply has none, and renders as text.
 */
export async function leafImages(bookId: string): Promise<Map<number, string>> {
  const data = await rawBook(bookId);
  const pages = Array.isArray(data.pages) ? (data.pages as Array<Record<string, unknown>>) : [];
  const map = new Map<number, string>();
  for (const page of pages) {
    const n = Number(page.page_number);
    const url = (page.display_photo ?? page.archived_photo ?? page.image_full) as string | undefined;
    if (Number.isFinite(n) && typeof url === "string" && url.startsWith("https://")) {
      map.set(n, url);
    }
  }
  return map;
}

/**
 * Accept anything an operator might paste: a reader URL, a citation shortlink,
 * a slug or a bare id. A shortlink is followed because it resolves to the book
 * page — we never guess an id from the URL's shape.
 */
export async function resolveBookInput(input: string): Promise<BookRef> {
  const raw = input.trim();
  if (!raw) throw new Error("nothing to resolve");

  let candidate = raw;
  const url = raw.match(/^https?:\/\/\S+$/i) ? new URL(raw) : null;
  if (url) {
    if (/\/q\//.test(url.pathname)) {
      const res = await fetch(url, { redirect: "follow" });
      candidate = new URL(res.url).pathname.split("/book/")[1] ?? "";
    } else {
      candidate = url.pathname.split("/book/")[1] ?? "";
    }
    candidate = candidate.split("/")[0].split("?")[0];
  }
  if (!candidate) throw new Error(`could not find a book id or slug in "${raw}"`);
  return getBook(candidate);
}

/* ── search inside one book ─────────────────────────────────────────────── */

export type PageHit = {
  page: number;
  /** "keyword" | "semantic" | "both" — the service's own lanes. */
  foundBy: string;
  score: number;
  snippet: string;
};

/**
 * The corpus mixes AI-written summaries in with page text. A summary is
 * description OF a book, not something the book says, so a hit that offers no
 * text field is dropped here at the boundary rather than filtered later — the
 * count is reported so a run can state how many were refused.
 */
const TEXT_FIELDS = new Set(["translation", "original", "ocr", "text"]);
let droppedNonText = 0;
export function nonTextDropped(): number {
  return droppedNonText;
}
export function resetNonTextDropped(): void {
  droppedNonText = 0;
}

/**
 * Search within one book. This endpoint runs both a keyword and a meaning lane
 * and reports which matched, so one call serves both an exact seed term and a
 * concept prompt. Results are page hits, not text we may quote.
 */
export async function searchInBook(bookId: string, query: string, limit = 30): Promise<PageHit[]> {
  return cached(`inbook:${bookId}:${query}:${limit}`, async () => {
    const data = await request<{ results?: Array<Record<string, unknown>> }>(
      `/books/${encodeURIComponent(bookId)}/search`,
      { q: query, limit },
    );
    const seen = new Set<number>();
    const hits: PageHit[] = [];
    for (const r of data.results ?? []) {
      const page = Number(r.pageNumber);
      if (!Number.isFinite(page) || seen.has(page)) continue;
      if (r.is_front_matter === true) continue;
      const matches = (r.matches ?? []) as Array<{ snippet?: string; field?: string }>;
      const text = matches.filter((m) => TEXT_FIELDS.has(String(m.field ?? "")));
      if (matches.length > 0 && text.length === 0) {
        droppedNonText++;
        continue;
      }
      seen.add(page);
      hits.push({
        page,
        foundBy: String(r.found_by ?? "keyword"),
        score: Number(r.score ?? 0),
        snippet: stripWatermark(text[0]?.snippet ?? matches[0]?.snippet ?? ""),
      });
    }
    return hits;
  });
}

/* ── quoting one page ───────────────────────────────────────────────────── */

export type Quote = {
  bookId: string;
  page: number;
  lang: string;
  body: string;
  marginalia: string[];
  /** The scan carries a reading the transcription marks as unclear. */
  uncertain: boolean;
  textSource: "translation" | "ocr_original";
  translationNote?: string;
  author: string;
  bookTitle: string;
  citationLink: string;
  readerUrl: string;
  footnote: string;
  /** Present only when asked for; used to complete a sentence across a break. */
  previousPage?: string;
  nextPage?: string;
};

type RawQuote = {
  quote: Record<string, unknown>;
  citation: Record<string, unknown>;
  context?: { previous_page?: string; next_page?: string };
};

/**
 * Fetch one page with its citation apparatus. `withContext` also returns the
 * neighbouring leaves so a sentence running across the page break can be read
 * whole — the brief's continuity rule. It costs additional page budget, so it
 * is requested only for the pages that actually need it.
 *
 * The CACHE HOLDS THE RAW RESPONSE, and parsing happens after it. That layering
 * matters: it means a change to how text is cleaned costs nothing to apply to
 * everything already harvested, instead of re-spending the page budget.
 */
export async function getQuote(bookId: string, page: number, withContext = false, lang = "en"): Promise<Quote> {
  const key = `raw-quote:${bookId}:${page}:${lang}:${withContext ? "ctx" : "plain"}`;
  const data = await cached(key, () =>
    request<RawQuote>(`/books/${encodeURIComponent(bookId)}/quote`, {
      page,
      lang,
      include_context: withContext ? "true" : undefined,
    }),
  );

  const q = data.quote ?? {};
  const c = data.citation ?? {};
  const textSource = q.text_source === "ocr_original" ? "ocr_original" : "translation";
  const rawText = String(
    (textSource === "ocr_original" ? q.original : q.translation) ?? q.translation ?? q.original ?? "",
  );
  const { body, marginalia, uncertain } = cleanPage(rawText);
  return {
    bookId,
    page,
    lang: String(q.lang ?? lang),
    body,
    marginalia,
    uncertain,
    textSource,
    translationNote: (q.translation_note as string) ?? undefined,
    author: String(q.author ?? ""),
    bookTitle: String(q.display_title ?? q.book_title ?? ""),
    citationLink: String(c.short_url ?? c.url ?? ""),
    readerUrl: String(c.url ?? ""),
    footnote: String(c.footnote ?? ""),
    previousPage: data.context?.previous_page ? cleanPage(data.context.previous_page).body : undefined,
    nextPage: data.context?.next_page ? cleanPage(data.context.next_page).body : undefined,
  };
}

/** Illustrations extracted from a book's own leaves, for the reader's plates. */
export async function bookImages(bookId: string, query: string, limit = 8) {
  return cached(`gallery:${bookId}:${query}:${limit}`, async () => {
    const data = await request<{ items?: Array<Record<string, unknown>> }>("/gallery", {
      book_id: bookId,
      q: query,
      limit,
    });
    return (data.items ?? [])
      .filter((i) => String(i.bookId ?? "") === bookId)
      .map((i) => ({
        page: Number(i.pageNumber ?? 0),
        thumb: String(i.thumbnailUrl ?? ""),
        full: String(i.imageUrl ?? ""),
        description: String(i.description ?? ""),
      }));
  });
}

/**
 * The reader URL for one leaf, used by the facsimile capture when the library
 * publishes no image of its own. This is a page to visit, never an image to
 * hot-link.
 */
export function readerPageUrl(slugOrId: string, page: number): string {
  return `https://sourcelibrary.org/book/${slugOrId}?page=${page}`;
}
