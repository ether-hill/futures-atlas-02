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

/** Package the five sparks as Social Composer `finding` frames and stash the
 *  handoff payload; the composer picks it up at ?import=quantum-spark. */
function stashComposerHandoff(result: SparkResult): void {
  const ts = Date.now();
  const payload = {
    name: `Quantum Spark — ${result.business_display}`,
    url: window.location.href,
    bgColor: "#07080f",
    textColor: "#f2f3fb",
    frames: result.insights.map((ins, i) => ({
      id: `tm-spark-${ts}-${i}`,
      kind: "finding",
      label: `Spark ${String(i + 1).padStart(2, "0")}`,
      date: ins.tag,
      headline: ins.headline,
      sub: `${ins.tag} · Quantum Spark`,
      body: ins.insight,
    })),
  };
  try {
    window.localStorage.setItem("social-composer:import:quantum-spark", JSON.stringify(payload));
  } catch {
    /* storage full/blocked — the composer will simply open empty */
  }
}

export default function Page() {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const msgTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);

  // close the share menu on outside click / Escape
  useEffect(() => {
    if (!shareOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!shareRef.current?.contains(e.target as Node)) setShareOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShareOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [shareOpen]);

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
    setShareOpen(false);
    setPhase({ name: "idle" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const ready = query.trim().length >= 2;

  return (
    <main className="shell">
      <Reveal className="hero">
        <div className="hero-grid">
          <div className="hero-text">
            <p className="eyebrow">Quantum Spark · ignite the room</p>
            <h1>
              Five <span className="grad-text">sparks</span> for what&rsquo;s next.
            </h1>
            <p className="sub">
              Name your business — get five bold, grounded glimpses of how quantum computing and
              next-wave AI will transform it. Inspiration, not fabrication.
            </p>
          </div>

          {/* picker: entry field first, the industry grid beneath it */}
          <div className="picker-panel">
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Your business or industry…"
                autoComplete="off"
              />
              <button className="spark-btn" type="submit" disabled={!ready || phase.name === "loading"}>
                Spark ✦
              </button>
            </form>
            <div className="chips" role="group" aria-label="Or pick an industry">
              {INDUSTRY_OPTIONS.map((c) => (
                <button
                  key={c}
                  className="chip"
                  disabled={phase.name === "loading"}
                  onClick={() => {
                    setQuery(c);
                    spark(c);
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
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
              <div className="share-wrap" ref={shareRef}>
                <button
                  className="act-primary"
                  aria-haspopup="menu"
                  aria-expanded={shareOpen}
                  onClick={() => setShareOpen((o) => !o)}
                >
                  Share this now ✦
                </button>
                {shareOpen && <ShareMenu result={phase.result} onClose={() => setShareOpen(false)} onToast={quietToast} />}
              </div>
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

/** The same share functions as the global Atlas Share tool — with the
 *  Social Composer paths carrying the five sparks as ready-made post frames
 *  (stashed just before navigation, picked up at ?import=quantum-spark). */
function ShareMenu({
  result,
  onClose,
  onToast,
}: {
  result: SparkResult;
  onClose: () => void;
  onToast: (t: string) => void;
}) {
  const u = typeof window !== "undefined" ? window.location.href : "";
  const t = `Quantum Spark — ${result.business_display}`;
  const enc = encodeURIComponent;
  const composerHref = (format?: string) =>
    `/social-composer?import=quantum-spark${format ? `&format=${format}` : ""}`;
  const stash = () => stashComposerHandoff(result);

  return (
    <div className="share-pop" role="menu">
      <a className="share-opt share-opt--accent" href={composerHref()} onClick={stash} role="menuitem">
        ⚗ Open in Social Composer
      </a>
      <div className="share-ig">
        <span className="share-iglbl">⌗ Instagram</span>
        {(["story", "square", "reel"] as const).map((f) => (
          <a key={f} className="share-chip" href={composerHref(f)} onClick={stash} role="menuitem">
            {f[0].toUpperCase() + f.slice(1)}
          </a>
        ))}
      </div>
      <span className="share-sep" />
      <button
        className="share-opt"
        role="menuitem"
        onClick={() => {
          navigator.clipboard
            .writeText(u)
            .then(() => onToast("Link copied"))
            .catch(() => onToast("Couldn't access the clipboard"));
          onClose();
        }}
      >
        Copy link
      </button>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button
          className="share-opt"
          role="menuitem"
          onClick={() => {
            navigator.share({ title: t, url: u }).catch(() => {});
            onClose();
          }}
        >
          Share…
        </button>
      )}
      <a className="share-opt" role="menuitem" target="_blank" rel="noopener" href={`https://wa.me/?text=${enc(`${t} ${u}`)}`} onClick={onClose}>
        WhatsApp
      </a>
      <a className="share-opt" role="menuitem" target="_blank" rel="noopener" href={`https://twitter.com/intent/tweet?url=${enc(u)}&text=${enc(t)}`} onClick={onClose}>
        Post to X
      </a>
      <a className="share-opt" role="menuitem" target="_blank" rel="noopener" href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(u)}`} onClick={onClose}>
        Share to LinkedIn
      </a>
      <a className="share-opt" role="menuitem" href={`mailto:?subject=${enc(t)}&body=${enc(u)}`} onClick={onClose}>
        Email a link
      </a>
    </div>
  );
}
