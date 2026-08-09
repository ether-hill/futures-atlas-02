"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SECTORS, VLABEL, isAligned, profileFor,
  type Card, type Sector,
} from "../data/sectors";
import { SectorFilter } from "./SectorFilter";

const MIXED = 10; // length of the "surprise me" round; a sector deck runs its own length
const pad = (n: number) => String(n).padStart(2, "0");

type Item = { card: Card; sector: Sector };
type Ans = { card: Card; sector: Sector; sayReal: boolean };
type Phase = "swipe" | "flinging" | "result" | "final";

// The mixed deck. `sector` here is whichever deck the card came from, so the
// result card can still credit it.
const MIXED_SECTOR: Sector = { id: "mixed", kind: "wildcard", name: "Mixed", blurb: "A bit of everything", cards: [] };

// fire-and-forget metrics. `v: 2` tells the host this answer is to the
// already/not-yet question, so it lands in the v2 counters and never mixes with
// v1's true/false tallies, which were gathered against a different question.
function track(body: Record<string, unknown>) {
  try { fetch("/api/swipe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ v: 2, ...body }), keepalive: true }).catch(() => {}); } catch { /* */ }
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j]!, r[i]!]; }
  return r;
}

export default function Calibration() {
  const [deck, setDeck] = useState<Item[]>([]);
  const [sector, setSector] = useState<Sector>(MIXED_SECTOR);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<Ans[]>([]);
  const [phase, setPhase] = useState<Phase>("swipe");
  const [fling, setFling] = useState<0 | 1 | -1>(0);

  // sectors people have added themselves, fetched from the host API
  const [generated, setGenerated] = useState<Sector[]>([]);
  const [custom, setCustom] = useState("");
  const [gen, setGen] = useState<{ state: "idle" | "loading" | "error"; msg?: string }>({ state: "idle" });

  const reduce = useRef(false);
  const cardEl = useRef<HTMLDivElement | null>(null);
  const locked = useRef(false);
  const roundTracked = useRef(false);

  useEffect(() => { reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  useEffect(() => {
    fetch("/api/swipe/sector", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.sectors)) setGenerated(d.sectors); })
      .catch(() => {});
  }, []);

  const item = deck[pos];
  const lastAns = answers[pos];

  // The first thing anyone sees is a card, face up. Sector choice lives in its
  // own section further down; you do not have to make a decision to start.
  useEffect(() => {
    const pool = SECTORS.flatMap((sec) => sec.cards.map((c) => ({ card: c, sector: sec })));
    setDeck(shuffle(pool).slice(0, MIXED));
  }, []);

  const startDeck = useCallback((s: Sector | null) => {
    let next: Item[];
    let used: Sector;
    if (!s) {
      used = MIXED_SECTOR;
      const pool = [...SECTORS, ...generated].flatMap((sec) => sec.cards.map((c) => ({ card: c, sector: sec })));
      next = shuffle(pool).slice(0, MIXED);
    } else {
      used = s;
      // A sector round is only that sector's cards, no topping up from
      // elsewhere, so "you picked Military" means what it says.
      next = shuffle(s.cards.map((c) => ({ card: c, sector: s })));
    }
    setSector(used); setDeck(next); setPos(0); setAnswers([]);
    setPhase("swipe"); locked.current = false; roundTracked.current = false;
  }, [generated]);

  const decide = useCallback((sayReal: boolean) => {
    if (locked.current || phase !== "swipe" || !item) return;
    locked.current = true;
    setAnswers((a) => [...a, { card: item.card, sector: item.sector, sayReal }]);
    track({ cardId: item.card.id, category: item.sector.id, verdict: item.card.verdict, real: sayReal });
    setFling(sayReal ? 1 : -1);
    setPhase(reduce.current ? "result" : "flinging"); // the card swipes/fades off, then the result
  }, [phase, item]);

  // the card flings off + fades, then the verdict fades in
  useEffect(() => {
    if (phase !== "flinging") return;
    const t = setTimeout(() => setPhase("result"), 320);
    return () => clearTimeout(t);
  }, [phase]);

  // Step to any card in the deck. A card you have already answered reopens on
  // its reveal rather than asking you again, so going back cannot double-count.
  const goTo = useCallback((next: number) => {
    locked.current = false; setFling(0);
    if (next >= deck.length) {
      setPhase("final");
      if (!roundTracked.current) { roundTracked.current = true; track({ round: true }); }
      return;
    }
    setPos(next);
    setPhase(answers[next] ? "result" : "swipe");
  }, [deck.length, answers]);

  const advance = useCallback(() => goTo(pos + 1), [goTo, pos]);
  const goBack = useCallback(() => { if (pos > 0) goTo(pos - 1); }, [goTo, pos]);

  // drag the active card (swipe phase only)
  useEffect(() => {
    if (phase !== "swipe") return;
    const el = cardEl.current; if (!el) return;
    const yes = el.querySelector<HTMLElement>(".stamp.yes"), no = el.querySelector<HTMLElement>(".stamp.no");

    // Thresholds scale with the card. A fixed 95px commit is most of the width
    // on a phone, which is what made swiping there feel like it was ignoring you.
    const width = () => el.getBoundingClientRect().width || 320;
    let sx = 0, sy = 0, dx = 0, dragging = false, decided = false, pid = -1;

    const paint = (v: number) => {
      el.style.transform = `translateX(${v}px) rotate(${v / 22}deg)`;
      const t = Math.min(Math.abs(v) / (width() * 0.28), 1);
      if (yes) yes.style.opacity = v > 0 ? String(t) : "0";
      if (no) no.style.opacity = v < 0 ? String(t) : "0";
    };
    const reset = () => {
      el.style.transition = "";
      el.style.transform = "";
      if (yes) yes.style.opacity = "0";
      if (no) no.style.opacity = "0";
    };

    const down = (e: PointerEvent) => {
      if (locked.current) return;
      if ((e.target as HTMLElement).closest(".card-actions")) return;
      dragging = true; decided = false; pid = e.pointerId;
      sx = e.clientX; sy = e.clientY; dx = 0;
      el.style.transition = "none";
      try { el.setPointerCapture(e.pointerId); } catch { /* not fatal */ }
    };
    const move = (e: PointerEvent) => {
      if (!dragging || locked.current || e.pointerId !== pid) return;
      dx = e.clientX - sx;
      // Ignore a mostly-vertical drag: that is someone scrolling, not swiping.
      if (!decided && Math.abs(dx) < 8 && Math.abs(e.clientY - sy) > 12) { dragging = false; reset(); return; }
      if (Math.abs(dx) > 4) { decided = true; e.preventDefault(); }
      paint(dx);
    };
    const up = (e: PointerEvent) => {
      if (!dragging || locked.current) return;
      if (e.pointerId !== pid) return;
      dragging = false;
      try { el.releasePointerCapture(pid); } catch { /* already released */ }
      el.style.transition = "";
      if (Math.abs(dx) > width() * 0.28) decide(dx > 0); // leave the transform; React flings it
      else reset();
      dx = 0;
    };

    el.addEventListener("pointerdown", down);
    // On the element, not the window: pointer capture routes the rest here, and
    // a lost pointer (a call, a gesture) then cancels cleanly instead of sticking.
    el.addEventListener("pointermove", move, { passive: false });
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", () => { if (dragging) { dragging = false; reset(); } });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
  }, [phase, pos, decide]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "swipe") { if (e.key === "ArrowLeft") decide(false); if (e.key === "ArrowRight") decide(true); }
      else if (phase === "result") {
        if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); advance(); }
        if (e.key === "ArrowLeft") { e.preventDefault(); goBack(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, decide, advance, goBack]);

  // Ask the host to draft a sector nobody has covered yet. Claude searches the
  // web for it, so this takes a while, the button holds a spinner throughout.
  const requestSector = useCallback(async () => {
    const name = custom.trim();
    if (name.length < 3 || gen.state === "loading") return;
    setGen({ state: "loading" });
    try {
      const r = await fetch("/api/swipe/sector", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ sector: name }),
      });
      const d = await r.json();
      if (!r.ok || !d?.ok) { setGen({ state: "error", msg: d?.message ?? "Couldn't build that one." }); return; }
      setGenerated((g) => [d.sector, ...g.filter((x) => x.id !== d.sector.id)]);
      setCustom(""); setGen({ state: "idle" });
      startDeck(d.sector);
    } catch {
      setGen({ state: "error", msg: "Couldn't reach the server." });
    }
  }, [custom, gen.state, startDeck]);

  const stop = (e: React.PointerEvent) => e.stopPropagation();

  // verdict bits. The big word grades the answer, it does not restate the claim:
  // someone who swiped NOT YET and was right should be told they were right, not
  // handed the claim back at them.
  const aligned = lastAns ? isAligned(lastAns.card.verdict, lastAns.sayReal) : false;
  const voClass = aligned ? "correct" : "wrong";
  const voBig = aligned ? "CORRECT" : "WRONG";

  // score (for the final card). Every card is scorable now, so N/N means N/N.
  // `overs` is buying a thing that has not happened, `unders` is doubting a thing
  // that has. The two mistakes are different people, hence the two profiles.
  const total = answers.length;
  const matched = answers.filter((a) => isAligned(a.card.verdict, a.sayReal)).length;
  const overs = answers.filter((a) => a.card.verdict === "notyet" && a.sayReal).length;
  const unders = answers.filter((a) => a.card.verdict === "already" && !a.sayReal).length;
  const prof = profileFor(matched, total, overs, unders);

  const behind = deck.length - 1 - pos;
  const depths: number[] = [];
  for (let d = Math.min(2, behind); d >= 0; d--) depths.push(d);

  return (
    <section className="stf-banner">
      <div className="banner-inner">
        <div className="bcol-l">
          <div className="stf-head">
            <h1>Swipe the <em>future.</em></h1>
            <p className="lede">Every card is one thing a machine might be doing in the world, fact-checked and linked to its source. Has it <em>already</em> happened, or <em>not yet?</em></p>
            <p className="stf-links">
              <a href="/swipe-the-future/stats">See what everyone else answered →</a>
            </p>
          </div>

          <SectorFilter
            current={sector.id}
            generated={generated}
            query={custom}
            gen={gen}
            onPick={startDeck}
            onQuery={(v) => { setCustom(v); if (gen.state === "error") setGen({ state: "idle" }); }}
            onRequest={requestSector}
          />
        </div>

        <div className="bcol-r">

      <div className="deck-head">
        <div className="dots">{deck.map((_, k) => <span key={k} className={`dot${k < pos ? " done" : k === pos ? " cur" : ""}`} />)}</div>
        <span className="count">{phase === "final" ? "DONE" : `${pad(pos + 1)} / ${pad(deck.length)}`}</span>
      </div>

      <div className="tinder">
        {phase === "final" ? (
          <div className="tcard final">
            <span className="card-eyebrow">{sector.name} · your calibration</span>
            <div className="score-big">{matched}<span className="sof">/ {total}</span></div>
            <div className="score-sub">matched the evidence {prof.lblNote}</div>
            <div className="pname">{prof.name}</div>
            <p className="pdesc">{prof.desc}</p>
            <div className="final-actions">
              <button className="card-cta" onClick={() => startDeck(null)}>Ten more, mixed →</button>
              
              <a className="card-cta ghost" href="/swipe-the-future/stats">How did everyone else do? →</a>
            </div>
          </div>
        ) : (
          depths.map((d) => {
            const active = d === 0;
            if (active && phase === "result" && lastAns) {
              return (
                <div key={`res-${pos}`} className="tcard is-result">
                  <div className="vo-body">
                    <div className={`vo-big ${voClass}`}>{voBig}</div>
                    <div className="vo-label">{VLABEL[lastAns.card.verdict]}</div>
                    {lastAns.card.attribution && <div className="vo-who">{lastAns.card.attribution}</div>}
                    <p className="vo-insight">{lastAns.card.note}</p>
                    <div className="vo-src">
                      {lastAns.card.source.url ? <a href={lastAns.card.source.url} target="_blank" rel="noopener noreferrer">{lastAns.card.source.label} ↗</a> : lastAns.card.source.label}
                      {lastAns.card.checked && <span className="vo-checked"> · checked {lastAns.card.checked}</span>}
                    </div>
                  </div>
                  {/* same wrapper as the False/True row, so Next lands under your thumb */}
                  <div className="card-actions">
                    {pos > 0 && (
                      <button className="ca-back" onClick={goBack} aria-label="Previous claim">‹ back</button>
                    )}
                    <span className="ca">
                      <button className="round next" onClick={advance} aria-label="Next claim">→</button>
                      <span className="ca-lbl">Next</span>
                    </span>
                  </div>
                </div>
              );
            }
            const it = deck[pos + d]!;
            const flung = active && phase === "flinging";
            const flingStyle = flung ? { transform: `translateX(${fling * 130}%) rotate(${fling * 18}deg)`, opacity: 0 } : undefined;
            return (
              <div key={`claim-${pos + d}-${it.card.id}`} ref={active && phase === "swipe" ? cardEl : undefined} className={`tcard${d === 1 ? " b1" : d === 2 ? " b2" : ""}${it.card.attribution ? " quote" : ""}`} style={flingStyle}>
                {it.card.attribution && <span className="quote-mark" aria-hidden="true">&ldquo;</span>}
                {it.sector.kind === "generated" && !it.sector.approved && <span className="draft-flag">AI-drafted · unverified</span>}
                <h3 className="claim">{it.card.attribution ? <><span className="qtext">{it.card.claim}</span><span className="quote-by">, {it.card.attribution}</span></> : it.card.claim}</h3>
                {active && phase === "swipe" && (
                  <div className="card-actions">
                    {pos > 0 && (
                      <button className="ca-back" onClick={goBack} aria-label="Previous claim">‹ back</button>
                    )}
                    <span className="ca">
                      <button className="round no" onPointerDown={stop} onClick={() => decide(false)} aria-label="Not yet">✕</button>
                      <span className="ca-lbl">Not yet</span>
                    </span>
                    <span className="ca">
                      <button className="round yes" onPointerDown={stop} onClick={() => decide(true)} aria-label="Already real">✓</button>
                      <span className="ca-lbl">Already real</span>
                    </span>
                  </div>
                )}
                {active && phase === "swipe" && <>
                  <span className="ca-hint left" aria-hidden="true">←</span>
                  <span className="ca-hint right" aria-hidden="true">→</span>
                </>}
                {active && (phase === "swipe" || flung) && <><span className="stamp no" aria-hidden="true" style={flung && fling < 0 ? { opacity: 1 } : undefined}>✕</span><span className="stamp yes" aria-hidden="true" style={flung && fling > 0 ? { opacity: 1 } : undefined}>✓</span></>}
              </div>
            );
          })
        )}
      </div>



        </div>
      </div>
    </section>
  );
}
