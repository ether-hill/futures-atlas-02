"use client";

import "./reading-guide.css";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Container } from "@/components/Container";
import { SHELF_BOOKS, SHELF_CATEGORIES, type ShelfCategoryKey } from "@/data/library-shelf";
import { THREAD_STORIES } from "@/data/ancestors-story";
import { GEOMETRY, H, LAYOUTS, LINKS, THREADS, W, type LayoutKey } from "./layouts";
import { BookSheet } from "./Panels";
import { Method, ReadingList, ShelfStrip, threadAnchor } from "./Sections";
import { World } from "./World";
import { BOOK, CAT_COLOR, FIRST_YEAR, LAST_YEAR } from "./shared";

/**
 * The Source Library reading guide, in two parts.
 *
 * First the shelf seen whole, five ways. The stage pins under the nav and the
 * page scrolls behind it; each stretch of scroll is one view, and the same
 * fifty tiles travel from one arrangement to the next. The row of view names is
 * both the progress mark and a way to jump.
 *
 * Then the reading list: every book as a cover with one sentence on why it is
 * here. A book opens in the same sheet from either part.
 */

interface Cam {
  x: number;
  y: number;
  s: number;
}

const NO_IDS = new Set<string>();
const NO_LINKS = new Set<number>();
const OPENING_STEP_MS = 1100;
/** how much scroll one view gets, in viewport heights */
const SCROLL_PER_VIEW = 0.85;

const latin = SHELF_BOOKS.filter((b) => b.language === "Latin").length;
const busiest = [...GEOMETRY.when.extras.bins].sort((a, b) => b.count - a.count)[0]!;
const crossThread = LINKS.filter((l) => !l.same).length;

/** What each view shows, said once, in the order the scroll meets them. */
const VIEWS: Record<LayoutKey, { title: string; text: string }> = {
  circuit: {
    title: "Five subjects, five lines",
    text: "Each line is one subject. A book sits at the year it was printed, and a curve joins two books worth reading together. The diamond marks the year the subject got the name we use now.",
  },
  constellation: {
    title: "What reads with what",
    text: `The same books, pulled together by their ${LINKS.length} cross references. Dotted lines are the ${crossThread} that cross from one subject into another.`,
  },
  when: {
    title: "When they were printed",
    text: `Stacked by half century, subjects in bands. ${busiest.count} of the ${SHELF_BOOKS.length} come from ${busiest.from} to ${busiest.from + 50}.`,
  },
  languages: {
    title: "What they were written in",
    text: `One row per language, oldest first. ${latin} of the ${SHELF_BOOKS.length} are in Latin.`,
  },
  pages: {
    title: "How long they are",
    text: `Each book stands beside a block as thick as its page count. Together they run to ${GEOMETRY.pages.extras.total.toLocaleString("en-GB")} pages.`,
  },
};

export function ReadingGuide() {
  const [step, setStep] = useState(0);
  const [sorted, setSorted] = useState(0);
  const [herald, setHerald] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; winH: number; bar: number } | null>(null);
  const [pan, setPan] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const layout = LAYOUTS[step]!.key;

  const scrolly = useRef<HTMLDivElement>(null);
  const pinned = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const press = useRef<{ x: number; y: number; cam: Cam; id: number } | null>(null);

  /* ------------------------------------------------------------ the opening */

  // The stage sits below the masthead now, so the opening waits until it is
  // actually on screen; sorting fifty books where nobody is looking is no opening.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSorted(THREADS.length);
      return;
    }
    const el = viewport.current;
    if (!el) return;
    let timers: number[] = [];
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        timers = THREADS.map((_, i) =>
          window.setTimeout(() => setSorted((n) => Math.max(n, i + 1)), 350 + i * OPENING_STEP_MS),
        );
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(window.clearTimeout);
    };
  }, []);

  const opening = sorted < THREADS.length;
  const finishOpening = useCallback(() => setSorted(THREADS.length), []);

  // the masthead names one subject at a time, slowly
  useEffect(() => {
    const t = window.setInterval(() => setHerald((h) => (h + 1) % THREADS.length), 4800);
    return () => window.clearInterval(t);
  }, []);

  /* ------------------------------------------- scroll position picks the view */

  const shownStep = useRef(0);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const outer = scrolly.current;
      const pin = pinned.current;
      if (!outer || !pin) return;
      const travel = outer.offsetHeight - pin.offsetHeight;
      if (travel <= 0) return;
      // how far the pinned block has slid down inside its tall container
      const done = (pin.getBoundingClientRect().top - outer.getBoundingClientRect().top) / travel;
      const next = Math.min(LAYOUTS.length - 1, Math.max(0, Math.floor(done * LAYOUTS.length)));
      if (next === shownStep.current) return;
      shownStep.current = next;
      setStep(next);
      if (next > 0) setSorted(THREADS.length); // scrolling on ends the opening
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    read();
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goToView = (i: number) => {
    const outer = scrolly.current;
    const pin = pinned.current;
    if (!outer || !pin) return;
    finishOpening();
    const travel = outer.offsetHeight - pin.offsetHeight;
    const stickyTop = parseFloat(getComputedStyle(pin).top) || 0;
    const start = window.scrollY + outer.getBoundingClientRect().top - stickyTop;
    window.scrollTo({ top: start + ((i + 0.5) / LAYOUTS.length) * travel, behavior: "smooth" });
  };

  /* -------------------------------------------------------------- the camera */

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const measure = () =>
      setSize({ w: el.clientWidth, winH: window.innerHeight, bar: bar.current?.offsetHeight ?? 120 });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (bar.current) ro.observe(bar.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const dims = useMemo(() => {
    if (!size) return null;
    const fitW = size.w / W;
    // the pinned block has to fit under the nav, caption bar included
    const ceiling = Math.max(340, size.winH - 66 - size.bar);
    // never shorter than a usable strip, even where the width alone would make it one
    const h = Math.min(ceiling, Math.max(Math.min(ceiling, 460), Math.round(H * fitW)));
    // Wide screens fit the whole world. A phone cannot, so it fits the height
    // (up to half scale) and is dragged sideways instead of shrinking to a stamp.
    const s0 = H * fitW <= h ? Math.max(fitW, Math.min(h / H, 0.5)) : h / H;
    return { w: size.w, h, s0 };
  }, [size]);

  const cam = useMemo<Cam>(() => {
    if (!dims) return { x: W / 2, y: H / 2, s: 0.6 };
    const s = dims.s0;
    const hw = dims.w / (2 * s);
    const want = pan?.x ?? (layout === "constellation" ? W / 2 : 0);
    return { s, x: W * s <= dims.w ? W / 2 : Math.min(W - hw, Math.max(hw, want)), y: H / 2 };
  }, [dims, pan, layout]);

  // a new arrangement starts from its own beginning, not where the last was dragged to
  useEffect(() => setPan(null), [layout]);

  /* ------------------------------------------------------------ what is lit */

  const neighbours = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const l of LINKS) {
      m.set(l.a, [...(m.get(l.a) ?? []), l.b]);
      m.set(l.b, [...(m.get(l.b) ?? []), l.a]);
    }
    return m;
  }, []);

  const linked = useMemo(
    () => (selected ? new Set(neighbours.get(selected) ?? []) : NO_IDS),
    [selected, neighbours],
  );
  const hot = useMemo(() => {
    if (!selected) return NO_LINKS;
    const s = new Set<number>();
    LINKS.forEach((l, i) => {
      if (l.a === selected || l.b === selected) s.add(i);
    });
    return s;
  }, [selected]);
  const dim = useMemo(() => {
    if (!selected || (layout !== "circuit" && layout !== "constellation")) return null;
    return new Set(SHELF_BOOKS.filter((b) => b.id !== selected && !linked.has(b.id)).map((b) => b.id));
  }, [selected, linked, layout]);

  /* ---------------------------------------------------------------- actions */

  const pick = useCallback(
    (id: string) => {
      finishOpening();
      setSelected(id);
    },
    [finishOpening],
  );
  const toThread = useCallback((key: ShelfCategoryKey) => {
    document.getElementById(threadAnchor(key))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!selected) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selected]);

  /* ------------------------------------- dragging sideways, where it is needed */

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragged.current = false;
    press.current = { x: e.clientX, y: e.clientY, cam, id: e.pointerId };
  };
  const onMove = (e: React.PointerEvent) => {
    const p = press.current;
    if (!p || !dims || W * p.cam.s <= dims.w) return;
    const dx = e.clientX - p.x;
    if (!dragged.current) {
      if (Math.abs(dx) < 6) return;
      dragged.current = true;
      setDragging(true);
      finishOpening();
      viewport.current?.setPointerCapture(p.id);
    }
    setPan({ x: p.cam.x - dx / p.cam.s, y: H / 2 });
  };
  const onUp = () => {
    press.current = null;
    setDragging(false);
  };

  /* ------------------------------------------------------------------ render */

  const book = selected ? BOOK.get(selected) : undefined;
  const heraldStory = THREAD_STORIES[herald]!;
  const view = VIEWS[layout];
  const pannable = !!dims && W * cam.s > dims.w + 1;

  const transform = dims
    ? `translate(${dims.w / 2 - cam.x * cam.s}px, ${dims.h / 2 - cam.y * cam.s}px) scale(${cam.s})`
    : undefined;

  return (
    <div className="bg-surface pb-[clamp(56px,8vw,110px)]">
      {/* ------------------------------------------------------------ masthead */}
      {/* One screen, and little on it: what this is, one line that keeps
          changing, and the books themselves standing on a shelf. */}
      <header
        className="flex flex-col"
        style={{ minHeight: "calc(100svh - var(--fa-nav-h))" }}
      >
        <Container className="flex flex-1 flex-col justify-center pb-[clamp(28px,4vw,56px)] pt-[clamp(40px,6vw,88px)]">
          <p className="text-[13.5px] font-semibold text-graphite">
            A reading guide · {SHELF_BOOKS.length} books from the Source Library · {FIRST_YEAR} to {LAST_YEAR}
          </p>
          <h1 className="mt-[clamp(14px,1.8vw,26px)] max-w-[13ch] text-[clamp(42px,7.4vw,116px)] font-extrabold leading-[0.93] tracking-[-0.032em] text-ink text-balance">
            The ancestors of the questions we work on
          </h1>
          <div className="mt-[clamp(28px,4vw,60px)] grid gap-x-[clamp(32px,6vw,96px)] gap-y-7 min-[980px]:grid-cols-2 min-[980px]:items-start">
            <p
              className="max-w-[54ch]"
              style={{ fontSize: "var(--text-lead)", lineHeight: "var(--lh-snug)", color: "var(--text-body)" }}
            >
              Fifty works from the Source Library, chosen because each one is an early version of something the
              rest of the Atlas is still doing: making inference mechanical, building bodies that move on their
              own, arguing about what light is, predicting on the record, and specifying whole societies that do
              not exist yet.
            </p>
            {/* the line that names one subject at a time */}
            <p className="min-h-[5.4em] max-w-[30ch] text-[clamp(19px,1.9vw,27px)] font-extrabold leading-[1.28] tracking-[-0.014em] text-ink min-[980px]:min-h-[4.2em]">
              Before{" "}
              <span
                key={heraldStory.key}
                className="anc-swap inline-block"
                style={{ boxShadow: `inset 0 -0.34em 0 color-mix(in oklab, ${CAT_COLOR[heraldStory.key]} 45%, transparent)` }}
              >
                {heraldStory.modern}
              </span>{" "}
              there was{" "}
              <span key={`${heraldStory.key}-t`} className="anc-swap inline font-semibold text-ink-70">
                {heraldStory.heralds
                  .map((h) => `${h.label} (${BOOK.get(h.id)?.year ?? ""})`)
                  .join(", ")
                  .replace(/, ([^,]*)$/, " and $1")}
                .
              </span>
            </p>
          </div>
        </Container>

        <ShelfStrip onPick={pick} />
        <Container className="pb-[clamp(18px,2.4vw,32px)] pt-3">
          <p className="text-[13px] font-semibold text-graphite">
            Scroll for five views of the whole shelf, then the reading list.
          </p>
        </Container>
      </header>

      {/* ------------------------------------- the shelf seen whole, five ways */}
      <div ref={scrolly} aria-label="The shelf in five views">
        <div
          ref={pinned}
          className="sticky z-10 border-y border-ink/[0.14] bg-surface"
          style={{ top: "var(--fa-nav-now, var(--fa-nav-h))" }}
        >
          <div ref={bar}>
            <Container className="pb-[clamp(16px,1.8vw,26px)] pt-[clamp(14px,1.5vw,22px)]">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div
                  role="tablist"
                  aria-label="View"
                  className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] min-[680px]:mx-0 min-[680px]:px-0 [&::-webkit-scrollbar]:hidden"
                >
                  {LAYOUTS.map((l, i) => (
                    <button
                      key={l.key}
                      type="button"
                      role="tab"
                      aria-selected={step === i}
                      onClick={() => goToView(i)}
                      className={`shrink-0 whitespace-nowrap rounded-[2px] border px-3.5 py-2 text-[13.5px] font-semibold transition-colors ${
                        step === i
                          ? "border-ink bg-ink text-surface"
                          : "border-ink/[0.18] text-graphite hover:border-ink hover:text-ink"
                      }`}
                    >
                      <span className={`mr-2 font-condensed tracking-[0.04em] ${step === i ? "opacity-60" : "opacity-50"}`}>
                        {i + 1}
                      </span>
                      {l.label}
                    </button>
                  ))}
                </div>

                {/* what the five colours mean, wherever you are */}
                <ul className="flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 min-[1180px]:ml-auto">
                  {SHELF_CATEGORIES.map((c) => (
                    <li key={c.key}>
                      <button
                        type="button"
                        onClick={() => toThread(c.key)}
                        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-graphite hover:text-ink"
                      >
                        <i className="block h-[9px] w-[9px]" style={{ background: CAT_COLOR[c.key] }} />
                        <span className="min-[680px]:hidden">{c.short}</span>
                        <span className="hidden min-[680px]:inline">{c.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div key={layout} className="anc-swap mt-[clamp(16px,1.9vw,28px)] grid gap-x-[clamp(24px,3vw,48px)] gap-y-1.5 min-[900px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[900px]:items-baseline">
                <h2 className="text-[clamp(20px,2vw,29px)] font-extrabold leading-[1.1] tracking-[-0.018em] text-ink">
                  {view.title}
                </h2>
                <p className="max-w-[92ch] text-[14.5px] leading-[1.55] text-ink-70">{view.text}</p>
                <p className="hidden whitespace-nowrap text-[12.5px] font-semibold text-graphite min-[900px]:block">
                  {step < LAYOUTS.length - 1 ? "Keep scrolling for the next view" : "The reading list is next"}
                </p>
              </div>
            </Container>
          </div>

          <div
            ref={viewport}
            className={`anc-viewport ${dragging ? "is-dragging" : ""} ${pannable ? "" : "is-still"}`}
            style={{ height: dims?.h ?? 520 }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div
              className="anc-world"
              style={
                {
                  width: W,
                  height: H,
                  transform,
                  opacity: dims ? 1 : 0,
                  "--inv": 1 / cam.s,
                  "--hs": Math.min(2.6, Math.max(1.15, 1.3 / cam.s)),
                } as CSSProperties
              }
            >
              <World
                layout={layout}
                sorted={sorted}
                selected={selected}
                linked={linked}
                dim={dim}
                hot={hot}
                onPick={pick}
                onThread={toThread}
                dragged={dragged}
              />
            </div>

            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
              {opening ? (
                <button
                  type="button"
                  onClick={finishOpening}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="pointer-events-auto rounded-[2px] border border-ink/25 bg-surface/90 px-3 py-1.5 text-[13px] font-semibold text-ink backdrop-blur-sm hover:border-ink"
                >
                  Skip the opening
                </button>
              ) : (
                <span className="rounded-[2px] bg-surface/85 px-2.5 py-1 text-[12.5px] font-semibold text-graphite backdrop-blur-sm">
                  {pannable ? "Drag sideways for more. Select a book to open it" : "Select any book to see why it is here"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* the scroll the pinned stage is read against: one stretch per view */}
        <div aria-hidden style={{ height: `${LAYOUTS.length * SCROLL_PER_VIEW * 100}svh` }} />
      </div>

      <ReadingList selected={selected} onPick={pick} />
      <Method />

      {book && <BookSheet book={book} onJump={pick} onClose={() => setSelected(null)} />}
    </div>
  );
}
