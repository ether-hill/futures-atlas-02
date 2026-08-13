"use client";

import { useEffect, useRef, useState } from "react";
import type { Compare } from "@/components/FigureCard";
import { type Intervention, matchFrom, yearIn } from "@/lib/interventions";


/** ms per character. Fast enough not to be a wait, slow enough to read as typing. */
const TYPE_SPEED = 22;

const YEAR = /\b(19|20)\d{2}\b/;

/**
 * The sentence and the slider must never disagree about the date — and a clause
 * anchored to a particular year stops being true when the year moves, so it goes.
 */
function promptAt(iv: Intervention, year: number) {
  if (!YEAR.test(iv.prompt)) return iv.prompt;
  const line = iv.prompt.replace(YEAR, String(year));
  if (!iv.anchor) return line;
  return year === iv.from ? line + iv.anchor : line + "?";
}

export default function InterventionBar({
  interventions,
  placeholder,
  horizon,
  active,
  from,
  onSet,
  onFrom,
  onClear,
  compare,
  onCompare,
  changed,
  total,
}: {
  interventions: Intervention[];
  placeholder: string;
  horizon: number;
  active: Intervention | null;
  from: number;
  onSet: (iv: Intervention, from?: number) => void;
  onFrom: (y: number) => void;
  onClear: () => void;
  compare: Compare;
  onCompare: (c: Compare) => void;
  changed: number;
  total: number;
}) {
  const [text, setText] = useState(active?.prompt ?? "");
  const [typing, setTyping] = useState<string | null>(null);
  const [miss, setMiss] = useState<string | null>(null);
  const [seenId, setSeenId] = useState(active?.id ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Adjust during render rather than in an effect: `active` is a fresh object on
     every year-slider tick, so keying on the id is what actually changes. */
  if ((active?.id ?? null) !== seenId) {
    setSeenId(active?.id ?? null);
    setMiss(null);
    if (active) {
      const instant =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const line = promptAt(active, from);
      setText(instant ? line : "");
      setTyping(instant ? null : line);
    } else {
      setText("");
      setTyping(null);
    }
  }

  /* Picking a suggestion should look like someone typed it, because typing is
     what the box is asking for. */
  useEffect(() => {
    if (typing === null) return;
    /* A real caret at the end of the run sells it — but only on pointer devices,
       since focusing an input on a phone throws up the keyboard. */
    if (window.matchMedia?.("(pointer: fine)").matches) inputRef.current?.focus();
    /* Driven by elapsed time rather than a tick count, so a throttled timer
       (a background tab clamps to 1s) catches up instead of crawling. */
    const start = performance.now();
    const id = window.setInterval(() => {
      const n = Math.min(typing.length, Math.floor((performance.now() - start) / TYPE_SPEED));
      setText(typing.slice(0, n));
      if (n >= typing.length) {
        window.clearInterval(id);
        setTyping(null);
      }
    }, TYPE_SPEED);
    return () => window.clearInterval(id);
  }, [typing]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const hit = matchFrom(interventions, text);
    if (!hit) {
      setMiss(text.trim());
      return;
    }
    /* A year in the sentence is the date of the proposal. "Regulate AI in 2018"
       should land in 2018, not wherever the preset was authored. */
    const y = yearIn(text);
    const inRange = y !== null && y >= hit.fromRange[0] && y <= hit.fromRange[1];
    onSet(hit, inRange ? y : undefined);
    setMiss(null);
  }

  /* …and the connection runs the other way too: drag the slider and the year in
     the sentence follows, so the text never contradicts the chart. */
  function retime(y: number) {
    onFrom(y);
    if (!active || !YEAR.test(active.prompt)) return;
    /* Dragging mid-type finishes the sentence rather than racing it. */
    if (typing !== null) setTyping(null);
    setText(promptAt(active, y));
  }

  return (
    <div className="ivbar">
      <div className="shell ivbar-inner">
        <form className="ivform" onSubmit={submit}>
          <input
            id="iv"
            ref={inputRef}
            className={typing ? "ivinput istyping" : "ivinput"}
            value={text}
            placeholder={placeholder}
            onChange={(e) => {
              setTyping(null);
              setText(e.target.value);
              setMiss(null);
            }}
            autoComplete="off"
          />
          <button type="submit" className="ivgo">
            Redraw
          </button>
          {active && (
            <button type="button" className="ivclear" onClick={onClear}>
              Reset
            </button>
          )}
        </form>

        <div className="ivrow">
          <div className="ivsuggest">
            {interventions.map((iv) => (
              <button
                key={iv.id}
                type="button"
                className={active?.id === iv.id ? "ivchip on" : "ivchip"}
                onClick={() => onSet(iv)}
                title={iv.summary}
              >
                {iv.short}
                <span className="chipyear">{iv.from}</span>
              </button>
            ))}
          </div>

          {active && (
            <div className="ivopts">
              <div className="ivyear">
                <label htmlFor="ivfrom">
                  Happens in <span className="yr">{from}</span>
                </label>
                <input
                  id="ivfrom"
                  type="range"
                  min={active.fromRange[0]}
                  max={active.fromRange[1]}
                  step={1}
                  value={from}
                  onChange={(e) => retime(Number(e.target.value))}
                />
              </div>
              <div className="segmented" role="group" aria-label="Comparison view">
                {(["overlay", "split"] as Compare[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={compare === c ? "on" : ""}
                    onClick={() => onCompare(c)}
                  >
                    {c === "overlay" ? "Overlay" : "Side by side"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {miss !== null && (
          <p className="ivmiss">
            No preset matches <em>&ldquo;{miss}&rdquo;</em>. Free-text interventions need a model
            behind them — until then, the {interventions.length} above are the ones with authored
            transforms.
          </p>
        )}

        <p className="ivsummary">
          {active ? (
            <>
              {active.summary}{" "}
              <span className="ivscope">
                {from <= 2025 ? `Rewrites history from ${from}.` : `Changes ${from} onward.`}{" "}
                {changed} of {total} figures move.
              </span>
            </>
          ) : (
            <span className="ivhint">
              These are the published figures, ending where the data ends. Name something and the
              charts run on to {horizon} to show where it lands — put a year in the sentence, or
              drag it afterwards, and an intervention dated before 2026 rewrites what happened
              instead.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
