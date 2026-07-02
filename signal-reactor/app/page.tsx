"use client";

/**
 * Signal Reactor — one scrolling flow: title banner (modelled on the Atlas
 * homepage hero) → sector picker → deck viewer. "Let's begin" scrolls to the
 * picker; choosing an industry scrolls to the deck section, where staged
 * generation plays and the briefing lands. State is URL-serialized
 * (?s=<sector-slug>); generation runs in the HOST app at
 * /api/signal-reactor/generate and archived decks are served instantly.
 */

import { useEffect, useRef, useState } from "react";
import { Picker } from "../components/Picker";
import { Reveal } from "../components/Reveal";
import { SlideBoard } from "../components/Slides";
import { Viewer } from "../components/Viewer";
import { SAMPLE_DECK } from "../lib/sample";
import { fromSlug, toSlug } from "../lib/sectors";
import { HONESTY_LINE, type Deck, type GenerateResponse } from "../lib/types";

const API = "/api/signal-reactor/generate";

// honest labels for the real pipeline stages (two model calls + assembly)
const STAGES = [
  "reading the sector's real mechanisms",
  "deflating the hype, isolating the signal",
  "mapping horizons and impact vectors",
  "engineering questions for the room",
  "assembling the eight-slide briefing",
];

type Phase =
  | { name: "idle" }
  | { name: "generating"; sector: string; stage: number }
  | { name: "error"; sector: string; message: string }
  | { name: "deck"; deck: Deck; sector: string; cached: boolean };

/** A fluid miniature of one real slide — measures itself and scales the
 *  1280×720 board down to fit. */
function MiniSlide({ index }: { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0.2);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setS(el.clientWidth / 1280);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="mini-slide" ref={ref}>
      <div className="mini-scale" style={{ transform: `scale(${s})` }}>
        <SlideBoard deck={SAMPLE_DECK} index={index} />
      </div>
    </div>
  );
}

export default function Page() {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const booted = useRef(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  function scrollTo(el: HTMLElement | null) {
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  // ?s= in the URL → prefill and auto-generate (linkable briefings)
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const slug = new URLSearchParams(window.location.search).get("s");
    if (slug) generate(fromSlug(slug));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setUrl(sector: string | null) {
    const u = new URL(window.location.href);
    if (sector) u.searchParams.set("s", toSlug(sector));
    else u.searchParams.delete("s");
    window.history.replaceState(null, "", u.toString());
  }

  async function generate(sector: string, fresh = false) {
    setUrl(sector);
    setPhase({ name: "generating", sector, stage: 0 });
    requestAnimationFrame(() => scrollTo(deckRef.current));
    if (stageTimer.current) clearInterval(stageTimer.current);
    stageTimer.current = setInterval(() => {
      setPhase((p) =>
        p.name === "generating" ? { ...p, stage: Math.min(p.stage + 1, STAGES.length - 2) } : p,
      );
    }, 6000);

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sector, fresh }),
      });
      const data = (await res.json()) as GenerateResponse;
      if (!data.ok) throw new Error(data.message || "Generation failed.");
      setPhase({ name: "deck", deck: data.deck, sector, cached: !!data.cached });
      requestAnimationFrame(() => scrollTo(deckRef.current));
    } catch (e) {
      setPhase({
        name: "error",
        sector,
        message: e instanceof Error ? e.message : "Generation failed.",
      });
    } finally {
      if (stageTimer.current) clearInterval(stageTimer.current);
    }
  }

  function reset() {
    setUrl(null);
    setPhase({ name: "idle" });
    scrollTo(pickerRef.current);
  }

  return (
    <main className="shell">
      {/* title banner — same vocabulary as the Atlas homepage hero */}
      <section className="sr-hero">
        <Reveal className="sr-hero__inner">
          <div className="hero-grid">
            <div>
              <p className="eyebrow tick">Organizational foresight · quantum + advanced AI</p>
              <h1>Signal Reactor</h1>
              <p className="sr-hero__lede">
                A public foresight instrument. Name your organization and it builds an honest,
                presentable eight-slide briefing on what quantum computing and advanced AI actually
                mean for you — hype deflated, the real signal extrapolated, ready to run a
                stakeholder discussion from, and exportable as PPTX or PDF.
              </p>
              <div className="sr-hero__ctas">
                <button className="cta-primary" onClick={() => scrollTo(pickerRef.current)}>
                  Let&rsquo;s begin <span>↓</span>
                </button>
              </div>
              <p className="honesty">{HONESTY_LINE}</p>
            </div>

            {/* the real deck, squared: the sample briefing's first four slides */}
            <div className="deck-grid" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <MiniSlide key={i} index={i} />
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* start screen */}
      <div ref={pickerRef} className="flow-section flow-section--picker">
        <Picker onGenerate={(s) => generate(s)} />
      </div>

      {/* deck section */}
      <div ref={deckRef} className="flow-section flow-section--deck">
        {phase.name === "generating" && (
          <section className="gen-stage" aria-live="polite">
            <Reveal>
              <span className="kicker kicker--accent">Generating briefing — {phase.sector}</span>
              {STAGES.map((label, i) => (
                <div
                  key={label}
                  className="gen-line"
                  data-state={i < phase.stage ? "done" : i === phase.stage ? "active" : "pending"}
                >
                  {label}
                </div>
              ))}
            </Reveal>
          </section>
        )}

        {phase.name === "error" && (
          <section className="error-panel">
            <span className="kicker">Generation failed</span>
            <h2>The reactor didn&rsquo;t deliver.</h2>
            <p>{phase.message}</p>
            <div className="error-actions">
              <button className="generate-btn" onClick={() => generate(phase.sector)}>
                Try again
              </button>
              <button
                className="btn-secondary"
                onClick={() => setPhase({ name: "deck", deck: SAMPLE_DECK, sector: SAMPLE_DECK.sector, cached: false })}
              >
                Load the sample briefing
              </button>
              <button className="btn-secondary" onClick={reset}>
                Start over
              </button>
            </div>
          </section>
        )}

        {phase.name === "deck" && (
          <Reveal>
            <Viewer deck={phase.deck} onNew={reset} />
          </Reveal>
        )}
      </div>
    </main>
  );
}
