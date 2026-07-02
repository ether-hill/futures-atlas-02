"use client";

/**
 * Signal Reactor — single-page flow: picker → staged generation → deck viewer.
 * State is URL-serialized (?s=<sector-slug>) so a briefing is linkable; a
 * shared link regenerates fresh content for that sector (hosted decks are M3).
 * Generation runs in the HOST app at /api/signal-reactor/generate.
 */

import { useEffect, useRef, useState } from "react";
import { Picker } from "../components/Picker";
import { Viewer } from "../components/Viewer";
import { SAMPLE_DECK } from "../lib/sample";
import { fromSlug, toSlug } from "../lib/sectors";
import type { Deck, GenerateResponse } from "../lib/types";

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
  | { name: "idle"; prefill?: string }
  | { name: "generating"; sector: string; stage: number }
  | { name: "error"; sector: string; message: string }
  | { name: "deck"; deck: Deck };

export default function Page() {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const booted = useRef(false);

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

  async function generate(sector: string) {
    setUrl(sector);
    setPhase({ name: "generating", sector, stage: 0 });
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
        body: JSON.stringify({ sector }),
      });
      const data = (await res.json()) as GenerateResponse;
      if (!data.ok) throw new Error(data.message || "Generation failed.");
      setPhase({ name: "deck", deck: data.deck });
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
  }

  return (
    <main className="shell">
      {phase.name === "idle" && <Picker onGenerate={generate} initialSector={phase.prefill} />}

      {phase.name === "generating" && (
        <section className="gen-stage" aria-live="polite">
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
            <button className="btn-secondary" onClick={() => setPhase({ name: "deck", deck: SAMPLE_DECK })}>
              Load the sample briefing
            </button>
            <button className="btn-secondary" onClick={reset}>
              Start over
            </button>
          </div>
        </section>
      )}

      {phase.name === "deck" && <Viewer deck={phase.deck} onNew={reset} />}
    </main>
  );
}
