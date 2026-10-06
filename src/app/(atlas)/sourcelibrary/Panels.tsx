"use client";

import { useEffect, useState } from "react";
import { SHELF_RELATED, shelfBookUrl, type ShelfBook } from "@/data/library-shelf";
import { SHELF_COVER_ASPECT, SHELF_PLATES, type ShelfPlate } from "@/data/library-plates";
import { BOOK, CAT, CAT_COLOR, shortAuthor, shortTitle } from "./shared";

/**
 * One book, opened. The same sheet whether the book was picked from the
 * pinned stage or from a card in the reading list, so there is one place a
 * reader learns to look. It slides in over the right edge and leaves the rest
 * of the page live: picking another book swaps what it shows.
 */

const label = "text-[12px] font-semibold text-graphite";

export function BookSheet({
  book,
  onJump,
  onClose,
}: {
  book: ShelfBook;
  onJump: (id: string) => void;
  onClose: () => void;
}) {
  const plates = SHELF_PLATES[book.id] ?? [];
  const related = SHELF_RELATED[book.id] ?? [];
  const [open, setOpen] = useState<ShelfPlate | null>(null);
  const coverAspect = SHELF_COVER_ASPECT[book.id] ?? 0.7;
  const stripH = 190;

  useEffect(() => setOpen(null), [book.id]);

  return (
    <aside
      role="dialog"
      aria-label={book.title}
      className="anc-sheet fixed bottom-0 right-0 z-[70] w-full overflow-y-auto border-l border-ink/[0.18] bg-panel shadow-[-18px_0_40px_-28px_rgba(0,0,0,0.5)] [scrollbar-width:thin] min-[560px]:w-[440px]"
      style={{ top: "var(--fa-nav-now, var(--fa-nav-h))" }}
    >
      <div key={book.id} className="anc-panel-in px-5 pb-8 pt-4 min-[560px]:px-6">
        <div className="flex items-center gap-3">
          <i className="block h-[11px] w-[11px] shrink-0" style={{ background: CAT_COLOR[book.cat] }} />
          <span className={label}>{CAT[book.cat].name}</span>
          {book.year && <span className="font-condensed text-[16px] tracking-[0.06em] text-ink">{book.year}</span>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-[2px] border border-ink/25 px-3 py-1.5 text-[13px] font-semibold text-ink hover:border-ink"
          >
            Close
          </button>
        </div>

        <h3 className="mt-3.5 text-[clamp(21px,1.8vw,26px)] font-extrabold leading-[1.12] tracking-[-0.018em] text-ink">
          {book.title}
        </h3>
        <p className="mt-1.5 text-[13.5px] leading-[1.5] text-graphite">
          {book.author}
          {book.language && ` · ${book.language}`}
          {book.pages && ` · ${book.pages} pages`}
        </p>
        {book.originalTitle && (
          <p className="mt-0.5 text-[13px] leading-[1.45] text-faint">
            {book.originalTitle.length > 130 ? `${book.originalTitle.slice(0, 128).trim()}…` : book.originalTitle}
          </p>
        )}

        {/* the cover, then the library's own extractions from the scan, each at its own shape */}
        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:thin] min-[560px]:-mx-6 min-[560px]:px-6">
          <a
            href={shelfBookUrl(book)}
            target="_blank"
            rel="noopener"
            className="block shrink-0 border border-ink/[0.14] bg-haze"
            style={{ height: stripH, width: stripH * coverAspect }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- the library's image host, not ours to optimise */}
            <img src={book.thumbnail} alt={`Cover scan of ${book.title}`} className="block h-full w-full object-cover" />
          </a>
          {plates.map((p) => (
            <button
              key={p.src}
              type="button"
              onClick={() => setOpen(p)}
              title={p.caption}
              className="block shrink-0 border border-ink/[0.14] bg-paper transition-colors hover:border-accent"
              style={{ height: stripH, width: stripH * p.aspect }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumb} alt={p.caption} loading="lazy" className="block h-full w-full object-contain" />
            </button>
          ))}
        </div>
        {plates.length > 0 && (
          <p className="mt-1 text-[12px] text-faint">
            {plates.length} {plates.length === 1 ? "figure" : "figures"} from the scan. Select one to enlarge it.
          </p>
        )}

        <div className="mt-5">
          <span className={label}>Why it is on the shelf</span>
          <p className="mt-1.5 text-[15.5px] leading-[1.65] text-ink-70">{book.note}</p>
        </div>

        <a
          href={shelfBookUrl(book)}
          target="_blank"
          rel="noopener"
          className="mt-5 inline-block rounded-[2px] border border-ink bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-surface transition-colors hover:border-accent hover:bg-accent"
        >
          Read the scan in Source Library
        </a>

        {related.length > 0 && (
          <div className="mt-6 border-t border-ink/[0.14] pt-4">
            <span className={label}>Read it with</span>
            <ul className="mt-2 grid list-none gap-2.5 p-0">
              {related.map((r) => {
                const other = BOOK.get(r.id);
                if (!other) return null;
                return (
                  <li key={r.id} className="text-[13.5px] leading-[1.45] text-graphite">
                    <button
                      type="button"
                      onClick={() => onJump(r.id)}
                      className="mr-1.5 inline-flex items-baseline gap-1.5 text-left font-semibold text-accent underline decoration-accent/35 decoration-1 underline-offset-[3px] hover:decoration-accent"
                    >
                      <i className="inline-block h-[8px] w-[8px] shrink-0" style={{ background: CAT_COLOR[other.cat] }} />
                      {shortTitle(other.title, 38)}
                    </button>
                    {r.why}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {book.description && (
          <p className="mt-6 border-t border-ink/[0.14] pt-4 text-[13.5px] leading-[1.6] text-graphite">
            <span className={`${label} mr-2`}>From the library</span>
            {book.description}
          </p>
        )}
      </div>

      {open && <Lightbox plate={open} book={book} onClose={() => setOpen(null)} />}
    </aside>
  );
}

function Lightbox({ plate, book, onClose }: { plate: ShelfPlate; book: ShelfBook; onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal
      aria-label={plate.caption}
      onClick={onClose}
      className="fixed inset-0 z-[90] flex cursor-zoom-out flex-col items-center justify-center gap-4 bg-surface/95 p-5 backdrop-blur-sm"
    >
      {/* The figure sits on paper in both themes: it was drawn for a white page. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={plate.src}
        alt={plate.caption}
        className="max-h-[74vh] max-w-full border border-ink/[0.14] bg-paper object-contain"
        style={{ aspectRatio: plate.aspect }}
      />
      <p className="max-w-[72ch] text-center text-[14px] leading-[1.55] text-ink-70">
        {plate.caption}
        <span className="mt-1 block text-[12.5px] text-graphite">
          {shortTitle(book.title)}, {shortAuthor(book.author)}
          {book.year ? `, ${book.year}` : ""}. Page {plate.page} of the scan. Description by Source Library.
        </span>
      </p>
      <button type="button" className="rounded-[2px] border border-ink/25 px-4 py-2 text-[13px] font-semibold text-ink hover:border-ink">
        Close
      </button>
    </div>
  );
}
