"use client";

import { useEffect, useState } from "react";
import type { Poll } from "@/data/polls";

/**
 * A mini survey in the feed.
 *
 * The bars show the real tally of answers given here — see src/data/polls.ts
 * for why that is non-negotiable. Three states, all honest:
 *   - unanswered: the options, nothing else;
 *   - answered:   the counts, with your own choice marked;
 *   - no store:   a plain line saying answers aren't being recorded.
 *
 * The "already voted" memory is localStorage, which is a courtesy to the reader
 * rather than a control — it stops a double tap, not a determined ballot
 * stuffer, and it is not pretending otherwise.
 */

const seenKey = (id: string) => `fa-poll-${id}`;

export function PollCard({ poll }: { poll: Poll }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [tally, setTally] = useState<Record<string, number> | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setChoice(localStorage.getItem(seenKey(poll.id)));
    } catch {
      /* private mode — the poll still works, it just won't remember */
    }
    let live = true;
    fetch("/api/feed/poll")
      .then((r) => r.json())
      .then((d) => {
        if (!live) return;
        setConfigured(Boolean(d?.configured));
        setTally(d?.tallies?.[poll.id] ?? {});
      })
      .catch(() => live && setConfigured(false));
    return () => {
      live = false;
    };
  }, [poll.id]);

  async function vote(optionId: string) {
    if (choice || busy) return;
    setBusy(true);
    setChoice(optionId); // optimistic: the bars appear immediately
    try {
      localStorage.setItem(seenKey(poll.id), optionId);
    } catch {
      /* nothing to do */
    }
    try {
      const res = await fetch("/api/feed/poll", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: poll.id, option: optionId }),
      });
      const d = await res.json();
      if (d?.ok) setTally(d.tally ?? {});
      else setConfigured(false);
    } catch {
      setConfigured(false);
    } finally {
      setBusy(false);
    }
  }

  const total = tally ? Object.values(tally).reduce((a, b) => a + b, 0) : 0;
  const answered = choice !== null;

  return (
    <div className="flex h-full flex-col p-5">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent-deep">
        Reader poll
      </span>
      <h3 className="mt-3 text-[16px] font-extrabold leading-[1.3] tracking-[-0.015em] text-ink text-balance">
        {poll.question}
      </h3>
      {poll.note && (
        <p className="mt-2 font-mono text-[11.5px] leading-[1.55] text-graphite">{poll.note}</p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {poll.options.map((o) => {
          const n = tally?.[o.id] ?? 0;
          const pct = answered && total > 0 ? Math.round((n / total) * 100) : 0;
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

      <p className="mt-auto pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {!answered
          ? "Pick one to see how others answered"
          : configured === false
            ? "Answers aren't being recorded on this deployment"
            : `${total} ${total === 1 ? "answer" : "answers"} so far`}
      </p>
    </div>
  );
}
