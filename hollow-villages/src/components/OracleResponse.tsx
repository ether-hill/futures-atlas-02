"use client";

import { useState, type ReactNode } from "react";
import { getResearch, type ResearchEntry } from "@/data/research";
import { getFuturePair } from "@/data/futures";
import type { Letter } from "@/data/letters";
import { BeforeAfter } from "./BeforeAfter";
import { Reveal } from "./Reveal";

const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

/** The finished 2050 renders — tiled behind the "consult again" slide. */
const VISION_TILES = ["anna-8", "giorgio-72", "mara-34", "tomas-19", "yusuf-45", "henrik-58", "bianca-51"].map(
  (id) => `/hollow-villages/villages/${id}-vision.jpg`,
);

/** Body copy is set in the sans display face, never mono — kept for readability. */
const SANS = { fontFamily: "var(--font-display)" } as const;
const SERIF = { fontFamily: "var(--font-serif)" } as const;

/** Every section is exactly one full screen tall — a presentation slide. The
 *  content is centred and clipped; each slide fills the whole viewport so the
 *  neighbouring slide can never peek in (the global nav auto-hides on scroll). */
const SLIDE =
  "flex h-[100svh] w-full flex-col justify-center overflow-hidden px-[clamp(16px,4vw,64px)] py-[clamp(20px,3.5vh,48px)]";
/** A gated slide with an id — aligns flush to the top of the viewport when
 *  scrolled to (no offset), so no previous slide shows above it. */
const SLIDE_ID = SLIDE;

/** The consistent "take me to the next section" control that drives the reading. */
function NextButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="mt-[clamp(20px,3vh,40px)] flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-3 rounded-[3px] bg-accent px-9 py-[18px] font-mono text-[12.5px] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-accent-deep"
      >
        {label} <span aria-hidden className="text-[15px]">↓</span>
      </button>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/* ── section marks — sized to sit as tall as the heading beside them ── */
const ICO_LG = "h-[clamp(26px,3vw,40px)] w-[clamp(26px,3vw,40px)] shrink-0 text-accent-deep";
const ICO_SM = "h-[clamp(15px,1.7vw,19px)] w-[clamp(15px,1.7vw,19px)] shrink-0 text-accent-deep";
const svg = "0 0 24 24";
const IconNamed = ({ className = ICO_SM }: { className?: string }) => (
  <svg viewBox={svg} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 5h14v10H9l-4 4V5Z" />
  </svg>
);
const IconChange = ({ className = ICO_LG }: { className?: string }) => (
  <svg viewBox={svg} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className={className} aria-hidden>
    <path d="M4 8h16M4 16h16" />
    <circle cx="9" cy="8" r="2.4" fill="var(--color-surface)" />
    <circle cx="15" cy="16" r="2.4" fill="var(--color-surface)" />
  </svg>
);
const IconWho = ({ className = ICO_LG }: { className?: string }) => (
  <svg viewBox={svg} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="8.5" cy="8" r="3" />
    <path d="M3 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <path d="M16 5.6a2.9 2.9 0 0 1 0 5.6M17.5 19c0-2.3-1-4-2.7-4.7" />
  </svg>
);
const IconFunding = ({ className = ICO_LG }: { className?: string }) => (
  <svg viewBox={svg} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 9.6a4 4 0 1 0 0 4.8M8 11h5.2M8 13.2h5.2" />
  </svg>
);
const IconStories = ({ className = ICO_LG }: { className?: string }) => (
  <svg viewBox={svg} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M12 21s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z" />
    <circle cx="12" cy="11" r="2.3" />
  </svg>
);
const IconVision = ({ className = ICO_SM }: { className?: string }) => (
  <svg viewBox={svg} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

/** Split a paragraph so the final sentence can be emphasised (the "Why" punch). */
function splitLast(text: string) {
  const m = text.match(/[^.!?]+[.!?]+(?:\s|$)/g);
  if (!m || m.length < 2) return { lead: "", last: text.trim() };
  return { lead: m.slice(0, -1).join("").trim(), last: m[m.length - 1].trim() };
}

function SlideHead({ icon, title, meta, sub }: { icon: ReactNode; title: string; meta: string; sub?: string }) {
  return (
    <div className={sub ? "mb-[clamp(18px,2.6vw,30px)]" : "mb-[clamp(22px,3.2vw,40px)]"}>
      <div className="flex items-center gap-3.5">
        {icon}
        <h2 className="m-0 text-[clamp(24px,3vw,40px)] font-extrabold tracking-[-0.018em] text-ink">{title}</h2>
        <span className="h-px flex-1 bg-ink/20" />
        <span className="max-w-[45%] text-right font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">{meta}</span>
      </div>
      {sub && (
        <p className="mt-3.5 max-w-[68ch] text-[clamp(15px,1.5vw,18px)] leading-[1.5] text-ink-70" style={SANS}>
          {sub}
        </p>
      )}
    </div>
  );
}

function SourceCard({ entry }: { entry: ResearchEntry }) {
  const [ok, setOk] = useState(true);
  return (
    <a
      href={entry.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden border border-ink bg-panel transition-colors hover:bg-surface"
    >
      <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden border-b border-ink">
        {ok ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.thumbnail}
            alt=""
            loading="lazy"
            onError={() => setOk(false)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="hatch absolute inset-0 flex items-center justify-center px-3 text-center font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink/45">
            {entry.source}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-[18px] pb-[18px] pt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
          — {entry.source}{entry.year ? ` · ${entry.year}` : ""}
        </span>
        <h3 className="text-[15.5px] font-bold leading-[1.22] text-ink" style={SANS}>
          {entry.title}
        </h3>
        <p className="text-[13.5px] leading-[1.55] text-ink-70" style={SANS}>{entry.summary}</p>
        <span className="mt-auto pt-1.5 font-mono text-[11px] tracking-[0.06em] text-accent-deep">Read the source ↗</span>
      </div>
    </a>
  );
}

export function OracleResponse({
  letter,
  count,
  step,
  goTo,
  onAgain,
}: {
  letter: Letter;
  count: number;
  step: number;
  goTo: (nextStep: number, id: string) => void;
  onAgain: () => void;
}) {
  const r = letter.reframe;
  const pair = getFuturePair(letter.futurePairId);
  const why = splitLast(r.system);
  const sources = letter.articleIds
    .map(getResearch)
    .filter((e): e is NonNullable<typeof e> => Boolean(e));
  const actorsMeta = letter.actors?.length ? letter.actors.map((a) => a.tier).join(" · ") : "";
  const hasActors = !!letter.actors && letter.actors.length > 0;
  const hasResources = letter.resources.length > 0;

  return (
    <div data-reveal className="is-in">
      {/* ── SECTION 1 · WHAT YOU NAMED / WHAT CAN CHANGE (step ≥ 1) ── */}
      {step >= 1 && (
        <section id="sec-change" className={SLIDE_ID}>
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-[clamp(28px,5vh,64px)]">
            <div className="grid items-start gap-[clamp(30px,4.5vw,84px)] lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
              {/* the reframe */}
              <div>
                <div className="flex items-center gap-2.5">
                  <IconNamed />
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-deep">What you named</span>
                </div>
                <p className="mt-4 text-[clamp(19px,2.1vw,28px)] italic leading-[1.32] text-ink text-pretty" style={SERIF}>
                  {r.symptom}
                </p>
                <p className="mt-[clamp(16px,2vw,26px)] text-[clamp(14.5px,1.5vw,18px)] leading-[1.55] text-ink-70 text-pretty" style={SERIF}>
                  {why.lead ? <>{why.lead} </> : null}
                  <b className="font-bold text-ink">{why.last}</b>
                </p>
              </div>

              {/* what can change — the levers */}
              <div>
                <div className="mb-[clamp(14px,1.8vw,22px)] flex items-center gap-3.5">
                  <IconChange />
                  <h2 className="m-0 text-[clamp(24px,2.9vw,40px)] font-extrabold tracking-[-0.018em] text-ink">What can change</h2>
                  <span className="h-px flex-1 bg-ink/20" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">{letter.levers.length} levers</span>
                </div>
                <div className="flex flex-col border-y border-ink/15">
                  {letter.levers.map((l) => (
                    <div key={l.n} className="flex gap-[clamp(14px,1.8vw,26px)] border-b border-ink/15 py-[clamp(12px,1.6vw,20px)] last:border-b-0">
                      <span className="year w-[clamp(38px,3.4vw,52px)] shrink-0 text-[clamp(30px,3vw,42px)] leading-[0.82] text-accent">{l.n}</span>
                      <div>
                        <h3 className="text-[clamp(16px,1.6vw,20px)] font-bold leading-[1.15] tracking-[-0.01em] text-ink" style={SANS}>
                          {l.title}
                        </h3>
                        <p className="mt-1 text-[clamp(13px,1.3vw,15px)] leading-[1.5] text-ink-70" style={SANS}>{l.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* button 2 — the vision teaser, fading in a beat after the rest */}
            {pair && (
              <div className="hv-delay-in flex flex-col items-center gap-4 text-center">
                <p className="oracle-voice max-w-[30ch] text-[clamp(17px,2vw,27px)] italic leading-[1.16] text-ink text-balance">
                  I have a vision of your village in 2050.
                </p>
                <button
                  type="button"
                  onClick={() => goTo(2, "sec-vision")}
                  className="hv-shine inline-flex items-center gap-3 rounded-[3px] bg-accent px-10 py-[18px] font-mono text-[13px] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-accent-deep"
                >
                  See the 2050 vision <span aria-hidden className="text-[15px]">↓</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SECTION 2 · THE 2050 VISION — image 66% / text 33% (step ≥ 2) ── */}
      {pair && step >= 2 && (
        <section
          id="sec-vision"
          className={SLIDE_ID}
          style={{
            // the same dreaming palette as the rest of the site, but the pools
            // are larger and slightly less faded so this slide feels vivid
            background:
              "radial-gradient(72% 68% at 16% 20%, rgba(126,178,224,0.55), transparent 66%)," +
              "radial-gradient(68% 64% at 86% 82%, rgba(150,182,110,0.5), transparent 66%)," +
              "radial-gradient(58% 56% at 60% 36%, rgba(240,226,172,0.52), transparent 64%)," +
              "radial-gradient(52% 54% at 92% 12%, rgba(70,122,132,0.42), transparent 70%)," +
              "var(--color-surface)",
          }}
        >
          <div className="mx-auto w-full max-w-[1500px]">
            <div className="grid items-center gap-[clamp(24px,4vw,64px)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              {/* the render — kept at a true 16:9 */}
              <Reveal effect="blur" threshold={0.99} className="block">
                {pair.visionImage ? (
                  <figure className="relative m-0 aspect-[16/9] w-full overflow-hidden rounded-sm border border-ink/15">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pair.visionImage}
                      alt={`${letter.correspondent.name}'s village in 2050`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </figure>
                ) : (
                  <BeforeAfter
                    beforeImage={pair.beforeImage}
                    afterImage={pair.afterImage}
                    afterIsPlaceholder={pair.afterIsPlaceholder}
                    callout={pair.callout}
                    alt={`${letter.correspondent.name}'s village`}
                    aspectClass="aspect-[16/9]"
                  />
                )}
              </Reveal>
              <div className="flex flex-col justify-center gap-4">
                <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-accent-deep">
                  <IconVision /> The forecast
                </span>
                <p className="text-[clamp(16.5px,1.7vw,26px)] font-medium leading-[1.4] text-ink text-pretty" style={SANS}>
                  {r.vision2050}
                </p>
                {!pair.visionImage && (
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-graphite">⇆ Drag the line to compare</span>
                )}
                <button
                  type="button"
                  onClick={() => goTo(3, hasActors ? "sec-who" : hasResources ? "sec-resources" : "sec-stories")}
                  className="mt-3 inline-flex items-center gap-3 self-start rounded-[3px] bg-accent px-8 py-[16px] font-mono text-[12.5px] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-accent-deep"
                >
                  {hasActors ? "Learn who can do what" : hasResources ? "Discover resources & funding" : "See where this has happened"}
                  <span aria-hidden className="text-[15px]">↓</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 3 · WHO CAN DO WHAT (step ≥ 3) ────────────────── */}
      {hasActors && step >= 3 && (
        <section id="sec-who" className={SLIDE_ID}>
          <div className="mx-auto w-full max-w-[1340px]">
            <SlideHead
              icon={<IconWho />}
              title="Who can do what"
              meta={actorsMeta}
              sub="The same problem, answered at every scale — what one person, the village, and the nation can each move."
            />
            <div className="grid gap-[clamp(16px,2vw,26px)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
              {letter.actors!.map((a, i) => (
                <div key={i} className="flex flex-col border border-ink bg-panel px-[clamp(22px,2.4vw,32px)] pb-[clamp(22px,2.6vw,32px)] pt-[clamp(20px,2.2vw,28px)]">
                  <h3 className="flex items-center gap-2.5 text-[clamp(19px,2vw,25px)] font-extrabold leading-[1.1] tracking-[-0.01em] text-ink" style={SANS}>
                    <span aria-hidden className="h-[12px] w-[12px] shrink-0 bg-accent" />
                    {a.tier}
                  </h3>
                  <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-graphite">{a.who}</p>
                  <div className="mt-5 flex flex-col gap-3.5 border-t border-ink/15 pt-5">
                    {a.moves.map((m, j) => (
                      <div key={j} className="flex items-baseline gap-3">
                        <span aria-hidden className="shrink-0 font-mono text-[13px] text-accent">→</span>
                        <p className="m-0 text-[14px] leading-[1.52] text-ink" style={SANS}>{m}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-[clamp(18px,3.5vh,44px)]">
              <NextButton
                label={hasResources ? "Discover resources & funding" : "See where this has happened"}
                onClick={() => goTo(4, hasResources ? "sec-resources" : "sec-stories")}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 4 · RESOURCES, SUPPORT & FUNDING (step ≥ 4) ──── */}
      {hasResources && step >= 4 && (
        <section id="sec-resources" className={SLIDE_ID}>
          <div className="mx-auto w-full max-w-[1340px]">
            <SlideHead
              icon={<IconFunding />}
              title="Resources, support & funding"
              meta="What's available"
              sub="These are the real programmes available to start — currently-open funding, advice and networks a village or resident can actually use. Each links out to the source."
            />
            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
              {letter.resources.map((res, i) => (
                <a
                  key={i}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-2.5 border border-ink bg-panel px-[24px] pb-[24px] pt-[22px] transition-colors hover:bg-surface"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] border border-ink/15 bg-surface p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={favicon(res.domain)} alt="" width={128} height={128} loading="lazy" className="max-h-full max-w-full object-contain" />
                    </span>
                    <span className="bg-accent px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-paper">{res.kind}</span>
                    <span className="flex-1" />
                    <span aria-hidden className="font-mono text-[12px] text-accent-deep">↗</span>
                  </div>
                  <h3 className="mt-1 text-[clamp(16px,1.7vw,18px)] font-bold leading-[1.2] text-ink" style={SANS}>
                    {res.name}
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">{res.org}</span>
                  <p className="mt-0.5 text-[13.5px] leading-[1.58] text-ink-70" style={SANS}>{res.detail}</p>
                </a>
              ))}
            </div>
            {sources.length > 0 && (
              <NextButton label="See where this has already happened" onClick={() => goTo(5, "sec-stories")} />
            )}
          </div>
        </section>
      )}

      {/* ── SECTION 5 · WHERE THIS HAS ALREADY HAPPENED (step ≥ 5) ── */}
      {sources.length > 0 && step >= 5 && (
        <section id="sec-stories" className={SLIDE_ID}>
          <div className="mx-auto w-full max-w-[1340px]">
            <SlideHead
              icon={<IconStories />}
              title="Where this has already happened"
              meta="Real-life stories"
              sub="None of this is hypothetical. Every part of the forecast points to a real place that has already done a version of it."
            />
            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
              {sources.map((entry) => (
                <SourceCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CONSULT AGAIN (after the last section) ────────────────── */}
      {step >= 5 && (
      <section className={`${SLIDE} relative text-center`}>
        {/* four rows of the 2050 renders — full-height tiles, cropped only left↔right */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col overflow-hidden">
          {Array.from({ length: 4 }, (_, row) => (
            <div key={row} className="flex h-[25svh]">
              {Array.from({ length: 8 }, (_, col) => (
                <div
                  key={col}
                  className="aspect-[3/2] h-full shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${VISION_TILES[(row * 8 + col) % VISION_TILES.length]})` }}
                />
              ))}
            </div>
          ))}
        </div>
        {/* dark tint over the renders so the light text reads */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "rgba(22,19,14,0.64)" }} />
        <div className="relative z-10 mx-auto w-full max-w-[820px]">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-paper/70">
            Consultation {pad(count)} · complete
          </span>
          <h2 className="mt-4 text-[clamp(32px,5vw,64px)] font-extrabold leading-[0.98] tracking-[-0.02em] text-paper text-balance">
            The record holds another village.
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-[15px] leading-[1.65] text-paper/75" style={SANS}>
            Consult again and the oracle draws a new letter — a different place, a different life, the
            same instrument reading it against every case it knows.
          </p>
          <button
            type="button"
            onClick={onAgain}
            className="mt-9 inline-flex items-center gap-3 rounded-[3px] bg-accent px-10 py-[20px] font-mono text-[13px] uppercase tracking-[0.12em] text-paper transition-colors hover:bg-accent-deep"
          >
            ↺ Consult the oracle again
          </button>
        </div>
      </section>
      )}
    </div>
  );
}
