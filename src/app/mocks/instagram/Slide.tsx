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
import type { Card, OddsPost, Post, ReelPost, ShotsPost, SlideKind, TegmarkPost, TermPost } from "./posts";

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
export interface CropOverride { zoom: number; x: number; y: number }

export function PostSlide({
  post, index, ratio, live = false, crop,
}: {
  post: Post;
  index: number;
  ratio: Ratio;
  live?: boolean;
  /** Set by the editor; overrides whatever the post was authored with. */
  crop?: CropOverride;
}) {
  return post.kind === "reel" ? (
    <ReelSlide post={post} ratio={ratio} live={live} crop={crop} />
  ) : post.kind === "shots" ? (
    <ShotSlide post={post} index={index} ratio={ratio} crop={crop} />
  ) : post.kind === "odds" ? (
    <OddsSlide post={post} index={index} ratio={ratio} live={live} crop={crop} />
  ) : post.kind === "term" ? (
    <TermSlide post={post} ratio={ratio} />
  ) : post.kind === "tegmark" ? (
    <TegmarkSlide post={post} index={index} ratio={ratio} />
  ) : (
    <SlideBody card={post.card} kind={SLIDE_KINDS_LOCAL[index]!} ratio={ratio} />
  );
}

const SLIDE_KINDS_LOCAL = ["card", "reveal", "stats"] as const;

/** The editor's crop if there is one, else whatever the post was authored with. */
function cropStyle(post: { zoom?: number; focusY?: number }, crop?: CropOverride) {
  if (crop) {
    return {
      transform: `translate(${crop.x * 100}%, ${crop.y * 100}%) scale(${crop.zoom})`,
      transformOrigin: "center center",
    };
  }
  return {
    transform: `scale(${post.zoom ?? 1})`,
    transformOrigin: `center ${(post.focusY ?? 0.5) * 100}%`,
  };
}

function ReelSlide({
  post, ratio, live, crop,
}: { post: ReelPost; ratio: Ratio; live: boolean; crop?: CropOverride }) {
  const h = DESIGN_W * RATIOS[ratio];
  return (
    <div className="stf" style={{ width: DESIGN_W, height: h }}>
      <div className="fld">
        {/* One crop for the still and the live embed alike, or opening a post
            would jump to a different framing than its tile showed. */}
        <div className="fld-crop" style={cropStyle(post, crop)}>
          {live && post.video ? (
            <video className="fld-thumb" src={post.video} autoPlay loop muted playsInline />
          ) : live ? (
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
    </div>
  );
}

/** Redden one phrase inside the quote. The card used to shout the figure in
 *  48pt above the name; the sentence says it better, and once the sentence is
 *  there the big number is just the same fact twice. */
function highlight(quote: string, needle: string) {
  const i = needle ? quote.indexOf(needle) : -1;
  if (i < 0) return quote;
  return (
    <>
      {quote.slice(0, i)}
      <b>{needle}</b>
      {quote.slice(i + needle.length)}
    </>
  );
}

/**
 * The Odds. Slide one is the player, laid out here from the game's own data so
 * it fits the frame exactly; slide two is a recording of a real play-through.
 */
function OddsSlide({
  post, index, ratio, live, crop,
}: { post: OddsPost; index: number; ratio: Ratio; live: boolean; crop?: CropOverride }) {
  const h = DESIGN_W * RATIOS[ratio];
  const p = post.player;
  if (index === 1) {
    return (
      <div className="stf" style={{ width: DESIGN_W, height: h }}>
        <div className="fld">
          <div className="fld-crop" style={cropStyle({}, crop)}>
            {live ? (
              <video className="fld-thumb" src={post.video} autoPlay loop muted playsInline />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img className="fld-thumb" src={`/mocks/instagram/${post.id}-play.jpg`} alt="" />
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="stf" style={{ width: DESIGN_W, height: h }}>
      <div className="odds-card" style={{ ["--accent" as string]: p.accent }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="odds-photo" src={p.photo} alt="" style={{ objectPosition: p.photoPos }} />
        <div className="odds-scrim" />
        <div className="odds-body">
          <div className="odds-who">{p.who}</div>
          <div className="odds-role">{p.role}</div>
          {p.quoteContext ? <div className="odds-ctx">{p.quoteContext}</div> : null}
          <blockquote className="odds-quote">
            &ldquo;{highlight(p.quote, p.hot)}&rdquo;
          </blockquote>
          <div className="odds-cta">
            {p.cta}
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h15M13 6l6 6-6 6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/** One word, set big. The vocabulary posts are typography, nothing else. */
function TermSlide({ post, ratio }: { post: TermPost; ratio: Ratio }) {
  return (
    <div className="stf" style={{ width: DESIGN_W, height: DESIGN_W * RATIOS[ratio] }}>
      <div className="term-card">
        <div className="term-kind">{post.kind_}</div>
        <div className="term-word">{post.term}</div>
        <div className="term-pron">{post.pron}</div>
        <p className="term-def">{post.definition}</p>
        <p className="term-body">{post.body}</p>
      </div>
    </div>
  );
}

/**
 * One of Tegmark's twelve: the card's face, then the card's copy.
 *
 * Both slides sit on the Max Tegmark player's own ground — the purple with the
 * pink and teal glows from `.od-game` — so the pair reads as two views of one
 * object rather than a picture and a caption.
 *
 * Slide one is the game's tarot face in the game's own markup (`.od-tarot`,
 * `.od-tarot-art`, `.od-tarot-cap`), with the flip machinery dropped: a still
 * has no back to turn away from. Slide two is what the game prints once the
 * card has landed — the future's name as the heading, the deck's own copy under
 * it, unchanged — plus the one thing a feed cannot infer from a name, which is
 * whether anybody is left in this future. Six of the twelve sound benign and
 * are not, so that label is always shown and never softened.
 */
/**
 * The reading is authored against 9:16, the format these go out in, and stepped
 * down for the crops that have less height to give it. Everything on that slide
 * is words, so there is no fallback of showing less of the picture.
 */
const READ_SCALE: Record<Ratio, number> = { "9:16": 1.1, "4:5": 0.92, "1:1": 0.74 };

function TegmarkSlide({
  post, index, ratio,
}: { post: TegmarkPost; index: number; ratio: Ratio }) {
  const num = String(post.num).padStart(2, "0");
  const eyebrow = `Aftermath ${num} of 12`;
  return (
    <div className="stf" style={{ width: DESIGN_W, height: DESIGN_W * RATIOS[ratio] }}>
      <div className={`tg${post.doom ? " doom" : ""}`}>
        <div className="tg-eyebrow">{eyebrow}</div>
        {index === 0 ? (
          <div className="tg-face">
            {/* The card's own box: it takes the height on offer and derives its
                width from the game's 280 x 395, and opens a container so the
                rules below are written against the CARD rather than the slide,
                exactly as the game writes them against 280px. */}
            <div className="tg-card">
              <div className="od-tarot">
                <div className="od-tarot-art">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.img} alt={post.title} />
                </div>
                <div className="od-tarot-cap"><div className="nm">{post.title}</div></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="tg-read" style={{ ["--tg" as string]: READ_SCALE[ratio] }}>
            <div className="tg-fate">{post.doom ? "We\u2019re gone" : "We\u2019re still here"}</div>
            <h2 className="tg-name">{post.title}</h2>
            <p className="tg-desc">{post.desc}</p>
          </div>
        )}
        <div className="tg-foot">Max Tegmark &middot; Life 3.0</div>
      </div>
    </div>
  );
}

/** A carousel of stills: no embed, because there is nothing running to show. */
function ShotSlide({
  post, index, ratio, crop,
}: { post: ShotsPost; index: number; ratio: Ratio; crop?: CropOverride }) {
  const shot = post.shots[Math.min(index, post.shots.length - 1)]!;
  const cue = index === 0 && post.shots.length > 1;
  return (
    <div className="stf" style={{ width: DESIGN_W, height: DESIGN_W * RATIOS[ratio] }}>
      <div className="fld">
        <div className="fld-crop" style={cropStyle({}, crop)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="fld-thumb" src={shot.src ?? `/mocks/instagram/${shot.id}.jpg`} alt="" />
        </div>
        {/* Says there is more, in place of the page furniture that was cropped
            out of the top of these captures. */}
        {cue ? (
          <div className="swipe-cue">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
              strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h15M13 6l6 6-6 6" />
            </svg>
          </div>
        ) : null}
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
