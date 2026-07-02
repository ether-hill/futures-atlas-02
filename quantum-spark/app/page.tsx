"use client";

/**
 * Quantum Spark — one screen: hero (input + chips) → glowing loading orb →
 * five staggered insight cards with Spark-more / Copy-all / reset. Business
 * is URL-serialized (?b=), generation runs in the HOST app at
 * /api/quantum-spark/spark, and any failure falls back to the sample set
 * with a quiet toast — never a dead end.
 */

import { useEffect, useRef, useState } from "react";
import { Reveal } from "../components/Reveal";
import { SAMPLE_SPARK } from "../lib/sample";
import { HONESTY_LINE, INDUSTRY_OPTIONS, type SparkResponse, type SparkResult } from "../lib/types";

const API = "/api/quantum-spark/spark";

const LOADING_MSGS = [
  "Tuning into the quantum future…",
  "Collapsing the possibilities…",
  "Entangling ideas…",
  "Amplifying the best signals…",
];

type Phase =
  | { name: "idle" }
  | { name: "loading"; business: string; msg: number }
  | { name: "results"; result: SparkResult; business: string; fallback: boolean };

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export default function Page() {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [query, setQuery] = useState("");
  const [other, setOther] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const msgTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const b = new URLSearchParams(window.location.search).get("b");
    if (b) {
      const business = b.replace(/-/g, " ");
      setQuery(business);
      spark(business);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setUrl(business: string | null) {
    const u = new URL(window.location.href);
    if (business) u.searchParams.set("b", toSlug(business));
    else u.searchParams.delete("b");
    window.history.replaceState(null, "", u.toString());
  }

  function quietToast(text: string) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  async function spark(businessRaw: string, fresh = false) {
    const business = businessRaw.trim();
    if (business.length < 2) return;
    setUrl(business);
    setCopied(false);
    setPhase({ name: "loading", business, msg: 0 });
    if (msgTimer.current) clearInterval(msgTimer.current);
    msgTimer.current = setInterval(() => {
      setPhase((p) => (p.name === "loading" ? { ...p, msg: (p.msg + 1) % LOADING_MSGS.length } : p));
    }, 2400);

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ business, fresh }),
      });
      const data = (await res.json()) as SparkResponse;
      if (!data.ok) throw new Error(data.message || "Generation failed.");
      setPhase({ name: "results", result: data.result, business, fallback: false });
    } catch {
      // never dead-end: show the sample set with a quiet note
      setPhase({ name: "results", result: SAMPLE_SPARK, business, fallback: true });
      quietToast("Live generation is unavailable right now — showing a sample spark.");
    } finally {
      if (msgTimer.current) clearInterval(msgTimer.current);
      requestAnimationFrame(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        resultsRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      });
    }
  }

  function copyAll(result: SparkResult) {
    const text = [
      `Quantum Spark — ${result.business_display}`,
      "",
      ...result.insights.flatMap((ins, i) => [`${i + 1}. ${ins.tag} — ${ins.headline}`, ins.insight, ""]),
      HONESTY_LINE,
    ].join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => quietToast("Couldn't access the clipboard — select and copy the cards directly."));
  }

  function reset() {
    setUrl(null);
    setQuery("");
    setOther(false);
    setPhase({ name: "idle" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const ready = query.trim().length >= 2;

  return (
    <main className="shell">
      <Reveal className="hero">
        <p className="eyebrow">Quantum Spark · ignite the room</p>
        <h1>
          Five <span className="grad-text">sparks</span> for what&rsquo;s next.
        </h1>
        <p className="sub">
          Pick your industry — get five bold, grounded glimpses of how quantum computing and
          next-wave AI will transform it. Inspiration, not fabrication.
        </p>
        {/* lead with the options: 20 industries + Other… (reveals free text) */}
        <div className="chips" role="group" aria-label="Choose your industry">
          {INDUSTRY_OPTIONS.map((c) => (
            <button
              key={c}
              className="chip"
              disabled={phase.name === "loading"}
              onClick={() => {
                setQuery(c);
                setOther(false);
                spark(c);
              }}
            >
              {c}
            </button>
          ))}
          <button
            className="chip chip--other"
            aria-pressed={other}
            onClick={() => setOther((o) => !o)}
          >
            Other…
          </button>
        </div>
        {other && (
          <form
            className="spark-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (ready) spark(query);
            }}
          >
            <label className="sr-only" htmlFor="business">
              Your business or industry
            </label>
            <input
              id="business"
              className="spark-input"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your business — e.g. 'a craft brewery', 'a shipping port'…"
              autoComplete="off"
            />
            <button className="spark-btn" type="submit" disabled={!ready || phase.name === "loading"}>
              Spark 5 insights ✦
            </button>
          </form>
        )}
      </Reveal>

      <div ref={resultsRef} style={{ scrollMarginTop: "calc(var(--fa-nav-h, 64px) + 16px)" }}>
        {phase.name === "loading" && (
          <div className="loading" aria-live="polite">
            <div className="orb" aria-hidden="true" />
            <p className="msg">{LOADING_MSGS[phase.msg]}</p>
          </div>
        )}

        {phase.name === "results" && (
          <section className="results" aria-live="polite">
            <h2>
              How quantum reshapes <span className="grad-text">{phase.result.business_display}</span>
            </h2>
            {phase.result.insights.map((ins, i) => (
              <article className="card" key={`${phase.result.generatedAt}-${i}`} style={{ animationDelay: `${i * 90}ms` }}>
                <div className="num grad-text">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <span className="tag">{ins.tag}</span>
                  <h3>{ins.headline}</h3>
                  <p>{ins.insight}</p>
                </div>
              </article>
            ))}
            <div className="actions">
              <button className="act-primary" onClick={() => spark(phase.business, true)}>
                Spark 5 more ✦
              </button>
              <button className="act-ghost" onClick={() => copyAll(phase.result)}>
                {copied ? "Copied ✓" : "Copy all"}
              </button>
              <button className="act-ghost" onClick={reset}>
                New business
              </button>
            </div>
            <p className="honesty">{HONESTY_LINE}</p>
          </section>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
