"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ROLES, POS, VLABEL, VCOLOR, isAligned, profileFor, type Role, type Card } from "../data/roles";

type View = "intro" | "deck" | "result";
type Phase = "swipe" | "flinging" | "reveal";
interface Answer { card: Card; believe: boolean }

const pad = (n: number) => String(n).padStart(2, "0");

export default function Calibration() {
  const [view, setView] = useState<View>("intro");
  const [role, setRole] = useState<Role | null>(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [phase, setPhase] = useState<Phase>("swipe");
  const [fling, setFling] = useState<0 | 1 | -1>(0); // direction the committed card flies
  const [meterOn, setMeterOn] = useState(false);

  const reduce = useRef(false);
  useEffect(() => { reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);

  const cardEl = useRef<HTMLDivElement | null>(null);
  const locked = useRef(false);

  const startRole = (r: Role) => {
    setRole(r); setI(0); setAnswers([]); setPhase("swipe"); setFling(0); setMeterOn(false);
    locked.current = false; setView("deck");
  };

  const decide = useCallback((believe: boolean) => {
    if (locked.current || !role || phase !== "swipe") return;
    locked.current = true;
    const c = role.cards[i]!;
    setAnswers((a) => [...a, { card: c, believe }]);
    setFling(believe ? 1 : -1);
    setPhase("flinging");
  }, [role, i, phase]);

  // flinging → reveal, then animate the meter in
  useEffect(() => {
    if (phase !== "flinging") return;
    const t = setTimeout(() => { setPhase("reveal"); setMeterOn(false); }, reduce.current ? 0 : 240);
    return () => clearTimeout(t);
  }, [phase]);
  useEffect(() => {
    if (phase !== "reveal") return;
    const t = setTimeout(() => setMeterOn(true), reduce.current ? 0 : 70);
    return () => clearTimeout(t);
  }, [phase]);

  const next = useCallback(() => {
    if (!role) return;
    if (i + 1 < role.cards.length) { setI(i + 1); setPhase("swipe"); setFling(0); setMeterOn(false); locked.current = false; }
    else { setView("result"); }
  }, [role, i]);

  // ── pointer drag on the active card (swipe phase only) ─────────────────────
  useEffect(() => {
    if (view !== "deck" || phase !== "swipe") return;
    const el = cardEl.current;
    if (!el) return;
    const yes = el.querySelector<HTMLElement>(".stamp.yes");
    const no = el.querySelector<HTMLElement>(".stamp.no");
    let sx = 0, sy = 0, dx = 0, dy = 0, dragging = false;
    const onDown = (e: PointerEvent) => {
      if (locked.current) return;
      dragging = true; sx = e.clientX; sy = e.clientY; el.style.transition = "none";
      try { el.setPointerCapture(e.pointerId); } catch { /* */ }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || locked.current) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      if (Math.abs(dx) > 6) e.preventDefault();
      el.style.transform = `translate(${dx}px, ${dy * 0.25}px) rotate(${dx / 18}deg)`;
      const t = Math.min(Math.abs(dx) / 90, 1);
      if (yes) yes.style.opacity = dx > 0 ? String(t) : "0";
      if (no) no.style.opacity = dx < 0 ? String(t) : "0";
    };
    const onUp = () => {
      if (!dragging || locked.current) return; dragging = false;
      el.style.transition = "";
      if (Math.abs(dx) > 95) decide(dx > 0);
      else { el.style.transform = ""; if (yes) yes.style.opacity = "0"; if (no) no.style.opacity = "0"; }
      dx = 0; dy = 0;
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [view, phase, i, decide]);

  // ── keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (view !== "deck") return;
      if (phase === "swipe") {
        if (e.key === "ArrowLeft") decide(false);
        if (e.key === "ArrowRight") decide(true);
      } else if (phase === "reveal") {
        if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); next(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, phase, decide, next]);

  // ── views ────────────────────────────────────────────────────────────────
  if (view === "intro") {
    return (
      <section className="screen active intro">
        <div className="intro-hero">
          <span className="eyebrow">Futures Atlas · № 01 · Calibration</span>
          <h1>Swipe the <em>future.</em></h1>
          <p className="lede">Six claims about where AI and quantum take your line of work. Swipe <strong>Believe</strong> or <strong>Doubt</strong> on each — then see how far your gut sat from where the evidence actually lands.</p>
        </div>
        <div className="pick">
          <span className="pick-label eyebrow">Choose your vantage point</span>
          <div className="role-grid">
            {ROLES.map((r, n) => (
              <button key={r.id} className="role" onClick={() => startRole(r)}>
                <span className="idx">{pad(n + 1)}</span>
                <span className="name">{r.name}</span>
                <span className="blurb">{r.blurb}</span>
                <span className="go">Swipe in →</span>
              </button>
            ))}
          </div>
        </div>
        <div className="foot">Imagine freely · Cite everything · MMXXVI</div>
      </section>
    );
  }

  if (view === "result" && role) {
    const scored = answers.filter((a) => a.card.verdict !== "contested");
    const matched = scored.filter((a) => isAligned(a.card.verdict, a.believe)).length;
    const unders = answers.filter((a) => a.card.verdict === "already" && !a.believe);
    const overs = answers.filter((a) => a.card.verdict === "unlikely" && a.believe);
    const prof = profileFor(matched, scored.length, overs.length, unders.length);
    const items = [
      ...unders.map((a) => ({ type: "under" as const, claim: a.card.claim })),
      ...overs.map((a) => ({ type: "over" as const, claim: a.card.claim })),
    ];
    return (
      <section className="screen active">
        <div className="res-h"><span className="eyebrow">Your calibration</span><h2>Seen as a {role.name.toLowerCase()}</h2></div>
        <div className="cols">
          <div className="s-l">
            <div className="score">
              <span className="big">{matched}</span>
              <span className="of">/ {scored.length} calls</span>
              <span className="lbl">matched the evidence {prof.lblNote}</span>
            </div>
            <div className="profile">
              <div className="pk">Your futures profile</div>
              <div className="pv">{prof.name}</div>
              <div className="pd">{prof.desc}</div>
            </div>
            <div className="res-actions">
              <button className="btn next" onClick={() => setView("intro")}>Try another world →</button>
              <button className="btn ghost" onClick={() => startRole(role)}>Re-run this one</button>
              <a className="btn ghost" href="/social-composer?transmutate=https://futures-atlas-02.vercel.app/swipe-the-future">Make a shareable post →</a>
            </div>
          </div>
          <div className="s-r">
            {items.length > 0 ? (
              <div className="misjudged">
                <span className="eyebrow">Where you and the evidence parted ways</span>
                <div>
                  {items.map((it, k) => (
                    <div className="mj" key={k}>
                      <span className={`badge ${it.type}`}>{it.type === "under" ? "Already real" : "Ahead of evidence"}</span>
                      <span className="txt"><b>{it.claim}</b> <span>{it.type === "under" ? "— you doubted something that's already happening." : "— you backed a claim the evidence doesn't yet support."}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="misjudged"><span className="eyebrow">Where you and the evidence parted ways</span><p className="mj-none">Nothing major — your calls tracked the evidence across the board.</p></div>
            )}
            <div className="foot">Each card links back to a real source · Futures Atlas</div>
          </div>
        </div>
      </section>
    );
  }

  // deck
  if (!role) return null;
  const card = role.cards[i]!;
  const youPos = (answers[answers.length - 1]?.believe ?? false) ? 0.85 : 0.15;
  const evPos = POS[card.verdict];
  const aligned = isAligned(card.verdict, answers[answers.length - 1]?.believe ?? false);
  const contested = card.verdict === "contested";
  // stacked cards: current + up to 2 behind, deepest first so the active one paints last
  const behind = role.cards.length - 1 - i;
  const depths: number[] = [];
  for (let d = Math.min(2, behind); d >= 0; d--) depths.push(d);

  return (
    <section className="screen active deck">
      <div className="deck-head">
        <span className="lens">{role.name}</span>
        <div className="dots">{role.cards.map((_, k) => <span key={k} className={`dot${k < i ? " done" : k === i ? " cur" : ""}`} />)}</div>
        <span className="count">{pad(i + 1)} / {pad(role.cards.length)}</span>
      </div>

      <div className="tinder">
        {phase === "reveal" ? (
          <div className="tcard reveal-card">
            <div className="reveal">
              <span className="verdict-k">The evidence says</span>
              <span className="verdict-v" style={{ color: VCOLOR[card.verdict] }}>{VLABEL[card.verdict]}</span>
              <div className="meter">
                <div className="track">
                  <b style={{ width: meterOn ? `${evPos * 100}%` : "0%", background: VCOLOR[card.verdict] }} />
                  <span className={`mk ev${meterOn ? " show" : ""}`} style={{ left: `${evPos * 100}%` }} />
                  <span className={`mk you${meterOn ? " show" : ""}`} style={{ left: `${youPos * 100}%` }} />
                </div>
                <div className="ends"><span>Unlikely</span><span>Already real</span></div>
                <div className="legend"><span className="ev"><i />Evidence</span><span className="you"><i />Your call</span></div>
              </div>
              <div className="verdict-tick">
                <span className="dot" style={{ background: contested ? "var(--slate)" : aligned ? "var(--verdigris)" : "var(--oxblood)" }} />
                {contested ? "Judgment call — the evidence is genuinely split here." : aligned ? "Your gut tracked the evidence." : "Your gut and the evidence diverged."}
              </div>
              <p className="note">{card.note}</p>
              <div className="src">
                {card.source.url
                  ? <>Source · <a href={card.source.url} target="_blank" rel="noopener noreferrer">{card.source.label} ↗</a></>
                  : <>Source · {card.source.label}</>}
              </div>
            </div>
          </div>
        ) : (
          depths.map((d) => {
            const c = role.cards[i + d]!;
            const active = d === 0;
            const flungStyle = active && phase === "flinging" && !reduce.current
              ? { transform: `translate(${fling * 130}%, ${fling * -4}%) rotate(${fling * 16}deg)`, opacity: 0 }
              : undefined;
            return (
              <div key={c.id} ref={active ? cardEl : undefined} className={`tcard${d === 1 ? " b1" : d === 2 ? " b2" : ""}`} style={flungStyle}>
                <span className="tcard-tag">Claim {pad(i + d + 1)} · swipe to judge</span>
                <h3 className="claim">{c.claim}</h3>
                <div className="tcard-foot"><span className="l" aria-label="Doubt">✕</span><span className="r" aria-label="Believe">✓</span></div>
                {active && <><span className="stamp no" aria-hidden="true">✕</span><span className="stamp yes" aria-hidden="true">✓</span></>}
              </div>
            );
          })
        )}
      </div>

      <div className="swipe-actions">
        {phase === "reveal"
          ? <button className="btn next" onClick={next}>{i + 1 < role.cards.length ? "Next claim →" : "See your calibration →"}</button>
          : <>
              <button className="round no" onClick={() => decide(false)} aria-label="Doubt — won't happen / not true">✕</button>
              <button className="round yes" onClick={() => decide(true)} aria-label="Believe — likely / true">✓</button>
            </>}
      </div>
      <p className="deckhint">{phase === "reveal" ? "The gap between the two markers is the point" : "Drag the card · tap a button · or use ← / →"}</p>
    </section>
  );
}
