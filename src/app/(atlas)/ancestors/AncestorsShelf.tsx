"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import {
  SHELF_BOOKS,
  SHELF_CATEGORIES,
  SHELF_EDGES,
  SHELF_RELATED,
  shelfBookUrl,
  type ShelfBook,
  type ShelfCategoryKey,
} from "@/data/library-shelf";

/**
 * The shelf, browsable three ways: by category, by search, and along the
 * timeline in the masthead. Everything filters in the client — fifty entries
 * are already in the page, and a round trip per keystroke would be slower.
 *
 * Cross references are the point of the thing, so they override the controls:
 * following one clears any filter that would hide where you are going, then
 * flashes the card it lands on.
 */

/*
 * The category legend, mapped onto core's categorical tokens (--data-1…5, see
 * tokens.css). Colour here encodes which shelf a book sits on, on the timeline
 * ticks and the section heads; --data-1 is the brand blue's own hue, so the
 * largest category reads as the Atlas rather than as a sixth colour.
 */
const CAT_COLOR: Record<ShelfCategoryKey, string> = {
  reasoning: "var(--data-1)",
  automata: "var(--data-2)",
  physics: "var(--data-3)",
  forecast: "var(--data-4)",
  worlds: "var(--data-5)",
};

const TITLES = new Map(SHELF_BOOKS.map((b) => [b.id, b.title]));

/** A cross reference wants the name, not the whole title page. */
const shortTitle = (t: string) => {
  const cut = t.split(/[:,(]|\s+—\s+/)[0].trim();
  return cut.length > 46 ? `${cut.slice(0, 44).trim()}…` : cut;
};

const anchorOf = (id: string) => `shelf-${id}`;

const YEARS = SHELF_BOOKS.map((b) => b.year).filter((y): y is number => typeof y === "number");
const MIN = Math.floor(Math.min(...YEARS) / 50) * 50;
const MAX = Math.ceil(Math.max(...YEARS) / 50) * 50;
const at = (year: number) => ((year - MIN) / (MAX - MIN)) * 100;

const DECADES = Array.from({ length: Math.round((MAX - MIN) / 50) + 1 }, (_, i) => MIN + i * 50);

export function AncestorsShelf() {
  const [cat, setCat] = useState<ShelfCategoryKey | null>(null);
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const haystack = useMemo(
    () =>
      new Map(
        SHELF_BOOKS.map((b) => [
          b.id,
          [b.title, b.originalTitle, b.author, b.note, b.description, b.tags.join(" ")]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
        ]),
      ),
    [],
  );

  const needle = q.trim().toLowerCase();
  const shown = SHELF_BOOKS.filter(
    (b) => (!cat || b.cat === cat) && (!needle || haystack.get(b.id)!.includes(needle)),
  );
  const shownIds = new Set(shown.map((b) => b.id));

  /** Follow a cross reference or a timeline tick: unfilter, scroll, mark. */
  const jump = (id: string) => {
    setCat(null);
    setQ("");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.getElementById(anchorOf(id))?.scrollIntoView({ behavior: "smooth", block: "start" });
        setFlash(id);
        window.setTimeout(() => setFlash((f) => (f === id ? null : f)), 1800);
      }),
    );
  };

  const counts = useMemo(() => {
    const m = new Map<ShelfCategoryKey, number>();
    for (const b of SHELF_BOOKS) m.set(b.cat, (m.get(b.cat) ?? 0) + 1);
    return m;
  }, []);

  return (
    <div className="min-h-[70vh] bg-surface pb-[clamp(48px,8vw,110px)] pt-[clamp(48px,8vw,110px)]">
      <Container>
        <div className="mb-3.5 flex flex-wrap items-baseline gap-4">
          <span className="h-px min-w-10 flex-1 bg-ink/[0.18]" />
          <span className="font-serif text-[11px] uppercase tracking-[0.18em] text-graphite">
            Source Library · {SHELF_BOOKS.length} works
          </span>
        </div>

        <h1 className="max-w-[16ch] text-[clamp(34px,5.2vw,78px)] font-extrabold leading-[0.96] tracking-[-0.024em] text-ink text-balance">
          The ancestors of the questions we work on
        </h1>

        <p
          className="mt-[clamp(16px,2vw,24px)] max-w-[64ch]"
          style={{ fontSize: "var(--text-lead)", lineHeight: "var(--lh-snug)", color: "var(--text-body)" }}
        >
          Fifty works from the Source Library, chosen because each one is an early version
          of something the rest of the Atlas is still doing: making inference mechanical,
          building bodies that move on their own, arguing about what light is, predicting on
          the record, and specifying whole societies that do not exist yet.
        </p>

        <p className="mt-5 max-w-[64ch] text-[13.5px] leading-[1.7] text-graphite">
          Found by running concept searches against the library&apos;s semantic index rather
          than keyword search, since none of these books contain the words we use now. Titles,
          dates, cover plates and the grey summaries are the library&apos;s own; the notes,
          the groupings and the {SHELF_EDGES.length} cross references are ours. Every entry
          opens the scan at{" "}
          <a
            href="https://sourcelibrary.org"
            target="_blank"
            rel="noopener"
            className="text-accent underline decoration-1 underline-offset-[3px]"
          >
            sourcelibrary.org
          </a>
          .
        </p>

        {/* timeline: one tick per book, hover for the title, click to land on the card */}
        <div className="mt-[clamp(34px,5vw,58px)] hidden border-t border-ink/[0.14] pt-7 md:block">
          <div className="relative h-[78px]">
            <div className="absolute inset-x-0 top-[44px] h-px bg-ink/[0.14]" />
            {SHELF_BOOKS.filter((b) => b.year).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => jump(b.id)}
                title={`${b.year}  ${b.title} · ${b.author}`}
                aria-label={`${b.year} ${b.title}`}
                className="group absolute top-[22px] h-[22px] w-[2px] -translate-x-px transition-[height,top] hover:top-[14px] hover:h-[34px]"
                style={{ left: `${at(b.year!)}%`, background: CAT_COLOR[b.cat] }}
              >
                <span className="pointer-events-none absolute bottom-[26px] left-1/2 z-10 hidden max-w-[280px] -translate-x-1/2 truncate whitespace-nowrap border border-ink/[0.14] bg-panel px-2 py-1 text-[11px] text-ink group-hover:block">
                  {b.title}
                </span>
              </button>
            ))}
            {DECADES.map((y) => (
              <span
                key={y}
                className="absolute top-[52px] -translate-x-1/2 font-condensed text-[11px] tracking-[0.08em] text-faint"
                style={{ left: `${at(y)}%` }}
              >
                {y}
              </span>
            ))}
          </div>
        </div>
      </Container>

      {/* controls */}
      <div
        className="sticky z-20 mt-[clamp(20px,3vw,32px)] border-y border-ink/[0.14] bg-surface/95 py-3 backdrop-blur-md"
        style={{ top: "var(--fa-nav-now, var(--fa-nav-h))" }}
      >
        <Container className="flex flex-nowrap items-center gap-2.5 overflow-x-auto [scrollbar-width:none] min-[900px]:flex-wrap min-[900px]:overflow-visible [&::-webkit-scrollbar]:hidden">
          <Chip label={`All ${SHELF_BOOKS.length}`} active={cat === null} onClick={() => setCat(null)} />
          {SHELF_CATEGORIES.map((c) => (
            <Chip
              key={c.key}
              label={c.short}
              dot={CAT_COLOR[c.key]}
              count={counts.get(c.key)}
              active={cat === c.key}
              onClick={() => setCat(cat === c.key ? null : c.key)}
            />
          ))}
          <label htmlFor="shelf-search" className="sr-only">
            Search the shelf
          </label>
          <input
            id="shelf-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles, authors, notes"
            className="w-[190px] shrink-0 rounded-[3px] border border-ink/25 bg-transparent px-4 py-2.5 text-[16px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent min-[900px]:w-auto min-[900px]:min-w-[240px] min-[900px]:flex-1"
          />
          {shown.length !== SHELF_BOOKS.length && (
            <span className="shrink-0 font-condensed text-[13px] tracking-[0.06em] text-faint">
              {shown.length} of {SHELF_BOOKS.length}
            </span>
          )}
        </Container>
      </div>

      <Container>
        {shown.length === 0 && (
          <p className="py-[clamp(40px,6vw,80px)] font-serif text-[19px] text-graphite">
            Nothing on the shelf matches that.
          </p>
        )}

        {SHELF_CATEGORIES.map((c) => {
          const list = shown.filter((b) => b.cat === c.key);
          if (list.length === 0) return null;
          return (
            <section key={c.key} id={`shelf-${c.key}`} className="mt-[clamp(44px,7vw,86px)] scroll-mt-[132px]">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 gap-y-1.5 border-t-2 border-ink pt-4">
                <h2
                  className="col-start-1 text-[clamp(23px,2.9vw,38px)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink"
                  style={{ color: CAT_COLOR[c.key] }}
                >
                  {c.name}
                </h2>
                <span className="col-start-2 row-start-1 font-serif text-[11px] uppercase tracking-[0.18em] text-faint">
                  {list.length} {list.length === 1 ? "work" : "works"}
                </span>
                <p className="col-start-1 max-w-[70ch] text-[14px] leading-[1.65] text-graphite">{c.blurb}</p>
              </div>

              <div className="mt-2">
                {list.map((b) => (
                  <Entry key={b.id} book={b} flashing={flash === b.id} onJump={jump} inView={shownIds} />
                ))}
              </div>
            </section>
          );
        })}
      </Container>
    </div>
  );
}

function Chip({
  label,
  count,
  dot,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  dot?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-[2px] border px-3 py-2 font-serif text-[11px] uppercase tracking-[0.16em] transition-colors ${
        active
          ? "border-ink bg-ink text-surface"
          : "border-ink/[0.18] text-graphite hover:border-ink hover:text-ink"
      }`}
    >
      {dot && (
        <span
          aria-hidden
          className="mr-2 inline-block h-[7px] w-[7px] align-[1px]"
          style={{ background: active ? "var(--c-surface)" : dot }}
        />
      )}
      {label}
      {count !== undefined && <span className="ml-2 text-faint">{count}</span>}
    </button>
  );
}

function Entry({
  book,
  flashing,
  onJump,
  inView,
}: {
  book: ShelfBook;
  flashing: boolean;
  onJump: (id: string) => void;
  inView: Set<string>;
}) {
  const related = SHELF_RELATED[book.id] ?? [];
  return (
    <article
      id={anchorOf(book.id)}
      className={`grid scroll-mt-[128px] grid-cols-[96px_minmax(0,1fr)] gap-4 border-t border-ink/[0.14] py-7 transition-colors duration-700 min-[720px]:grid-cols-[150px_minmax(0,1fr)] min-[720px]:gap-[clamp(18px,2.4vw,34px)] ${
        flashing ? "bg-accent-soft duration-0" : ""
      }`}
    >
      <a
        href={shelfBookUrl(book)}
        target="_blank"
        rel="noopener"
        className="group block self-start overflow-hidden border border-ink/[0.14] bg-haze"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- the library's image host, not ours to optimise */}
        <img
          src={book.thumbnail}
          alt=""
          loading="lazy"
          className="block aspect-[3/4] w-full object-cover saturate-[0.86] transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </a>

      <div>
        <div className="mb-2 flex items-baseline gap-3.5">
          <span
            className="font-serif text-[10px] uppercase tracking-[0.2em]"
            style={{ color: CAT_COLOR[book.cat] }}
          >
            {SHELF_CATEGORIES.find((c) => c.key === book.cat)?.name}
          </span>
          {book.year && <span className="font-condensed text-[15px] tracking-[0.08em] text-faint">{book.year}</span>}
        </div>

        <h3 className="text-[clamp(19px,2vw,27px)] font-extrabold leading-[1.14] tracking-[-0.018em] text-ink">
          <a href={shelfBookUrl(book)} target="_blank" rel="noopener" className="hover:text-accent">
            {book.title}
          </a>
        </h3>

        <p className="mt-1.5 text-[13.5px] text-graphite">
          {book.author}
          {book.language && ` · ${book.language}`}
          {book.pages && ` · ${book.pages} pages`}
        </p>

        {book.originalTitle && (
          <p className="mt-0.5 font-serif text-[13.5px] italic text-faint">{book.originalTitle}</p>
        )}

        <p className="mt-3 max-w-[72ch] text-[15px] leading-[1.7] text-ink-70">{book.note}</p>

        {book.description && (
          <p className="mt-2.5 max-w-[72ch] text-[13.5px] leading-[1.65] text-graphite">
            <span className="mr-2 font-serif text-[10px] uppercase tracking-[0.2em] text-faint">
              From the library
            </span>
            {book.description}
          </p>
        )}

        {book.tags.length > 0 && (
          <ul className="mt-3.5 flex list-none flex-wrap gap-1.5 p-0">
            {book.tags.map((t) => (
              <li
                key={t}
                className="rounded-full border border-ink/[0.14] px-2.5 py-0.5 text-[11.5px] text-graphite"
              >
                {t}
              </li>
            ))}
          </ul>
        )}

        {related.length > 0 && (
          <div className="mt-4 border-t border-ink/[0.14] pt-3">
            <span className="font-serif text-[10px] uppercase tracking-[0.2em] text-faint">Reads with</span>
            <ul className="mt-1.5 grid list-none gap-1 p-0">
              {related.map((r) => (
                <li key={r.id} className="text-[13px] text-faint">
                  <button
                    type="button"
                    onClick={() => onJump(r.id)}
                    className={`border-b text-left text-accent transition-colors ${
                      inView.has(r.id) ? "border-accent/35 hover:border-accent" : "border-dotted border-accent/25"
                    }`}
                  >
                    {shortTitle(TITLES.get(r.id) ?? r.id)}
                  </button>{" "}
                  <span>{r.why}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <a
          href={shelfBookUrl(book)}
          target="_blank"
          rel="noopener"
          className="mt-4 inline-block border-b-[1.5px] border-ink pb-0.5 font-serif text-[11px] uppercase tracking-[0.18em] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Open in Source Library
        </a>
      </div>
    </article>
  );
}
