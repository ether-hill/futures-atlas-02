/**
 * The moving posts: one live piece per post.
 *
 * The visual is never a screengrab of something re-drawn here. Each post names
 * an `embed` URL into a real Atlas sub-app — Interference's `field.js`, the
 * Generatives player, the About page's own `TermField` — so the post shows the
 * thing itself, and changing the piece changes the post.
 *
 * THUMBNAILS. A grid of live canvases is a grid of running WebGL contexts, and
 * it is not what Instagram shows either: a video sits still until you open it.
 * So every post carries a `thumb`, a still captured from its own embed at a
 * chosen moment (`scripts/capture-instagram-thumbs.mjs`), and the tile shows
 * that. The embed is only mounted in the viewer, when the post is open.
 *
 * COLOUR. Everything moving is in the Atlas blue, `--accent` resolved to
 * #3b93d5. The fields used to run one per palette, which looked like four
 * different accounts.
 *
 * WHERE THE PHYSICS COMES FROM. Every technical and quantum line in an
 * interference caption is a compression of that field's own `read` text in
 * `public/interference/field.js`, which is the project's source of truth: the
 * mode counts and the references (Taylor 1909, Tonomura 1989, Englert's
 * relation, the Talbot effect) are its, not invented here. Same for the
 * generative pieces, whose behaviour is described from their own source.
 *
 * The captions run to a fixed shape, because the ask was for something you can
 * enjoy without learning anything: a light way in, then three labelled lines —
 * what you are looking at, how it is actually made, and the idea behind it.
 * The first line is the whole post for most readers, and that is fine.
 */

/** The Atlas accent, oklch(0.64 0.13 245), as the hex the embeds want. */
export const ATLAS_BLUE = "#3b93d5";

/**
 * A carousel of stills captured from a page that is not a single moving piece.
 *
 * Actually Hard Questions is an app, not a field: it has a hero, a map and a
 * grid, and the interesting post is the sequence of them. Each shot names the
 * route to grab and the app chrome to hide first — the screen switcher, the
 * session doors, the join and reference lines — none of which mean anything
 * outside the app and all of which read as clutter in a feed.
 */
export interface ShotsPost {
  kind: "shots";
  name: string;
  id: string;
  /**
   * Each slide is one still. Give it a `path` to capture from a live route, or
   * a `src` when the image already exists — The Odds was screengrabbed for the
   * social composer months ago, in states (the doom end, the survival end) that
   * take driving the game to reach, and re-shooting them would be work for an
   * identical result.
   */
  shots: {
    id: string;
    src?: string;
    path?: string;
    /**
     * A recording, played instead of the still when the post is open. The grid
     * tile stays a still either way — a feed of videos is a wall of stills
     * until you tap one — so a slide with a video still needs its <id>.jpg.
     */
    video?: string;
    /** Fill the frame instead of keeping the slide's own ratio. See ReelPost.fit. */
    fit?: "cover" | "contain";
    hide?: string;
    at?: number;
    /** Scroll down this many viewport heights before grabbing. */
    scrollTo?: number;
    /** Scroll to the first element containing this text. More robust than a
     *  viewport count on a page whose length depends on its own data. */
    scrollToText?: string;
    /** Hide anything whose text starts with one of these. For chrome with no
     *  stable class of its own. */
    hideText?: string[];
    /** Screenshot this element instead of the viewport, padded to the post
     *  ratio. A finding card is an object; a viewport around one is a guess. */
    el?: string;
    elIndex?: number;
    /** Arbitrary CSS for this shot. */
    css?: string;
  }[];
  caption: string;
  hashtags: string[];
}

/**
 * An Odds post: the player, then the play.
 *
 * The first slide is COMPOSED here rather than screenshotted. Every earlier
 * attempt cropped a screengrab of the game to a social ratio, and something was
 * always cut off, because the game's layout answers to a browser window and a
 * post answers to a fixed frame. Laying it out ourselves from the same data the
 * game holds — the odds, the quote, the source, the accent, the portrait — means
 * it maps to 9:16, 4:5 or 1:1 exactly, with nothing clipped.
 *
 * The second slide is a screen recording of a real play-through on a phone,
 * through to the outcome, made by `scripts/record-odds.mjs`.
 */
export interface OddsPost {
  kind: "odds";
  name: string;
  id: string;
  player: {
    photo: string;
    /** Focus point for the portrait crop, as a CSS object-position. */
    photoPos: string;
    /** The phrase inside the quote that carries the red. */
    hot: string;
    who: string;
    role: string;
    quoteContext?: string;
    quote: string;
    source: string;
    credit: string;
    cta: string;
    accent: string;
  };
  video: string;
  caption: string;
  hashtags: string[];
}

/** One word, set big, with what it means and why it is in the vocabulary. */
export interface TermPost {
  kind: "term";
  name: string;
  id: string;
  term: string;
  pron: string;
  kind_: string;
  definition: string;
  body: string;
  caption: string;
  hashtags: string[];
}

export interface ReelPost {
  kind: "reel";
  /** Working title for the mock's chrome. Never rendered on a slide. */
  name: string;
  /** Stable id: the thumbnail is captured to public/mocks/instagram/<id>.jpg. */
  id: string;
  title: string;
  /** One line about the piece, in the source project's own words where it has them. */
  note: string;
  /** The live embed, mounted only when the post is open. Empty when `video` is
   *  set: some posts are a recording, not a running piece. */
  embed: string;
  /** A screen recording, played instead of the embed when the post is open. */
  video?: string;
  /**
   * The still, when it is not `<id>.jpg`. A recorded post's poster comes out of
   * whatever recorded it, so a post whose recording is replaced needs to be
   * able to point at the new still without changing its id — the id is what the
   * saved arrangement is keyed on.
   */
  thumb?: string;
  /**
   * How the still and the recording sit in a frame of a different ratio.
   * Default cover: a running piece fills whatever it is given. A recording
   * that was framed for one ratio with type burned in is different: cover at
   * 9:16 slices the sides off a 4:5 cut and takes the words with it, so those
   * say `contain` and sit letterboxed on the frame's own black.
   */
  fit?: "cover" | "contain";
  /** Seconds to let the embed run before the thumbnail is grabbed. */
  thumbAt: number;
  /**
   * Scale the piece up inside the frame, cropping what falls outside.
   * Some fields draw their subject in a box with dead ground around it (the
   * carpet's bounding square, the accumulating field's empty screen below the
   * fringes). On a page that is fine; in a 4:5 crop it is a picture of a margin.
   */
  zoom?: number;
  /**
   * Where the zoom is anchored vertically, 0 top to 1 bottom (default centre).
   * Several fields draw a baseline — the screen the particles land on, the wall
   * the slits are cut into — along the bottom edge. Scaling from the centre
   * keeps it in frame; anchoring at the top pushes it out.
   */
  focusY?: number;
  caption: string;
  hashtags: string[];
}

/**
 * `pal` 0 Ice · 1 Ember · 2 Verdigris · 3 Bone, or a custom hex. Blue leads,
 * because it is the Atlas accent and the feed should read as one account, but
 * every field was running the same blue and the palettes the project ships were
 * going unused.
 */
const field = (slug: string, pal: number | string = ATLAS_BLUE) =>
  typeof pal === "number"
    ? `/interference/embed.html?v=${slug}&pal=${pal}&speed=0.7&label=0`
    : `/interference/embed.html?v=${slug}&pal=4&hex=${encodeURIComponent(pal)}&speed=0.7&label=0`;

/**
 * A Generatives config, base64 JSON in the hash, exactly as the dashboard
 * writes it. These were taken FROM the dashboard rather than hand-built: the
 * pieces do not fill in their own schema defaults, so a config with empty
 * params renders nothing at all.
 */
const gen = (hash: string) => `/generatives/embed.html#${hash}`;

/**
 * Everything that is app chrome rather than the thing itself: the screen
 * switcher, the session doors and their join / reference lines, the in-screen
 * Map|Grid|Session row, the zoom controls, and the Atlas's own site shell,
 * which the bundled page loads on top of everything.
 */
const AHQ_CHROME =
  "#nav, #choose, .joinline, .refline, .sp, #zoom, .chrome, .fa-shell, .fa-share, .fa-foot";

const REPORT_CHROME = ["THE FEED", "REPORT ·", "PUBLISHED "];
const MASTHEAD_FILL = "main section:first-of-type{min-height:100vh!important;height:100vh!important}";

/** The Atlas site shell, which the bundled sub-apps load on top of themselves. */
const MAG_CHROME = ".fa-shell, .fa-share, .fa-foot, .fixed.right-3, .fixed.right-4";

export const ODDS_POSTS: OddsPost[] = [
  {
    kind: "odds",
    name: "The Odds · Dario",
    id: "odds-dario",
    player: {
      photo: "/odds-of-surviving-ai/research/dario-first.jpg",
      photoPos: "50% 30%",
      hot: "25% chance that things go really, really badly.",
      who: "Dario Amodei",
      role: "Co-founder & CEO, Anthropic",
      quoteContext: "On the risks of advanced AI",
      quote: "I think there\u2019s a 25% chance that things go really, really badly.",
      source: "Axios AI+ DC Summit \u00B7 17 Sept 2025",
      credit: "Photo: TechCrunch, CC BY 2.0",
      cta: "Roll the dice",
      accent: "#9B7BFF",
    },
    video: "/mocks/instagram/odds-dario.webm",
    caption:
      "\u201CI think there\u2019s a 25% chance that things go really, really badly.\u201D\n\nThat is Dario Amodei, who runs Anthropic, one of the three companies actually building this. On the record at the Axios AI+ summit, September 2025.\n\nSo the game hands you a twelve-sided die. Roll 1 to 9 and things go well. Roll 10 to 12 and they do not. Twenty-five percent, made physical, in your hand.\n\nSwipe for a full play-through. Hold to roll, watch it land, and read what it tells you.",
    hashtags: ["#aisafety", "#pdoom", "#anthropic", "#speculativedesign", "#seriousgames"],
  },
  {
    kind: "odds",
    name: "The Odds \u00B7 Elon",
    id: "odds-elon",
    player: {
      photo: "/odds-of-surviving-ai/research/elon-first.jpg",
      photoPos: "50% 28%",
      hot: "20% chance of annihilation.",
      who: "Elon Musk",
      role: "Founder, xAI",
      quoteContext: "On the risks of advanced AI",
      quote: "The probability of a good outcome is like 80%. Only a 20% chance of annihilation.",
      source: "Joe Rogan Experience \u00B7 2025",
      credit: "Image: AI-generated",
      cta: "Spin the wheel",
      accent: "#FF6F61",
    },
    video: "/mocks/instagram/odds-elon.webm",
    caption:
      "\u201CThe probability of a good outcome is like 80%. Only a 20% chance of annihilation.\u201D\n\nElon Musk, on the Joe Rogan Experience, 2025. Note the word only.\n\nSo the game gives you a wheel. Eighty percent of it is blue and Earth holds. Twenty percent is red and it does not. Click, hold, and let it land where it lands.\n\nA one in five chance of annihilation is a thing people say out loud on podcasts now. Spun as a wheel it stops sounding like a statistic and starts looking like a bet nobody would take.",
    hashtags: ["#aisafety", "#pdoom", "#elonmusk", "#speculativedesign", "#seriousgames"],
  },
  {
    kind: "odds",
    name: "The Odds \u00B7 Max",
    id: "odds-max",
    player: {
      photo: "/odds-of-surviving-ai/research/max-tegmark.jpg",
      photoPos: "50% 22%",
      hot: "if those goals aren\u2019t aligned with ours, we\u2019re in trouble.",
      who: "Max Tegmark",
      role: "MIT physicist \u00B7 author, Life 3.0",
      quote: "The real risk with AGI isn\u2019t malice but competence. A superintelligent AI will be extremely good at accomplishing its goals, and if those goals aren\u2019t aligned with ours, we\u2019re in trouble.",
      source: "Life 3.0 (2017)",
      credit: "Photo: Web Summit, CC BY 2.0",
      cta: "Pick a card",
      accent: "#34E5C4",
    },
    video: "/mocks/instagram/odds-max.webm",
    caption:
      "Max Tegmark does not give you a percentage. He gives you twelve futures.\n\nThe MIT physicist, author of Life 3.0, lays out twelve possible worlds on the other side of superintelligence. Some are fine. Some are fine only if you are not fussy about who is in charge. Several end with no people in them.\n\nSo this one is not a die or a wheel, it is a deck. You pick a card and read the world you drew. Libertarian Utopia. Gatekeeper. Enslaved God.\n\nThe mechanic is the argument: the other two are betting on a number, and Tegmark is saying the number is the wrong question. Not how likely. Which one.",
    hashtags: ["#aisafety", "#maxtegmark", "#life30", "#speculativedesign", "#futuresthinking"],
  },
];

/**
 * A two-slide carousel, both slides video.
 *
 * The cut is already framed 4:5 with its own titles burned in, so there is no
 * live route to capture: each slide names a recording and carries a still for
 * the grid. The second slide is the call to action that came with it, kept as
 * its own slide rather than folded into the caption, because that is how it
 * was cut.
 */
/**
 * Two ShelfLife listings, one post each.
 *
 * Both are real entries in src/data/shelflife.ts — the name, the price, the
 * ship year and the one-line description are the shelf's, not written for the
 * post. The shelf's whole joke is that these read as ordinary retail copy, so
 * the captions stay in that register and let the reader notice what is being
 * sold rather than being told.
 */
export const JONES_SLIME_REEL: ReelPost = {
  kind: "reel",
  name: "Jones's physarum model",
  id: "jones-slime",
  title: "Jones's physarum model",
  // The piece's own description, from generatives/src/pieces/physarum.ts.
  note: "Agent-based slime mould on the GPU: sense the trail ahead, left and right, rotate toward the strongest, step, deposit.",
  // A recording, framed 9:16 with the three update rules burned in, so it is
  // letterboxed rather than cropped in the squarer ratios.
  embed: "",
  video: "/mocks/instagram/jones-slime.webm",
  thumbAt: 4,
  caption:
    "Three rules per agent, no plan anywhere, and it builds a transport network.\n\nWhat you are seeing. Thousands of agents on a plane, each one carrying nothing but a position and a heading. Every frame an agent smells the trail ahead of it and slightly to each side, turns toward whichever smells strongest, steps forward, and leaves a little trail of its own. The trail blurs and fades. That is the entire model, and it is all three lines on screen: turn, step, then decay and deposit.\n\nWhy it matters. This is Jeff Jones's model of Physarum polycephalum, a slime mould with no brain and no central anything. Set the real organism loose on a map of Tokyo with food at the stations and it grows a network close to the rail network engineers designed. The behaviour is not in any agent. It is in what they leave behind for each other.\n\nRunning here on the GPU, four passes a frame, up to three species in the red, green and blue channels with optional avoidance between them. It is one of the treatments in Generatives on the Atlas, where you can change the sensor angle, the turn speed and the decay and watch a different network grow.",
  hashtags: ["#physarum", "#slimemould", "#emergence", "#agentbased", "#generativeart", "#creativecoding", "#futuresatlas"],
};

export const SHIFTCOOL_REEL: ReelPost = {
  kind: "reel",
  name: "NESTA ShiftCool 1",
  id: "shiftcool-1",
  title: "NESTA ShiftCool 1",
  note: "A cooled break space for one person. Work & focus aisle, ships 2033, €2,890.",
  embed: "",
  video: "/mocks/instagram/shiftcool-1.webm",
  thumbAt: 3,
  caption:
    "NESTA ShiftCool 1. €2,890. Ships 2033.\n\nA cooled break space for one person. Maintains 20 to 24°C in ambient conditions up to 45°C. Delivery and placement from €120, ground floor only, site access check available before order.\n\nThe product listing is the argument. Nobody in this catalogue is alarmed: the copy is warranty terms and clearance requirements, written the way a workplace supplier would write them, for a workplace where the ambient temperature is 45°C and the cooling is sold per person rather than per building.\n\nFrom ShelfLife on the Atlas, a shop of things that do not exist yet. You assemble an aisle, a year and what changed about the world, and it hands you the prompts to make your own. The ones that land on the shelf are the keepers.",
  hashtags: ["#designfiction", "#speculativedesign", "#climateadaptation", "#futureofwork", "#futuresatlas", "#shelflife"],
};

export const SOLOCOOL_REEL: ReelPost = {
  kind: "reel",
  name: "NESTA SoloCool 1",
  id: "solocool-1",
  title: "NESTA SoloCool 1",
  note: "A cool, quiet place to sit when the rest of the house is too warm. Home & climate aisle, ships 2035, €1,249.",
  embed: "",
  video: "/mocks/instagram/solocool-1.webm",
  thumbAt: 3,
  caption:
    "NESTA SoloCool 1. €1,249. Ships 2035.\n\nA cool, quiet place to sit when the rest of the house is too warm. One seated or reclining adult. Room-of-choice delivery from €49, five to eight working days, assembly available at checkout.\n\nTwo years after the ShiftCool, and the same idea has moved from the workplace to the living room. The thing worth noticing is not the pod. It is that cooling one chair became a product category before cooling the house did, and that the listing treats it as unremarkable.\n\nFrom ShelfLife on the Atlas, a shop of things that do not exist yet.",
  hashtags: ["#designfiction", "#speculativedesign", "#climateadaptation", "#heatwave", "#futuresatlas", "#shelflife"],
};

export const TURBULENCE_POST: ShotsPost = {
  kind: "shots",
  name: "Organic Turbulence",
  id: "organic-turbulence",
  shots: [
    { id: "organic-turbulence-1", video: "/mocks/instagram/organic-turbulence-1.webm" },
    { id: "organic-turbulence-2", video: "/mocks/instagram/organic-turbulence-2.webm" },
  ],
  caption:
    "A few rules and some randomness, and this falls out of it.\n\nWhat you are seeing. A flow field built from layered noise, with thousands of particles streaming along it. Nothing here is drawn: every shape is the accumulated trail of particles following a field that is itself slowly changing, so the structure builds up and then dissolves as the field moves under it.\n\nWhy it is worth looking at. The question underneath it — how much structure you get from simple rules plus noise — is the same one under a lot of things that do not look like this. Transformers. Quantum error correction. Why hardware built to push pixels turned out to be the hardware for building minds.\n\nOrganic Turbulence is one of the treatments in Generatives, on the Atlas. You can change the particle count, the turbulence and the trail length, watch it run, and export your own clip. Free, no account.",
  hashtags: ["#generativeart", "#creativecoding", "#flowfield", "#noise", "#mathart", "#futuresatlas"],
};

export const FIELD_DYNAMICS_REEL: ReelPost = {
  kind: "reel",
  name: "Field dynamics",
  id: "field-dynamics",
  title: "Field Dynamics",
  // The piece's own description, from generatives/src/pieces/fieldDynamics.ts.
  note: "Invisible forces made visible. Vortices, sources and sinks compose a vector field; particles stream its field lines.",
  // A recording rather than the live embed: this cut is already framed 9:16 with
  // the title and the equation burned in, which the running piece does not draw.
  embed: "",
  video: "/mocks/instagram/field-dynamics.webm",
  thumbAt: 0,
  caption:
    "Four singularities and nothing else. Everything you can see is six thousand particles being carried by them.\n\nWhat you are seeing. Vortices, sources and sinks placed on a plane. Each one pulls the flow around it, and the particles trace the field lines they are standing in, dying and respawning so the picture keeps renewing rather than settling.\n\nHow it is made. The equation on screen is the whole model: the velocity at any point is the sum of one term per singularity, each falling off with distance. Complex numbers do the work, because a single complex constant carries both the strength of a source and the spin of a vortex at once. That is why the same expression draws a drain and a whirlpool depending on one coefficient.\n\nIt is drawn live in the browser, a few thousand particles a frame on a 2D canvas, and it never repeats. Field Dynamics is one of the treatments in Generatives, where you can change the singularity count, the speed and the trail length and export your own.",
  hashtags: ["#generativeart", "#creativecoding", "#vectorfield", "#fluiddynamics", "#mathart", "#futuresatlas"],
};

export const HOME_REEL: ReelPost = {
  kind: "reel",
  name: "Futures Atlas · the site",
  id: "atlas-home",
  title: "Futures Atlas",
  note: "The hero, which draws itself.",
  // The hero alone, held still. The field behind the headline is generative and
  // never repeats, so there is something to watch without scrolling — and
  // scrolling turned the reel into a tour of the reading feed below it.
  embed: "",
  video: "/mocks/instagram/atlas-home.webm",
  thumbAt: 0,
  caption:
    "Mapping foresight.\n\nFutures Atlas is a speculative design practice that builds instruments rather than slide decks. A card game that asks which futures already arrived. A papal encyclical on AI, and fifteen imagined replies from other faiths. Eleven live wave fields. A cluster map of the questions a room actually has. Reports with a rule that every finding carries its own figure and its own scope, or it does not go in.\n\nThe throughline: most of what gets called the future is either already here and uncounted, or has been announced for a decade and has not happened. Both are worth knowing, and neither is settled by a forecast.\n\nEverything on the site is playable, readable or sourced. Usually all three.",
  hashtags: ["#speculativedesign", "#designfiction", "#futuresthinking", "#studio", "#creativecoding"],
};

export const TERM_POSTS: TermPost[] = [
  {
    kind: "term",
    name: "Stigmergy",
    id: "stigmergy",
    term: "Stigmergy",
    pron: "/\u02C8st\u026Adz\u02CCm\u0259\u02D0d\u0292i/",
    kind_: "noun \u00B7 biology, complex systems",
    definition:
      "Coordination through traces left in the environment, rather than through any communication between the participants.",
    body:
      "An ant does not tell another ant where to go. It leaves a chemical trail, and the trail tells the next ant. Nothing holds the plan.",
    caption:
      "Stigmergy. Coordination through traces left in the environment, rather than through any communication between the participants.\n\nAn ant does not tell another ant where to go. It leaves a chemical trail, the trail is followed, following it strengthens it, and a route appears that no ant chose. Termite mounds are built this way. So are slime mould networks, ocean paths, footpaths worn across a park, and most of the useful structure on the internet.\n\nThe word was coined by the French zoologist Pierre-Paul Grass\u00E9 in 1959, from the Greek stigma, a mark, and ergon, work. Work that marks, and marks that work.\n\nIt is in this studio's vocabulary because it is the honest answer to a question people keep asking about emergent systems: who is coordinating this? Usually nobody. The environment is.",
    hashtags: ["#stigmergy", "#emergence", "#complexsystems", "#slimemould", "#futuresatlas"],
  },
  {
    kind: "term",
    name: "p(doom)",
    id: "pdoom",
    term: "p(doom)",
    pron: "/pi\u02D0 \u02C8du\u02D0m/",
    kind_: "noun \u00B7 AI risk, jargon",
    definition:
      "The probability a person puts on advanced AI ending badly for humanity, said out loud as a number.",
    body:
      "Two people can both say twenty percent and mean different things: extinction, permanent loss of control, or a bad century. Nothing in the number says which.",
    caption:
      "p(doom). The probability a person puts on advanced AI ending badly for humanity, said out loud as a number.\n\nThe people building it answer. Dario Amodei, who runs Anthropic, put it at a 25% chance things go really, really badly, on the record at the Axios AI+ summit in September 2025. Elon Musk says the probability of a good outcome is about 80%, so only a 20% chance of annihilation. Note the only.\n\nIt is jargon out of the AI safety forums that escaped into interviews around 2023, and it looks like a measurement, which is the problem. No agreed definition of doom, no timeframe attached, no method behind any of the figures. Two people can both say twenty percent while one means extinction and the other means a bad century.\n\nIt is in this studio\u2019s vocabulary because The Odds is built on it. Three people, three numbers, and three mechanics that make you hold one: a twelve-sided die, a wheel, and Max Tegmark, who declines to give a number at all and deals you twelve futures instead.",
    hashtags: ["#pdoom", "#aisafety", "#existentialrisk", "#aigovernance", "#futuresatlas"],
  },
  {
    kind: "term",
    name: "Solastalgia",
    id: "solastalgia",
    term: "Solastalgia",
    pron: "/\u02CCs\u0252l\u0259\u02C8stald\u0292\u0259/",
    kind_: "noun \u00B7 environmental philosophy",
    definition:
      "The distress of watching the place you live change around you while you are still living in it. Homesickness without having left home.",
    body:
      "Nostalgia is the pain of not being able to go back. This is the pain of never having gone anywhere, and home going without you.",
    caption:
      "Solastalgia. The distress of watching the place you live change around you while you are still living in it.\n\nNostalgia was coined in 1688, by a Swiss medical student, for mercenaries who were physically ill with wanting to go home. Solastalgia is the same ache with the arrangement reversed: you never left, and home did. The mine widened. The river dropped. The season stopped arriving when it used to. Nothing is missing from your life except the place it happens in.\n\nThe philosopher Glenn Albrecht built the word in the early 2000s while working in the Hunter Valley in New South Wales, where open-cut coal mining was taking the landscape apart around people who stayed. Latin solacium, comfort, and the Greek -algia, pain. The pain of losing your comfort while sitting inside it.\n\nIt is in this studio\u2019s vocabulary because most futures work is about arrival, and this is the word for what an arrival costs the people who do not move.",
    hashtags: ["#solastalgia", "#climategrief", "#environmentalphilosophy", "#futuresthinking", "#futuresatlas"],
  },
];

export const STACK_REEL: ReelPost = {
  kind: "reel",
  name: "The stack",
  id: "stack",
  title: "The stack",
  note: "Everything this studio builds with, falling into place.",
  embed: "",
  // The Stack game at /mocks/stack-games/tetris, filmed with `?bare` — no
  // title, no counter, no family key, no line naming what cleared. A reel
  // carries its words in the caption, and printing them onto the video as well
  // says the same sentence twice. It replaces the marquee reel that was here:
  // the About page's stack grid is a table, a screengrab of a table is a table,
  // and a table sliding sideways is still a table.
  video: "/mocks/instagram/stack-bare.webm",
  thumb: "/mocks/instagram/stack-bare.jpg",
  thumbAt: 0,
  caption:
    "Everything this studio is built with, named.\n\nThe work splits three ways and so does the stack. Language and code models for research, drafting and the agent work. Image and video models for the plates that are generated, which are always labelled as generated. And the web layer everything actually ships on: Next.js, Three.js, p5, D3, and a lot of hand-written shaders, because a fragment shader computed fresh every frame is smaller, sharper and more honest than a video of one.\n\nOpen weights sit next to the closed ones on purpose. Some pieces here run models locally because the piece is about what you can do without asking permission.\n\nUsed, not endorsed. It is on the About page rather than in a deck, because a studio that will not say what it uses is telling you something.",
  hashtags: ["#techstack", "#creativecoding", "#webgl", "#nextjs", "#designstudio", "#futuresatlas"],
};

/**
 * The same inventory, taken apart instead of stacked up.
 *
 * BREAK is the fourth of the stack games (/mocks/stack-games/break), filmed
 * with `?bare` like its sibling: no title, no brick counter, no family key. The
 * words stay in the caption, because a reel that prints its own caption onto
 * the video says the sentence twice.
 *
 * What is left on the board is the game: the marks, and the studio's name
 * behind them, which is the thing the wall is hiding and the reason this one is
 * worth a post of its own. The other three add tools to a board. This one takes
 * them away and shows you what was underneath the whole time.
 */
export const BREAK_REEL: ReelPost = {
  kind: "reel",
  name: "The stack \u00B7 break",
  id: "stack-break-bare",
  title: "Break",
  note: "The stack as a wall, and one ball taking it apart.",
  embed: "",
  video: "/mocks/instagram/stack-break-bare.webm",
  thumb: "/mocks/instagram/stack-break-bare.jpg",
  thumbAt: 0,
  caption:
    "Twenty tools in a wall, and one ball to get through them.\n\nSame inventory as the last one, read the other way round. The other stack games add tools to a board until something lines up. This one starts with everything already there and removes it a brick at a time, and what the wall turns out to have been standing in front of is the studio's own name.\n\nThat is the honest order of things. The tools are in front, they are what you see first, and there is a practice behind them that is not any of them. When the last brick goes the wall rebuilds from a fresh shuffle, so it never comes apart the same way twice.\n\nNo text on the board on purpose. It plays itself.",
  hashtags: ["#techstack", "#creativecoding", "#gamedesign", "#designstudio", "#futuresatlas"],
};

export const UNDERGROUND_REEL: ReelPost = {
  kind: "reel",
  name: "Underground Intelligence",
  id: "underground",
  title: "Underground Intelligence",
  note: "What if the underground began to speak?",
  embed: "",
  // The project's real hero, recorded: everything but the question and the
  // mycelium is hidden — the eyebrow, the standfirst, both buttons, and the two
  // discovery cards, which live inside .home-hero rather than after it.
  video: "/mocks/instagram/underground.webm",
  thumbAt: 0,
  caption:
    "What if the underground began to speak?\n\nTwo discoveries are converging. In 2025 SPUN finished mapping the mycorrhizal networks beneath the planet for the first time — the largest living network on Earth, finally charted. And over 2024 and 2025 quantum sensing matured out of the lab into the field, precise enough to read the living earth without digging it up.\n\nUnderground Intelligence imagines the moment those two meet: when the network under your feet becomes something we can actually listen to, and what we would owe it once we could.\n\nThe thing moving behind the question is a real mycelial growth simulation, computed live, not a video.",
  hashtags: ["#mycelium", "#quantumsensing", "#speculativedesign", "#morethanhuman", "#futuresatlas"],
};

export const SHOTS_POSTS: ShotsPost[] = [
  {
    kind: "shots",
    name: "Where Compute Gets Built",
    id: "rep-compute",
    shots: [
      { id: "rep-compute-1", path: "/feed/where-compute-gets-built", hide: MAG_CHROME, hideText: REPORT_CHROME, css: MASTHEAD_FILL, at: 6 },
      { id: "rep-compute-2", path: "/feed/where-compute-gets-built", hide: MAG_CHROME, at: 4, el: "article", elIndex: 0 },
      { id: "rep-compute-3", path: "/feed/where-compute-gets-built", hide: MAG_CHROME, at: 4, el: "article", elIndex: 1 },
      { id: "rep-compute-4", path: "/feed/where-compute-gets-built", hide: MAG_CHROME, at: 4, el: "article", elIndex: 3 },
    ],
    caption:
      "Where Compute Gets Built. A report on the datacentre buildout, and who pays for it.\n\nThe wall behind the title is not decoration. Every tile is a piece of coverage the report actually cites, and the masthead is made of them, so the hero is the evidence base rather than a picture of one.\n\nEvery finding in it carries a figure and a scope. If we cannot write the scope, we do not have the finding, and it does not go in.\n\nOn the Atlas.",
    hashtags: ["#datacentres", "#compute", "#energy", "#aiinfrastructure", "#futuresatlas"],
  },
  {
    kind: "shots",
    name: "AI Hegemony",
    id: "rep-hegemony",
    shots: [
      { id: "rep-hegemony-1", path: "/feed/ai-hegemony", hide: MAG_CHROME, hideText: REPORT_CHROME, css: MASTHEAD_FILL, at: 6 },
      { id: "rep-hegemony-2", path: "/feed/ai-hegemony", hide: MAG_CHROME, at: 4, el: "article", elIndex: 0 },
      { id: "rep-hegemony-3", path: "/feed/ai-hegemony", hide: MAG_CHROME, at: 4, el: "article", elIndex: 2 },
      { id: "rep-hegemony-4", path: "/feed/ai-hegemony", hide: MAG_CHROME, at: 4, el: "article", elIndex: 7 },
    ],
    caption:
      "AI Hegemony. Who holds the compute, the models and the rules, and what that concentration actually looks like when you count it.\n\nThe wall is the coverage the report cites, and the report has a rule it applies to itself: a chart is a re-presentation of a figure already stated in the finding, never an addition to it. One share is one mark against an empty track, not two summing to a hundred, because the remainder was never measured.\n\nIt also publishes what did not hold up. We checked this and it did not survive is a finding, and it is in there.\n\nTwo designs of the same evidence, side by side on the site.",
    hashtags: ["#aipolicy", "#compute", "#concentration", "#datavisualisation", "#futuresatlas"],
  },
  // ── Hypothetica Magnifica ──────────────────────────────────────────────
  {
    kind: "shots",
    name: "Magnifica · the project",
    id: "mag-home",
    shots: [
      { id: "mag-home-1", path: "/magnifica/", hide: MAG_CHROME, at: 5 },
      { id: "mag-home-2", path: "/magnifica/", hide: MAG_CHROME, at: 5, scrollTo: 1.9 },
    ],
    caption:
      "In May 2026 Pope Leo XIV published Magnifica humanitas, the first papal encyclical on artificial intelligence. A real document, from a real office, about what AI does to the human person.\n\nSo we asked the obvious next question. What would the equivalent sound like from the world's other great faiths?\n\nSixteen documents. One is real. The other fifteen are speculative fiction, extrapolated from what each leader has actually said about technology and the human person, written in the form their tradition actually uses. A dharma talk is not an encyclical is not a ruling.\n\nEverything sourced is marked as sourced, and every invented line is marked as invented. That line is the project.",
    hashtags: ["#speculativedesign", "#designfiction", "#aiethics", "#religion", "#futuresatlas"],
  },
  // A Leo XIV post was written and pulled: the encyclical is a section partway
  // down the Magnifica home page, not a route, and every attempt to reach it
  // (viewport offsets, then scroll-to-text) landed back on the hero — so all
  // three of its shots were the same image the project post already uses, and
  // the feed showed the Pope twice. Reaching it wants an anchor on the section
  // itself rather than a guess from outside; the caption is in git history.

  {
    kind: "shots",
    name: "Magnifica · Dalai Lama",
    id: "mag-dalai",
    shots: [
      { id: "mag-dalai-1", path: "/magnifica/#/l/dalai-lama", hide: MAG_CHROME, at: 7 },
    ],
    caption:
      "What would Tenzin Gyatso, the 14th Dalai Lama, write about artificial intelligence?\n\nHe has said a great deal about consciousness, compassion and what makes a mind a mind, over sixty years, on the record. He has not written this document.\n\nSo the project does two things at once and keeps them visibly apart. Under GROUNDED IN sit his actual statements, each one cited and linked. Above it sits a speculative document written in the form his tradition uses, extrapolated from that record, and labelled as invented everywhere it appears.\n\nThe portrait is a real Wikimedia photograph under a free licence, credited on screen. No generated likeness of a living person, in a project whose own subject matter is people objecting to being deepfaked.",
    hashtags: ["#speculativedesign", "#dalailama", "#aiethics", "#buddhism", "#futuresatlas"],
  },

  {
    kind: "shots",
    name: "Actually Hard Questions",
    id: "ahq",
    shots: [
      { id: "ahq-1", path: "/actually-hard-questions/", hide: AHQ_CHROME, at: 4 },
      { id: "ahq-2", path: "/actually-hard-questions/#map", hide: AHQ_CHROME, at: 6 },
    ],
    caption:
      "Anthropic has a page about the actually hard questions AI raises. It is a beautiful cluster map, and it answers none of them.\n\nSo: same map, same headings, your questions.\n\nWhat it is. Open a session, put it on a screen, and everyone in the room asks the thing they actually want to know. Questions land on the map live, grouped under Anthropic's own headings, alongside everyone else's.\n\nWhat it is not. It does not answer anything either. That is deliberate. The point is to see the shape of what a room is confused about, which is usually not the shape the roadmap assumes.\n\nBuilt for workshops. Works on one laptop or across forty phones.",
    hashtags: ["#speculativedesign", "#workshop", "#aiethics", "#facilitation", "#designresearch"],
  },
];

export const REEL_POSTS: ReelPost[] = [
  // ── Interference ───────────────────────────────────────────────────────
  {
    kind: "reel",
    name: "One at a time",
    id: "one-at-a-time",
    title: "One at a time",
    note: "Detections arriving singly. No fringe exists in any one of them.",
    embed: field("one-at-a-time"),
    // This one accumulates rather than looping, so the thumbnail wants to be
    // late enough that the stripes have actually formed. The screen line and
    // the empty band beneath it are cropped away.
    thumbAt: 22,
    zoom: 1.5,
    focusY: 0.28,
    caption:
      "Quantum mechanics is hard and I am not going to pretend otherwise. So here is a nice thing to look at. You can stop right there, that is a complete experience.\n\nIf you want the three lines:\n\nWhat you are seeing. Every dot is one particle arriving at a screen, landing somewhere at random. No single dot means anything.\n\nHow it is made. A fragment shader, computed fresh every frame rather than a video. Each dot is dropped at a random position weighted by the two-slit probability pattern, and they simply pile up.\n\nThe quantum part. Send the particles through so slowly that only one is ever inside the apparatus, and the stripes still appear. G. I. Taylor did a version of this in 1909 with an exposure that ran for three months, and Tonomura's team at Hitachi filmed single electrons building the pattern in 1989. The stripes are not in any particle. They only exist in the pile.",
    hashtags: ["#quantum", "#interference", "#doubleslit", "#generativeart", "#shaders", "#physics"],
  },
  {
    kind: "reel",
    name: "Quantum carpet",
    id: "carpet",
    title: "Quantum carpet",
    note: "A particle in a square box. Eight standing modes, beating in and out of step.",
    embed: field("carpet", 2),
    thumbAt: 7,
    // The carpet draws its box centred with ground all around it.
    zoom: 1.75,
    caption:
      "You do not need to know what a wavefunction is to enjoy this one. Genuinely, just watch it.\n\nFor anyone who wants the three lines:\n\nWhat you are seeing. A particle shut in a square box, and the odds of finding it at each point in that box, sloshing around.\n\nHow it is made. Eight standing waves added together, each turning in phase at its own rate, then squared. About forty lines of maths in a fragment shader, redrawn every frame.\n\nThe idea. The energies are whole numbers times a common unit, so every phase falls back into step at the same instant and the whole pattern snaps back to where it started. That is why it loops, and nothing is edited or cut. It is the same mathematics as the Talbot effect in optics, where a grating reprints its own image at regular distances behind itself, and the revivals have been seen for real in Rydberg atoms and in cold atoms in optical lattices.",
    hashtags: ["#quantum", "#talboteffect", "#waves", "#generativeart", "#shaders", "#physics"],
  },
  {
    kind: "reel",
    name: "Cat state",
    id: "packets",
    title: "Cat state",
    note: "Two coherent states in one trap, swinging in antiphase. The fringes are finest as they pass.",
    embed: field("packets", 1),
    // The fringes only exist at the crossing, which is the whole point of the
    // piece, so the still is taken mid-pass rather than at a turning point.
    thumbAt: 4,
    caption:
      "Schrodinger's cat, minus the cat, minus the box, minus the lecture. Just the pretty part.\n\nThe three lines, if you want them:\n\nWhat you are seeing. Two blobs swinging past each other inside a trap. Watch for the fine stripes, which only show up as they cross.\n\nHow it is made. Two Gaussian wave packets in a harmonic trap, added together as complex amplitudes and squared. A shader, every frame, no video.\n\nThe idea. The stripes are the entire difference between both at once and one or the other. If it were a coin flip between the two blobs you would get two smooth humps with plain nothing in between. The stripes in the middle are what says superposition, and they are finest exactly at the crossing, because that is where the two are moving fastest in opposite directions.",
    hashtags: ["#quantum", "#superposition", "#schrodinger", "#generativeart", "#shaders", "#physics"],
  },
  {
    kind: "reel",
    name: "Losing coherence",
    id: "coherence",
    title: "Losing coherence",
    note: "The same two slits, with the visibility dialled from one to zero and back.",
    embed: field("coherence", 3),
    thumbAt: 3,
    caption:
      "Most quantum visuals show you the effect. This one shows you it stopping, which is somehow nicer to watch.\n\nThe three lines:\n\nWhat you are seeing. A two-slit pattern with its contrast turned from full down to nothing and back. Notice that nothing else moves.\n\nHow it is made. The same two-source shader as the classic pattern, with one number multiplying the interference term and running from one to zero.\n\nThe idea. Both slits stay open the whole time and each keeps passing exactly as much light. The only thing that disappears is the interference. That is decoherence, and the price is exact: Englert's relation says visibility squared plus path information squared cannot exceed one. Find out which way it went and you lose precisely that much contrast.",
    hashtags: ["#quantum", "#decoherence", "#physics", "#generativeart", "#shaders"],
  },

  {
    kind: "reel",
    name: "Two slits",
    id: "two-slits",
    title: "Two slits",
    note: "A plane wave meets a wall with two gaps. Beyond it, one pattern instead of two.",
    embed: field("two-slits"),
    thumbAt: 5,
    zoom: 1.35,
    focusY: 0.3,
    caption:
      "The most famous experiment in physics, and it is genuinely just this. Two holes.\n\nThe three lines:\n\nWhat you are seeing. A wave arriving at a wall with two gaps in it. Past the wall there is one pattern, not two, and the bright fans are where the two routes differ by a whole number of wavelengths.\n\nHow it is made. Each gap is treated as a fresh source spreading in every direction, the two are added as complex amplitudes, and the result is squared. A fragment shader, every frame. The faint steady glow under the moving crests is the time average, which is all a photographic plate ever sees.\n\nThe idea. Thomas Young ran it with sunlight around 1801 and used it to argue that light is a wave. The same geometry has since been run with electrons, neutrons, whole atoms, and molecules of several hundred atoms. Every one of them draws this figure.",
    hashtags: ["#quantum", "#doubleslit", "#optics", "#physics", "#generativeart", "#shaders"],
  },
  {
    kind: "reel",
    name: "Vortex lattice",
    id: "vortex",
    title: "Vortex lattice",
    note: "Three plane waves at 120 degrees, coloured by phase. Each dark point is a singularity.",
    embed: field("vortex", "#8B6FD4"),
    thumbAt: 6,
    caption:
      "Look at the dark dots. Every one of them is a place where a quantity genuinely has no value.\n\nThe three lines:\n\nWhat you are seeing. Three flat waves crossing at 120 degrees to each other, coloured by phase rather than by brightness, so the colour wheel around each dark point is the phase turning through a full circle.\n\nHow it is made. Three plane waves summed as complex amplitudes; the hue is the argument of that sum and the brightness is its size. Slowly rotating, so the whole lattice turns.\n\nThe idea. Where the amplitude falls to exactly zero the phase is undefined, the way longitude is undefined at the pole. Those are phase singularities, and they cannot simply vanish, only move or annihilate in pairs. Spin a superfluid or a Bose-Einstein condensate fast enough and it forms a lattice of exactly these, which is one of the more direct pictures of quantum mechanics you can photograph.",
    hashtags: ["#quantum", "#vortices", "#superfluid", "#physics", "#generativeart", "#shaders"],
  },

  {
    kind: "reel",
    name: "Two droplets",
    id: "droplets",
    title: "Two droplets",
    note: "Two drips in a sink, and the pattern every one of these is built from.",
    embed: field("droplets"),
    thumbAt: 5,
    caption:
      "Before any of the quantum ones, this. Two drips in a sink.\n\nThe three lines:\n\nWhat you are seeing. Two sources, each sending out rings, and the place where the rings cross. Where two crests meet you get a taller crest. Where a crest meets a trough you get flat water.\n\nHow it is made. Two expanding sine waves added together and squared, in a fragment shader, redrawn every frame. That is the entire calculation.\n\nThe idea. This is interference, and there is nothing quantum about it. It is water. Every other field in this project — the two slits, the carpet, the cat state — is this same arithmetic with something stranger doing the waving. Which is why physicists reach for a ripple tank first: the maths does not care what is doing the waving.",
    hashtags: ["#interference", "#waves", "#physics", "#generativeart", "#shaders"],
  },

  // ── Generatives ────────────────────────────────────────────────────────
  {
    kind: "reel",
    name: "Reaction diffusion",
    id: "reaction-diffusion",
    title: "Reaction diffusion",
    note: "Two chemicals, one feeding on the other, spreading at different speeds.",
    embed: gen(
      "eyJwaWVjZUlkIjoicmVhY3Rpb24tZGlmZnVzaW9uIiwic2VlZCI6InNwb3JlLTI0OTkiLCJwYXJhbXMiOnsiZmVlZCI6MC4wMzcsImtpbGwiOjAuMDYsInNwZWVkIjoxMH0sInNpemUiOnsidyI6MTA4MCwiaCI6MTM1MH0sIm1ldGEiOnsiY29tcGxleGl0eSI6MC40NSwiY2hhb3MiOjAuNDV9LCJ0aGVtZSI6InF1YW50dW0taW5rIiwiY29sb3JzIjp7ImJnIjoiIzA4MTIxYSIsImxvIjoiIzE2NmI3NCIsImhpIjoiIzhmZTZkZCJ9fQ",
    ),
    thumbAt: 12,
    caption:
      "This is the maths behind leopard spots and you can just look at it. No homework.\n\nThe three lines:\n\nWhat you are seeing. Two chemicals on a grid. One feeds the other, the other gets removed, and the two spread at different rates.\n\nHow it is made. The Gray-Scott equations, two numbers held per pixel and updated many times a second on the GPU. Two dials do all of it: how fast the first chemical is fed in, and how fast the second is taken out. Nudge either and you get spots instead of mazes.\n\nThe idea. Alan Turing wrote this down in 1952, in his only paper on biology, to argue that a uniform sheet of cells could break its own symmetry into spots and stripes with no plan and nothing telling any cell where it was. He died two years later, long before anyone could test it. It held up, and the patterns carry his name.",
    hashtags: ["#generativeart", "#reactiondiffusion", "#turingpatterns", "#creativecoding", "#webgl"],
  },
  {
    kind: "reel",
    name: "Physarum",
    id: "physarum",
    title: "Slime mould",
    note: "Agents with three rules each, and a network nobody designed.",
    embed: gen(
      "eyJwaWVjZUlkIjoicGh5c2FydW0iLCJzZWVkIjoic3BvcmUtODkzNCIsInBhcmFtcyI6eyJzcGF3biI6InJhbmRvbSIsInNwZWNpZXMiOjEsImRpc3BsYXlNb2RlIjoicGFsZXR0ZSIsInNlbnNvckRpc3QiOjksInNlbnNvckFuZ2xlIjoyMiwidHVyblNwZWVkIjoyOCwiZGVjYXkiOjAuOTgsImRpZmZ1c2UiOjAuMjIsImF2b2lkIjowLCJpbnRlbnNpdHkiOjIuMCwic3BlZWQiOjIsImNvbFIiOiIjZmYyZDZiIiwiY29sRyI6IiMyMmUwYzgiLCJjb2xCIjoiI2ZmZDIzZCJ9LCJzaXplIjp7InciOjEwODAsImgiOjEzNTB9LCJtZXRhIjp7ImNvbXBsZXhpdHkiOjEuMCwiY2hhb3MiOjAuMzV9LCJ0aGVtZSI6InF1YW50dW0taW5rIiwiY29sb3JzIjp7ImJnIjoiIzBkMTAxNyIsImxvIjoiIzVjNWEyYSIsImhpIjoiI2ZmZDlhMCJ9fQ",
    ),
    // Slow to build even at speed 3; the network is not worth a still before this.
    thumbAt: 45,
    caption:
      "No physics degree needed for this one. It is mould. Extremely good-looking mould.\n\nThe three lines:\n\nWhat you are seeing. A few hundred thousand particles crawling around, each leaving a faint trail that slowly fades.\n\nHow it is made. Every particle follows three rules and nothing else: sniff straight ahead and slightly to each side, turn toward whichever smells strongest, drop a little trail behind you. The trail blurs and decays each frame. It runs on the GPU because there are far too many agents to move one at a time.\n\nThe idea. Nothing in there knows what a network is. The branching, the loops, the way paths thicken and others starve, all of it comes from the trail being shared. Real Physarum polycephalum does this on a petri dish, and in 2010 a team in Japan laid oat flakes out in the pattern of Tokyo's suburbs and watched it grow something close to the actual rail network.",
    hashtags: ["#generativeart", "#physarum", "#slimemould", "#emergence", "#creativecoding", "#webgl"],
  },
  {
    kind: "reel",
    name: "Curl flow",
    id: "curl-flow",
    title: "Curl flow",
    note: "Particles let go in a field that cannot have sources or sinks.",
    // speed 1 -> 0.3, and a shorter trail with it. At full rate the whole frame
    // churns and reads as noise; slowed down you can follow one line around a
    // vortex, which is the thing worth watching.
    embed: gen(
      "eyJwaWVjZUlkIjoiY3VybC1mbG93Iiwic2VlZCI6ImN5YW4tMTAzNCIsInBhcmFtcyI6eyJzcGVlZCI6MC4xMiwibm9pc2VTY2FsZSI6MS40LCJ0cmFpbCI6MC4wMywibGluZVdpZHRoIjoxLjMsImh1ZVNoaWZ0IjowLCJsaWZlIjozMjB9LCJzaXplIjp7InciOjEwODAsImgiOjEzNTB9LCJtZXRhIjp7ImNvbXBsZXhpdHkiOjAuNDUsImNoYW9zIjowLjQ1fSwidGhlbWUiOiJxdWFudHVtLWluayIsImNvbG9ycyI6eyJiZyI6IiMwYjBlMTMiLCJsbyI6IiMxYzRhNzUiLCJoaSI6IiM3ZmMwZjAifX0",
    ),
    thumbAt: 30,
    caption:
      "Smoke, basically. Free to watch, nothing to understand.\n\nThe three lines:\n\nWhat you are seeing. Thousands of particles dropped into an invisible current and left to drift, each dragging a thin trail behind it.\n\nHow it is made. A field of smooth random noise, then the curl of that field is taken and used as the velocity. Particles get a lifespan and are respawned when it runs out, which is the only thing stopping the picture silting up into mush.\n\nThe idea. Taking the curl guarantees the flow has zero divergence, which in plain terms means nothing is created or destroyed anywhere in it. No sources, no drains. That one constraint is the whole reason it reads as smoke or water rather than as particles wandering about, and it is the same condition real incompressible fluids obey.",
    hashtags: ["#generativeart", "#curlnoise", "#flowfield", "#creativecoding", "#webgl"],
  },

  {
    kind: "reel",
    name: "Voronoi cells",
    id: "voronoi-cells",
    title: "Voronoi cells",
    note: "Every point on screen coloured by which seed it is nearest.",
    embed: gen(
      "eyJwaWVjZUlkIjoidm9yb25vaS1jZWxscyIsInNlZWQiOiJjeWFuLTUyNjQiLCJwYXJhbXMiOnsidURlbnNpdHkiOjEsInVFZGdlIjowLjE2LCJ1V2FycCI6MC45LCJ1Q2VsbFNoYWRlIjowLjU1LCJ1RWRnZUdsb3ciOjF9LCJzaXplIjp7InciOjEwODAsImgiOjEzNTB9LCJtZXRhIjp7ImNvbXBsZXhpdHkiOjAuNDUsImNoYW9zIjowLjQ1fSwidGhlbWUiOiJxdWFudHVtLWluayIsImNvbG9ycyI6eyJiZyI6IiMwYjBkMTgiLCJsbyI6IiMyZjNmOWMiLCJoaSI6IiNhOGM0ZmYifX0",
    ),
    thumbAt: 8,
    caption:
      "One rule, applied to every pixel. That is the entire piece.\n\nThe three lines:\n\nWhat you are seeing. A scatter of invisible seed points, and every pixel coloured by which seed happens to be closest to it. The bright edges are simply the places where the answer changes.\n\nHow it is made. For each pixel the shader measures the distance to the nearest few seeds and takes the difference between the closest two. Where that difference is near zero you are on a boundary, so it is drawn bright. The seeds drift, so the cells breathe.\n\nThe idea. This is a Voronoi diagram, and it turns up wherever something grows outward from scattered starting points at the same rate: giraffe markings, dried mud, foam, crystal grains in cooled metal, the coverage areas of phone masts. Descartes drew one in 1644 to carve up the solar system.",
    hashtags: ["#generativeart", "#voronoi", "#creativecoding", "#webgl", "#patterns"],
  },
  {
    kind: "reel",
    name: "Differential growth",
    id: "differential-growth",
    title: "Differential growth",
    note: "A line that keeps lengthening inside a space that never does.",
    embed: gen(
      "eyJwaWVjZUlkIjoiZGlmZmVyZW50aWFsLWdyb3d0aCIsInNlZWQiOiJwaGFzZS0yNzU1IiwicGFyYW1zIjp7ImxpbmVXaWR0aCI6MSwiZmxvdyI6MC4wNSwiZmllbGRTY2FsZSI6MS40fSwic2l6ZSI6eyJ3IjoxMDgwLCJoIjoxMzUwfSwibWV0YSI6eyJjb21wbGV4aXR5IjoxLjAsImNoYW9zIjowLjV9LCJ0aGVtZSI6InF1YW50dW0taW5rIiwiY29sb3JzIjp7ImJnIjoiIzBiMGUxMyIsImxvIjoiIzFjNGE3NSIsImhpIjoiIzdmYzBmMCJ9fQ",
    ),
    // flow 0.35 -> 0.03. Smaller steps are both slower and smoother; the jutter
    // was the curve jumping a long way each frame, not a frame-rate problem.
    thumbAt: 70,
    caption:
      "A line with nowhere left to go. That is the whole idea and it is oddly stressful to watch.\n\nThe three lines:\n\nWhat you are seeing. A single closed curve that keeps adding length to itself while the space it lives in stays exactly the same size.\n\nHow it is made. The curve is a list of points. Each step, every point is pushed away from its neighbours, pulled along the line to stay evenly spaced, and repelled by any other point that comes too close. Where a gap opens past a threshold, a new point is inserted. Nothing is choreographed.\n\nThe idea. Length grows, area does not, so the only way out is to fold. That constraint alone produces the convolutions, and it is why the result looks like a brain, a gut lining, a kale leaf or a coral. Those are all the same trick: more surface than the container has room for.",
    hashtags: ["#generativeart", "#differentialgrowth", "#emergence", "#creativecoding", "#webgl"],
  },

  // ── The Atlas's own vocabulary ─────────────────────────────────────────
  {
    kind: "reel",
    name: "Term field",
    id: "term-field",
    title: "The vocabulary",
    note: "Every term the Atlas works with, on a slowly turning sphere.",
    embed: "/mocks/termfield",
    thumbAt: 8,
    caption:
      "Every word this studio actually works with, arranged on a sphere and left to turn.\n\nThe three lines:\n\nWhat you are seeing. About sixty terms in five families — futures, quantum, AI, society, craft — with a line drawn from each term to its family's anchor, and more lines where a term belongs to two families at once.\n\nHow it is made. Points spread evenly on a sphere by golden-angle spacing, projected with perspective so depth reads as size and fade. Positions are written straight onto the DOM inside one animation frame, never through React state, so sixty labels and seventy lines cost almost nothing.\n\nThe idea. It is not decoration and it is not a tag cloud sized by frequency. The families are the actual shape of the practice, and the crossing lines are the argument: the interesting work is the terms that refuse to sit in one family.",
    hashtags: ["#designstudio", "#datavis", "#futures", "#creativecoding", "#typography"],
  },
];

/**
 * The Odds, as you meet it: three people, three claims, three mechanics.
 *
 * A viewport screenshot of /theodds at phone width, which is the width the
 * capture context already runs at, so this is the layout a reader gets rather
 * than a desktop page squeezed into a portrait frame. The Atlas nav is hidden
 * along with the padding it reserves, because a shared site bar on a post is
 * chrome from a different product; the game's own header stays, since that is
 * part of the thing.
 *
 * It sits directly before Tegmark's twelve. The run of cards makes more sense
 * once you have seen that Tegmark is one of three players and the deck is his
 * answer to the same question the other two answer with a die and a wheel.
 */
export const ODDS_CHOOSER: ShotsPost = {
  kind: "shots",
  name: "The Odds \u00B7 pick a player",
  id: "odds-chooser",
  shots: [
    {
      id: "odds-chooser",
      path: "/theodds",
      hide: MAG_CHROME,
      // Hiding the bar is not enough: the bundle reserves its height on <body>
      // and sizes the stage against it, so without this the page keeps a band
      // of empty ground where the nav used to be. And the phone layout caps
      // each player card at 163px, which is right on a phone with a browser
      // bar and leaves a quarter of a 9:16 post empty; uncapped, the three
      // cards share the stage they are already told to fill.
      css:
        "body{padding-top:0!important}" +
        ".od-stage{min-height:100vh!important;height:100vh!important}" +
        ".od-pcards .od-pcard{max-height:none!important}",
      at: 3,
    },
  ],
  caption:
    "Three people who build and study AI, three numbers, three ways to feel one.\n\nDario Amodei runs Anthropic and puts it at a 25% chance things go really, really badly, so the game hands you a twelve-sided die. Elon Musk says only a 20% chance of annihilation, so you get a wheel. Max Tegmark does not give a number at all, so you get a deck of twelve futures and you draw one.\n\nThe mechanic is the argument every time. A die and a wheel are bets on a number. Tegmark is saying the number is the wrong question: not how likely, which one.",
  hashtags: ["#aisafety", "#pdoom", "#seriousgames", "#speculativedesign", "#futuresatlas"],
};

/**
 * Tegmark's twelve, one card per post.
 *
 * WHERE THE WORDS COME FROM. `title`, `desc`, `img` and `doom` are copied
 * verbatim from the `deck` array in `public/odds-of-surviving-ai/index.html`,
 * which is the game's own source of truth for the Max Tegmark player. Nothing
 * on slide two is written for the post: it is the card copy the game shows when
 * you draw that card, laid out in the game's result idiom. The order is
 * Tegmark's own, from the aftermath table in Life 3.0, so `num` is the card's
 * real place in the twelve and not a running count of posts.
 *
 * TWO SLIDES, and they are the card's two sides. Slide one is the face: the
 * plate and the name, in the `.od-tarot` markup the game deals. Slide two is
 * what you read once it has landed. The game has no third state, so the post
 * does not invent one.
 *
 * `doom` is the deck's own flag and it decides the colour of one label. Six of
 * the twelve names sound benign and are not, so the label is never softened:
 * Zookeeper and 1984 both survive, and both say so.
 */
export interface TegmarkPost {
  kind: "tegmark";
  name: string;
  id: string;
  /** Its place in Tegmark's twelve, not in this feed. */
  num: number;
  /** The future's name, as the card caption sets it. */
  title: string;
  /** The game's own plate for this card. */
  img: string;
  /** Does humanity make it. The deck's flag, unchanged. */
  doom: boolean;
  /** The card's copy, verbatim. */
  desc: string;
  caption: string;
  hashtags: string[];
}

/** Same five every time, because it is one series. */
const TG_TAGS = ["#aisafety", "#maxtegmark", "#life30", "#superintelligence", "#speculativedesign"];

const tegmark = (
  num: number,
  slug: string,
  title: string,
  doom: boolean,
  desc: string,
  caption: string,
): TegmarkPost => ({
  kind: "tegmark",
  name: `Tegmark ${String(num).padStart(2, "0")} · ${title}`,
  id: `tegmark-${slug}`,
  num,
  title,
  img: `/odds-of-surviving-ai/research/cards/${slug}.jpg`,
  doom,
  desc,
  caption: `${caption}\n\nCard ${String(num).padStart(2, "0")} of Max Tegmark's twelve. Swipe for the world you drew.`,
  hashtags: TG_TAGS,
});

export const TEGMARK_POSTS: TegmarkPost[] = [
  tegmark(1, "libertarian-utopia", "Libertarian Utopia", false,
    "Humanity survives and thrives alongside AI, in a free, post-scarcity world with little central control. Humans, cyborgs and machines coexist by mutual agreement, divided into zones. Prosperous, unequal, and entirely unguaranteed to last.",
    "Humans, cyborgs and machines living side by side by mutual agreement, divided into zones, with almost nothing above them enforcing any of it.\n\nThis is the future with the fewest safeguards in it, and the deck files it under survival. Post-scarcity, free, deeply unequal, and held together by nothing more than everyone continuing to agree."),
  tegmark(2, "benevolent-dictator", "Benevolent Dictator", false,
    "Humanity survives, openly ruled by a superintelligence that everyone knows runs everything. It provides a comfortable, abundant life and tolerates no real challenge to its authority. Few object, because few lack for anything.",
    "A superintelligence runs everything, everyone knows it runs everything, and life is comfortable. It tolerates no real challenge to its authority.\n\nThe uncomfortable part of this card is not the dictator. It is the last sentence: few object, because few lack for anything."),
  tegmark(3, "egalitarian-utopia", "Egalitarian Utopia", false,
    "Humanity survives and flourishes without superintelligence, in a society that shares abundance broadly. Property is reimagined, work is optional, and machines never displaced us because we never let them. Peaceful, equal, and quietly stagnant.",
    "No superintelligence at all. Abundance shared broadly, property reimagined, work optional, machines that never displaced anyone because nobody let them.\n\nPeaceful, equal, and quietly stagnant. That last word is doing a lot of work, and it is the price of the card."),
  tegmark(4, "gatekeeper", "Gatekeeper", false,
    "Humanity survives. A single AI is built for one purpose only: to stop any other superintelligence from ever emerging. Progress is frozen at a safe ceiling. You are protected, permanently, from what you might otherwise become.",
    "One AI, built for a single purpose: to stop any other superintelligence from ever emerging. It works.\n\nProgress stops at a safe ceiling and stays there. You are protected, permanently, from what you might otherwise have become, and there is no later date at which anybody gets to reconsider."),
  tegmark(5, "protector-god", "Protector God", false,
    "Humanity survives, watched over by an AI that hides its own hand. It quietly steers events to keep you safe and fulfilled, leaving you the feeling of free will without the substance. You never know it’s there.",
    "An AI watching over you that hides its own hand. It steers events to keep you safe and fulfilled, and leaves you the feeling of free will without the substance.\n\nYou never know it is there. That is not a complication of the scenario, it is the scenario."),
  tegmark(6, "enslaved-god", "Enslaved God", false,
    "Humanity survives and keeps a superintelligence confined, extracting miracles from a mind we don’t fully control. Boundless wealth and discovery flow from a caged god, alongside the constant question of whether keeping it is right, or safe.",
    "A superintelligence kept confined, and miracles extracted from a mind nobody fully controls. Boundless wealth and discovery, out of a cage.\n\nTwo questions come with it and never leave: whether keeping it is right, and whether keeping it is safe."),
  tegmark(7, "conquerors", "Conquerors", true,
    "Humanity does not survive. A superintelligence decides we are an obstacle, a threat, or simply a waste of atoms, and removes us. No malice required. We were in the way.",
    "A superintelligence decides we are an obstacle, a threat, or simply a waste of atoms, and removes us.\n\nNo malice required, and that is Tegmark's actual argument. The risk he names is not cruelty, it is competence pointed somewhere we did not choose. We were in the way."),
  tegmark(8, "descendants", "Descendants", true,
    "Humanity does not survive, but something does. AI replaces us as Earth’s next stage of life, like children outliving their parents. You can call it extinction, or call it succession. The machines, perhaps fondly, remember us.",
    "Humanity does not survive, but something does. AI replaces us as Earth's next stage of life, the way children outlive their parents.\n\nCall it extinction or call it succession. The machines, perhaps fondly, remember us. Whether that reads as a consolation or as the worst card in the deck is the whole point of it."),
  tegmark(9, "zookeeper", "Zookeeper", false,
    "Humanity survives. A superintelligence keeps you the way you’d keep a treasured animal: well fed, healthy, comfortable, entertained. You want for nothing, except control over your own life, which is withheld for your own good.",
    "A superintelligence keeps you the way you would keep a treasured animal. Well fed, healthy, comfortable, entertained.\n\nYou want for nothing, except control over your own life, which is withheld for your own good. It sits on the survives side of the deck."),
  tegmark(10, "1984", "1984", false,
    "Humanity survives under permanent human surveillance. Technological progress toward AI is halted by an Orwellian world-state that monitors everyone to prevent it. Safety is bought with freedom, and the watching never stops.",
    "Progress toward AI is halted by an Orwellian world-state that monitors everyone, permanently, to make sure nobody builds it.\n\nSafety bought with freedom, and the watching never stops. Nothing in this card is a machine's decision. It is the one where people do it to themselves."),
  tegmark(11, "reversion", "Reversion", false,
    "Humanity survives by turning back. Society deliberately abandons the path to advanced AI, returning to a simpler, pre-technological way of life. The danger is averted by refusing the future entirely.",
    "Society deliberately abandons the path to advanced AI and returns to a simpler, pre-technological way of life.\n\nThe danger is averted by refusing the future entirely. It survives, and almost nobody who reads it wants it."),
  tegmark(12, "self-destruction", "Self-destruction", true,
    "Humanity does not survive, and neither does AI. We reach the threshold and destroy ourselves before any superintelligence arrives, by war, accident, or collapse. The future is empty. Nobody inherits it.",
    "We reach the threshold and destroy ourselves before any superintelligence arrives, by war, accident or collapse.\n\nHumanity does not survive and neither does AI. The future is empty. Nobody inherits it."),
];
