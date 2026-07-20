"use client";

/**
 * Faithful React port of projects/design_handoff_futures_atlas — the
 * "Claude-app × Netflix" browse UI. Three theme variants share this one
 * component; only tokens + the hero's generative piece differ. Per the
 * owner's brief the stock background VIDEO is replaced by the Generatives
 * embed player (particle-nebula / lattice-waves / boids), keeping the mock's
 * fade-in and the ❚❚/▶ motion toggle semantics.
 * Inline styles are intentional: they mirror the handoff's values 1:1.
 */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { projectsOrdered } from "@/data/projects";

/* ---------- theming ---------- */

export interface MockTheme {
  name: "observatory" | "gallery" | "signal";
  bg: string;
  text: string;
  accent: string;
  accentBright: string;
  panel: string;
  rail: string;
  avatarBg: string;
  sendText: string; // glyph colour on the accent send button
  logoFilter: string;
  bodyFont: string;
  scrimRgb: string; // theme bg as "r,g,b" for hero scrims
}

export interface HeroSpec {
  pieceId: string;
  params: Record<string, number>;
  meta: { complexity: number; chaos: number };
  colors: { bg: string; lo: string; hi: string };
  seed: string;
}

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/=+$/, "");
const embedSrc = (h: HeroSpec) =>
  `/generatives/embed.html#${b64(
    JSON.stringify({
      pieceId: h.pieceId,
      seed: h.seed,
      params: h.params,
      size: { w: 1600, h: 900 },
      meta: h.meta,
      theme: "quantum-ink",
      colors: h.colors,
    }),
  )}`;

/* ---------- content (real projects + handoff extras) ---------- */

const GREETINGS = ["Back at it, Derek", "Now, where were we?", "Which future today?", "The atlas is open", "Pick a possible world"];

const RECENTS = [
  "What odds do AI insiders put on catastrophe?",
  "How would quantum change my industry?",
  "Can a gigawatt campus coexist with a town?",
  "How could a depopulating village revive by 2050?",
  "Where did the USAID cuts actually land?",
  "What lives beneath everyday infrastructure?",
  "How calibrated is my gut on AI claims?",
];

// per-project fallback art (behind the real preview image) — handoff ART map
const ART: Record<string, string> = {
  "odds-of-surviving-ai": "radial-gradient(circle at 25% 30%, rgba(255,90,120,.55), transparent 55%), radial-gradient(circle at 75% 75%, rgba(125,225,255,.35), transparent 55%), conic-gradient(from 210deg at 60% 40%, #1A1030, #0B0A11, #241E3E, #0B0A11)",
  "signal-reactor": "repeating-linear-gradient(105deg, rgba(125,225,255,.14) 0 2px, transparent 2px 14px), radial-gradient(circle at 70% 25%, rgba(125,225,255,.5), transparent 60%), linear-gradient(160deg, #0E1B2E, #0B0A11)",
  "quantum-spark": "radial-gradient(circle at 50% 110%, rgba(255,196,80,.6), transparent 60%), conic-gradient(from 0deg at 50% 120%, #2E1A0E, #0B0A11 40%, #241E3E 70%, #0B0A11)",
  hyperscale: "linear-gradient(0deg, rgba(60,220,160,.28), transparent 55%), repeating-linear-gradient(0deg, rgba(237,236,244,.09) 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, rgba(237,236,244,.09) 0 1px, transparent 1px 22px), linear-gradient(180deg, #101826, #0B0A11)",
  "hollow-villages": "radial-gradient(ellipse at 30% 70%, rgba(140,255,190,.4), transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(125,225,255,.3), transparent 50%), linear-gradient(200deg, #10221A, #0B0A11)",
  generatives: "conic-gradient(from 90deg at 30% 40%, #7DE1FF22, #B96CFF33, #FF5A7822, #7DE1FF22), radial-gradient(circle at 70% 60%, rgba(185,108,255,.4), transparent 60%), #0F0C1C",
  "swipe-the-future": "linear-gradient(75deg, rgba(255,90,120,.35) 0 50%, rgba(60,220,160,.35) 50% 100%), radial-gradient(circle at 50% 50%, rgba(11,10,17,.2), rgba(11,10,17,.9)), #14101E",
  trajectories: "radial-gradient(circle at 50% 50%, rgba(255,255,255,.35), rgba(125,225,255,.25) 30%, transparent 65%), repeating-conic-gradient(from 0deg at 50% 50%, rgba(125,225,255,.12) 0 2deg, transparent 2deg 9deg), #060510",
  "quantum-dominance": "repeating-linear-gradient(45deg, rgba(255,90,120,.18) 0 10px, transparent 10px 26px), radial-gradient(circle at 20% 20%, rgba(255,90,120,.45), transparent 55%), linear-gradient(160deg, #200E18, #0B0A11)",
  woodchipper: "repeating-linear-gradient(-15deg, rgba(255,196,80,.16) 0 3px, transparent 3px 18px), radial-gradient(circle at 80% 80%, rgba(255,140,60,.4), transparent 60%), #171008",
  "underground-intelligence": "repeating-radial-gradient(circle at 50% 120%, rgba(125,225,255,.12) 0 2px, transparent 2px 26px), linear-gradient(0deg, #0E141F, #0B0A11)",
  "quantum-sandbox": "conic-gradient(from 180deg at 50% 50%, #7DE1FF33, #B96CFF44, #3CDCA033, #7DE1FF33), radial-gradient(circle at 50% 50%, transparent 30%, #0B0A11 75%), #121024",
  "literal-frequency": "radial-gradient(circle at 30% 40%, rgba(237,236,244,.25), transparent 45%), radial-gradient(circle at 60% 65%, rgba(125,225,255,.3), transparent 40%), radial-gradient(circle at 78% 30%, rgba(185,108,255,.25), transparent 35%), #0D0C16",
  "social-composer": "linear-gradient(120deg, rgba(125,225,255,.2), transparent 55%), repeating-linear-gradient(90deg, rgba(237,236,244,.1) 0 1px, transparent 1px 34px), linear-gradient(180deg, #16121F, #0B0A11)",
};

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return y && m && d ? `${d} ${mo[m - 1]} ${y}` : iso;
}

interface CardData {
  title: string;
  cat: string;
  date: string;
  href: string;
  art: string;
  img?: string;
  meta: string; // second line (varies per row)
  pct?: number;
  rank?: string;
}

function useRows() {
  return useMemo(() => {
    const by = Object.fromEntries(projectsOrdered.map((p) => [p.id, p]));
    const card = (id: string, meta?: string): CardData => {
      const p = by[id];
      return {
        title: p?.title ?? id,
        cat: p?.field ?? "",
        date: p ? fmtDate(p.date) : "",
        href: p?.path ?? "/projects",
        art: ART[id] ?? ART.generatives,
        img: p?.image,
        meta: meta ?? `${p ? fmtDate(p.date) : ""} · ${p?.status === "live" ? "Open the project" : "Forthcoming"}`,
      };
    };
    const recent = ["quantum-spark", "signal-reactor", "hyperscale", "trajectories", "quantum-sandbox", "swipe-the-future", "generatives", "literal-frequency", "social-composer", "hollow-villages"].map((id) => card(id));
    const exploring: CardData[] = [
      { ...card("hyperscale"), meta: "campus at 640 MW · heat wave inbound", pct: 64 },
      { ...card("swipe-the-future"), meta: "claim 4 of 6 · calibrating", pct: 66 },
      { ...card("hollow-villages"), meta: "letter drafted · awaiting oracle", pct: 30 },
      { ...card("woodchipper"), meta: "audit branch · 12 outcomes seen", pct: 48 },
      { ...card("underground-intelligence"), meta: "chapter 3 · the grid beneath", pct: 82 },
      { ...card("quantum-dominance"), meta: "the backfire · future 2 of 5", pct: 40 },
    ];
    const popular = ["odds-of-surviving-ai", "hyperscale", "quantum-spark", "trajectories", "signal-reactor", "social-composer"].map((id, i) => ({
      ...card(id),
      meta: by[id]?.field ?? "",
      rank: `Nº${i + 1}`,
    }));
    const risk: CardData[] = [
      { ...card("odds-of-surviving-ai"), meta: `${fmtDate(by["odds-of-surviving-ai"].date)} · gamble on our future` },
      { ...card("signal-reactor"), meta: `${fmtDate(by["signal-reactor"].date)} · an honest briefing` },
      { ...card("quantum-spark"), meta: `${fmtDate(by["quantum-spark"].date)} · grounded hype` },
      { ...card("quantum-dominance"), meta: `${fmtDate(by["quantum-dominance"].date)} · satire, two lenses` },
      { ...card("woodchipper"), meta: `${fmtDate(by["woodchipper"].date)} · fact-checked outcomes` },
    ];
    return { recent, exploring, popular, risk, total: projectsOrdered.length };
  }, []);
}

/* ---------- component ---------- */

export function BrowseMock({ T, hero }: { T: MockTheme; hero: HeroSpec }) {
  const [railOpen, setRailOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [askQuery, setAskQuery] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [motion, setMotion] = useState(true);
  const [heroReady, setHeroReady] = useState(false);
  const [heroIn, setHeroIn] = useState(false);
  const [greeting, setGreeting] = useState(GREETINGS[0]);
  const rows = useRows();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // mobile: rail starts CLOSED and overlays instead of pushing content
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      setIsMobile(mq.matches);
      if (mq.matches) setRailOpen(false);
    };
    apply();
    mq.addEventListener("change", apply);
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    setHeroReady(true);
    const t = setTimeout(() => setHeroIn(true), 300); // fade-in from black, as the video did
    return () => {
      clearTimeout(t);
      mq.removeEventListener("change", apply);
    };
  }, []);

  const railW = railOpen ? "min(300px,84vw)" : "64px";
  const contentPad = isMobile ? "64px" : railW; // open rail overlays on mobile
  const mono = 'ui-monospace, "SF Mono", Menlo, monospace';
  const rgba = (a: number) => `rgba(${T.scrimRgb},${a})`;
  const tx = (a: number) => `color-mix(in srgb, ${T.text} ${a * 100}%, transparent)`;

  const submit = (q: string) => q.trim() && setAsked(q.trim());
  const scrollRow = (e: React.MouseEvent, dir: number) => {
    const sc = (e.currentTarget.closest("[data-row]") as HTMLElement)?.querySelector("[data-scroller]") as HTMLElement | null;
    sc?.scrollBy({ left: dir * sc.clientWidth * 0.75 });
  };

  const navItems: { icon: string; label: string; href: string; accent?: boolean }[] = [
    { icon: "▤", label: "Projects", href: "/projects" },
    { icon: "❐", label: "News and articles", href: "#news" },
    { icon: "⚑", label: "Get involved", href: "/contact", accent: true },
    { icon: "⌘", label: "The Lab", href: "/about" },
    { icon: "✉", label: "Contact", href: "/contact" },
  ];

  const paddle: React.CSSProperties = { width: 32, height: 32, borderRadius: 2, border: `1px solid ${tx(0.2)}`, background: "none", color: T.text, fontSize: 12, cursor: "pointer" };

  const Card = ({ p, joined = false }: { p: CardData; joined?: boolean }) => (
    <a href={p.href} className="mock-card" style={{ flex: "none", width: "min(320px,78vw)", color: T.text, transition: "transform .2s ease", textDecoration: "none" }}>
      <div style={{ position: "relative", aspectRatio: "16/10", borderRadius: joined ? "6px 6px 0 0" : 6, overflow: "hidden", background: p.art }}>
        {p.img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(5,4,10,.88) 10%, rgba(5,4,10,.05) 55%)" }} />
        {p.rank && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(5,4,10,.82)", color: T.accent, fontFamily: mono, fontSize: 9.5, fontWeight: 500, padding: "2px 7px", borderRadius: 2 }}>{p.rank}</div>
        )}
        {!p.rank && p.pct === undefined && (
          <div style={{ position: "absolute", top: 12, left: 14, fontFamily: mono, fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(237,236,244,.75)" }}>{p.cat}</div>
        )}
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
          <div style={{ fontSize: p.rank || p.pct !== undefined ? 20 : 21, fontWeight: 600, lineHeight: 1.12, color: "#fff" }}>{p.title}</div>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: "rgba(237,236,244,.65)", marginTop: 6 }}>{p.meta}</div>
        </div>
      </div>
      {p.pct !== undefined && (
        <div style={{ height: 4, background: tx(0.15), borderRadius: "0 0 6px 6px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${p.pct}%`, background: T.accent }} />
        </div>
      )}
    </a>
  );

  const Row = ({ title, items, joined = false }: { title: string; items: CardData[]; joined?: boolean }) => (
    <section data-row style={{ padding: "10px 0 8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 clamp(16px,3vw,40px)", marginBottom: 13 }}>
        <h2 style={{ fontSize: 15.5, fontWeight: 600, margin: 0 }}>{title}</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="mock-paddle" onClick={(e) => scrollRow(e, -1)} aria-label="Previous" style={paddle}>←</button>
          <button className="mock-paddle" onClick={(e) => scrollRow(e, 1)} aria-label="Next" style={paddle}>→</button>
        </div>
      </div>
      <div data-scroller style={{ display: "flex", gap: 12, overflowX: "auto", padding: "4px clamp(16px,3vw,40px) 12px" }}>
        {items.map((p) => (
          <Card key={p.title + (p.rank ?? "")} p={p} joined={joined} />
        ))}
      </div>
    </section>
  );

  return (
    <div style={{ background: T.bg, color: T.text, overflowX: "hidden", minHeight: "100vh", fontFamily: T.bodyFont }}>
      <style>{`
        .mock-card:hover{transform:translateY(-6px)}
        .mock-paddle:hover,.mock-chip:hover{border-color:${T.accent}!important;color:${T.accentBright}!important}
        .mock-hov:hover{background:${tx(0.08)}}
        .mock-send:hover{background:${T.accentBright}!important}
        [data-scroller]{scrollbar-width:none;scroll-behavior:smooth}
        [data-scroller]::-webkit-scrollbar{display:none}
        ::selection{background:color-mix(in srgb, ${T.accent} 30%, transparent)}
      `}</style>

      {/* ============ sidebar rail ============ */}
      <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 40, width: railW, background: T.rail, borderRight: `1px solid ${tx(0.12)}`, backdropFilter: "blur(8px)", transition: "width .35s cubic-bezier(.25,.8,.25,1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 15px 12px" }}>
          {railOpen && (
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, color: T.text, whiteSpace: "nowrap", textDecoration: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fa.svg" alt="Futures Atlas" style={{ height: 40, width: "auto", flex: "none", filter: T.logoFilter }} />
              <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: ".01em" }}>Futures Atlas</span>
            </Link>
          )}
          <button className="mock-hov" onClick={() => setRailOpen((v) => !v)} aria-label="Toggle sidebar" style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: "none", color: tx(0.75), fontSize: 14, cursor: "pointer", flex: "none" }}>◫</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 12px" }}>
          <button
            className="mock-hov"
            onClick={() => {
              setAskQuery("");
              setAsked(null);
              inputRef.current?.focus();
            }}
            title="New question"
            style={{ display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, color: T.text, padding: 8, borderRadius: 8, textAlign: "left", whiteSpace: "nowrap" }}
          >
            <span style={{ width: 26, height: 26, borderRadius: "50%", background: tx(0.12), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flex: "none" }}>＋</span>
            {railOpen && "New question"}
          </button>
          {navItems.map((n) => (
            <a key={n.label} className="mock-hov" href={n.href} title={n.label} style={{ display: "flex", alignItems: "center", gap: 14, color: T.text, fontSize: 14.5, padding: 8, borderRadius: 8, whiteSpace: "nowrap", textDecoration: "none" }}>
              <span style={{ width: 26, display: "flex", justifyContent: "center", fontSize: 14, color: n.accent ? T.accent : tx(0.75), flex: "none" }}>{n.icon}</span>
              {railOpen && n.label}
            </a>
          ))}
        </div>
        {railOpen ? (
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "10px 12px" }}>
            <div style={{ fontSize: 12.5, color: tx(0.5), padding: "6px 8px" }}>Recents</div>
            {RECENTS.map((q) => (
              <button
                key={q}
                className="mock-hov"
                onClick={() => {
                  setAskQuery(q);
                  setAsked(q);
                }}
                style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.35, color: tx(0.85), padding: "7px 8px", borderRadius: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {q}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: `1px solid ${tx(0.1)}` }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.avatarBg, border: `1px solid color-mix(in srgb, ${T.accent} 40%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: T.accent, flex: "none" }}>D</div>
          {railOpen && (
            <div style={{ minWidth: 0, whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Derek</div>
              <div style={{ fontSize: 11.5, color: tx(0.5) }}>Open by default</div>
            </div>
          )}
        </div>
      </div>

      {isMobile && railOpen && (
        <div onClick={() => setRailOpen(false)} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 39, background: "rgba(0,0,0,.55)" }} />
      )}
      <div style={{ paddingLeft: contentPad, transition: "padding-left .35s cubic-bezier(.25,.8,.25,1)" }}>
        {/* ============ hero: generative field + greeting + composer ============ */}
        <section style={{ position: "relative", minHeight: "min(75vh,700px)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#000" }}>
          {heroReady && motion && (
            <iframe
              src={embedSrc(hero)}
              title=""
              tabIndex={-1}
              aria-hidden="true"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, opacity: heroIn ? 1 : 0, transition: "opacity 1.4s ease", pointerEvents: "none" }}
            />
          )}
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 60% at center, ${rgba(0.35)} 0%, ${rgba(0.8)} 100%)` }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(0deg, ${T.bg} 3%, ${rgba(0)} 30%)` }} />
          <button
            className="mock-paddle"
            onClick={() => setMotion((v) => !v)}
            aria-label={motion ? "Pause background motion" : "Play background motion"}
            style={{ position: "absolute", right: 16, bottom: 16, zIndex: 5, width: 34, height: 34, borderRadius: "50%", border: `1px solid ${tx(0.35)}`, background: rgba(0.6), color: T.text, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {motion ? "❚❚" : "▶"}
          </button>
          <div style={{ position: "relative", zIndex: 2, width: "min(760px,92%)", textAlign: "center", padding: isMobile ? "48px 0 40px" : "70px 0 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "0 0 12px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/fa.svg" alt="" style={{ width: "clamp(34px,3.4vw,46px)", height: "clamp(34px,3.4vw,46px)", flex: "none", filter: T.logoFilter }} />
              <h1 style={{ fontSize: "clamp(28px,3.8vw,50px)", fontWeight: 500, margin: 0, color: T.text, whiteSpace: isMobile ? "normal" : "nowrap", textShadow: "0 2px 30px rgba(0,0,0,.6)" }}>{greeting}</h1>
            </div>
            <p style={{ fontFamily: mono, fontSize: 12.5, letterSpacing: ".08em", color: tx(0.65), margin: "0 0 30px" }}>
              a catalogue of possible worlds · {rows.total} projects · open by default
            </p>
            <div style={{ background: T.panel, border: `1px solid ${tx(0.14)}`, borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,.6)", padding: "22px 24px 16px", textAlign: "left", backdropFilter: "blur(6px)" }}>
              <input
                ref={inputRef}
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit(askQuery)}
                placeholder="Ask the Atlas about a possible future…"
                style={{ width: "100%", boxSizing: "border-box", background: "none", border: "none", outline: "none", color: T.text, fontFamily: "inherit", fontSize: 16.5, padding: "2px 0 26px" }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span className="mock-hov" style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: tx(0.7), cursor: "pointer" }}>＋</span>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontFamily: mono, fontSize: 12, color: tx(0.6) }}>
                    ATLAS · grounded <span style={{ fontSize: 9 }}>▾</span>
                  </span>
                  <button className="mock-send" onClick={() => submit(askQuery)} aria-label="Ask" style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: T.accent, color: T.sendText, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>↑</button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
              {[
                { icon: "◆", label: "Explore", href: "/projects" },
                { icon: "⑂", label: "Fork", href: "https://github.com/ether-hill" },
                { icon: "❝", label: "Cite", href: "/about" },
              ].map((c) => (
                <a key={c.label} className="mock-chip" href={c.href} style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${tx(0.2)}`, background: rgba(0.6), color: T.text, padding: "10px 20px", borderRadius: 10, fontSize: 13.5, textDecoration: "none" }}>
                  <span style={{ color: T.accent }}>{c.icon}</span>
                  {c.label}
                </a>
              ))}
            </div>
            {asked && (
              <div style={{ marginTop: 24, textAlign: "left", background: T.panel, border: `1px solid ${tx(0.14)}`, borderRadius: 14, padding: "22px 26px" }}>
                <div style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: ".24em", textTransform: "uppercase", color: T.accent, marginBottom: 11 }}>The Atlas answers</div>
                <p style={{ fontSize: 15.5, lineHeight: 1.6, margin: "0 0 16px", color: tx(0.9) }}>
                  Several projects in the atlas map this question — each a grounded forecast, sources linked. Start with the citations below; every claim traces back to something on the record.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    { n: "i", ref: "The Odds · insider estimates", href: "/theodds" },
                    { n: "ii", ref: "Signal Reactor · briefing", href: "/signal-reactor" },
                    { n: "iii", ref: "Woodchipper · evidence base", href: "/woodchipper" },
                  ].map((c) => (
                    <a key={c.n} className="mock-chip" href={c.href} style={{ display: "flex", alignItems: "baseline", gap: 8, border: `1px solid ${tx(0.2)}`, borderRadius: 6, padding: "6px 11px", color: T.text, fontFamily: mono, fontSize: 11, textDecoration: "none" }}>
                      <span style={{ color: T.accent }}>{c.n}</span>
                      {c.ref}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============ rows ============ */}
        <div style={{ paddingTop: 10 }}>
          <Row title="Recent projects" items={rows.recent} />
          <Row title="Continue exploring" items={rows.exploring} joined />
          <Row title="Popular this week" items={rows.popular} />
          <Row title="AI & risk" items={rows.risk} />
        </div>

        {/* ============ footer ============ */}
        <footer style={{ padding: "30px clamp(16px,3vw,40px) 40px", borderTop: `1px solid ${tx(0.1)}`, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 14, fontSize: 12.5 }}>
          <span style={{ color: tx(0.4) }}>Futures Atlas · a catalogue of possible worlds · open by default</span>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Observatory", href: "/mocks/observatory" },
              { label: "Gallery", href: "/mocks/gallery" },
              { label: "Signal", href: "/mocks/signal" },
            ].map((l) => (
              <a key={l.label} className="mock-chip" href={l.href} style={{ color: tx(0.55), textDecoration: "none", border: "none" }}>
                {l.label}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
