"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SECTORS, SECTOR_DECKS, WILDCARD_DECKS, VLABEL, isAligned, profileFor,
  type Card, type Sector,
} from "../data/sectors";

const MIXED = 10; // length of the "surprise me" round; a sector deck runs its own length
const pad = (n: number) => String(n).padStart(2, "0");

type Item = { card: Card; sector: Sector };
type Ans = { card: Card; sector: Sector; sayTrue: boolean };
type Phase = "pick" | "swipe" | "flinging" | "result" | "final";

// The mixed deck. `sector` here is whichever deck the card came from, so the
// result card can still credit it.
const MIXED_SECTOR: Sector = { id: "mixed", kind: "wildcard", name: "Mixed", blurb: "A bit of everything", cards: [] };

// fire-and-forget metrics. The wire field stays `believe` so the counters that
// have been accumulating since launch keep adding up under the same keys.
function track(body: Record<string, unknown>) {
  try { fetch("/api/swipe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {}); } catch { /* */ }
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
  const [phase, setPhase] = useState<Phase>("pick");
  const [secs, setSecs] = useState(5);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fling, setFling] = useState<0 | 1 | -1>(0);

  // sectors people have added themselves, fetched from the host API
  const [generated, setGenerated] = useState<Sector[]>([]);
  const [custom, setCustom] = useState("");
  const [gen, setGen] = useState<{ state: "idle" | "loading" | "error"; msg?: string }>({ state: "idle" });

  const reduce = useRef(false);
  const cardEl = useRef<HTMLDivElement | null>(null);
  const locked = useRef(false);

  useEffect(() => { reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  useEffect(() => {
    fetch("/api/swipe/sector", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.sectors)) setGenerated(d.sectors); })
      .catch(() => {});
  }, []);

  const item = deck[pos];
  const lastAns = answers[answers.length - 1];

  const startDeck = useCallback((s: Sector | null) => {
    let next: Item[];
    let used: Sector;
    if (!s) {
      used = MIXED_SECTOR;
      const pool = [...SECTORS, ...generated].flatMap((sec) => sec.cards.map((c) => ({ card: c, sector: sec })));
      next = shuffle(pool).slice(0, MIXED);
    } else {
      used = s;
      // A sector round is only that sector's cards — no topping up from
      // elsewhere, so "you picked Military" means what it says.
      next = shuffle(s.cards.map((c) => ({ card: c, sector: s })));
    }
    setSector(used); setDeck(next); setPos(0); setAnswers([]);
    setPhase("swipe"); setPickerOpen(false); locked.current = false;
  }, [generated]);

  const decide = useCallback((sayTrue: boolean) => {
    if (locked.current || phase !== "swipe" || !item) return;
    locked.current = true;
    setAnswers((a) => [...a, { card: item.card, sector: item.sector, sayTrue }]);
    track({ cardId: item.card.id, category: item.sector.id, verdict: item.card.verdict, believe: sayTrue });
    setFling(sayTrue ? 1 : -1);
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
      const commit = Math.abs(dx) > 95, sayTrue = dx > 0;
      if (commit) { decide(sayTrue); } // leave transform — React applies the fling-off style
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

  // Ask the host to draft a sector nobody has covered yet. Claude searches the
  // web for it, so this takes a while — the button holds a spinner throughout.
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

  // verdict bits
  const aligned = lastAns ? isAligned(lastAns.card.verdict, lastAns.sayTrue) : false;
  const kinda = lastAns?.card.verdict === "contested";
  const voClass = kinda ? "kinda" : aligned ? "yes" : "nope";
  const voBig = kinda ? "KINDA" : aligned ? "YES!" : "NOPE";

  // score (for the final card). Contested cards are KINDA — they count as matched
  // either way (never against you), so a perfect run can reach N/N.
  const total = answers.length;
  const matched = answers.filter((a) => isAligned(a.card.verdict, a.sayTrue)).length;
  const overs = answers.filter((a) => a.card.verdict === "unlikely" && a.sayTrue).length;
  const unders = answers.filter((a) => a.card.verdict === "already" && !a.sayTrue).length;
  const prof = profileFor(matched, total, overs, unders);

  const behind = deck.length - 1 - pos;
  const depths: number[] = [];
  for (let d = Math.min(2, behind); d >= 0; d--) depths.push(d);

  const picker = (
    <div className="cat-menu">
      <div className="cat-menu-head">
        <span>Pick a sector</span>
        {phase !== "pick" && <button className="cat-close" onClick={() => setPickerOpen(false)} aria-label="Close">✕</button>}
      </div>
      <div className="cat-list">
        <button className="cat-item mixed" onClick={() => startDeck(null)}>
          <span className="cat-name">Surprise me</span>
          <span className="cat-blurb">Ten cards pulled from every sector at once</span>
        </button>

        <div className="cat-ask">
          <label className="cat-asklbl" htmlFor="stf-custom">Not here? Name a sector and we&apos;ll build it</label>
          <div className="cat-askrow">
            <input
              id="stf-custom" className="cat-input" value={custom} placeholder="e.g. shipping, archaeology, social work"
              onChange={(e) => { setCustom(e.target.value); if (gen.state === "error") setGen({ state: "idle" }); }}
              onKeyDown={(e) => { if (e.key === "Enter") requestSector(); }}
              disabled={gen.state === "loading"} maxLength={40}
            />
            <button className="cat-go" onClick={requestSector} disabled={custom.trim().length < 3 || gen.state === "loading"}>
              {gen.state === "loading" ? <span className="spin" aria-hidden="true" /> : "→"}
            </button>
          </div>
          {gen.state === "loading" && <span className="cat-note">Reading up on it — this takes two or three minutes, so hold on.</span>}
          {gen.state === "error" && <span className="cat-note err">{gen.msg}</span>}
        </div>

        {generated.length > 0 && (
          <>
            <div className="cat-group">Added by visitors</div>
            {generated.map((s) => (
              <button key={s.id} className="cat-item" onClick={() => startDeck(s)}>
                <span className="cat-name">{s.name}{!s.approved && <span className="cat-badge">AI-drafted</span>}</span>
                <span className="cat-blurb">{s.blurb}</span>
              </button>
            ))}
          </>
        )}

        <div className="cat-group">Sectors</div>
        {SECTOR_DECKS.map((s) => (
          <button key={s.id} className="cat-item" onClick={() => startDeck(s)}>
            <span className="cat-name">{s.name}</span>
            <span className="cat-blurb">{s.blurb}</span>
          </button>
        ))}

        <div className="cat-group">Wildcards</div>
        {WILDCARD_DECKS.map((s) => (
          <button key={s.id} className="cat-item" onClick={() => startDeck(s)}>
            <span className="cat-name">{s.name}</span>
            <span className="cat-blurb">{s.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section className="stf-banner">
      <div className="banner-inner">
        <div className="bcol-l">
          <div className="stf-head">
            <span className="eyebrow">Futures Atlas · № 01 · Calibration</span>
            <h1>Swipe the <em>future.</em></h1>
            <p className="lede">It&apos;s 2026, and AI and quantum computing are rewriting whole sectors — fast, and unevenly. Every card here is a real claim about where things <em>actually</em> stand: each one fact-checked and linked to its source, no hype, no doom. Pick a sector, call each claim <em>true</em> or <em>false</em>, then see how far your gut sat from the evidence.</p>
            <p className="stf-links">
              <a href="/swipe-the-future/stats">See what everyone else answered →</a>
            </p>
          </div>
        </div>
        <div className="bcol-r">

      <div className="deck-head">
        {phase === "pick" ? (
          <span className="count">Choose your deck</span>
        ) : (
          <>
            <div className="dots">{deck.map((_, k) => <span key={k} className={`dot${k < pos ? " done" : k === pos ? " cur" : ""}`} />)}</div>
            <span className="count">{phase === "final" ? "DONE" : `${pad(pos + 1)} / ${pad(deck.length)}`}</span>
          </>
        )}
      </div>

      <div className="tinder">
        {phase === "pick" ? picker : phase === "final" ? (
          <div className="tcard final">
            <span className="card-eyebrow">{sector.name} · your calibration</span>
            <div className="score-big">{matched}<span className="sof">/ {total}</span></div>
            <div className="score-sub">matched the evidence {prof.lblNote}</div>
            <div className="pname">{prof.name}</div>
            <p className="pdesc">{prof.desc}</p>
            <div className="final-actions">
              <button className="card-cta" onClick={() => startDeck(null)}>Ten more, mixed →</button>
              <button className="card-cta ghost" onClick={() => setPickerOpen(true)}>Pick another sector →</button>
              <a className="card-cta ghost" href="/swipe-the-future/stats">How did everyone else do? →</a>
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
                  <div className="vo-src">
                    {lastAns.card.source.url ? <a href={lastAns.card.source.url} target="_blank" rel="noopener noreferrer">{lastAns.card.source.label} ↗</a> : lastAns.card.source.label}
                    {lastAns.card.checked && <span className="vo-checked"> · checked {lastAns.card.checked}</span>}
                  </div>
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
                {it.sector.kind === "generated" && !it.sector.approved && <span className="draft-flag">AI-drafted · unverified</span>}
                <h3 className="claim">{it.card.attribution ? <><span className="qtext">{it.card.claim}</span><span className="quote-by">— {it.card.attribution}</span></> : it.card.claim}</h3>
                {active && phase === "swipe" && (
                  <div className="card-actions">
                    <span className="ca"><button className="round no" onPointerDown={stop} onClick={() => decide(false)} aria-label="False">✕</button><span className="ca-lbl">False</span></span>
                    <span className="ca"><button className="round yes" onPointerDown={stop} onClick={() => decide(true)} aria-label="True">✓</button><span className="ca-lbl">True</span></span>
                  </div>
                )}
                {active && (phase === "swipe" || flung) && <><span className="stamp no" aria-hidden="true" style={flung && fling < 0 ? { opacity: 1 } : undefined}>✕</span><span className="stamp yes" aria-hidden="true" style={flung && fling > 0 ? { opacity: 1 } : undefined}>✓</span></>}
              </div>
            );
          })
        )}
        {phase !== "pick" && pickerOpen && picker}
      </div>

      <p className="deckhint">
        {phase === "pick" ? "Every claim is sourced — pick where to start"
          : phase === "result" ? `Auto-advancing in ${secs}s`
          : phase === "final" ? `${sector.name} · pick up where you left off, or switch sectors`
          : `${sector.name} · swipe the card · tap ✕ / ✓ · or use ← / →`}
      </p>
        </div>
      </div>
    </section>
  );
}
