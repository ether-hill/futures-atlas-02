"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import PowerChart, { type Threshold } from "@/components/one/PowerChart";
import { type Figure, figures } from "@/lib/figures";
import { INTERVENTIONS, type Intervention, matchFrom, yearIn } from "@/lib/interventions";
import { PROJECTION_RULE, projectFigure } from "@/lib/project";
import { applyIntervention, untouchedReason } from "@/lib/transform";

const FIG_ID = "1.2.4";
const HORIZON = 2032;
const TYPE_SPEED = 20;
const YEAR = /\b(19|20)\d{2}\b/;

/* The three the AI Index itself prints on this figure. Keeping them is the
   difference between a number and a fact you can feel. */
const THRESHOLDS: Threshold[] = [
  { y: 7, label: "New Zealand ≈ 7 GW" },
  { y: 19, label: "the Netherlands ≈ 19 GW" },
  { y: 31, label: "New York State, peak ≈ 31 GW" },
];

const CONF: Record<string, string> = {
  "well-evidenced": "well evidenced",
  arguable: "arguable",
  speculative: "speculative",
};

const promptAt = (iv: Intervention, year: number) => {
  if (!YEAR.test(iv.prompt)) return iv.prompt;
  const line = iv.prompt.replace(YEAR, String(year));
  if (!iv.anchor) return line;
  return year === iv.from ? line + iv.anchor : line + "?";
};

const totalOf = (ss: Figure["series"]) =>
  ss[0].points.map((_, i) => ss.reduce((n, s) => n + (s.points[i]?.[1] ?? 0), 0));

export default function Story() {
  const [active, setActive] = useState<Intervention | null>(null);
  const [from, setFrom] = useState(0);

  const figure = figures.find((f) => f.id === FIG_ID)!;
  const iv = useMemo<Intervention | null>(
    () => (active ? { ...active, from: from || active.from } : null),
    [active, from]
  );

  const projected = useMemo(
    () => (iv ? projectFigure(figure, HORIZON)?.figure ?? figure : figure),
    [figure, iv]
  );
  const dataEndsAt = figure.categories!.length - 1;
  const cf = useMemo(() => applyIntervention(projected, iv), [projected, iv]);

  const baseEnd = totalOf(projected.series).at(-1)!;
  /* The headline number is the published one; the sentence's 2032 figure is the
     trend, and is always available even before the chart extends to show it. */
  const trendEnd = useMemo(
    () => totalOf((projectFigure(figure, HORIZON)?.figure ?? figure).series).at(-1)!,
    [figure]
  );
  const published = totalOf(figure.series).at(-1)!;
  const cfEnd = cf ? totalOf(cf.series).at(-1)! : null;
  const delta = cfEnd !== null ? Math.round((cfEnd / baseEnd - 1) * 100) : null;

  /* What else on the board this same intervention moves, and what it leaves. */
  const elsewhere = useMemo(() => {
    if (!iv) return null;
    const moved: string[] = [];
    const still: { title: string; why: string }[] = [];
    const strip = (t: string) => t.replace(/,\s*\d{4}(–\d{2,4})?( \(part \d\))?$/, "");
    for (const f of figures) {
      if (f.id === FIG_ID) continue;
      const r = applyIntervention(projectFigure(f, HORIZON)?.figure ?? f, iv);
      if (r) moved.push(strip(f.title));
      else still.push({ title: strip(f.title), why: untouchedReason(f, iv) });
    }
    return { moved, still };
  }, [iv]);

  const here = cf?.effects.filter((e) => e.figureId === FIG_ID) ?? [];

  function choose(next: Intervention | null, at?: number) {
    setActive(next);
    setFrom(next ? (at ?? next.from) : 0);
  }

  return (
    <div className="one">
      {/* Everything you need to use this page, in one screen. */}
      <section className="one-screen">
        <header className="one-top">
          <div>
            <p className="one-eyebrow">
              Manipulate the data <span className="one-series-no">03</span> · Epoch AI for the
              2026 AI Index
            </p>
            <h1>
              AI now draws <span className="one-hero-num">{Math.round(published)}</span> gigawatts.
            </h1>
          </div>
          <p className="one-lede">
            In the first quarter of 2022 the world&rsquo;s AI data centres drew 0.15 GW between
            them, about what a mid-sized hospital campus uses. By the end of 2025 they drew 29.56 GW
            — more electricity than the Netherlands. On the present trend they pass New York State
            at peak next year, and reach {trendEnd.toFixed(0)} GW by {HORIZON}.
          </p>
        </header>

        <Ask active={active} from={from} onChoose={choose} onFrom={setFrom} />

        {iv && cf && delta !== null && (
          <p className="one-verdict-line">
            <span className="one-verdict-num">
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
            <span className="one-verdict-say">
              <b>{cfEnd!.toFixed(1)} GW</b> instead of {baseEnd.toFixed(1)} by {HORIZON} —{" "}
              {cfEnd! < 19
                ? "back under the Netherlands"
                : cfEnd! < 31
                  ? "above the Netherlands, under New York State"
                  : "still above New York State at peak"}
              .{" "}
              <span className="one-verdict-dim">
                {elsewhere!.moved.length} of {figures.length - 1} other figures on the board move
                too — read on.
              </span>
            </span>
          </p>
        )}

        <div className="one-figure">
          <PowerChart
            figure={projected}
            cf={cf?.series}
            thresholds={THRESHOLDS}
            interventionLabel={active?.short}
            dataEndsAt={iv ? dataEndsAt : undefined}
          />
        </div>
        {iv && cf && (
          <a className="one-readwhy" href="#why">
            Read why this happens
            <span aria-hidden>↓</span>
          </a>
        )}
      </section>

      {iv && cf && (
        <section className="one-result" id="why">
          <p className="one-story">
            <b>{iv.prompt.replace(/\?$/, "")}</b>, from {iv.from}.{" "}
            {here[0]?.rationale} By {HORIZON} the world&rsquo;s AI data centres draw{" "}
            <b>{cfEnd!.toFixed(1)} GW</b> rather than {baseEnd.toFixed(1)}, a gap of{" "}
            <b>{Math.abs(cfEnd! - baseEnd).toFixed(1)} GW</b>, about{" "}
            {(Math.abs(cfEnd! - baseEnd) / 31).toFixed(1)} times New York State at peak.{" "}
            {elsewhere!.moved.length} of the other {figures.length - 1} figures on the board move
            with it, and {elsewhere!.still.length} do not. What follows is every reason, including
            the ones against.
          </p>
          <div className="one-cols">
            <div className="one-col">
              <h2>What you changed here</h2>
              {here.map((e, i) => (
                <p key={i}>
                  <span className="one-op">
                    {e.op}
                    {e.op === "freeze" ? "" : ` ${e.magnitude}`} from {e.from}
                  </span>
                  {e.rationale}{" "}
                  <em className={`one-conf c-${e.confidence}`}>{CONF[e.confidence]}</em>
                </p>
              ))}
              <p className="one-note">
                Nothing before {e0(here)} moves at all: the counterfactual is glued to the published
                record until the year you picked. Past 2025Q4 both readings are projection, on one
                rule applied to every figure identically — {PROJECTION_RULE}
              </p>
            </div>

            <div className="one-col">
              <h2>What you changed elsewhere</h2>
              {elsewhere!.moved.length ? (
                <ul className="one-moved">
                  {elsewhere!.moved.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : (
                <p>Nothing else on the board moves.</p>
              )}
              <h2 className="one-h2-b">What you did not change</h2>
              {elsewhere!.still.slice(0, 3).map((s) => (
                <p key={s.title} className="one-still">
                  <b>{s.title}.</b> {s.why}
                </p>
              ))}
              {elsewhere!.still.length > 3 && (
                <p className="one-still one-still-more">
                  …and {elsewhere!.still.length - 3} more, for the same reason.
                </p>
              )}
            </div>

            <div className="one-col">
              <h2>The objection</h2>
              <blockquote>{iv.objection.claim}</blockquote>
              <p>{iv.objection.response}</p>
            </div>
          </div>
        </section>
      )}

      <footer className="one-foot">
        <p>
          Figure 1.2.4 of the <em>2026 AI Index Report</em>, Stanford HAI, from Epoch AI. The
          published series ends at 2025Q4 at 29.56 GW; everything right of the boundary is the
          projection rule and is labelled as such. The thresholds are the ones the AI Index prints
          on the figure itself.
        </p>
        <p>
          <Link href="/">← The AI board, sixteen figures</Link>
          <span className="one-dot">·</span>
          <Link href="/quantum">The quantum board</Link>
        </p>
      </footer>
    </div>
  );
}

/* ---------------------------------------------------------------------- input */

function Ask({
  active,
  from,
  onChoose,
  onFrom,
}: {
  active: Intervention | null;
  from: number;
  onChoose: (iv: Intervention | null, at?: number) => void;
  onFrom: (y: number) => void;
}) {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const [miss, setMiss] = useState<string | null>(null);
  const [seenId, setSeenId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Adjust during render rather than in an effect: `active` is a fresh object on
     every year tick, so keying on the id is what actually changes. */
  if ((active?.id ?? null) !== seenId) {
    setSeenId(active?.id ?? null);
    setMiss(null);
    if (active) {
      const instant =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const line = promptAt(active, from || active.from);
      setText(instant ? line : "");
      setTyping(instant ? null : line);
    } else {
      setText("");
      setTyping(null);
    }
  }

  useEffect(() => {
    if (typing === null) return;
    if (window.matchMedia?.("(pointer: fine)").matches) inputRef.current?.focus();
    /* Driven by elapsed time rather than a tick count, so a throttled timer
       catches up instead of crawling. */
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
    const hit = matchFrom(INTERVENTIONS, text);
    if (!hit) {
      setMiss(text.trim());
      return;
    }
    const y = yearIn(text);
    const ok = y !== null && y >= hit.fromRange[0] && y <= hit.fromRange[1];
    onChoose(hit, ok ? y : undefined);
    setMiss(null);
  }

  function retime(y: number) {
    onFrom(y);
    if (!active || !YEAR.test(active.prompt)) return;
    if (typing !== null) setTyping(null);
    setText(promptAt(active, y));
  }

  return (
    <div className="one-ask">
      <form className="one-form" onSubmit={submit}>
        <label className="one-ask-label" htmlFor="one-iv">
          Now change it.
        </label>
        <input
          id="one-iv"
          ref={inputRef}
          className="one-input"
          value={text}
          placeholder="What would you do about AI, and when?"
          onChange={(e) => {
            setTyping(null);
            setText(e.target.value);
            setMiss(null);
          }}
          autoComplete="off"
        />
        <button type="submit" className="one-go">
          Redraw
        </button>
        {active && (
          <button type="button" className="one-reset" onClick={() => onChoose(null)}>
            Reset
          </button>
        )}
      </form>

      <div className="one-options">
        {INTERVENTIONS.map((i) => (
          <button
            key={i.id}
            type="button"
            className={active?.id === i.id ? "one-option on" : "one-option"}
            onClick={() => onChoose(active?.id === i.id ? null : i)}
            title={i.summary}
          >
            <span>{i.short}</span>
            <span className="one-option-year">{i.from}</span>
          </button>
        ))}
        {active && (
          <span className="one-when">
            <label htmlFor="one-from">from</label>
            <input
              id="one-from"
              type="range"
              min={active.fromRange[0]}
              max={active.fromRange[1]}
              step={1}
              value={from || active.from}
              onChange={(e) => retime(Number(e.target.value))}
            />
            <b>{from || active.from}</b>
          </span>
        )}
      </div>

      {miss !== null && (
        <p className="one-miss">
          No preset matches <em>&ldquo;{miss}&rdquo;</em>. Free text needs a model behind it — until
          then these {INTERVENTIONS.length} are the ones with authored transforms.
        </p>
      )}
    </div>
  );
}

/** Earliest year any effect on this figure starts. */
function e0(effects: { from: number }[]) {
  return effects.length ? Math.min(...effects.map((e) => e.from)) : 2026;
}
