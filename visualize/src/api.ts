// Source Library API client (sourcelibrary.org/api). CORS is open and the
// read endpoints work without a key to start, so we call it straight from the
// browser. Docs: https://sourcelibrary.org/developers

// Source Library has no open CORS, so we go through a same-origin proxy: the host
// Next app exposes /api/sl/* → sourcelibrary.org/api/* (see src/app/api/sl). In
// local Vite dev/preview the same path is proxied by vite.config.
const BASE = "/api/sl";

export interface BookMeta {
  id: string;
  title: string; // English / display title where available
  originalTitle: string;
  author: string;
  language: string;
  year: string;
  pages: number;
  pagesTranslated: number;
  thumbnail: string;
  categories: string[];
  url: string; // page on sourcelibrary.org
}

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  language: string;
  thumbnail: string;
  pages: number;
  translationPercent: number;
}

const bookUrl = (id: string): string => `https://sourcelibrary.org/book/${id}`;

/** A page of the public catalogue, newest-translated first where the API allows. */
export async function library(limit = 30): Promise<LibraryItem[]> {
  const res = await fetch(`${BASE}/books/library?limit=${limit}`);
  if (!res.ok) throw new Error(`library: ${res.status}`);
  const json = (await res.json()) as { books?: Array<Record<string, unknown>> };
  return (json.books ?? []).map((b) => ({
    id: String(b.id ?? ""),
    title: String(b.display_title ?? b.title ?? "Untitled"),
    author: String(b.author ?? "Unknown"),
    language: String(b.language ?? ""),
    thumbnail: String(b.image_thumb ?? b.thumbnail ?? ""),
    pages: Number(b.pages_count ?? 0),
    translationPercent: Number(b.translation_percent ?? 0),
  }));
}

export async function getBook(id: string): Promise<BookMeta> {
  const res = await fetch(`${BASE}/books/${id}`);
  if (!res.ok) throw new Error(`book: ${res.status}`);
  const b = (await res.json()) as Record<string, unknown>;
  return {
    id: String(b.id ?? id),
    title: String(b.display_title ?? b.title ?? "Untitled"),
    originalTitle: String(b.title ?? ""),
    author: String(b.author ?? "Unknown"),
    language: String(b.language ?? ""),
    year: String(b.published ?? ""),
    pages: Number(b.pages_count ?? 0),
    pagesTranslated: Number(b.pages_translated ?? 0),
    thumbnail: String(b.thumbnail ?? ""),
    categories: Array.isArray(b.categories) ? (b.categories as unknown[]).map(String) : [],
    url: bookUrl(String(b.id ?? id)),
  };
}

/** Concatenated text for a page range. `content` is translation | ocr | both. */
export async function getText(
  id: string,
  opts: { content?: "translation" | "ocr" | "both"; from?: number; to?: number } = {},
): Promise<string> {
  const content = opts.content ?? "translation";
  const from = opts.from ?? 1;
  const to = opts.to ?? 40;
  const res = await fetch(`${BASE}/books/${id}/text?content=${content}&from=${from}&to=${to}&format=plain`);
  if (!res.ok) throw new Error(`text: ${res.status}`);
  return res.text();
}

export { bookUrl };
