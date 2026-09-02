"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Container } from "@/components/Container";
import { DOMAIN_ORDER, type GlossaryDomain, type GlossaryEntry } from "@/data/glossary";

/**
 * The glossary, browsable three ways: by letter, by domain, and by search.
 *
 * Everything filters in the client because the whole set is a few tens of KB
 * of text and already in the page — a round trip per keystroke would be slower
 * and worse. Search matches the term, its abbreviations and the definition, so
 * looking up "CoT" or "store now decrypt later" lands on the right entry.
 */

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const letterOf = (t: string) => {
  const c = t[0]?.toUpperCase() ?? "";
  return c >= "A" && c <= "Z" ? c : "#";
};

export function GlossaryBrowser({ entries }: { entries: GlossaryEntry[] }) {
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState<GlossaryDomain | null>(null);
  /** the letter section currently under the sticky rail */
  const [active, setActive] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.term.localeCompare(b.term, "en")),
    [entries],
  );

  const needle = q.trim().toLowerCase();
  const filtered = sorted.filter((e) => {
    if (domain && e.domain !== domain) return false;
    if (!needle) return true;
    return (
      e.term.toLowerCase().includes(needle) ||
      e.definition.toLowerCase().includes(needle) ||
      (e.aka ?? []).some((a) => a.toLowerCase().includes(needle))
    );
  });

  // group into letter sections, preserving the sort
  const groups = useMemo(() => {
    const m = new Map<string, GlossaryEntry[]>();
    for (const e of filtered) {
      const l = letterOf(e.term);
      (m.get(l) ?? m.set(l, []).get(l)!).push(e);
    }
    return m;
  }, [filtered]);

  const present = new Set(groups.keys());
  const counts = useMemo(() => {
    const m = new Map<GlossaryDomain, number>();
    for (const e of entries) m.set(e.domain, (m.get(e.domain) ?? 0) + 1);
    return m;
  }, [entries]);

  /*
   * Mark the current letter: the last section whose top has passed the reading
   * line, which sits below the bar and the rail so a heading counts as current
   * when it is actually visible rather than when it touches the viewport edge
   * and is still behind the chrome. One rAF-throttled scroll pass, no observer
   * — the sections move together, so this is a single cheap read per frame.
   */
  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const sections = [...root.querySelectorAll<HTMLElement>("section[data-letter]")];
    if (sections.length === 0) {
      setActive(null);
      return;
    }

    const LINE = 140;
    let queued = false;
    const measure = () => {
      queued = false;
      let current = sections[0]?.dataset.letter ?? null;
      for (const s of sections) {
        if (s.getBoundingClientRect().top <= LINE) current = s.dataset.letter ?? current;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [filtered.length]);

  return (
    <div className="min-h-[70vh] bg-surface py-[clamp(48px,8vw,110px)]">
      <Container>
        <div className="mb-3.5 flex flex-wrap items-baseline gap-4">
          <span className="h-px min-w-10 flex-1 bg-ink/[0.18]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
            {filtered.length} of {entries.length} terms
          </span>
        </div>

        <h1 className="max-w-[20ch] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
          Glossary
        </h1>
        <p
          className="mt-[clamp(16px,2vw,24px)] max-w-[64ch]"
          style={{
            fontSize: "var(--text-body-size)",
            lineHeight: "var(--lh-body)",
            color: "var(--text-body)",
          }}
        >
          The vocabulary the rest of the Atlas assumes: {entries.length} terms across AI,
          quantum computing, the compute underneath them, and the policy and social
          questions they raise. Written to be read cold. Where a word is contested or
          used loosely, the entry says so rather than picking the flattering reading.
        </p>

        {/* search */}
        <div className="mt-[clamp(28px,4vw,44px)] max-w-[520px]">
          <label htmlFor="glossary-search" className="sr-only">
            Search the glossary
          </label>
          <input
            id="glossary-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search terms, abbreviations, definitions…"
            className="w-full rounded-[3px] border border-ink/25 bg-transparent px-4 py-3 font-mono text-[16px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
          />
        </div>

        {/* domain filters */}
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Chip label="All" count={entries.length} active={domain === null} onClick={() => setDomain(null)} />
          {DOMAIN_ORDER.map((d) => (
            <Chip
              key={d}
              label={d}
              count={counts.get(d) ?? 0}
              active={domain === d}
              onClick={() => setDomain(domain === d ? null : d)}
            />
          ))}
        </div>

        {/* A–Z rail */}
        {/*
          The alphabet is the sticky nav. It sits directly under the global bar,
          spans the gutter with its own ground so entries don't scroll visibly
          behind it, and stays one row — 27 targets wrap to three lines on a
          phone, which would eat a third of the screen, so it scrolls sideways
          instead. The current letter is marked as you scroll, which is why the
          per-letter headings below no longer need to stick as well.
        */}
        <nav
          aria-label="Jump to letter"
          className="sticky z-20 -mx-4 mt-5 flex gap-x-1 overflow-x-auto border-y border-ink/[0.14] bg-surface/95 px-4 py-2 backdrop-blur-md [scrollbar-width:none] min-[680px]:-mx-7 min-[680px]:px-7 [&::-webkit-scrollbar]:hidden"
          // --fa-nav-now, not --fa-nav-h: the bar hides on scroll-down, and a
          // constant offset left this floating above a 64px band of nothing
          // with entries sliding through it.
          style={{ top: "var(--fa-nav-now, var(--fa-nav-h))" }}
        >
          {LETTERS.map((l) =>
            present.has(l) ? (
              <a
                key={l}
                href={`#letter-${l}`}
                aria-current={active === l ? "true" : undefined}
                className="relative grid h-7 w-7 shrink-0 place-items-center rounded-[2px] font-mono text-[11px] transition-colors"
                style={
                  active === l
                    ? { background: "var(--accent)", color: "var(--paper, #fff)", fontWeight: 700 }
                    : { color: "color-mix(in srgb, var(--text) 70%, transparent)" }
                }
              >
                {l}
                {/* a tab-style marker on the rail's own bottom edge, so the
                    current letter reads as a position rather than a hover */}
                {active === l && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-2 h-[2px]"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </a>
            ) : (
              <span
                key={l}
                aria-hidden
                className="grid h-7 w-7 shrink-0 place-items-center font-mono text-[11px] text-ink/15"
              >
                {l}
              </span>
            ),
          )}
        </nav>

        {filtered.length === 0 ? (
          <p className="mt-[clamp(40px,6vw,80px)] font-mono text-[13px] text-graphite">
            Nothing matches “{q}”{domain ? ` in ${domain}` : ""}.
          </p>
        ) : (
          <div ref={listRef} className="mt-[clamp(32px,5vw,60px)]">
            {[...groups.entries()].map(([letter, items]) => (
              <section
                key={letter}
                id={`letter-${letter}`}
                data-letter={letter}
                // clears the global bar AND the sticky alphabet under it
                style={{ scrollMarginTop: "calc(var(--fa-nav-h) + 68px)" }}
              >
                {/* double the old 11px: these are what the eye is scanning
                    for on the way down, and the rule carries it across */}
                <h2 className="flex items-center gap-4 border-t border-ink/[0.14] py-4 font-mono text-[22px] font-bold uppercase leading-none tracking-[0.18em] text-accent-deep">
                  {letter}
                  <span aria-hidden className="h-px flex-1 bg-ink/[0.12]" />
                </h2>
                {/*
                  Four columns of cards rather than a two-column definition
                  list. Grid, not CSS columns: a letter's entries read across
                  in alphabetical order, and columns would run them down one
                  column and back up the next. align-start so a long definition
                  doesn't stretch the three cards beside it.
                */}
                <dl className="grid grid-cols-1 items-start gap-x-[clamp(16px,1.8vw,28px)] gap-y-[clamp(16px,1.8vw,28px)] min-[560px]:grid-cols-2 min-[980px]:grid-cols-3 min-[1280px]:grid-cols-4">
                  {items.map((e) => (
                    <Entry key={e.term} entry={e} />
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

function Entry({ entry }: { entry: GlossaryEntry }) {
  const id = slugOf(entry.term);
  return (
    <div
      id={id}
      // --fa-nav-h here, not --fa-nav-now: a jump target should clear the bar
      // even if the bar happens to be hidden at the moment of the jump, since
      // scrolling up to read brings it straight back over the heading.
      style={{ scrollMarginTop: "calc(var(--fa-nav-h) + 68px)" }}
      className="flex h-full flex-col rounded-[3px] border border-ink/[0.14] p-[clamp(14px,1.5vw,20px)] transition-colors hover:border-ink/35"
    >
      <dt className="min-w-0">
        <a
          href={`#${id}`}
          className="group inline-flex items-baseline gap-2 text-[clamp(15px,1.5vw,18px)] font-extrabold leading-tight tracking-[-0.015em] text-ink"
        >
          {entry.term}
          <span
            aria-hidden
            className="font-mono text-[11px] font-normal text-faint opacity-0 transition-opacity group-hover:opacity-100"
          >
            #
          </span>
        </a>
        {entry.aka && entry.aka.length > 0 && (
          <span className="mt-1 block text-[11px] leading-[1.5] text-faint">
            {entry.aka.join(" · ")}
          </span>
        )}
        <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-accent-deep">
          {entry.domain}
        </span>
      </dt>
      <dd className="m-0 mt-2.5 min-w-0 border-t border-ink/[0.1] pt-2.5">
        <p
          style={{
            fontSize: "var(--text-body-size)",
            lineHeight: "var(--lh-body)",
            color: "var(--text-body)",
          }}
        >
          {entry.definition}
        </p>
        {entry.see && entry.see.length > 0 && (
          <p className="mt-2.5 text-[11px] leading-[1.7] text-faint">
            See also{" "}
            {entry.see.map((s, i) => (
              <span key={s}>
                {i > 0 && " · "}
                <a
                  href={`#${slugOf(s)}`}
                  className="text-graphite underline decoration-ink/25 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                >
                  {s}
                </a>
              </span>
            ))}
          </p>
        )}
      </dd>
    </div>
  );
}

/** Stable anchor for a term, so /glossary#rlhf can be linked from anywhere. */
export function slugOf(term: string): string {
  return term
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
        active ? "border-band bg-band text-paper" : "border-ink/25 text-ink/70 hover:border-ink/60"
      }`}
    >
      {label}
      <span className={active ? "text-paper/60" : "text-ink/40"}>{count}</span>
    </button>
  );
}
