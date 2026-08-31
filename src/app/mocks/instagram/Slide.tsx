"use client";

/**
 * A slide is the Swipe the Future card, in the game's own markup.
 *
 * The class names below (`tcard`, `claim`, `card-actions`, `vo-*`, `st-*`) are
 * the game's, and the rules behind them are copied verbatim in `slide-css.ts`.
 * That is the point: the post has to be the thing that already exists, so a
 * change to the card shows up here rather than drifting away from it.
 *
 * Every slide body is authored in ONE fixed box (CARD_W x CARD_H, the phone
 * column the card's rules are written against) and scaled to fit the crop asked
 * for. So the grid thumbnail, the carousel view and a 1080-wide export are one
 * drawing at three sizes, and no crop can clip a slide — a narrower one just
 * shows the same block smaller on more ground.
 */

import {
  DESIGN_W, CARD_W, CARD_H, PAD_TOP, PAD_BOTTOM, FOOT_H, HEAD_H, SLIDE_CSS,
} from "./slide-css";
import type { Card, SlideKind } from "./posts";

export const RATIOS = { "4:5": 5 / 4, "1:1": 1, "9:16": 16 / 9 } as const;
export type Ratio = keyof typeof RATIOS;

/**
 * The domain, not the deck path. The full URL is 44 characters, and at the
 * card's real 19px wordmark there is no row in a 420px column that holds both:
 * it wrapped over "Futures Atlas". The deck path lives in the caption, which is
 * where an Instagram reader looks for it anyway.
 */
const HOME = "futures-atlas-02.vercel.app";

/** The stats page's diverging pair, unchanged (StatsView.tsx 19-21). */
const C_BELIEVE = "#D8694E"; // hype trap: believed something that hasn't happened
const C_DOUBT = "#3E93D8";   // blind spot: doubted something already real

export function SlideStyles() {
  return <style>{SLIDE_CSS}</style>;
}

export function SlideFrame({
  width, ratio, children,
}: {
  width: number;
  ratio: Ratio;
  children: React.ReactNode;
}) {
  const dh = DESIGN_W * RATIOS[ratio];
  const scale = width / DESIGN_W;
  return (
    <div style={{ width, height: dh * scale, overflow: "hidden", position: "relative" }}>
      <div
        style={{
          width: DESIGN_W,
          height: dh,
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

/** The site's own lockup: /fa.svg inverted for the dark ground, plus the word. */
function Lockup() {
  return (
    <div className="stf-foot">
      <span className="fa-lockup">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/fa.svg" alt="" aria-hidden="true" />
        <span className="word">Futures Atlas</span>
      </span>
      <span className="fa-url">{HOME}</span>
    </div>
  );
}

/** The deck head, as the game draws it: progress dots and the count. */
function DeckHead({ pos, size }: { pos: number; size: number }) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="deck-head">
      <div className="dots">
        {Array.from({ length: size }, (_, k) => (
          <span key={k} className={`dot${k < pos - 1 ? " done" : k === pos - 1 ? " cur" : ""}`} />
        ))}
      </div>
      <span className="count">{pad(pos)} / {pad(size)}</span>
    </div>
  );
}

export function SlideBody({ card, kind, ratio }: { card: Card; kind: SlideKind; ratio: Ratio }) {
  // The deck head rides above the box, and only on the front: the reveal needs
  // every pixel (in the game `.vo-body` scrolls when it runs long, and a still
  // slide has nothing to scroll), and the deck position is already on slide 1.
  const withHead = kind === "card";
  return (
    <div className="stf" style={{ width: DESIGN_W, height: DESIGN_W * RATIOS[ratio] }}>
      <div className="stf-slide">
        {withHead ? <DeckHead pos={card.pos} size={card.deckSize} /> : null}
        <ScaleBox ratio={ratio} withHead={withHead}>
          {kind === "stats" ? <StatsSlide card={card} /> : <CardSlide card={card} kind={kind} />}
        </ScaleBox>
        <Lockup />
      </div>
    </div>
  );
}

/**
 * Draws its children at the authored CARD_W x CARD_H and scales that block to
 * the room this crop leaves, never past 1:1. Computed rather than measured:
 * every term is a pinned constant, so a slide is identical in the grid, in the
 * viewer and in an export.
 */
function ScaleBox({
  ratio, withHead, children,
}: {
  ratio: Ratio;
  withHead: boolean;
  children: React.ReactNode;
}) {
  const availW = DESIGN_W - 40;
  const availH = DESIGN_W * RATIOS[ratio] - PAD_TOP - PAD_BOTTOM - FOOT_H - (withHead ? HEAD_H : 0);
  const s = Math.min(availW / CARD_W, availH / CARD_H);
  return (
    <div className="stf-stack">
      <div style={{ width: CARD_W * s, height: CARD_H * s }}>
        <div
          style={{
            width: CARD_W,
            height: CARD_H,
            transform: `scale(${s})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function CardSlide({ card, kind }: { card: Card; kind: "card" | "reveal" }) {
  return (
    <>
      <div className="tinder">
        {/* b2 and b1 are the cards still to come, exactly as the game stacks
            them. They are what makes it read as a deck rather than a poster. */}
        <div className="tcard b2" />
        <div className="tcard b1" />
        {kind === "card" ? <CardFront card={card} /> : <CardReveal card={card} />}
      </div>
    </>
  );
}

function CardFront({ card }: { card: Card }) {
  return (
    <div className="tcard">
      <h3 className="claim">{card.claim}</h3>
      <div className="card-actions">
        <span className="ca">
          <span className="round no" aria-hidden="true">✕</span>
          <span className="ca-lbl">Not yet</span>
        </span>
        <span className="ca">
          <span className="round yes" aria-hidden="true">✓</span>
          <span className="ca-lbl">Already real</span>
        </span>
      </div>
    </div>
  );
}

function CardReveal({ card }: { card: Card }) {
  const already = card.verdict === "already";
  return (
    <div className="tcard is-result">
      <div className="vo-body">
        <p className="vo-claim">{card.claim}</p>
        {/* In the game this slot reads "Correct" or "Wrong" — it is grading the
            answer you just gave. A post has no answer to grade, so it carries
            the verdict, in the same slot and the same two colours.
            Only where the card has no `bigLabel`, though: that label already
            opens with the verdict ("Already real since"), and printing both gave
            "Already real / Already real since / 1981". Cards with a big number
            keep the game's own sequence untouched. */}
        {card.bigLabel ? null : (
          <div className={`vo-grade ${already ? "correct" : "wrong"}`}>
            {already ? "Already real" : "Not yet"}
          </div>
        )}
        {card.big ? (
          <>
            <div className="vo-label">{card.bigLabel}</div>
            <div className="vo-bignum">{card.big}</div>
          </>
        ) : null}
        <p className={`vo-lede${card.big ? "" : " solo"}`}>{card.lede}</p>
        <p className="vo-insight">{card.note}</p>
        <div className="vo-crowd">
          <span className="vo-crowdtop">
            <b>{Math.round(card.crowd.pctReal * 100)}%</b> said already real
            <i>{card.crowd.n} swipes</i>
          </span>
          <span className="vo-crowdbar" aria-hidden="true">
            <span
              style={{
                width: `${Math.round(card.crowd.pctReal * 100)}%`,
                background: already ? "var(--good-ink)" : "var(--bad-ink)",
              }}
            />
          </span>
        </div>
        <div className="vo-src">
          <u>{card.source.label} ↗</u>
          <span className="vo-checked"> · checked {card.checked}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * The stats slide, in the stats page's own parts: its kicker, its `st-row`, and
 * its brass sample-data bar.
 *
 * It REPORTS the split; it does not label the card. An earlier version headlined
 * every not-yet card "A hype trap" and every already card "A blind spot" — the
 * mistake the card can produce — which said "we said it had happened" over a
 * tally where 83% correctly said it hadn't. The headline is now the raw share
 * who said ALREADY REAL, and the two rows show who was right and who was not,
 * whichever way the numbers fall. The named mistake belongs to the row it
 * actually describes.
 */
function StatsSlide({ card }: { card: Card }) {
  const already = card.verdict === "already";
  const pctReal = card.crowd.pctReal;
  // The miss is whoever answered against the source: doubting something real is
  // a blind spot, believing something that hasn't happened is a hype trap. Same
  // definitions and same two colours as StatsView.
  const missPct = already ? 1 - pctReal : pctReal;
  const gotIt = 1 - missPct;
  const missName = already ? "A blind spot" : "A hype trap";
  const missColour = already ? C_DOUBT : C_BELIEVE;
  const pc = (x: number) => `${Math.round(x * 100)}%`;

  return (
    <div className="st-sec" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <span className="st-kicker">What everyone else answered</span>
      <h2>{pc(pctReal)} said already real.</h2>
      {/* The truth, in the deck's own two words (VLABEL in sectors.ts), with the
          year where the card has one. Uppercased by .st-sublede. */}
      <p className="st-sublede">
        {already
          ? card.big
            ? `Already real since ${card.big}`
            : "Already real"
          : "Not yet, anywhere"}
      </p>

      <div className="st-row" style={{ borderTop: 0 }}>
        <span className="st-rowpct" style={{ color: "var(--good)" }}>{pc(gotIt)}</span>
        <span className="st-rowtxt">
          <b>Read it right</b>
          <span>said {already ? "already real" : "not yet"} · {card.sector} · {card.crowd.n} swipes</span>
        </span>
      </div>
      <div className="st-row">
        <span className="st-rowpct" style={{ color: missColour }}>{pc(missPct)}</span>
        <span className="st-rowtxt">
          <b>{missName}</b>
          <span>
            said {already ? "not yet" : "already real"} ·{" "}
            {already ? "doubted something already running" : "bought something that hasn't happened"}
          </span>
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0 }} />

      <p className="st-para" style={{ margin: "18px 0 14px" }}>
        The full results page splits every player into those two mistakes, sector by
        sector, and scores how sharply they tell a shipped thing from a press release.
      </p>

      {/* The stats page's own brass bar, said the way that page says it. */}
      {card.crowd.sample ? (
        <div className="st-demobar" style={{ margin: 0 }}>
          <b>Sample data.</b>
          <span>These are made-up tallies, shown so the layout can be read. Nobody has answered this deck yet.</span>
        </div>
      ) : null}
    </div>
  );
}
