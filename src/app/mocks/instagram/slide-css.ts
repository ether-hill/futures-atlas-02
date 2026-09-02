/**
 * The Swipe the Future card, verbatim.
 *
 * These rules are COPIED from `swipe-the-future/app/globals.css`, not written
 * for the post: the slide has to be the card people actually see, not a second
 * design that drifts from it. Everything is scoped under `.stf` so it cannot
 * touch the host page. When the game's card changes, re-copy the blocks below —
 * each carries the line range it came from.
 *
 * TWO DELIBERATE DEPARTURES, both marked FIXED-FOR-EXPORT:
 *  · The game sizes three things with `clamp(…vw…)`. A slide is drawn in a fixed
 *    design space and then scaled by a transform, so `vw` would resolve against
 *    the browser window and the same slide would set differently on a laptop and
 *    a phone. Each clamp is pinned to the value it takes on a phone-width column,
 *    which is where the card is designed to be read.
 *  · Hover and drag affordances (`:hover`, `cursor: grab`, the enter/leave
 *    keyframes) are dropped. A still image has no pointer.
 */

/**
 * The slide's design space, and the card's own fixed box inside it.
 *
 * The card is NOT stretched to the crop. Its rules are authored against a phone
 * column roughly CARD_W x CARD_H, and the reveal fills that box: squeeze it and
 * the source line — which the deck's own rule says every card must carry — falls
 * off the bottom, because `.vo-body` scrolls in the game and a still slide has
 * nothing to scroll. So the card keeps these proportions always and is scaled to
 * fit whatever crop is asked for. A 1:1 post shows the same card smaller with
 * more ground around it; it never shows a cropped one.
 */
export const DESIGN_W = 480;
export const CARD_W = 420;
export const CARD_H = 560;

/** The only slide chrome left: a margin, so the colour wash reads as a halo. */
export const PAD = 16;

export const SLIDE_CSS = `
/* ── tokens: swipe-the-future/app/globals.css :root (dark) ─────────────── */
.stf {
  --ff-sans: system-ui, -apple-system, "Segoe UI", sans-serif;
  --ff-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;
  --accent: oklch(0.64 0.13 245);
  --accent-deep: oklch(0.74 0.12 245);
  --accent-ink: oklch(0.48 0.13 245);
  --accent-soft: color-mix(in srgb, var(--accent) 18%, transparent);
  --ink: #17181b;
  --ink-2: #1d1f23;
  --bone: #f2ede2;
  --muted: #d3ccbe;
  --faint: #8b877f;
  --paper-muted: #8C8576;
  --good: #3f9e6b;
  /* Lifted for the dark cut: the game mixes these for cream paper. */
  --good-ink: #4fbb85;
  --bad-ink: #f0785a;
  --oxblood: #d8694e;
  --brass: #d8b13c;
  --line: rgba(242, 237, 226, .13);
  --card-line: #cdbfa6;
  --shadow: 0 30px 64px -30px rgba(0, 0, 0, .85);
  --wash-1: rgba(242, 237, 226, .07);

  background: var(--ink);
  color: var(--bone);
  font-family: var(--ff-sans);
  -webkit-font-smoothing: antialiased;
  text-align: left;
  position: relative;
  overflow: hidden;
}

/* ── light, for the stats slide: the game's own light theme, copied from
      globals.css html:not(.dark). The results page reads as paper, so the
      slide that quotes it does too. ─────────────────────────────────────── */
.stf.light {
  --accent: oklch(0.55 0.13 245);
  --accent-deep: oklch(0.42 0.11 245);
  --accent-ink: oklch(0.42 0.11 245);
  --accent-soft: color-mix(in srgb, var(--accent) 16%, transparent);
  --ink: #f4efe4;
  --ink-2: #fbf8f1;
  --bone: #17181b;
  --muted: #303237;
  --faint: #6f6759;
  --line: rgba(23, 24, 27, .16);
  --shadow: 0 24px 54px -28px rgba(60, 46, 24, .38);
  --wash-1: rgba(23, 24, 27, .07);
  --good: #16663d;
}

/* A soft colour behind the card. Keyed to the SECTOR, never the verdict: a
   green glow behind a card you are being asked to answer would give the answer
   away before you had read it. */
.stf-wash { position: absolute; inset: 0; pointer-events: none; }
.stf-wash i {
  position: absolute; left: 50%; top: 46%; width: 130%; aspect-ratio: 1 / 1;
  transform: translate(-50%, -50%); display: block;
  background: radial-gradient(circle, var(--wash-hue) 0%, transparent 58%);
  filter: blur(46px); opacity: .55;
}
.stf.light .stf-wash i { opacity: .34; }

/* ── deck head (globals.css 122-127) ───────────────────────────────────── */
.stf .deck-head { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 0 0 12px; flex: 0 0 27px; box-sizing: border-box; }
.stf .dots { display: flex; gap: 6px; }
.stf .dots .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--line); }
.stf .dots .dot.done { background: var(--accent); }
.stf .dots .dot.cur { background: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.stf .deck-head .count { font-family: var(--ff-mono); font-size: 12px; letter-spacing: .08em; color: var(--faint); }

/* ── the card (globals.css 131-177) ────────────────────────────────────── */
.stf .tinder { position: relative; width: 100%; height: 100%; }
.stf .tcard {
  position: absolute; inset: 0 34px 0 0; border-radius: 22px; overflow: hidden;
  background: linear-gradient(176deg, #f8f4ec 0%, #ece4d4 100%); color: #1b1610;
  box-shadow: var(--shadow), 0 1px 0 rgba(255, 255, 255, .5) inset;
  display: flex; flex-direction: column; padding: 28px 26px;
  transform-origin: center 135%;
}
.stf .tcard.b1 { transform: translateX(15px) translateY(6px); filter: brightness(.88); border-left: 1px solid var(--card-line); }
.stf .tcard.b2 { transform: translateX(30px) translateY(12px); filter: brightness(.76); border-left: 1px solid var(--card-line); }
/* FIXED-FOR-EXPORT: was clamp(20px, 2.4vw + 0.6vh, 31px). */
.stf .tcard .claim { flex: 1; min-height: 0; overflow: hidden; display: grid; place-items: center; text-align: center; font-weight: 600; font-size: 25px; line-height: 1.34; letter-spacing: -.02em; color: #19140e; }

/* ── the Instagram cut of the card ─────────────────────────────────────────
   The deck's own card carries a progress head, a stack of cards behind it and
   two swipe buttons, because it is a thing you play. A feed thumbnail is 120px
   wide and none of that survives the shrink: it just reads as clutter around
   the sentence, which is the only part anyone can actually see. So this cut
   drops all of it and asks the question in words instead. The claim is a
   statement about the world, so TRUE means it has happened and FALSE means it
   has not — the same question the deck asks, in the form a feed understands. */
/* The dark cut. The deck's own card is cream paper, which is right in the game
   — you are holding it, on a page that is otherwise empty — and wrong in a feed
   of dark work, where it is the one bright rectangle. Ground and ink are the
   Atlas's own near-blacks; the sector's colour comes back in as a glow inside
   the card and as the tint of the mesh, so the two cards of a post are never
   the same picture twice. */
.stf .tcard.ig {
  position: static; inset: auto; width: 100%; height: 100%;
  padding: 30px 28px 22px; border-radius: 22px; overflow: hidden;
  background:
    radial-gradient(78% 40% at 76% 4%, color-mix(in srgb, var(--hue, #3b93d5) 26%, transparent), transparent 68%),
    linear-gradient(168deg, #242833 0%, #1a1e26 58%, #15181e 100%);
  color: var(--bone);
  box-shadow: var(--shadow), inset 0 0 0 1px rgba(242,237,226,.12);
  /* The reveal fills its card corner to corner, so the mesh lives in the
     margin here rather than in a hole the shape of one headline. */
  --field-op: .34;
  --field-mask: radial-gradient(86% 58% at 50% 50%, transparent 26%, #000 100%);
}
/* Everything above the texture. */
.stf .tcard.ig > *:not(.tex-field):not(.tex-rule):not(.tex-grain) { position: relative; z-index: 1; }
/* FIXED-FOR-EXPORT: the claim, on the dark cut. */
.stf .tcard.ig .claim { color: var(--bone); font-weight: 500; letter-spacing: -.022em; }

/* The deck's own head, at the foot. */
.stf .ig-foot {
  flex: 0 0 auto; display: flex; align-items: center; gap: 14px;
  padding-top: 18px; border-top: 1px solid rgba(242,237,226,.12);
}
.stf .ig-foot .ig-sector {
  font-family: var(--font-heading); font-weight: 600; font-size: 11.5px;
  letter-spacing: .16em; text-transform: uppercase; color: var(--faint);
  white-space: nowrap;
}
.stf .ig-foot .dots { margin-left: auto; }
.stf .ig-foot .dot { width: 5px; height: 5px; }
.stf .ig-foot .dot.done { background: rgba(242,237,226,.3); }
.stf .ig-foot .dot.cur { background: #3b93d5; box-shadow: 0 0 0 3px rgba(59,147,213,.22); }
.stf .ig-foot .ig-pos {
  font-family: var(--font-heading); font-weight: 700; font-size: 11.5px;
  letter-spacing: .1em; color: var(--muted); font-variant-numeric: tabular-nums;
}
/* The card slide's ground. Both this and the term field were near-black on a
   near-black page, so the post had no edge: a deliberate ground gives the paper
   card something to sit on. */
.stf-slide.card-ground { background: linear-gradient(168deg, #232b39 0%, #151a23 60%, #10141a 100%); }
.stf .tq {
  flex: 0 0 auto; align-self: center; display: inline-flex; align-items: center; gap: 10px;
  background: #3b93d5; color: #fff; border-radius: 999px; padding: 11px 20px;
  font-family: var(--font-heading); font-size: 12.5px; font-weight: 700;
  letter-spacing: .16em; text-transform: uppercase; line-height: 1;
}
.stf .tq svg { display: block; width: 15px; height: 15px; }

/* The answer, said in both vocabularies at once. */
.stf .vo-verdict { font-weight: 700; font-size: 46px; line-height: 1; letter-spacing: -.035em; }
/* The two verdict inks, lifted for the dark cut: the game's #1d7a4c / #b8452c
   are mixed for cream paper and go nearly black on a near-black card. */
.stf .vo-verdict.correct { color: #4fbb85; }
.stf .vo-verdict.wrong { color: #f0785a; }
.stf .vo-verdict-sub { margin-top: 4px; font-size: 17px; font-weight: 600; letter-spacing: -.01em; color: var(--faint); }

/* ── the two buttons (globals.css 159-172) ─────────────────────────────── */
.stf .card-actions { position: relative; display: flex; justify-content: center; gap: 44px; padding-top: 14px; flex: 0 0 auto; }
.stf .card-actions .ca { position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.stf .ca-lbl { font-family: var(--ff-mono); font-size: 11.5px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #5d564a; }
.stf .card-actions .round { width: 60px; height: 60px; border-radius: 50%; display: grid; place-items: center; font-size: 25px; line-height: 1; background: rgba(255, 255, 255, .55); border: 2px solid; }
.stf .card-actions .round.no { color: var(--oxblood); border-color: color-mix(in srgb, var(--oxblood) 55%, var(--card-line)); }
.stf .card-actions .round.yes { color: var(--good-ink); border-color: color-mix(in srgb, var(--good) 60%, var(--card-line)); }

/* ── the reveal (globals.css 180-217, 255-262) ─────────────────────────── */
.stf .tcard.is-result { align-items: stretch; justify-content: flex-start; text-align: left; }
.stf .vo-body { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: stretch; justify-content: safe center; }
.stf .vo-claim { margin: 0; font-size: 13.5px; line-height: 1.45; color: var(--faint); max-width: 34ch; }
.stf .vo-grade { margin-top: 10px; font-weight: 700; font-size: 21px; letter-spacing: -.01em; line-height: 1.1; }
.stf .vo-grade.correct { color: var(--good-ink); }
.stf .vo-grade.wrong { color: var(--bad-ink); }
.stf .vo-label { margin-top: 2px; font-size: 19px; line-height: 1.2; color: var(--faint); letter-spacing: -.01em; }
/* FIXED-FOR-EXPORT: was clamp(40px, 8.5vw, 58px). */
.stf .vo-bignum { margin-top: 4px; font-weight: 700; font-size: 58px; line-height: .96; letter-spacing: -.04em; color: var(--bone); }
.stf .vo-lede { margin-top: 14px; max-width: 32ch; font-size: 16.5px; line-height: 1.34; letter-spacing: -.012em; color: var(--bone); font-weight: 600; }
/* FIXED-FOR-EXPORT: was clamp(20px, 2.6vw, 26px). */
.stf .vo-lede.solo { margin-top: 10px; font-size: 23px; line-height: 1.22; letter-spacing: -.02em; font-weight: 700; }
.stf .vo-insight { margin-top: 10px; max-width: 32ch; font-size: 14px; line-height: 1.5; color: var(--muted); }
.stf .vo-src { margin-top: 12px; max-width: 34ch; font-size: 13px; line-height: 1.5; color: var(--faint); }
.stf .vo-src u { text-decoration: underline; text-underline-offset: 2px; text-decoration-thickness: 1px; text-decoration-color: rgba(242,237,226,.3); color: var(--muted); }
.stf .vo-checked { color: var(--faint); }
.stf .vo-crowd { margin-top: 14px; width: min(100%, 34ch); padding: 11px 13px; background: rgba(242,237,226,.06); border: 1px solid rgba(242,237,226,.09); }
.stf .vo-crowdtop { display: flex; align-items: baseline; gap: 8px; font-size: 13.5px; color: var(--muted); }
.stf .vo-crowdtop b { font-weight: 700; }
.stf .vo-crowdtop i { margin-left: auto; font-style: normal; font-size: 11.5px; color: var(--faint); }
.stf .vo-crowdbar { display: block; margin-top: 8px; height: 6px; background: rgba(242,237,226,.14); overflow: hidden; }
.stf .vo-crowdbar > span { display: block; height: 100%; }

/* ── the stats page (globals.css 350-356, 479-484, 683-691) ────────────── */
.stf .st-kicker { display: block; margin-bottom: 10px; font-family: var(--font-heading); font-weight: 600; font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--accent-deep); }
/* FIXED-FOR-EXPORT: was clamp(26px, 3.4vw, 38px). */
.stf .st-sec h2 { margin: 0; font-weight: 600; font-size: 30px; letter-spacing: -.028em; color: var(--bone); line-height: 1.04; }
.stf .st-sec h3 { margin: 0; font-weight: 600; font-size: 19px; letter-spacing: -.015em; }
.stf .st-sublede { margin-top: 4px; margin-bottom: 14px; font-family: var(--font-heading); font-weight: 600; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--faint); }
.stf .st-para { margin: 0 0 18px; font-size: 14px; line-height: 1.68; color: var(--muted); max-width: 46ch; }
.stf .st-row { display: flex; gap: 13px; padding: 12px 0; border-top: 1px solid var(--wash-1); }
.stf .st-rowpct { font-family: var(--font-heading); font-weight: 700; font-size: 14px; min-width: 4ch; font-variant-numeric: tabular-nums; letter-spacing: .02em; }
.stf .st-rowtxt { display: flex; flex-direction: column; gap: 4px; font-size: 13.5px; line-height: 1.45; }
.stf .st-rowtxt b { font-weight: 500; color: var(--bone); }
.stf .st-rowtxt span { font-size: 11.5px; color: var(--faint); }
/* One card's split, drawn: the share that read it right against the share that
   made the named mistake. The results page argues in proportions, and two label
   rows on their own left it reading as a list. */
.stf .st-splitbar { display: flex; height: 12px; margin-top: 22px; overflow: hidden; background: var(--wash-1); }
.stf .st-splitbar span { display: block; height: 100%; }
.stf .st-splitkey { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11.5px; color: var(--faint); }
.stf .st-demobar { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; margin: 0 0 26px; padding: 14px 18px; background: var(--brass); color: #17140e; font-size: 14px; line-height: 1.5; }
.stf .st-demobar b { font-weight: 700; }
.stf .st-demobar span { flex: 1 1 320px; }
/* The results, in the same card as the other two slides rather than on paper. */
.stf .tcard.ig.is-stats { padding: 30px 28px 24px; display: block; }
.stf .tcard.ig.is-stats .st-sec { position: relative; z-index: 1; }
.stf .st-row { border-top-color: rgba(242,237,226,.12); }

/* ── the site's own brand lockup (public/atlas-nav.js + atlas-nav.css 67-68,
      170: the mark is /fa.svg, inverted on a dark ground, beside the
      "Futures Atlas" wordmark) ───────────────────────────────────────────── */
.stf .fa-lockup { display: flex; align-items: center; gap: 9px; flex: 0 0 auto; }
.stf .fa-lockup img { display: block; height: 20px; width: auto; filter: invert(1); }
.stf.light .fa-lockup img { filter: none; }
.stf .fa-lockup .word { font-size: 19px; font-weight: 500; letter-spacing: -0.01em; color: var(--bone); }
.stf .fa-url { margin-left: auto; font-family: var(--ff-mono); font-size: 11px; letter-spacing: .06em; color: var(--faint); }

/* ── an interference slide: the live field, full bleed ─────────────────── */
.stf .fld { container-type: inline-size; position: relative; width: 100%; height: 100%; overflow: hidden; background: #05070a; }
.stf .fld.lift { background: #14181f; }
/* pointer-events:none matters: the iframe covers the whole tile, so without it
   the embed swallows the click and the post never opens. The field is a post
   image here, not something to interact with. */
.stf .fld-crop { position: absolute; inset: 0; transform-origin: center center; }
.stf .fld iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; pointer-events: none; }
/* The still. object-fit:cover because the capture is 4:5 and the slide may
   be asked for at 1:1 or 9:16. */
.stf .fld-thumb { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }

/* ── The Odds player card ──────────────────────────────────────────────────
   Composed rather than screenshotted, so it maps to any frame exactly. Sizes
   are in cqw — 1% of the card's own width — so the whole thing scales with the
   slide instead of assuming one output size. */
.stf .odds-card {
  position: relative; width: 100%; height: 100%; overflow: hidden;
  background: #08070a; container-type: inline-size;
}
.stf .odds-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.stf .odds-scrim {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(8,7,10,.10) 0%, rgba(8,7,10,.30) 34%, rgba(8,7,10,.88) 66%, #08070a 100%);
}
.stf .odds-body { position: absolute; left: 0; right: 0; bottom: 0; padding: 8cqw 7.5cqw 9cqw; }
.stf .odds-who { margin-top: 0; font-size: 10cqw; font-weight: 800; letter-spacing: -.035em; line-height: 1.02; color: #fff; }
.stf .odds-role {
  margin-top: 2.6cqw; font-family: var(--ff-mono); font-size: 3.2cqw;
  letter-spacing: .04em; color: rgba(242,237,226,.72);
}
/* One red throughout. The player accents (violet, coral, teal) belong to the
   game's own chrome, not to a caption sitting on a photograph. */
.stf .odds-ctx {
  margin-top: 6cqw; font-family: var(--ff-mono); font-size: 3.1cqw; font-weight: 600;
  letter-spacing: .13em; text-transform: uppercase; color: #FF5C33;
}
.stf .odds-quote {
  margin: 3.4cqw 0 0; font-family: Georgia, "Times New Roman", serif; font-style: italic;
  font-size: 6cqw; line-height: 1.32; letter-spacing: -.01em; color: #f2ede2;
}
.stf .odds-quote b { font-weight: inherit; font-style: inherit; color: #FF5C33; }
.stf .odds-cta {
  margin-top: 7cqw; display: inline-flex; align-items: center; gap: 2.4cqw;
  background: #f7f0ff; color: #17121f; border-radius: 999px;
  padding: 3.6cqw 5.6cqw; font-size: 4.2cqw; font-weight: 700; letter-spacing: -.01em;
}
.stf .odds-cta svg { display: block; width: 4.4cqw; height: 4.4cqw; }

/* ── shared texture ────────────────────────────────────────────────────────
   Three layers, in this order, on any card that would otherwise be a flat
   field of colour with type on it.

   The RULE is the site's own .fa-plan-grid (futures-atlas-core/kit.css 171-176)
   at a card's scale rather than a page's: 40px on a 1200px page is roughly
   3.4cqw here. The GRAIN is fractal noise, inline as an SVG data URI so the
   slide stays one file with no request to make; at 4% it is felt rather than
   seen, and it is what stops a large flat gradient banding on export. The FIELD
   is drawn in the component (Slide.tsx) because it is geometry, not a fill.

   All three are absolutely positioned siblings, never backgrounds on the card
   itself, so each keeps its own opacity and the type sits above all of them. */
.stf .tex-field, .stf .tex-rule, .stf .tex-grain {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none; display: block;
}
.stf .tex-field {
  opacity: var(--field-op, .55);
  /* Held off the type. The mesh is texture, and a hairline crossing a word is
     not texture, it is a strike-through. Each card sets its own hole, because
     each puts its words somewhere different. */
  -webkit-mask-image: var(--field-mask, radial-gradient(72% 32% at 46% 52%, transparent 12%, #000 82%));
  mask-image: var(--field-mask, radial-gradient(72% 32% at 46% 52%, transparent 12%, #000 82%));
}
.stf .tex-rule {
  background-image:
    linear-gradient(rgba(242,237,226,.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(242,237,226,.045) 1px, transparent 1px);
  background-size: 3.4cqw 3.4cqw;
  -webkit-mask-image: radial-gradient(120% 70% at 50% 40%, #000 30%, transparent 100%);
  mask-image: radial-gradient(120% 70% at 50% 40%, #000 30%, transparent 100%);
}
.stf .tex-grain {
  opacity: .04;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 33cqw 33cqw;
}
/* On a light card the same three have to invert or they are invisible. */
.stf .light-card .tex-rule {
  background-image:
    linear-gradient(rgba(23,20,14,.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(23,20,14,.06) 1px, transparent 1px);
}
.stf .light-card .tex-grain { opacity: .05; mix-blend-mode: multiply; }

/* ── a vocabulary card ─────────────────────────────────────────────────────
   The word is still the whole post; everything added here sits under it. The
   ground is a slow diagonal rather than the old radial, which put a bright
   corner in the top left of every crop, and the type column is pushed off the
   optical centre so the field has somewhere to be. */
.stf .term-card {
  position: relative; width: 100%; height: 100%; box-sizing: border-box;
  padding: 9cqw 8cqw; display: flex; flex-direction: column; justify-content: center;
  overflow: hidden; container-type: inline-size;
  background:
    radial-gradient(80% 46% at 78% 8%, rgba(59,147,213,.16), transparent 62%),
    linear-gradient(168deg, #1b2330 0%, #101319 52%, #090b0f 100%);
}
/* The card as an object: a hairline held off the edge, the way the deck's own
   cards and the report plates are drawn. */
.stf .term-card::after {
  content: ""; position: absolute; inset: 3.4cqw; pointer-events: none;
  border: 1px solid rgba(242,237,226,.10);
}
.stf .term-body-col { position: relative; z-index: 1; }
.stf .term-kind {
  font-family: var(--font-heading); font-weight: 600; font-size: 3cqw;
  letter-spacing: .16em; text-transform: uppercase; color: #3b93d5;
}
.stf .term-word {
  margin-top: 3cqw; font-size: 15cqw; font-weight: 800; letter-spacing: -.045em;
  line-height: .96; color: #f2ede2;
}
/* A rule under the word, in the accent, the width of the word's own stem. */
.stf .term-word::after {
  content: ""; display: block; width: 12cqw; height: 2px;
  margin-top: 3.4cqw; background: #3b93d5;
}
.stf .term-pron {
  margin-top: 3cqw; font-family: var(--font-heading); font-size: 3.4cqw;
  letter-spacing: .04em; color: rgba(242,237,226,.5);
}
.stf .term-def {
  margin: 6cqw 0 0; font-size: 5.4cqw; line-height: 1.3; letter-spacing: -.015em;
  color: #f2ede2; font-weight: 600;
}
.stf .term-body {
  margin: 4cqw 0 0; padding-left: 4cqw; border-left: 1px solid rgba(59,147,213,.45);
  font-family: Georgia, "Times New Roman", serif; font-style: italic;
  font-size: 4.4cqw; line-height: 1.38; color: rgba(242,237,226,.66);
}
/* The mark, bottom left, so the card is signed like a plate rather than
   floating. Small enough to be a footer and not a logo. */
.stf .term-mark {
  position: absolute; left: 8cqw; bottom: 7cqw; z-index: 1;
  display: flex; align-items: center; gap: 2.2cqw;
}
.stf .term-mark img { display: block; height: 3.6cqw; width: auto; filter: invert(1); opacity: .7; }
.stf .term-mark span {
  font-family: var(--font-heading); font-weight: 600; font-size: 2.4cqw;
  letter-spacing: .2em; text-transform: uppercase; color: rgba(242,237,226,.34);
}

/* ── Tegmark's twelve ──────────────────────────────────────────────────────
   The card IS the post. No ground behind it, no margin around it: what the Max
   Tegmark player deals you is a card, and a card photographed on a table is a
   different object. So the card runs edge to edge and both slides are two
   sides of it.

   Sizes are in cqw, 1% of the slide's own width, so the pair holds at 9:16,
   4:5 and 1:1 alike.

   TYPE. Everything here is --font-heading, the Atlas display face, which is
   also what the game itself sets a drawn card's name in (.od-pcard-name and
   .od-rhead are both Archivo 800). The earlier cut set the names in the serif
   and they were unreadable at a card's size: a didone's hairlines vanish under
   a heavy weight and wide tracking, which is exactly the combination a card
   name wants. No serif on these slides. */
.stf .tg { position: relative; width: 100%; height: 100%; container-type: inline-size; }

/* ── the tarot card (odds-of-surviving-ai/index.html 81-87) ────────────────
   The game's structure, in the dark. Three departures, all deliberate:

   The flip is dropped. The game's card is one face of a 3D flip and carries
   position:absolute, backface-visibility:hidden and a 180 degree rotate for it;
   a still slide has no back to turn away from.

   The card is 280 x 395 and a post is not, so the art fills the frame it is
   given and crops, rather than letterboxing into bands of card.

   And the paper is dark. The game deals a cream tarot card, which is right on
   its own purple table and wrong as a whole post: a bright rectangle is the
   loudest thing in a feed of dark work. The ground is the game's own card
   colour (.od-pcard, #15151a) and the ink its own bone (#ECEAE6). */
.stf .od-tarot {
  position: absolute; inset: 0; box-sizing: border-box;
  background: #15151a; color: #ECEAE6;
  box-shadow: inset 0 0 0 1px rgba(236,234,230,.14);
  display: flex; flex-direction: column; padding: 3.6cqw 3.6cqw 0;
}
.stf .od-tarot-art {
  flex: 1; min-height: 0; overflow: hidden;
  border: 1px solid rgba(236,234,230,.16); background: #0b0b0f;
  display: flex; align-items: center; justify-content: center;
}
.stf .od-tarot-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
.stf .od-tarot-cap {
  flex: 0 0 auto; display: flex; align-items: center; justify-content: center;
  padding: 4.4cqw 2cqw 5cqw;
}
.stf .od-tarot-cap .nm {
  font-family: var(--font-heading); font-weight: 800; letter-spacing: -.01em;
  text-transform: uppercase; color: #ECEAE6; line-height: 1.02; text-align: center;
}

/* The two small labels. Letterspaced caps in the display face; the serif they
   used to be set in is not used on these slides at all. */
.stf .tg-fate, .stf .tg-foot {
  font-family: var(--font-heading); font-weight: 600;
  text-transform: uppercase; letter-spacing: .18em; line-height: 1;
}
.stf .tg-foot { flex: 0 0 auto; font-size: 2.6cqw; color: rgba(236,234,230,.38); }

/* The back. Same card, and the reading set on it. --fate is the one colour on
   this side: the player's own teal for a future with people in it, the game's
   red for one without. The wheel's blue was the earlier pair and it sank into
   the dark ground. */
.stf .tg-read {
  flex: 1; min-height: 0; display: flex; flex-direction: column;
  padding: 4.4cqw 4.4cqw 5.6cqw; --fate: #34E5C4;
}
.stf .tg.doom .tg-read { --fate: #FF5C33; }
.stf .tg-mid { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
.stf .tg-fate { font-size: calc(3.1cqw * var(--tg)); color: var(--fate); }
.stf .tg-name {
  margin: calc(4cqw * var(--tg)) 0 0;
  font-family: var(--font-heading); font-weight: 800; line-height: 1.02;
  letter-spacing: -.02em; text-transform: uppercase; color: #ECEAE6;
}
.stf .tg-name::after {
  content: ""; display: block; width: 14cqw; height: 1px;
  margin: calc(4.5cqw * var(--tg)) 0 0; background: var(--fate);
}
.stf .tg-desc {
  margin: calc(4.5cqw * var(--tg)) 0 0; font-size: calc(4.9cqw * var(--tg));
  line-height: 1.5; letter-spacing: -.005em; color: rgba(236,234,230,.74);
}

/* ── the slide shell: the game's page ground, with the card in it ──────── */
.stf-slide { position: relative; display: flex; flex-direction: column; box-sizing: border-box; padding: 16px; height: 100%; }
/* The card's box, at its authored size, scaled to the room available and
   centred in it. Nothing inside it ever reflows. */
.stf-stack { position: relative; flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center; }
`;
