"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ROLES, POS, VLABEL, VCOLOR, isAligned, profileFor, type Card } from "../data/roles";

const ROUND = 10;
const pad = (n: number) => String(n).padStart(2, "0");

type Item = { card: Card; role: string };
type Ans = { card: Card; role: string; believe: boolean };

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j]!, r[i]!]; }
  return r;
}
// A round: a shuffled mix across every vantage point (or one vantage, if chosen).
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
  const [phase, setPhase] = useState<"swipe" | "result">("swipe");
  const [view, setView] = useState<"deck" | "score">("deck");
  const [secs, setSecs] = useState(5);

  const reduce = useRef(false);
  const cardEl = useRef<HTMLDivElement | null>(null);
  const locked = useRef(false);

  useEffect(() => { reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  useEffect(() => { setDeck(buildDeck()); }, []); // straight into a mixed round on load

  const item = deck[pos];
  const lastAns = answers[answers.length - 1];

  const startDeck = (roleId?: string) => {
    setDeck(buildDeck(roleId)); setPos(0); setAnswers([]); setPhase("swipe"); setView("deck"); locked.current = false;
  };

  const decide = useCallback((believe: boolean) => {
    if (locked.current || phase !== "swipe" || !item) return;
    locked.current = true;
    setAnswers((a) => [...a, { card: item.card, role: item.role, believe }]);
    setPhase("result"); setSecs(5);
  }, [phase, item]);

  const advance = useCallback(() => {
    setPhase("swipe"); locked.current = false;
    if (pos + 1 >= deck.length) setView("score");
    else setPos(pos + 1);
  }, [pos, deck.length]);

  // 5-second auto-advance while the verdict is showing
  useEffect(() => {
    if (phase !== "result") return;
    if (reduce.current) { const t = setTimeout(advance, 1400); return () => clearTimeout(t); }
    setSecs(5);
    const iv = setInterval(() => setSecs((s) => { if (s <= 1) { clearInterval(iv); advance(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(iv);
  }, [phase, pos, advance]);

  // pointer drag on the active card (swipe phase only) — no fling; verdict overlays in place
  useEffect(() => {
    if (view !== "deck" || phase !== "swipe") return;
    const el = cardEl.current; if (!el) return;
    const yes = el.querySelector<HTMLElement>(".stamp.yes"), no = el.querySelector<HTMLElement>(".stamp.no");
    let sx = 0, dx = 0, dragging = false;
    const down = (e: PointerEvent) => { if (locked.current) return; dragging = true; sx = e.clientX; el.style.transition = "none"; try { el.setPointerCapture(e.pointerId); } catch {} };
    const move = (e: PointerEvent) => {
      if (!dragging || locked.current) return;
      dx = e.clientX - sx;
      if (Math.abs(dx) > 6) e.preventDefault();
      el.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
      const t = Math.min(Math.abs(dx) / 90, 1);
      if (yes) yes.style.opacity = dx > 0 ? String(t) : "0";
      if (no) no.style.opacity = dx < 0 ? String(t) : "0";
    };
    const up = () => {
      if (!dragging || locked.current) return; dragging = false; el.style.transition = "";
      const commit = Math.abs(dx) > 95; const believe = dx > 0;
      el.style.transform = ""; if (yes) yes.style.opacity = "0"; if (no) no.style.opacity = "0"; dx = 0;
      if (commit) decide(believe);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    return () => { el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [view, phase, pos, decide]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (view !== "deck") return;
      if (phase === "swipe") { if (e.key === "ArrowLeft") decide(false); if (e.key === "ArrowRight") decide(true); }
      else if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); advance(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, phase, decide, advance]);

  // ── score / calibration ───────────────────────────────────────────────────
  if (view === "score") {
    const scored = answers.filter((a) => a.card.verdict !== "contested");
    const matched = scored.filter((a) => isAligned(a.card.verdict, a.believe)).length;
    const unders = answers.filter((a) => a.card.verdict === "already" && !a.believe);
    const overs = answers.filter((a) => a.card.verdict === "unlikely" && a.believe);
    const prof = profileFor(matched, scored.length, overs.length, unders.length);
    const items = [
      ...unders.map((a) => ({ type: "under" as const, claim: a.card.claim, role: a.role })),
      ...overs.map((a) => ({ type: "over" as const, claim: a.card.claim, role: a.role })),
    ];
    return (
      <section className="screen active">
        <div className="res-h"><span className="eyebrow">Phase 1 · your calibration</span><h2>{prof.name}</h2></div>
        <div className="cols">
          <div className="s-l">
            <div className="score">
              <span className="big">{matched}</span>
              <span className="of">/ {scored.length} scorable calls</span>
              <span className="lbl">matched the evidence {prof.lblNote}</span>
            </div>
            <div className="profile"><div className="pk">What that means</div><div className="pd">{prof.desc}</div></div>
            <div className="res-actions">
              <button className="btn next" onClick={() => startDeck()}>Keep going — 10 more →</button>
              <label className="vantage-pick">
                <span>Or focus a vantage point</span>
                <select defaultValue="" onChange={(e) => { if (e.target.value) startDeck(e.target.value); }}>
                  <option value="" disabled>Choose a vantage point…</option>
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
            </div>
          </div>
          <div className="s-r">
            <div className="misjudged">
              <span className="eyebrow">Where you and the evidence parted ways</span>
              {items.length > 0 ? (
                <div>{items.map((it, k) => (
                  <div className="mj" key={k}>
                    <span className={`badge ${it.type}`}>{it.type === "under" ? "Already real" : "Ahead of evidence"}</span>
                    <span className="txt"><b>{it.claim}</b> <span>· {it.role} {it.type === "under" ? "— you doubted something already happening." : "— you backed a claim the evidence doesn't yet support."}</span></span>
                  </div>
                ))}</div>
              ) : <p className="mj-none">Nothing major — your calls tracked the evidence across the board.</p>}
            </div>
            <div className="foot">Each card links back to a real source · Futures Atlas</div>
          </div>
        </div>
      </section>
    );
  }

  // ── deck ────────────────────────────────────────────────────────────────
  if (!item) return <section className="screen active deck"><div className="tinder" /></section>;
  const aligned = lastAns ? isAligned(lastAns.card.verdict, lastAns.believe) : false;
  const contested = lastAns?.card.verdict === "contested";
  const voClass = contested ? "fair" : aligned ? "yes" : "nope";
  const voBig = contested ? "FAIR" : aligned ? "YES!" : "NOPE";
  const behind = deck.length - 1 - pos;
  const depths: number[] = [];
  for (let d = Math.min(2, behind); d >= 0; d--) depths.push(d);

  return (
    <section className="screen active deck">
      <div className="deck-head">
        <span className="lens">{item.role}</span>
        <div className="dots">{deck.map((_, k) => <span key={k} className={`dot${k < pos ? " done" : k === pos ? " cur" : ""}`} />)}</div>
        <span className="count">{pad(pos + 1)} / {pad(deck.length)}</span>
      </div>

      <div className="tinder">
        {depths.map((d) => {
          const it = deck[pos + d]!;
          const active = d === 0;
          return (
            <div key={`${pos + d}-${it.card.id}`} ref={active ? cardEl : undefined} className={`tcard${d === 1 ? " b1" : d === 2 ? " b2" : ""}`}>
              <span className="tcard-tag">{it.role} · swipe to judge</span>
              <h3 className="claim">{it.card.claim}</h3>
              <div className="tcard-foot"><span className="l" aria-label="Doubt">✕</span><span className="r" aria-label="Believe">✓</span></div>
              {active && phase === "swipe" && <><span className="stamp no" aria-hidden="true">✕</span><span className="stamp yes" aria-hidden="true">✓</span></>}
            </div>
          );
        })}

        {phase === "result" && lastAns && (
          <div className={`verdict-ov ${voClass}`} role="status" aria-live="polite" onClick={advance}>
            <span className="vo-bar" />
            <div className="vo-big">{voBig}</div>
            <div className="vo-label">Evidence: {VLABEL[lastAns.card.verdict]}</div>
            <p className="vo-insight">{lastAns.card.note}</p>
            <div className="vo-src">
              {lastAns.card.source.url
                ? <a href={lastAns.card.source.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{lastAns.card.source.label} ↗</a>
                : lastAns.card.source.label}
            </div>
          </div>
        )}
      </div>

      <div className="swipe-actions">
        {phase === "result"
          ? <button className="btn next" onClick={advance}>Next →</button>
          : <>
              <button className="round no" onClick={() => decide(false)} aria-label="Doubt — won't happen / not true">✕</button>
              <button className="round yes" onClick={() => decide(true)} aria-label="Believe — likely / true">✓</button>
            </>}
      </div>
      <p className="deckhint">{phase === "result" ? `Auto-advancing in ${secs}s · tap to continue` : "Drag the card · tap a button · or use ← / →"}</p>
    </section>
  );
}
