"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ROLES, VLABEL, isAligned, profileFor, type Card } from "../data/roles";
import Stats from "./Stats";

const ROUND = 10;
const pad = (n: number) => String(n).padStart(2, "0");

type Item = { card: Card; role: string };
type Ans = { card: Card; role: string; believe: boolean };
type Phase = "swipe" | "flinging" | "result" | "final";

// fire-and-forget metrics
function track(body: Record<string, unknown>) {
  try { fetch("/api/swipe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {}); } catch { /* */ }
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j]!, r[i]!]; }
  return r;
}
function buildDeck(roleId?: string): Item[] {
  const pool = roleId ? ROLES.filter((r) => r.id === roleId) : ROLES;
  const flat = pool.flatMap((r) => r.cards.map((c) => ({ card: c, role: r.name })));
  const shuffled = shuffle(flat);
  return roleId ? shuffled : shuffled.slice(0, ROUND);
}

export default function Calibration() {
  const [deck, setDeck] = useState<Item[]>([]);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<Ans[]>([]);
  const [phase, setPhase] = useState<Phase>("swipe");
  const [secs, setSecs] = useState(5);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fling, setFling] = useState<0 | 1 | -1>(0);
  const [statsOpen, setStatsOpen] = useState(false);

  const reduce = useRef(false);
  const cardEl = useRef<HTMLDivElement | null>(null);
  const locked = useRef(false);

  useEffect(() => { reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  useEffect(() => { setDeck(buildDeck()); }, []);

  const item = deck[pos];
  const lastAns = answers[answers.length - 1];

  const startDeck = (roleId?: string) => { setDeck(buildDeck(roleId)); setPos(0); setAnswers([]); setPhase("swipe"); setMenuOpen(false); locked.current = false; };

  const decide = useCallback((believe: boolean) => {
    if (locked.current || phase !== "swipe" || !item) return;
    locked.current = true;
    setAnswers((a) => [...a, { card: item.card, role: item.role, believe }]);
    track({ cardId: item.card.id, category: item.role, verdict: item.card.verdict, believe });
    setFling(believe ? 1 : -1);
    setPhase(reduce.current ? "result" : "flinging"); // the card swipes/fades off, then the result
    if (reduce.current) setSecs(5);
  }, [phase, item]);

  // the card flings off + fades, then the verdict fades in
  useEffect(() => {
    if (phase !== "flinging") return;
    const t = setTimeout(() => { setPhase("result"); setSecs(5); }, 320);
    return () => clearTimeout(t);
  }, [phase]);

  const advance = useCallback(() => {
    locked.current = false; setFling(0);
    if (pos + 1 >= deck.length) { setPhase("final"); track({ round: true }); }
    else { setPos(pos + 1); setPhase("swipe"); }
  }, [pos, deck.length]);

  // hidden stats dashboard — type "qwerty"
  useEffect(() => {
    let buf = "";
    const onKey = (e: KeyboardEvent) => { if (e.key.length === 1) { buf = (buf + e.key.toLowerCase()).slice(-6); if (buf === "qwerty") setStatsOpen(true); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // While the verdict shows: count seconds for the label, and let the ring's own
  // animationEnd drive the advance (so the loop always completes). A timeout is a
  // safety net (and the only timer when motion is reduced / animation disabled).
  useEffect(() => {
    if (phase !== "result") return;
    setSecs(5);
    const iv = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    const fb = setTimeout(advance, reduce.current ? 1500 : 5800);
    return () => { clearInterval(iv); clearTimeout(fb); };
  }, [phase, pos, advance]);

  // drag the active card (swipe phase only)
  useEffect(() => {
    if (phase !== "swipe") return;
    const el = cardEl.current; if (!el) return;
    const yes = el.querySelector<HTMLElement>(".stamp.yes"), no = el.querySelector<HTMLElement>(".stamp.no");
    let sx = 0, dx = 0, dragging = false;
    const down = (e: PointerEvent) => { if (locked.current) return; if ((e.target as HTMLElement).closest(".card-actions")) return; dragging = true; sx = e.clientX; el.style.transition = "none"; try { el.setPointerCapture(e.pointerId); } catch {} };
    const move = (e: PointerEvent) => {
      if (!dragging || locked.current) return;
      dx = e.clientX - sx; if (Math.abs(dx) > 6) e.preventDefault();
      el.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
      const t = Math.min(Math.abs(dx) / 90, 1);
      if (yes) yes.style.opacity = dx > 0 ? String(t) : "0";
      if (no) no.style.opacity = dx < 0 ? String(t) : "0";
    };
    const up = () => {
      if (!dragging || locked.current) return; dragging = false; el.style.transition = "";
      const commit = Math.abs(dx) > 95, believe = dx > 0;
      if (commit) { decide(believe); } // leave transform — React applies the fling-off style
      else { el.style.transform = ""; if (yes) yes.style.opacity = "0"; if (no) no.style.opacity = "0"; }
      dx = 0;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    return () => { el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [phase, pos, decide]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "swipe") { if (e.key === "ArrowLeft") decide(false); if (e.key === "ArrowRight") decide(true); }
      else if (phase === "result" && (e.key === "ArrowRight" || e.key === " " || e.key === "Enter")) { e.preventDefault(); advance(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, decide, advance]);

  const stop = (e: React.PointerEvent) => e.stopPropagation();

  // verdict bits
  const aligned = lastAns ? isAligned(lastAns.card.verdict, lastAns.believe) : false;
  const contested = lastAns?.card.verdict === "contested";
  const voClass = contested ? "fair" : aligned ? "yes" : "nope";
  const voBig = contested ? "FAIR" : aligned ? "YES!" : "NOPE";

  // score (for the final card)
  const scored = answers.filter((a) => a.card.verdict !== "contested");
  const matched = scored.filter((a) => isAligned(a.card.verdict, a.believe)).length;
  const overs = answers.filter((a) => a.card.verdict === "unlikely" && a.believe).length;
  const unders = answers.filter((a) => a.card.verdict === "already" && !a.believe).length;
  const prof = profileFor(matched, scored.length, overs, unders);

  const behind = deck.length - 1 - pos;
  const depths: number[] = [];
  for (let d = Math.min(2, behind); d >= 0; d--) depths.push(d);

  return (
    <section className="stf-banner">
      <div className="banner-inner">
        <div className="bcol-l">
          <div className="stf-head">
            <span className="eyebrow">Futures Atlas · № 01 · Calibration</span>
            <h1>Swipe the <em>future.</em></h1>
            <p className="lede">It&apos;s 2026, and AI and quantum computing are rewriting what work looks like — fast, and unevenly. Every card here is a real claim about where things <em>actually</em> stand for a given line of work: each one fact-checked and linked to its source — no hype, no doom. Swipe Believe or Doubt on ten of them, then see how far your gut sat from the evidence, and which categories you read best.</p>
          </div>
        </div>
        <div className="bcol-r">

      <div className="deck-head">
        <div className="dots">{deck.map((_, k) => <span key={k} className={`dot${k < pos ? " done" : k === pos ? " cur" : ""}`} />)}</div>
        <span className="count">{phase === "final" ? "DONE" : `${pad(pos + 1)} / ${pad(deck.length || ROUND)}`}</span>
      </div>

      <div className="tinder">
        {phase === "final" ? (
          <div className="tcard final">
            <span className="card-eyebrow">Phase 1 · your calibration</span>
            <div className="score-big">{matched}<span className="sof">/ {scored.length}</span></div>
            <div className="score-sub">matched the evidence {prof.lblNote}</div>
            <div className="pname">{prof.name}</div>
            <p className="pdesc">{prof.desc}</p>
            <div className="final-actions">
              <button className="card-cta" onClick={() => startDeck()}>Keep going — 10 more →</button>
              <button className="card-cta ghost" onClick={() => setMenuOpen(true)}>Explore a category →</button>
            </div>
          </div>
        ) : (
          depths.map((d) => {
            const active = d === 0;
            if (active && phase === "result" && lastAns) {
              return (
                <div key={`res-${pos}`} className="tcard is-result">
                  <div className={`vo-big ${voClass}`}>{voBig}</div>
                  <div className="vo-label">Evidence: {VLABEL[lastAns.card.verdict]}</div>
                  <p className="vo-insight">{lastAns.card.note}</p>
                  <div className="vo-src">{lastAns.card.source.url ? <a href={lastAns.card.source.url} target="_blank" rel="noopener noreferrer">{lastAns.card.source.label} ↗</a> : lastAns.card.source.label}</div>
                  <button className="nextring" onClick={advance} aria-label="Next claim">
                    <svg viewBox="0 0 72 72" aria-hidden="true">
                      <circle className="ring-bg" cx="36" cy="36" r="32" pathLength={100} />
                      <circle className="ring-fg" cx="36" cy="36" r="32" pathLength={100} onAnimationEnd={advance} />
                    </svg>
                    <span className="nr-label">Next</span>
                  </button>
                </div>
              );
            }
            const it = deck[pos + d]!;
            const flung = active && phase === "flinging";
            const flingStyle = flung ? { transform: `translateX(${fling * 130}%) rotate(${fling * 18}deg)`, opacity: 0 } : undefined;
            return (
              <div key={`claim-${pos + d}-${it.card.id}`} ref={active && phase === "swipe" ? cardEl : undefined} className={`tcard${d === 1 ? " b1" : d === 2 ? " b2" : ""}${it.card.attribution ? " quote" : ""}`} style={flingStyle}>
                {it.card.attribution && <span className="quote-mark" aria-hidden="true">&ldquo;</span>}
                <h3 className="claim">{it.card.attribution ? <><span className="qtext">{it.card.claim}</span><span className="quote-by">— {it.card.attribution}</span></> : it.card.claim}</h3>
                {active && phase === "swipe" && (
                  <div className="card-actions">
                    <span className="ca"><button className="round no" onPointerDown={stop} onClick={() => decide(false)} aria-label="Doubt — won't happen / not true">✕</button><span className="ca-lbl">Doubt</span></span>
                    <span className="ca"><button className="round yes" onPointerDown={stop} onClick={() => decide(true)} aria-label="Believe — likely / true">✓</button><span className="ca-lbl">Believe</span></span>
                  </div>
                )}
                {active && (phase === "swipe" || flung) && <><span className="stamp no" aria-hidden="true" style={flung && fling < 0 ? { opacity: 1 } : undefined}>✕</span><span className="stamp yes" aria-hidden="true" style={flung && fling > 0 ? { opacity: 1 } : undefined}>✓</span></>}
              </div>
            );
          })
        )}
        {phase === "final" && menuOpen && (
          <div className="cat-menu">
            <div className="cat-menu-head"><span>Explore a category</span><button className="cat-close" onClick={() => setMenuOpen(false)} aria-label="Close">✕</button></div>
            <div className="cat-list">
              {ROLES.map((r) => (
                <button key={r.id} className="cat-item" onClick={() => startDeck(r.id)}>
                  <span className="cat-name">{r.name}</span>
                  <span className="cat-blurb">{r.blurb}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="deckhint">{phase === "result" ? `Auto-advancing in ${secs}s` : phase === "final" ? "Pick up where you left off, or zoom in on one world" : "Swipe the card · tap ✕ / ✓ · or use ← / →"}</p>
        </div>
      </div>
      {statsOpen && <Stats onClose={() => setStatsOpen(false)} />}
    </section>
  );
}
