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
            <img className="fld-thumb" src={post.thumb ?? `/mocks/instagram/${post.id}.jpg`} alt="" />
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

/**
 * A drawn field behind a card: nodes, and a hairline to each node's two nearest
 * neighbours.
 *
 * It is TEXTURE, NOT DATA. No edge here claims a relation between two terms and
 * nothing is measured: it is the vocabulary sphere at /mocks/termfield reduced
 * to a still, so a card that is only words has something under them. Said out
 * loud because everything else on these slides is copied from a source, and a
 * reader is entitled to know which marks mean something.
 *
 * Deterministic from the post's id, so the server and the client draw the same
 * field. `Math.random()` here would be a hydration mismatch, and a texture that
 * changes on every render would make two screenshots of one post differ.
 */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIELD_W = 100;
const FIELD_H = 178;

function Field({ seed, nodes = 64, tint = "#3b93d5" }: { seed: string; nodes?: number; tint?: string }) {
  const r = rng(seed);
  const pts = Array.from({ length: nodes }, () => ({
    x: r() * FIELD_W,
    y: r() * FIELD_H,
    // A few nodes carry weight, the rest are dust. An even field reads as a
    // pattern; an uneven one reads as a structure.
    big: r() < 0.22,
  }));
  // Nearest two, and only if they are actually near: without the cap, a node
  // in a sparse corner reaches right across the card and the field reads as
  // three big triangles rather than as a mesh.
  const MAX_EDGE = 22 ** 2;
  const edges: [number, number][] = [];
  pts.forEach((p, i) => {
    const near = pts
      .map((q, j) => ({ j, d: (p.x - q.x) ** 2 + (p.y - q.y) ** 2 }))
      .filter((q) => q.j !== i && q.d < MAX_EDGE)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const q of near) if (i < q.j) edges.push([i, q.j]);
  });
  return (
    <svg
      className="tex-field"
      viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g stroke={tint} strokeWidth="0.13" opacity="0.55">
        {edges.map(([a, b], i) => (
          <line key={i} x1={pts[a]!.x} y1={pts[a]!.y} x2={pts[b]!.x} y2={pts[b]!.y} />
        ))}
      </g>
      <g fill={tint}>
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.big ? 0.7 : 0.32} opacity={p.big ? 0.8 : 0.4} />
        ))}
      </g>
    </svg>
  );
}

/** The three texture layers, in the order they stack. Separate elements rather
 *  than background layers on the card so each can carry its own blend and
 *  opacity without fighting the others. */
function Texture({ seed, tint, nodes }: { seed: string; tint?: string; nodes?: number }) {
  return (
    <>
      <Field seed={seed} tint={tint} nodes={nodes} />
      <i className="tex-rule" aria-hidden="true" />
      <i className="tex-grain" aria-hidden="true" />
    </>
  );
}

/** One word, set big, on a field of its own vocabulary. */
function TermSlide({ post, ratio }: { post: TermPost; ratio: Ratio }) {
  return (
    <div className="stf" style={{ width: DESIGN_W, height: DESIGN_W * RATIOS[ratio] }}>
      <div className="term-card">
        <Texture seed={post.id} />
        <div className="term-body-col">
          <div className="term-kind">{post.kind_}</div>
          <div className="term-word">{post.term}</div>
          <div className="term-pron">{post.pron}</div>
          <p className="term-def">{post.definition}</p>
          <p className="term-body">{post.body}</p>
        </div>
        <div className="term-mark" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fa.svg" alt="" />
          <span>Futures Atlas &middot; vocabulary</span>
        </div>
      </div>
    </div>
  );
}

/**
 * The back is authored against 9:16, the format these go out in, and stepped
 * down for the crops with less height to give it. It is all words, so there is
 * no fallback of showing less of a picture.
 */
const READ_SCALE: Record<Ratio, number> = { "9:16": 1.1, "4:5": 0.92, "1:1": 0.74 };

/**
 * A name that would run past the card is stepped down rather than clipped.
 *
 * The twelve names are one word or two, so there is nowhere for a long one to
 * wrap: SELF-DESTRUCTION and CONQUERORS have to be set smaller or they run off
 * the edge. Measured across all twelve, the display face at 800 uppercase never
 * exceeds WIDEST_EM per character, so the widest word decides the size. `avail`
 * is the card's width in cqw less its padding, with a little slack.
 *
 * Re-measure this if the face changes: scratchpad measured it by rendering each
 * name at 100px and dividing by its length.
 */
const WIDEST_EM = 0.7;
const fitName = (title: string, avail: number, max: number) => {
  const longest = Math.max(...title.split(" ").map((w) => w.length));
  return `${Math.min(max, avail / (WIDEST_EM * longest))}cqw`;
};

/**
 * One of Tegmark's twelve: the card's face, then the card's back.
 *
 * The card IS the post. There is no ground behind it and no margin around it:
 * a tarot card floating in the middle of a frame is a photograph of a card,
 * and what the game deals you is the card itself. So the paper runs edge to
 * edge on both slides and the pair reads as one object turned over.
 *
 * Slide one is the game's face, in its own markup (`.od-tarot`, `.od-tarot-art`,
 * `.od-tarot-cap`), with the 3D flip dropped: a still has no back to hide. The
 * art is 280 x 395 and a post is not, so it fills the frame and crops rather
 * than letterboxing into bands of paper.
 *
 * Slide two is the back, in the same paper, carrying what the game prints once
 * the card lands: the future's name, the deck's own copy, unchanged, and the
 * one thing a name cannot tell you, which is whether anybody is left in this
 * future. Six of the twelve sound benign and are not, so that line is always
 * shown and never softened.
 */
function TegmarkSlide({
  post, index, ratio,
}: { post: TegmarkPost; index: number; ratio: Ratio }) {
  return (
    <div className="stf" style={{ width: DESIGN_W, height: DESIGN_W * RATIOS[ratio] }}>
      <div className={`tg${post.doom ? " doom" : ""}`}>
        <div className="od-tarot">
          {index === 0 ? (
            <>
              <div className="od-tarot-art">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.img} alt={post.title} />
              </div>
              <div className="od-tarot-cap">
                <div className="nm" style={{ fontSize: fitName(post.title, 82, 8.4) }}>
                  {post.title}
                </div>
              </div>
            </>
          ) : (
            <div className="tg-read" style={{ ["--tg" as string]: READ_SCALE[ratio] }}>
              <div className="tg-mid">
                <div className="tg-fate">{post.doom ? "We\u2019re gone" : "We\u2019re still here"}</div>
                <h2
                  className="tg-name"
                  style={{ fontSize: fitName(post.title, 82, 11 * READ_SCALE[ratio]) }}
                >
                  {post.title}
                </h2>
                <p className="tg-desc">{post.desc}</p>
              </div>
              <div className="tg-foot">Max Tegmark &middot; Life 3.0</div>
            </div>
          )}
        </div>
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
  // All three slides are now the same object: one card, dark, textured, with
  // the sector's own colour in it. The results slide used to be light because
  // it quotes the stats page and that page reads as paper — true of the page,
  // wrong in a carousel, where two dark cards followed by a cream one reads as
  // a post that has lost its third slide.
  return (
    <div
      className="stf"
      style={{ width: DESIGN_W, height: DESIGN_W * RATIOS[ratio], ["--hue" as string]: card.hue }}
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
      <Texture seed={card.id} tint={card.hue} nodes={54} />
      <div className="tq">True or false?</div>
      <h3 className="claim">{card.claim}</h3>
      <DeckFoot card={card} />
    </div>
  );
}

/**
 * The deck head, moved to the foot.
 *
 * These are the game's own parts (`.deck-head`, `.dots`, globals.css 122-127):
 * which card of ten this is, and which deck it belongs to. The Instagram cut
 * dropped them, on the grounds that a 120px tile cannot show them — true of the
 * tile, but it also left the card as a sentence floating in a rectangle. At the
 * foot they give the card a base to stand on and say the one thing the claim
 * cannot, which is that there are nine more like it.
 */
function DeckFoot({ card }: { card: Card }) {
  return (
    <div className="ig-foot">
      <span className="ig-sector">{card.sector}</span>
      <span className="dots" aria-hidden="true">
        {Array.from({ length: card.deckSize }, (_, i) => (
          <i key={i} className={i + 1 === card.pos ? "dot cur" : i + 1 < card.pos ? "dot done" : "dot"} />
        ))}
      </span>
      <span className="ig-pos">
        {String(card.pos).padStart(2, "0")}/{card.deckSize}
      </span>
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
      <Texture seed={`${card.id}r`} tint={card.hue} nodes={54} />
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
    <div className="tcard ig is-stats">
      <Texture seed={`${card.id}s`} tint={card.hue} nodes={54} />
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
    </div>
  );
}
