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

import { DESIGN_W, CARD_W, CARD_H, PAD, SLIDE_CSS } from "./slide-css";
import type { Card, Post, ReelPost, SlideKind } from "./posts";

export const RATIOS = { "4:5": 5 / 4, "1:1": 1, "9:16": 16 / 9 } as const;
export type Ratio = keyof typeof RATIOS;

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

/**
 * One post, one slide index, drawn. A deck post has three slides; a reel post
 * has one, and that one is either its still or the piece running.
 *
 * `live` is what makes the grid affordable and honest at once: a wall of tiles
 * is a wall of stills, exactly as a feed of videos is, and the embed is mounted
 * only for the post you actually opened.
 */
export function PostSlide({
  post, index, ratio, live = false,
}: {
  post: Post;
  index: number;
  ratio: Ratio;
  live?: boolean;
}) {
  return post.kind === "reel" ? (
    <ReelSlide post={post} ratio={ratio} live={live} />
  ) : (
    <SlideBody card={post.card} kind={SLIDE_KINDS_LOCAL[index]!} ratio={ratio} />
  );
}

const SLIDE_KINDS_LOCAL = ["card", "reveal", "stats"] as const;

function ReelSlide({ post, ratio, live }: { post: ReelPost; ratio: Ratio; live: boolean }) {
  const h = DESIGN_W * RATIOS[ratio];
  return (
    <div className="stf" style={{ width: DESIGN_W, height: h }}>
      <div className="fld">
        {live ? (
          <iframe
            src={post.embed}
            title={post.title}
            scrolling="no"
            /* The embed covers the whole frame; without this it swallows the
               click and the post cannot be opened or closed. */
            style={{ pointerEvents: "none" }}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className="fld-thumb" src={`/mocks/instagram/${post.id}.jpg`} alt="" />
        )}
      </div>
    </div>
  );
}

export function SlideBody({ card, kind, ratio }: { card: Card; kind: SlideKind; ratio: Ratio }) {
  // The deck head rides above the box, and only on the front: the reveal needs
  // every pixel (in the game `.vo-body` scrolls when it runs long, and a still
  // slide has nothing to scroll), and the deck position is already on slide 1.
  // The results slide quotes the stats page, and that page reads as paper, so
  // the slide does too. The two card slides stay on the game's dark ground.
  const light = kind === "stats";
  return (
    <div
      className={`stf${light ? " light" : ""}`}
      style={{ width: DESIGN_W, height: DESIGN_W * RATIOS[ratio] }}
    >
      <div className="stf-wash" style={{ ["--wash-hue" as string]: card.hue }}>
        <i />
      </div>
      <div className="stf-slide">
        <ScaleBox ratio={ratio}>
          {kind === "stats" ? <StatsSlide card={card} /> : <CardSlide card={card} kind={kind} />}
        </ScaleBox>
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
function ScaleBox({ ratio, children }: { ratio: Ratio; children: React.ReactNode }) {
  const availW = DESIGN_W - PAD * 2;
  const availH = DESIGN_W * RATIOS[ratio] - PAD * 2;
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
  return kind === "card" ? <CardFront card={card} /> : <CardReveal card={card} />;
}

function CardFront({ card }: { card: Card }) {
  return (
    <div className="tcard ig">
      <div className="tq">True or false?</div>
      <h3 className="claim">{card.claim}</h3>
    </div>
  );
}

function CardReveal({ card }: { card: Card }) {
  const already = card.verdict === "already";
  // "Already real since 1981" under a line that already says ALREADY HAPPENED
  // says it twice. The rest of the labels (a not-yet card's nearest approach,
  // "Closest crossing", "Devices approved, none generative") still carry their
  // own meaning, so only this one is trimmed.
  const bigLabel = card.bigLabel === "Already real since" ? "Since" : card.bigLabel;
  return (
    <div className="tcard is-result ig">
      <div className="vo-body">
        <p className="vo-claim">{card.claim}</p>
        <div className={`vo-verdict ${already ? "correct" : "wrong"}`}>
          {already ? "True" : "False"}
        </div>
        <div className="vo-verdict-sub">{already ? "Already happened" : "Not yet"}</div>
        {card.big ? (
          <>
            <div className="vo-label">{bigLabel}</div>
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

      <div className="st-splitbar">
        <span style={{ width: `${gotIt * 100}%`, background: "var(--good)" }} />
        <span style={{ width: `${missPct * 100}%`, background: missColour }} />
      </div>
      <div className="st-splitkey">
        <span>Read it right</span>
        <span>{missName.replace("A ", "")}</span>
      </div>

      <div style={{ flex: 1, minHeight: 0 }} />

      <p className="st-para" style={{ margin: "18px 0 14px" }}>
        The full results page splits every player into those two mistakes, sector by
        sector, and scores how sharply they tell a shipped thing from a press release.
      </p>

      {/* The stats page's own brass bar, said the way that page says it. */}
      {card.crowd.sample ? (
        <div className="st-demobar" style={{ margin: "0 0 14px" }}>
          <b>Sample data.</b>
          <span>These are made-up tallies, shown so the layout can be read. Nobody has answered this deck yet.</span>
        </div>
      ) : null}
    </div>
  );
}
