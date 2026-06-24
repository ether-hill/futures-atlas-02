"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SCENARIOS, LENS, SHARE_AFTER, captionFor, type Lens, type Scenario } from "../data/scenarios";

const MEDIA_BASE = "/quantum-dominance/media/";
const byDeck = (d: Lens) => SCENARIOS.filter((s) => s.deck === d);

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j]!, r[i]!]; }
  return r;
}

// allow-list renderer: only <em> and <b>
function Markup({ html }: { html: string }) {
  const out: React.ReactNode[] = [];
  const re = /<(em|b)>([\s\S]*?)<\/\1>/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(html))) {
    if (m.index > last) out.push(html.slice(last, m.index));
    out.push(m[1] === "em" ? <em key={i++}>{m[2]}</em> : <b key={i++}>{m[2]}</b>);
    last = m.index + m[0].length;
  }
  if (last < html.length) out.push(html.slice(last));
  return <>{out}</>;
}

function Slot({ sc }: { sc: Scenario }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="slot">
      <div className="slot__inner">
        <div className="slot__bar"><span>◬ Media slot · {sc.id}</span><span className="ar">16:9</span></div>
        <div className="slot__label">Drop file → media/{sc.id}.{sc.type === "video" ? "mp4" : "jpg"}</div>
        <div className="slot__prompt">{sc.prompt}</div>
        <button className="slot__copy" onClick={() => { navigator.clipboard?.writeText(sc.prompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }); }}>{copied ? "⧉ Copied" : "⧉ Copy prompt"}</button>
      </div>
    </div>
  );
}

function MediaFrame({ sc }: { sc: Scenario }) {
  const [state, setState] = useState<"loading" | "ok" | "slot">("loading");
  useEffect(() => { setState("loading"); }, [sc.id]);
  const src = `${MEDIA_BASE}${sc.id}.${sc.type === "video" ? "mp4" : "jpg"}`;
  return (
    <div className={`scn-media${state === "ok" && sc.type === "image" ? " kb" : ""}`} key={sc.id}>
      {state === "slot" ? <Slot sc={sc} /> : sc.type === "video" ? (
        <video src={src} autoPlay muted loop playsInline onError={() => setState("slot")} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onLoad={() => setState("ok")} onError={() => setState("slot")} style={{ display: state === "ok" ? "block" : "none" }} />
      )}
      <div className="scrim" aria-hidden="true" />
    </div>
  );
}

interface StackItem { sc: Scenario; mode: Lens; key: number; }

export default function Experience() {
  const [mode, setMode] = useState<Lens>("dystopia");
  const [stack, setStack] = useState<StackItem[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [heroImg, setHeroImg] = useState(false);

  const queues = useRef<Record<Lens, string[]>>({ dystopia: [], backfire: [] });
  const keyRef = useRef(0);
  const shareRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const heroImgRef = useRef<HTMLImageElement | null>(null);
  const reduce = useRef(false);
  useEffect(() => { reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);
  // SSR/static export: the post image can finish loading before hydration, so onLoad never fires — catch it on mount
  useEffect(() => { const im = heroImgRef.current; if (im && im.complete && im.naturalWidth > 0) setHeroImg(true); }, []);

  const drawNext = (m: Lens): Scenario => {
    if (!queues.current[m].length) queues.current[m] = shuffle(byDeck(m).map((s) => s.id));
    const id = queues.current[m].shift()!;
    return byDeck(m).find((s) => s.id === id)!;
  };

  // append a fresh scenario panel; the scroll effect brings it into view
  const present = useCallback((m: Lens) => {
    setMode(m);
    setStack((s) => [...s, { sc: drawNext(m), mode: m, key: keyRef.current++ }]);
  }, []);

  const switchLens = (from: Lens) => present(from === "dystopia" ? "backfire" : "dystopia");

  // each new panel scrolls into view (stacking up the page)
  useEffect(() => {
    if (!stack.length) return;
    const el = document.getElementById(`qd-panel-${stack.length - 1}`);
    el?.scrollIntoView({ behavior: reduce.current ? "auto" : "smooth", block: "start" });
  }, [stack.length]);

  // composer: focus the close button on open, Esc closes, return focus to trigger, trap Tab
  useEffect(() => {
    if (!composerOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeComposer(); return; }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || !focusables.length) return;
      const first = focusables[0]!, last = focusables[focusables.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composerOpen]);
  const closeComposer = () => { setComposerOpen(false); requestAnimationFrame(() => shareRef.current?.focus()); };

  // composer stages every unique scenario seen, in order
  const viewed = stack.reduce<Scenario[]>((acc, e) => (acc.find((x) => x.id === e.sc.id) ? acc : [...acc, e.sc]), []);
  const viewCount = stack.length;
  const shareReady = viewCount >= SHARE_AFTER;

  return (
    <div className="qd-root" data-mode={mode}>
      {/* ── HERO · 50/50 ── */}
      <section className="hero" id="hero">
        <div className="hero__intro">
          <div className="hero__kicker"><span className="dot" aria-hidden="true" /> Futures Atlas · Quantum Dominance · Ed. 2026</div>
          <h1 className="hero__title"><span>Quantum</span><span>Dominance</span></h1>
          <p className="hero__sub">One vision. Two futures.</p>
          <p className="hero__summary">An official U.S. government account told the country to refill its popcorn. We took the bait — and mapped where the show goes next. Choose the lens you can stomach: the futures where the machine works <em>for</em> him, or the ones where it turns transparent the other way. <b>Speculative satire.</b></p>
          <div className="scroll-cue" aria-hidden="true">Pick a lens — each one builds the feed below<span className="arr">↓</span></div>
        </div>

        <div className="hero__deck">
          <div className="phone" aria-label="A facsimile of a post from the verified Department of War CTO account (@DoWCTO, Jun 22): 'Are you enjoying the show? Refill your popcorn — you'll love this next part,' captioned 'American (Q)uantum Dominance,' with the Quantum Dominance poster.">
            <div className="phone__island" aria-hidden="true" />
            <div className="phone__screen">
              <div className="sbar" aria-hidden="true"><span>9:41</span><span className="ic"><i /><i style={{ height: 9 }} /><i style={{ height: 5 }} /> ▮</span></div>
              <div className="post">
                <div className="post__head">
                  <div className="post__av" aria-hidden="true">▲</div>
                  <div className="post__who">
                    <div className="post__name">Department of War CTO <span className="vf" aria-hidden="true">✔</span></div>
                    <div className="post__handle">@DoWCTO · Jun 22</div>
                  </div>
                </div>
                <div className="post__text">Are you enjoying the show? Refill your popcorn… <span className="em">you&apos;ll love this next part.</span> 🍿</div>
                <div className="post__subline">AMERICAN (Q)UANTUM DOMINANCE</div>
                <div className="qd">
                  <div className="qd__cap" aria-hidden="true">AMERICAN (Q)UANTUM DOMINANCE</div>
                  <div className="qd__q" aria-hidden="true" />
                  <div className="qd__fig" aria-hidden="true" />
                  <div className="qd__title" aria-hidden="true"><b>QUANTUM</b><b>DOMINANCE</b></div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img ref={heroImgRef} className="qd__img" alt="" src={`${MEDIA_BASE}hero-post.jpg`} onLoad={() => setHeroImg(true)} onError={() => setHeroImg(false)} style={{ display: heroImg ? "block" : "none" }} />
                </div>
                <div className="post__attr">White House OSTP 47 and The White House</div>
                <div className="post__acts" aria-hidden="true"><span>↩ 2.8K</span><span>⇄ 10K</span><span>♡ 28K</span><span>▤ 2.4M</span></div>
              </div>
            </div>
          </div>

          <div className="lenses">
            <button className="lens lens--d" onClick={() => present("dystopia")}>
              <div className="lens__tag">▸ Lens 01</div>
              <div className="lens__name">The Dystopia</div>
              <div className="lens__desc">{LENS.dystopia.desc}</div>
            </button>
            <button className="lens lens--b" onClick={() => present("backfire")}>
              <div className="lens__tag">▸ Lens 02</div>
              <div className="lens__name">The Backfire</div>
              <div className="lens__desc">{LENS.backfire.desc}</div>
            </button>
          </div>
        </div>
      </section>

      {/* ── SCENARIO FEED · panels stack down the page ── */}
      {stack.map((item, i) => {
        const last = i === stack.length - 1;
        return (
          <section className="scenario" id={`qd-panel-${i}`} key={item.key} data-mode={item.mode}>
            <div className="scn-text scn-fade">
              <div className="scn-kicker"><span>{LENS[item.mode].label}</span> <span className="bar" /> <span>OUTCOME {String(i + 1).padStart(2, "0")}</span></div>
              <h2 className="scn-title">{item.sc.title}</h2>
              <p className="scn-summary"><Markup html={item.sc.summary} /></p>
              <div className="scn-seed">{item.sc.seed}</div>
              {last ? (
                <div className="scn-controls">
                  <button className="ctl ctl--primary" onClick={() => present(item.mode)}>↻ Show another</button>
                  <button className="ctl" onClick={() => switchLens(item.mode)}>⇄ Switch lens</button>
                  {shareReady && <button className="ctl ctl--share" ref={shareRef} onClick={() => setComposerOpen(true)}>⤴ Share these stories</button>}
                  <span className="scn-count">{viewCount} seen</span>
                </div>
              ) : (
                <div className="scn-controls scn-controls--done"><span className="scn-count">↓ kept exploring</span></div>
              )}
            </div>
            <MediaFrame sc={item.sc} />
          </section>
        );
      })}

      {/* ── COMPOSER ── */}
      {composerOpen && (
        <div className="composer" role="dialog" aria-modal="true" aria-label="Social composer — staged drafts" ref={dialogRef}>
          <div className="comp-wrap">
            <div className="comp-head">
              <div>
                <h2>Social Composer</h2>
                <div className="sub">{viewed.length} draft{viewed.length === 1 ? "" : "s"} staged · from {viewCount} views</div>
              </div>
              <button className="comp-close" ref={closeRef} onClick={closeComposer}>✕ Close</button>
            </div>
            <div id="draft-list">
              {viewed.map((v) => <Draft key={v.id} sc={v} />)}
            </div>
            <div className="comp-actions">
              <CopyAll />
              <button className="more" onClick={closeComposer}>← Keep exploring</button>
            </div>
            <div className="comp-note">Prototype composer · In production these hand off to your Composer with the matching media attached (media/&lt;id&gt;.jpg). Speculative satire — labelled as such on every post.</div>
          </div>
        </div>
      )}
    </div>
  );

  function Draft({ sc }: { sc: Scenario }) {
    const cap = captionFor(sc);
    const [copied, setCopied] = useState(false);
    const [thumb, setThumb] = useState(false);
    return (
      <div className="draft">
        <div className="draft__top"><span className={`draft__chip ${LENS[sc.deck].chip}`}>{LENS[sc.deck].label}</span><span className="draft__title">{sc.title}</span></div>
        <div className="draft__body">
          <div className="draft__thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={`${MEDIA_BASE}${sc.id}.jpg`} onLoad={() => setThumb(true)} onError={() => setThumb(false)} style={{ display: thumb ? "block" : "none" }} />
            {!thumb && <span>{sc.id.slice(0, 10)}</span>}
          </div>
          <div className="draft__cap">{cap}</div>
          <button className="draft__copy" aria-label={`Copy draft: ${sc.title}`} onClick={() => { navigator.clipboard?.writeText(cap).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1300); }); }}>{copied ? "✓" : "⧉"}</button>
        </div>
      </div>
    );
  }

  function CopyAll() {
    const [done, setDone] = useState(false);
    return <button className="all" onClick={() => { const all = viewed.map(captionFor).join("\n\n———\n\n"); navigator.clipboard?.writeText(all).then(() => { setDone(true); setTimeout(() => setDone(false), 1600); }); }}>{done ? "⧉ Copied all" : "⧉ Copy all drafts"}</button>;
  }
}
