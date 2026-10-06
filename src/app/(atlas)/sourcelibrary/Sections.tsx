"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { SHELF_BOOKS, SHELF_CATEGORIES, SHELF_EDGES, type ShelfBook } from "@/data/library-shelf";
import { SHELF_COVER_ASPECT } from "@/data/library-plates";
import { SHELF_SHORT } from "@/data/ancestors-short";
import { THREAD_STORIES, THREAD_STORY } from "@/data/ancestors-story";
import { EMPTY_WHEEL, LlullWheel, WHEEL_LANGS, type WheelValue } from "./LlullWheel";
import { CAT_COLOR, shortAuthor, shortTitle, smallCover } from "./shared";

/** What sits under the pinned stage: the reading list itself, and how it was made. */

export const threadAnchor = (key: string) => `reading-${key}`;

/* ------------------------------------------------------- the shelf, drifting */

const OLDEST_FIRST = [...SHELF_BOOKS].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));

/**
 * All fifty covers standing on one line, oldest first, drifting slowly past.
 * Each keeps its own shape and wears its subject's colour underfoot. The row is
 * rendered twice end to end so the drift loops without a seam; the second copy
 * is hidden from assistive tech and from the tab order.
 */
export function ShelfStrip({ onPick }: { onPick: (id: string) => void }) {
  const run = (copy: number) => (
    <ul className="anc-shelf-run" aria-hidden={copy > 0 || undefined}>
      {OLDEST_FIRST.map((b) => (
        <li key={b.id}>
          <button
            type="button"
            tabIndex={copy > 0 ? -1 : 0}
            onClick={() => onPick(b.id)}
            aria-label={`${b.title}, ${b.year ?? ""}`}
            title={`${shortTitle(b.title, 48)}${b.year ? `, ${b.year}` : ""}`}
            className="anc-shelf-book"
            style={{ aspectRatio: SHELF_COVER_ASPECT[b.id] ?? 0.7, boxShadow: `0 4px 0 0 ${CAT_COLOR[b.cat]}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- the library's image host, not ours to optimise */}
            <img src={smallCover(b)} alt="" draggable={false} />
          </button>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="anc-shelf border-b-2 border-ink" aria-label="All fifty books, oldest first">
      <div className="anc-shelf-track">
        {run(0)}
        {run(1)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ the reading list */

export function ReadingList({ selected, onPick }: { selected: string | null; onPick: (id: string) => void }) {
  const [wheel, setWheel] = useState<WheelValue>(EMPTY_WHEEL);
  const [q, setQ] = useState("");

  const haystack = useMemo(
    () =>
      new Map(
        SHELF_BOOKS.map((b) => [
          b.id,
          [b.title, b.originalTitle, b.author, b.note, b.tags.join(" "), b.language].filter(Boolean).join(" ").toLowerCase(),
        ]),
      ),
    [],
  );
  const needle = q.trim().toLowerCase();
  const shown = SHELF_BOOKS.filter(
    (b) =>
      (!wheel.thread || b.cat === wheel.thread) &&
      (wheel.century === null || (b.year !== undefined && Math.floor(b.year / 100) * 100 === wheel.century)) &&
      (!wheel.lang || (wheel.lang === "Other" ? !WHEEL_LANGS.includes(b.language ?? "") : b.language === wheel.lang)) &&
      (!needle || haystack.get(b.id)!.includes(needle)),
  );
  const narrowed = shown.length !== SHELF_BOOKS.length;
  const reset = () => {
    setWheel(EMPTY_WHEEL);
    setQ("");
  };

  return (
    <Container className="mt-[clamp(48px,7vw,96px)]">
      <h2 className="text-[clamp(28px,3.6vw,50px)] font-extrabold leading-[1] tracking-[-0.022em] text-ink">
        The reading list
      </h2>
      <p className="mt-3 max-w-[64ch] text-[15.5px] leading-[1.6] text-ink-70">
        All {SHELF_BOOKS.length} books, in five subjects, oldest first. Under each cover is one sentence on why the
        book is here. Select a book for the full note, its figures and the scan.
      </p>

      <div className="mt-[clamp(32px,4vw,64px)] min-[1100px]:grid min-[1100px]:grid-cols-[300px_minmax(0,1fr)] min-[1100px]:gap-x-[clamp(32px,4vw,64px)]">
        {/* ---- narrowing it down: stays beside the list as it scrolls ---- */}
        <aside
          className="mb-10 self-start border border-ink/[0.14] bg-panel px-4 pb-5 pt-4 min-[1100px]:sticky min-[1100px]:mb-0"
          style={{ top: "calc(var(--fa-nav-now, var(--fa-nav-h)) + 16px)" }}
        >
          <div className="flex items-baseline gap-3">
            <h3 className="text-[16px] font-extrabold leading-tight text-ink">Narrow the list</h3>
            {narrowed && (
              <button
                type="button"
                onClick={reset}
                className="ml-auto text-[13px] font-semibold text-accent underline decoration-1 underline-offset-[3px]"
              >
                Show all {SHELF_BOOKS.length}
              </button>
            )}
          </div>
          <p className="mt-1 text-[13px] leading-[1.5] text-graphite">
            Turn a ring, or select a segment, to pick a subject, a century and a language.
          </p>
          <div className="mx-auto mt-2 max-w-[280px]">
            <LlullWheel value={wheel} onChange={setWheel} count={shown.length} />
          </div>
          <label htmlFor="anc-search" className="sr-only">
            Search the reading list
          </label>
          <input
            id="anc-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles, authors, notes"
            className="mt-3 w-full rounded-[3px] border border-ink/25 bg-transparent px-3.5 py-2.5 text-[16px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
          />
          <p className="mt-3 text-[12px] leading-[1.5] text-faint">
            The wheel is borrowed from the oldest book on the reasoning shelf, Llull&apos;s Great Art, which combines
            ideas on three lettered rings.
          </p>
        </aside>

        {/* ---- five subjects, each a row of covers ---- */}
        <div>
          {shown.length === 0 && (
            <p className="border-t-2 border-ink py-10 text-[16px] text-graphite">
              No book on the shelf matches that.{" "}
              <button type="button" onClick={reset} className="font-semibold text-accent underline underline-offset-[3px]">
                Show all {SHELF_BOOKS.length}
              </button>
            </p>
          )}
          {SHELF_CATEGORIES.map((c, i) => {
            const list = shown.filter((b) => b.cat === c.key);
            if (list.length === 0) return null;
            const story = THREAD_STORY[c.key];
            return (
              <section
                key={c.key}
                id={threadAnchor(c.key)}
                className="mb-[clamp(88px,11vw,168px)] scroll-mt-[calc(var(--fa-nav-h)+20px)] last:mb-[clamp(40px,5vw,72px)]"
              >
                {/* the subject announces itself: a heavy rule in its colour, its
                    place in the five, then the question at display size */}
                <header className="border-t-[6px] pt-5" style={{ borderColor: CAT_COLOR[c.key] }}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-condensed text-[15px] tracking-[0.08em] text-graphite">
                      {i + 1} of {SHELF_CATEGORIES.length}
                    </span>
                    <span className="text-[15px] font-extrabold text-ink">{c.name}</span>
                    <span className="ml-auto font-condensed text-[15px] tracking-[0.06em] text-graphite">
                      {list.length} {list.length === 1 ? "book" : "books"}
                    </span>
                  </div>
                  <h3 className="mt-[clamp(18px,2.4vw,36px)] max-w-[18ch] text-[clamp(34px,4.9vw,74px)] font-extrabold leading-[0.97] tracking-[-0.028em] text-ink text-balance">
                    {story.question}
                  </h3>
                  <p
                    className="mt-[clamp(14px,1.6vw,24px)] max-w-[58ch]"
                    style={{ fontSize: "var(--text-lead)", lineHeight: "var(--lh-snug)", color: "var(--text-body)" }}
                  >
                    {c.blurb}
                  </p>
                </header>

                <ul className="mt-[clamp(28px,3.4vw,52px)] grid list-none grid-cols-2 gap-[clamp(10px,1.2vw,18px)] p-0 min-[620px]:grid-cols-3 min-[1360px]:grid-cols-4">
                  {list.map((b) => (
                    <li key={b.id} className="flex">
                      <Card book={b} on={selected === b.id} onPick={onPick} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </Container>
  );
}

function Card({ book, on, onPick }: { book: ShelfBook; on: boolean; onPick: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(book.id)}
      className={`fa-card fa-card--link group w-full text-left ${on ? "border-accent" : ""}`}
    >
      {/* One plate, the same on every card, and the cover standing whole inside
          it at its own shape: a folio is tall, a print is wide, nothing is cropped. */}
      <span className="relative block aspect-square w-full overflow-hidden bg-haze">
        {/* eslint-disable-next-line @next/next/no-img-element -- the library's image host, not ours to optimise */}
        <img
          src={book.thumbnail}
          alt=""
          loading="lazy"
          className="absolute inset-0 box-border h-full w-full object-contain p-[clamp(12px,1.6vw,22px)] transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </span>
      <span className="flex flex-1 flex-col px-[clamp(12px,1.3vw,18px)] pb-[clamp(14px,1.5vw,20px)] pt-[clamp(12px,1.3vw,16px)]">
        <span className="flex items-baseline gap-2 text-[13px] text-graphite">
          <span className="font-condensed text-[15px] tracking-[0.05em] text-ink">{book.year}</span>
          <span className="truncate">{shortAuthor(book.author)}</span>
        </span>
        <span className="mt-1.5 line-clamp-2 text-[clamp(15px,1.25vw,17.5px)] font-extrabold leading-[1.2] tracking-[-0.01em] text-ink group-hover:text-accent">
          {shortTitle(book.title, 64)}
        </span>
        <span className="mt-2 block text-[13.5px] leading-[1.5] text-ink-70">{SHELF_SHORT[book.id] ?? book.note}</span>
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------- method */

export function Method() {
  return (
    <Container className="mt-[clamp(20px,3vw,40px)]">
      <div className="grid max-w-[1100px] gap-x-[clamp(24px,4vw,64px)] gap-y-5 border-t border-ink/[0.14] pt-5 min-[820px]:grid-cols-2">
        <p className="text-[13.5px] leading-[1.7] text-graphite">
          Found by running concept searches against the library&apos;s semantic index rather than keyword search,
          since none of these books contain the words we use now. Titles, dates, cover plates and the grey
          summaries are the library&apos;s own; the notes, the groupings and the {SHELF_EDGES.length} cross
          references are ours. Every entry opens the scan at{" "}
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
        <div className="text-[13.5px] leading-[1.7] text-graphite">
          <p>
            Figures are the library&apos;s own extractions from the scans, with its descriptions. The diamond on each
            line of the circuit marks the year the subject got the name it goes by now:
          </p>
          <ul className="mt-1.5 list-none p-0">
            {[...THREAD_STORIES]
              .sort((a, b) => a.named.year - b.named.year)
              .map((t) => (
                <li key={t.key}>
                  <span className="font-condensed tracking-[0.04em] text-ink">{t.named.year}</span> {t.named.what}{" "}
                  <a
                    href={t.named.source}
                    target="_blank"
                    rel="noopener"
                    className="underline decoration-1 underline-offset-[3px] hover:text-accent"
                  >
                    {t.named.sourceName}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}
