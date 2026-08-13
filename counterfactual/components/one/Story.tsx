"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Argue, { type Objection } from "@/components/Argue";
import PowerChart, { type Threshold } from "@/components/one/PowerChart";
import Room from "@/components/one/Room";
import { type Figure, figures } from "@/lib/figures";
import { INTERVENTIONS, type Intervention, matchFrom, yearIn } from "@/lib/interventions";
import { PROJECTION_RULE, projectFigure } from "@/lib/project";
import { reviseWith } from "@/lib/rebuttals";
import { applyIntervention, movesVisibly, untouchedReason } from "@/lib/transform";

const FIG_ID = "1.2.4";
const HORIZON = 2032;
const TYPE_SPEED = 20;
const YEAR = /\b(19|20)\d{2}\b/;

/* The three the AI Index itself prints on this figure. Keeping them is the
   difference between a number and a fact you can feel. */
const THRESHOLDS: Threshold[] = [
  { y: 7, label: "New Zealand ≈ 7 GW", short: "NZ 7" },
  { y: 19, label: "the Netherlands ≈ 19 GW", short: "Netherlands 19" },
  { y: 31, label: "New York State, peak ≈ 31 GW", short: "NY State 31" },
];

const CONF: Record<string, string> = {
  "well-evidenced": "well evidenced",
  arguable: "arguable",
  speculative: "speculative",
};

/* The slider writes its year into the sentence, including for the prompts that
   carry none of their own. The box holds the whole intervention or it holds
   half of one. */
const promptAt = (iv: Intervention, year: number) => {
  if (YEAR.test(iv.prompt)) {
    const line = iv.prompt.replace(YEAR, String(year));
    if (!iv.anchor) return line;
    return year === iv.from ? line + iv.anchor : line + "?";
  }
  const q = iv.prompt.trimEnd().endsWith("?");
  const stem = iv.prompt.trimEnd().replace(/\?$/, "").trimEnd().replace(/,$/, "");
  return `${stem}, from ${year}${q ? "?" : ""}`;
};

const totalOf = (ss: Figure["series"]) =>
  ss[0].points.map((_, i) => ss.reduce((n, s) => n + (s.points[i]?.[1] ?? 0), 0));

export default function Story() {
  const [active, setActive] = useState<Intervention | null>(null);
  const [from, setFrom] = useState(0);
  const [objections, setObjections] = useState<Objection[]>([]);

  const figure = figures.find((f) => f.id === FIG_ID)!;
  const iv = useMemo<Intervention | null>(() => {
    if (!active) return null;
    const dated = { ...active, from: from || active.from };
    return objections.reduce((x, o) => reviseWith(x, o.rebuttal), dated);
  }, [active, from, objections]);
  const argued = objections.at(-1) ?? null;

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
      if (movesVisibly(r)) moved.push(strip(f.title));
      /* Reached but flat is a third category. Telling someone no lever reaches a
         figure when one does, and simply lands too late, is a false statement
         about the model rather than a modest one. */
      else if (r?.effects.length) {
        const y = Math.min(...r.effects.map((e) => e.from));
        still.push({
          title: strip(f.title),
          why:
            y > HORIZON
              ? `A lever reaches it, but not until ${y}, which is past the right edge of every chart here.`
              : "A lever reaches it and moves it by under one percent, which is not a change anyone should read off a chart.",
        });
      } else still.push({ title: strip(f.title), why: untouchedReason(f, iv) });
    }
    return { moved, still };
  }, [iv]);

  const here = cf?.effects.filter((e) => e.figureId === FIG_ID) ?? [];

  /* A new intervention starts a new argument: the old objections were aimed at
     transforms that are no longer on the page. */
  function choose(next: Intervention | null, at?: number) {
    setActive(next);
    setFrom(next ? (at ?? next.from) : 0);
    setObjections([]);
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
            them, about what a mid-sized hospital campus uses. By the end of 2025 they drew
            29.56 GW, more electricity than the Netherlands. On the present trend they pass New
            York State at peak next year, and reach {trendEnd.toFixed(0)} GW by {HORIZON}.
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
              <b>{cfEnd!.toFixed(1)} GW</b> instead of {baseEnd.toFixed(1)} by {HORIZON}:{" "}
              {cfEnd! < 19
                ? "back under the Netherlands"
                : cfEnd! < 31
                  ? "above the Netherlands, under New York State"
                  : "still above New York State at peak"}
              .{" "}
              <span className="one-verdict-dim">
                {elsewhere!.moved.length} of {figures.length - 1} other figures on the board move
                too. Read on.
              </span>
            </span>
          </p>
        )}

        {/* An intervention that never reaches this figure is a result, not a
            dead page. It gets the same slot the verdict would have had. */}
        {iv && !cf && (
          <p className="one-verdict-line one-verdict-flat">
            <span className="one-verdict-num">0%</span>
            <span className="one-verdict-say">
              <b>This one does not touch the power.</b> {untouchedReason(figure, iv)}{" "}
              <span className="one-verdict-dim">
                It still moves {elsewhere!.moved.length} of the other {figures.length - 1} figures
                on the board, and you can still argue with it.
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
        {iv && (
          <a className="one-readwhy" href="#why">
            {cf ? "Read why this happens" : "Read why nothing happened"}
            <span aria-hidden>↓</span>
          </a>
        )}
      </section>

      {iv && (
        <section className="one-result" id="why">
          <p className="one-story">
            <b>{iv.prompt.replace(/\?$/, "")}</b>, from {iv.from}.{" "}
            {cf ? (
              <>
                {here[0]?.rationale} By {HORIZON} the world&rsquo;s AI data centres draw{" "}
                <b>{cfEnd!.toFixed(1)} GW</b> rather than {baseEnd.toFixed(1)}, a gap of{" "}
                <b>{Math.abs(cfEnd! - baseEnd).toFixed(1)} GW</b>, about{" "}
                {(Math.abs(cfEnd! - baseEnd) / 31).toFixed(1)} times New York State at peak.{" "}
              </>
            ) : (
              <>
                {untouchedReason(figure, iv)} The line above is the published record and the trend
                that follows it, unchanged, which is the answer to the question you asked.{" "}
              </>
            )}
            {elsewhere!.moved.length} of the other {figures.length - 1} figures on the board move
            with it, and {elsewhere!.still.length} do not.{" "}
            {argued ? (
              <>
                Then you said <b>&ldquo;{argued.text}&rdquo;</b>.{" "}
                {!argued.rebuttal
                  ? "Nothing in the engine matched it, so the numbers above are the ones it started with."
                  : argued.rebuttal.verdict === "revised"
                    ? `Read as ${argued.rebuttal.label}, and taken: every number above is already your version rather than the authored one.`
                    : `Read as ${argued.rebuttal.label}, and it holds. The numbers above are unchanged by it, and the reason is at the foot of this page.`}
              </>
            ) : (
              "What follows is every reason, including the ones against."
            )}
          </p>

          <Room
            lit={cf ? cfEnd! / baseEnd : 1}
            caption={
              <>
                <b>A drawing, not a photograph.</b>{" "}
                {cf ? (
                  <>
                    The lit cabinets are the {cfEnd!.toFixed(1)} GW still drawn under your
                    intervention; the dark ones at the back are the{" "}
                    {Math.abs(baseEnd - cfEnd!).toFixed(1)} GW it took off the trend, and they are
                    at the back because the far racks are the ones that had not been built yet.
                  </>
                ) : (
                  <>
                    Every cabinet is lit, because this intervention takes none of them away. The
                    room is the {baseEnd.toFixed(1)} GW the trend arrives at in {HORIZON} either
                    way.
                  </>
                )}{" "}
                Nothing here is a picture of a real building, and no real hall is laid out to match
                a number.
              </>
            }
          />

          <div className="one-caveat">
            <h2>None of the future here is data.</h2>
            <ul className="one-caveat-tags">
              <li>Projected</li>
              <li>Written by a model</li>
              <li>Contested</li>
            </ul>
            <p>
              Everything left of the 2025Q4 rule is Stanford&rsquo;s published record, and you can
              open the CSV it came from. Everything right of it is one piece of arithmetic run over
              that record, the same rule for every figure on the board, because an intervention
              that starts next year needs a future to land in. It is not a forecast. Nobody at
              Epoch AI or Stanford has said the line goes to {trendEnd.toFixed(0)} GW.
            </p>
            <p>
              The counterfactual laid over the top is thinner still. Each effect is{" "}
              <b>a direction, a size and a start year, written by a language model</b> and tagged
              with how much weight it deserves. About a third of them are marked speculative by the
              thing that wrote them. They are arguments, not measurements, and an argument you
              can&rsquo;t check is worth less than one you can, which is why every effect on this
              page prints its own reasoning next to it.
            </p>
            <p>
              So take the numbers with salt. Plenty of people who know this field would set the
              magnitudes differently or point them the other way, and the strongest objection I
              know of against this particular intervention is written out below, unprompted. If
              yours is different, the page would rather hear it than be believed.
            </p>
            <a className="one-caveat-go" href="#argue">
              Dispute it ↓
            </a>
          </div>

          <div className="one-cols">
            <div className="one-col">
              <h2>{cf ? "What you changed here" : "Why this figure holds"}</h2>
              {!cf && <p>{untouchedReason(figure, iv)}</p>}
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
                Nothing before {cf ? e0(here) : iv.from} moves at all: the counterfactual is glued to the published
                record until the year you picked. Past 2025Q4 both readings are projection, on one
                rule applied to every figure identically. {PROJECTION_RULE}
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
              <h2>Not convinced?</h2>
              <p>
                Say so. Type what you think is wrong and this page either revises the transforms
                and redraws every number above, or refuses and tells you why. It refuses more often
                than it agrees, which is the only way the times it agrees mean anything.
              </p>
              <p className="one-still one-still-more">
                <a href="#argue">The box is directly below ↓</a>
              </p>
            </div>
          </div>

          <div className="one-arguebox" id="argue">
            <Argue
              intervention={iv}
              objections={objections}
              onPush={(o) => setObjections((list) => [...list, o])}
              onUndo={() => setObjections((list) => list.slice(0, -1))}
            />
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
    if (!active) return;
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
          No preset matches <em>&ldquo;{miss}&rdquo;</em>. Free text needs a model behind it. Until
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
