"use client";

import { useMemo, useState } from "react";
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
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-body-size)",
            lineHeight: "var(--lh-body)",
            color: "var(--text-body)",
          }}
        >
          The vocabulary the rest of the Atlas assumes — {entries.length} terms across AI,
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
            className="w-full rounded-[3px] border border-ink/25 bg-transparent px-4 py-3 font-mono text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent"
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
        <nav aria-label="Jump to letter" className="mt-5 flex flex-wrap gap-x-1 gap-y-1.5">
          {LETTERS.map((l) =>
            present.has(l) ? (
              <a
                key={l}
                href={`#letter-${l}`}
                className="grid h-7 w-7 place-items-center rounded-[2px] font-mono text-[11px] text-ink/70 transition-colors hover:bg-band hover:text-paper"
              >
                {l}
              </a>
            ) : (
              <span
                key={l}
                aria-hidden
                className="grid h-7 w-7 place-items-center font-mono text-[11px] text-ink/15"
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
          <div className="mt-[clamp(32px,5vw,60px)]">
            {[...groups.entries()].map(([letter, items]) => (
              <section key={letter} id={`letter-${letter}`} className="scroll-mt-24">
                <h2 className="sticky top-[var(--fa-nav-h)] z-10 -mx-1 bg-surface/95 px-1 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent-deep backdrop-blur-sm">
                  {letter}
                </h2>
                <dl className="border-t border-ink/[0.14]">
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
      className="grid scroll-mt-28 gap-x-[clamp(16px,2.4vw,40px)] gap-y-1.5 border-b border-ink/[0.14] py-[clamp(16px,2vw,24px)] min-[860px]:grid-cols-[minmax(200px,260px)_1fr]"
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
          <span className="mt-1 block font-mono text-[11px] leading-[1.5] text-faint">
            {entry.aka.join(" · ")}
          </span>
        )}
        <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-accent-deep">
          {entry.domain}
        </span>
      </dt>
      <dd className="m-0 min-w-0">
        <p
          className="max-w-[70ch]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-body-size)",
            lineHeight: "var(--lh-body)",
            color: "var(--text-body)",
          }}
        >
          {entry.definition}
        </p>
        {entry.see && entry.see.length > 0 && (
          <p className="mt-2.5 font-mono text-[11px] leading-[1.7] text-faint">
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
