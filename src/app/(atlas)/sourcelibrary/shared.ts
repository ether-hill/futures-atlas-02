import { SHELF_BOOKS, SHELF_CATEGORIES, type ShelfBook, type ShelfCategoryKey } from "@/data/library-shelf";
import { SHELF_COVER_SMALL } from "@/data/library-plates";

/*
 * The category legend on core's categorical tokens (--data-1…5, tokens.css),
 * the same mapping the list version of this page uses. Colour says which
 * thread a book is on and nothing else; text beside it stays in ink.
 */
export const CAT_COLOR: Record<ShelfCategoryKey, string> = {
  reasoning: "var(--data-1)",
  automata: "var(--data-2)",
  physics: "var(--data-3)",
  forecast: "var(--data-4)",
  worlds: "var(--data-5)",
};

export const CAT = Object.fromEntries(SHELF_CATEGORIES.map((c) => [c.key, c])) as Record<
  ShelfCategoryKey,
  (typeof SHELF_CATEGORIES)[number]
>;

export const BOOK = new Map<string, ShelfBook>(SHELF_BOOKS.map((b) => [b.id, b]));

/** A cross reference wants the name, not the whole title page. */
export const shortTitle = (t: string, max = 46) => {
  const cut = t.split(/[:,(]|\s+—\s+/)[0]!.trim();
  return cut.length > max ? `${cut.slice(0, max - 2).trim()}…` : cut;
};

/** "Lichtenberger, Johannes" and "Hero of Alexandria; Baldi (trans.)" both down to one name. */
export const shortAuthor = (a: string) => a.split(/[;/]/)[0]!.replace(/\(.*?\)|\[|\]/g, "").trim();

/** The light rendition for the field; the full scan only where one book is being read. */
export const smallCover = (b: ShelfBook) => SHELF_COVER_SMALL[b.id] ?? b.thumbnail;

export const YEARS = SHELF_BOOKS.map((b) => b.year).filter((y): y is number => typeof y === "number");
export const FIRST_YEAR = Math.min(...YEARS);
export const LAST_YEAR = Math.max(...YEARS);
