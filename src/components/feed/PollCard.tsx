"use client";

import { useEffect, useState } from "react";
import type { Poll } from "@/data/polls";

/**
 * The reader polls, as one card holding a single-column carousel.
 *
 * The bars show the real tally of answers given here — see src/data/polls.ts
 * for why that is non-negotiable. Three states, all honest:
 *   - unanswered: the options, nothing else;
 *   - answered:   the counts, with your own choice marked;
 *   - no store:   a plain line saying answers aren't being recorded.
 *
 * Answers are deliberately NOT remembered between page loads. An earlier
 * version parked the choice in localStorage so a reader saw their old answer
 * on return; that made the card a dead end on every later visit. It now guards
 * only within the page, so a double tap can't double count, and a reload gives
 * the questions back. That does mean the tally counts a determined repeat
 * voter more than once — a courtesy rail, not a ballot box, which is why the
 * card never claims the numbers are a survey of anything.
 */
export function PollCard({ polls }: { polls: Poll[] }) {
  const [i, setI] = useState(0);
  /** answers given in THIS page load, keyed by poll id */
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [tallies, setTallies] = useState<Record<string, Record<string, number>> | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/feed/poll")
      .then((r) => r.json())
      .then((d) => {
        if (!live) return;
        setConfigured(Boolean(d?.configured));
        setTallies(d?.tallies ?? {});
      })
      .catch(() => live && setConfigured(false));
    return () => {
      live = false;
    };
  }, []);

  const poll = polls[i];
  const total = polls.length;
  const choice = poll ? (choices[poll.id] ?? null) : null;
  const answered = choice !== null;
  const tally = poll ? (tallies?.[poll.id] ?? {}) : {};
  const votes = Object.values(tally).reduce((a, b) => a + b, 0);

  async function vote(optionId: string) {
    if (!poll || answered || busy) return;
    setBusy(true);
    setChoices((c) => ({ ...c, [poll.id]: optionId })); // optimistic: bars appear at once
    try {
      const res = await fetch("/api/feed/poll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: poll.id, option: optionId }),
      });
      const d = await res.json();
      if (d?.ok) setTallies((t) => ({ ...(t ?? {}), [poll.id]: d.tally ?? {} }));
      else setConfigured(false);
    } catch {
      setConfigured(false);
    } finally {
      setBusy(false);
    }
  }

  const go = (n: number) => setI((n + total) % total);

  if (!poll) return null;

  return (
    <div className="flex h-full flex-col p-5">
      {/* head: label, dots, counter */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent-deep">
          Reader poll
        </span>
        <span className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5" aria-hidden>
            {polls.map((pl, n) => (
              <span
                key={pl.id}
                className="block h-[5px] w-[5px] rounded-full transition-colors"
                style={{
                  background:
                    n === i
                      ? "var(--accent)"
                      : choices[pl.id]
                        ? "color-mix(in oklab, var(--accent) 45%, transparent)"
                        : "color-mix(in oklab, var(--text) 22%, transparent)",
                }}
              />
            ))}
          </span>
          <span className="font-mono text-[10px] tabular-nums tracking-[0.12em] text-faint">
            {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </span>
      </div>

      {/* the question. min-height holds the card steady as questions change
          length, so the feed grid doesn't jump on every advance. */}
      <div className="mt-3 flex min-h-[196px] flex-1 flex-col">
        <h3 className="text-[16px] font-extrabold leading-[1.3] tracking-[-0.015em] text-ink text-balance">
          {poll.question}
        </h3>
        {poll.note && (
          <p className="mt-2 text-[11.5px] leading-[1.55] text-graphite">{poll.note}</p>
        )}

        <ul className="mt-4 flex flex-col gap-2">
          {poll.options.map((o) => {
            const n = tally[o.id] ?? 0;
            const pct = answered && votes > 0 ? Math.round((n / votes) * 100) : 0;
            const mine = choice === o.id;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => vote(o.id)}
                  disabled={answered}
                  className="relative block w-full overflow-hidden rounded-[3px] border px-3 py-2.5 text-left transition-colors disabled:cursor-default"
                  style={{
                    borderColor: mine ? "var(--accent)" : "var(--hairline)",
                    color: "var(--text)",
                  }}
                >
                  {answered && (
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 transition-[width] duration-700"
                      style={{
                        width: `${pct}%`,
                        background: mine
                          ? "color-mix(in oklab, var(--accent) 26%, transparent)"
                          : "color-mix(in oklab, var(--text) 9%, transparent)",
                      }}
                    />
                  )}
                  <span className="relative flex items-baseline justify-between gap-3">
                    <span className="text-[13px] leading-tight">
                      {o.label}
                      {mine && <span className="ml-2 font-mono text-[9.5px] text-accent">yours</span>}
                    </span>
                    {answered && configured && (
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-graphite">
                        {pct}%
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* foot: state on the left, the carousel's own controls on the right */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {!answered
            ? "Pick one to see how others answered"
            : configured === false
              ? "Answers aren't being recorded"
              : `${votes} ${votes === 1 ? "answer" : "answers"} so far`}
        </p>
        <span className="flex shrink-0 items-center gap-1.5">
          <Arrow dir="prev" onClick={() => go(i - 1)} />
          <Arrow dir="next" onClick={() => go(i + 1)} highlight={answered} />
        </span>
      </div>
    </div>
  );
}

function Arrow({
  dir,
  onClick,
  highlight = false,
}: {
  dir: "prev" | "next";
  onClick: () => void;
  highlight?: boolean;
}) {
  const prev = dir === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={prev ? "Previous question" : "Next question"}
      className="grid h-7 w-7 place-items-center rounded-full border transition-colors"
      style={{
        borderColor: highlight ? "var(--accent)" : "var(--hairline)",
        color: highlight ? "var(--accent)" : "var(--muted)",
      }}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={prev ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"} />
      </svg>
    </button>
  );
}
