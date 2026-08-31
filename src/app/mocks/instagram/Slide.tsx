"use client";

/**
 * One social slide, drawn at its real export size and scaled down to fit.
 *
 * Everything inside `SlideFrame` is laid out in a fixed 1080-wide design space
 * and shrunk with a single `transform: scale()`, so the thumbnail in the grid,
 * the big view in the carousel and a future 1080×1350 export are the SAME
 * drawing at three sizes. Nothing reflows between them, which is the only way a
 * preview is worth looking at: a mock that re-wraps at 320px tells you nothing
 * about the post.
 *
 * The palette is Swipe the Future's, inlined (the game itself inlines it too —
 * it is a static export and cannot import core's tokens). These are social
 * assets, not site chrome: they have to hold up inside someone else's app, on a
 * white feed, with no theme to inherit. Labels are letterspaced Bodoni, never
 * mono.
 */

import type { CSSProperties } from "react";
import type { Slide as SlideData, Verdict } from "./posts";

// Swipe the Future's palette (swipe-the-future/app/globals.css, dark values).
const INK = "#17181b";       // page ground
const INK_2 = "#1d1f23";     // raised panel
const BONE = "#f2ede2";      // primary text on dark
const MUTED = "#d3ccbe";     // body text on dark
const FAINT = "#8b877f";     // labels, ticks
const PAPER = "#f4efe4";     // the swipe card stock
const PAPER_MUTED = "#8C8576";
const CARD_LINE = "#cdbfa6";
const GOOD_INK = "#1d7a4c";  // "already real", on paper
const OXBLOOD = "#d8694e";   // "not yet"
const BAD_INK = "#b8452c";   // "not yet", on paper

// The stats page's diverging pair, unchanged: oxblood = the crowd bought
// something that hasn't happened, blue = it doubted something that has.
const C_BELIEVE = "#D8694E";
const C_DOUBT = "#3E93D8";

export const RATIOS = { "4:5": 1350, "1:1": 1080, "9:16": 1920 } as const;
export type Ratio = keyof typeof RATIOS;

const DISPLAY = "var(--font-archivo), system-ui, sans-serif";
const SERIF = "var(--font-bodoni), Georgia, serif";

/** Uppercase letterspaced serif: the house label, in place of a mono face. */
const label = (size: number, color = FAINT): CSSProperties => ({
  fontFamily: SERIF,
  fontSize: size,
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color,
  lineHeight: 1.4,
});

export function SlideFrame({
  width,
  ratio,
  children,
}: {
  width: number;
  ratio: Ratio;
  children: React.ReactNode;
}) {
  const h = RATIOS[ratio];
  const scale = width / 1080;
  return (
    <div style={{ width, height: h * scale, overflow: "hidden", position: "relative" }}>
      <div
        style={{
          width: 1080,
          height: h,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          inset: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Mark({ size, color }: { size: number; color: string }) {
  return (
    <svg
      viewBox="6 10 88 56"
      width={size}
      height={(size * 56) / 88}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 60 L16.4 39.3 L31 21.9 L50 16 L69 21.9 L83.6 39.3 L88 60 Z" />
      <path d="M41.6 56.8 L21.5 49.2" />
      <path d="M43.6 53.7 L27 37.5" />
      <path d="M46.3 51.8 L35.9 29.1" />
      <path d="M50 51 L50 25" />
      <path d="M53.7 51.8 L64.1 29.1" />
      <path d="M56.4 53.7 L73 37.5" />
      <path d="M58.4 56.8 L78.5 49.2" />
      <path d="M41 60 A9 9 0 0 1 59 60" />
    </svg>
  );
}

/** The wordmark that sits at the foot of every dark slide. */
function Footer({ color = FAINT }: { color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <Mark size={54} color={color} />
      <span style={label(21, color)}>Futures Atlas</span>
    </div>
  );
}

/** A dark slide: the ground for covers, stats and the end card. */
function Dark({ children, h }: { children: React.ReactNode; h: number }) {
  return (
    <div
      style={{
        width: 1080,
        height: h,
        background: INK,
        color: BONE,
        padding: 88,
        // Pinned, not inherited: the grid renders slides inside a <button>,
        // whose UA default is text-align:center. A slide has to draw the same
        // wherever it is mounted or the preview is not a preview.
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        // A faint 60px rule grid, the Atlas's drawing-board texture.
        backgroundImage:
          `linear-gradient(${INK}, ${INK}), repeating-linear-gradient(0deg, rgba(242,237,226,.028) 0 1px, transparent 1px 60px), repeating-linear-gradient(90deg, rgba(242,237,226,.028) 0 1px, transparent 1px 60px)`,
        backgroundBlendMode: "normal",
      }}
    >
      {children}
    </div>
  );
}

/** A paper slide: the swipe card stock, inset on the dark ground. */
function Paper({ children, h }: { children: React.ReactNode; h: number }) {
  return (
    <div style={{ width: 1080, height: h, background: INK, padding: 56, boxSizing: "border-box", textAlign: "left" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: PAPER,
          border: `2px solid ${CARD_LINE}`,
          color: INK,
          padding: 72,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 64px -30px rgba(0,0,0,.85)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Stamp({ verdict }: { verdict: Verdict }) {
  const already = verdict === "already";
  const color = already ? GOOD_INK : BAD_INK;
  return (
    <div
      style={{
        // inline-block, not alignSelf: the stamp's wrapper is a plain div, so
        // alignSelf did nothing and the rule stretched to the full card width.
        display: "inline-block",
        border: `3px solid ${color}`,
        color,
        padding: "12px 26px",
        transform: `rotate(${already ? -3 : 3}deg)`,
        ...label(26, color),
        letterSpacing: "0.22em",
        fontWeight: 600,
      }}
    >
      {already ? "Already real" : "Not yet"}
    </div>
  );
}

export function SlideBody({ slide, ratio }: { slide: SlideData; ratio: Ratio }) {
  const h = RATIOS[ratio];

  if (slide.kind === "cover") {
    return (
      <Dark h={h}>
        <div style={label(24)}>{slide.kicker}</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: slide.title.length > 34 ? 96 : 116,
              lineHeight: 0.94,
              letterSpacing: "-0.035em",
              margin: 0,
              textWrap: "balance",
            }}
          >
            {slide.title}
          </h2>
          <p
            style={{
              fontFamily: SERIF,
              fontSize: 42,
              lineHeight: 1.35,
              color: MUTED,
              margin: "44px 0 0",
              maxWidth: 820,
            }}
          >
            {slide.sub}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <Footer />
          <span style={label(21, FAINT)}>Swipe →</span>
        </div>
      </Dark>
    );
  }

  if (slide.kind === "claim") {
    return (
      <Paper h={h}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={label(22, PAPER_MUTED)}>{slide.sector}</span>
          <span style={label(22, PAPER_MUTED)}>{slide.step}</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <p
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: slide.claim.length > 100 ? 62 : 72,
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              margin: 0,
              textWrap: "balance",
            }}
          >
            {slide.claim}
          </p>
        </div>
        {/* The two buttons, said in the game's own words, so the format reads
            as a question and not as a statement someone is asserting. */}
        <div style={{ display: "flex", gap: 20 }}>
          {(["notyet", "already"] as Verdict[]).map((v) => (
            <div
              key={v}
              style={{
                flex: 1,
                textAlign: "center",
                border: `2px solid ${v === "already" ? GOOD_INK : BAD_INK}`,
                color: v === "already" ? GOOD_INK : BAD_INK,
                padding: "26px 0",
                ...label(26, v === "already" ? GOOD_INK : BAD_INK),
                letterSpacing: "0.18em",
              }}
            >
              {v === "already" ? "Already real" : "Not yet"}
            </div>
          ))}
        </div>
      </Paper>
    );
  }

  if (slide.kind === "reveal") {
    return (
      <Paper h={h}>
        <p
          style={{
            fontFamily: SERIF,
            fontSize: 30,
            lineHeight: 1.35,
            color: PAPER_MUTED,
            margin: 0,
            maxWidth: 800,
          }}
        >
          {slide.claim}
        </p>
        <div style={{ height: 2, background: CARD_LINE, margin: "32px 0 0" }} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: 40 }}>
            <Stamp verdict={slide.verdict} />
          </div>
          {slide.big ? (
            <div style={{ marginBottom: 36 }}>
              <div style={label(22, PAPER_MUTED)}>{slide.bigLabel}</div>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 800,
                  fontSize: slide.big.length > 6 ? 108 : 156,
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                  marginTop: 10,
                }}
              >
                {slide.big}
              </div>
            </div>
          ) : null}
          <p
            style={{
              fontFamily: DISPLAY,
              fontWeight: 600,
              fontSize: 46,
              lineHeight: 1.18,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {slide.lede}
          </p>
          <p
            style={{
              fontFamily: SERIF,
              fontSize: 34,
              lineHeight: 1.4,
              color: "#4a4740",
              margin: "28px 0 0",
            }}
          >
            {slide.note}
          </p>
        </div>

        <div style={{ borderTop: `2px solid ${CARD_LINE}`, paddingTop: 24 }}>
          <span style={label(20, PAPER_MUTED)}>Source · {slide.source}</span>
        </div>
      </Paper>
    );
  }

  if (slide.kind === "stats") {
    // gap = share who said ALREADY REAL, minus the truth (1 if it happened,
    // 0 if it hasn't). Negative runs left and is a blind spot; positive runs
    // right and is a hype trap. Same reading as the stats page's own chart.
    //
    // The plot is the padded content box (1080 − 2×88), so the truth line lands
    // on its actual centre: an off-centre zero makes a symmetric scale look like
    // it leans, which is the one thing this chart must not do.
    const PLOT = 1080 - 88 * 2;
    const HALF = PLOT / 2;
    // Rows are absolutely placed on a fixed pitch so the truth line can be one
    // stroke rather than three stubs. LABEL_H is the row's name line plus its
    // gap; the pitch has to clear it or the next name lands on this bar.
    const LABEL_H = 50;
    const BAR_H = 34;
    const ROW = 122;
    const rows = slide.rows;
    return (
      <Dark h={h}>
        <div style={label(24)}>Swipe the Future · results</div>
        <div style={{ marginTop: 40 }}>
          <h2
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 78,
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              margin: 0,
            }}
          >
            {slide.title}
          </h2>
          <p style={{ fontFamily: SERIF, fontSize: 32, lineHeight: 1.35, color: MUTED, margin: "20px 0 0", maxWidth: 860 }}>
            {slide.sub}
          </p>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ position: "relative", height: (rows.length - 1) * ROW + LABEL_H + BAR_H }}>
            {/* The truth line: one continuous stroke through every row, because
                it is one quantity, not three separate axes. */}
            <div
              style={{
                position: "absolute",
                left: HALF - 1,
                top: LABEL_H,
                height: (rows.length - 1) * ROW + BAR_H,
                width: 2,
                background: "rgba(242,237,226,.45)",
              }}
            />
            {rows.map((r, i) => {
              const expected = r.verdict === "already" ? 1 : 0;
              const gap = r.pReal - expected;
              const w = Math.abs(gap) * HALF;
              const believe = gap > 0;
              return (
                <div key={r.short} style={{ position: "absolute", top: i * ROW, left: 0, right: 0, height: LABEL_H + BAR_H }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", height: LABEL_H }}>
                    <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 31, color: BONE, letterSpacing: "-0.015em" }}>
                      {r.short}
                    </span>
                    {/* Not letterspaced-uppercase: "n=24" loses its equals sign
                        at 0.3em and reads as two numbers. */}
                    <span style={{ fontFamily: SERIF, fontSize: 24, color: FAINT }}>
                      {Math.round(r.pReal * 100)}% said already · {r.n} answers
                    </span>
                  </div>
                  <div style={{ position: "relative", height: BAR_H }}>
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        height: BAR_H,
                        left: believe ? HALF : HALF - w,
                        width: w,
                        background: believe ? C_BELIEVE : C_DOUBT,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* The bar runs from the truth, so the centre line is "the crowd got
              this one right" and length is how far off it was — the same
              reading as the stats page's own gap chart. The middle label is
              positioned on the line, not space-between: with three labels of
              different widths, space-between puts the middle one anywhere. */}
          <div style={{ position: "relative", height: 30, marginTop: 30 }}>
            <span style={{ ...label(20, C_DOUBT), letterSpacing: "0.2em", position: "absolute", left: 0 }}>
              ← Blind spot
            </span>
            <span
              style={{
                ...label(20, FAINT),
                letterSpacing: "0.2em",
                position: "absolute",
                left: HALF,
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              Got it right
            </span>
            <span style={{ ...label(20, C_BELIEVE), letterSpacing: "0.2em", position: "absolute", right: 0 }}>
              Hype trap →
            </span>
          </div>
        </div>

        <p style={{ fontFamily: SERIF, fontSize: 28, lineHeight: 1.4, color: MUTED, margin: "0 0 34px" }}>
          {slide.footnote}
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <Footer />
          {slide.sample ? (
            <span style={{ ...label(18, INK), background: "#d8b13c", padding: "10px 18px", letterSpacing: "0.22em" }}>
              Sample tally
            </span>
          ) : null}
        </div>
      </Dark>
    );
  }

  return (
    <Dark h={h}>
      <div style={label(24)}>Play it</div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 104,
            lineHeight: 0.94,
            letterSpacing: "-0.035em",
            margin: 0,
            textWrap: "balance",
          }}
        >
          {slide.title}
        </h2>
        <p style={{ fontFamily: SERIF, fontSize: 40, lineHeight: 1.35, color: MUTED, margin: "40px 0 0", maxWidth: 800 }}>
          {slide.sub}
        </p>
        {/* A URL is not a label. Uppercased and tracked at 0.3em it wrapped to
            two lines and read "02.VERCEL.APP"; set in Bodoni its hyphens and
            slash all but vanished, which for an address people are meant to
            type is the whole job failing. Display face, as typed, one line. */}
        <div
          style={{
            marginTop: 56,
            alignSelf: "flex-start",
            border: `2px solid ${OXBLOOD}`,
            color: OXBLOOD,
            padding: "22px 34px",
            fontFamily: DISPLAY,
            fontWeight: 500,
            fontSize: 28,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {slide.url}
        </div>
      </div>
      <Footer color={MUTED} />
    </Dark>
  );
}

export { INK, INK_2, BONE, MUTED, FAINT, PAPER, CARD_LINE, OXBLOOD, C_BELIEVE, C_DOUBT, label, DISPLAY, SERIF };
