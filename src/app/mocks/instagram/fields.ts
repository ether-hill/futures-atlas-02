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

export interface ReelPost {
  kind: "reel";
  /** Working title for the mock's chrome. Never rendered on a slide. */
  name: string;
  /** Stable id: the thumbnail is captured to public/mocks/instagram/<id>.jpg. */
  id: string;
  title: string;
  /** One line about the piece, in the source project's own words where it has them. */
  note: string;
  /** The live embed, mounted only when the post is open. */
  embed: string;
  /** Seconds to let the embed run before the thumbnail is grabbed. */
  thumbAt: number;
  caption: string;
  hashtags: string[];
}

const field = (slug: string) =>
  `/interference/embed.html?v=${slug}&pal=4&hex=${encodeURIComponent(ATLAS_BLUE)}&speed=0.7&label=0`;

/**
 * A Generatives config, base64 JSON in the hash, exactly as the dashboard
 * writes it. These were taken FROM the dashboard rather than hand-built: the
 * pieces do not fill in their own schema defaults, so a config with empty
 * params renders nothing at all.
 */
const gen = (hash: string) => `/generatives/embed.html#${hash}`;

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
    // late enough that the stripes have actually formed.
    thumbAt: 22,
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
    embed: field("carpet"),
    thumbAt: 7,
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
    embed: field("packets"),
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
    embed: field("coherence"),
    thumbAt: 3,
    caption:
      "Most quantum visuals show you the effect. This one shows you it stopping, which is somehow nicer to watch.\n\nThe three lines:\n\nWhat you are seeing. A two-slit pattern with its contrast turned from full down to nothing and back. Notice that nothing else moves.\n\nHow it is made. The same two-source shader as the classic pattern, with one number multiplying the interference term and running from one to zero.\n\nThe idea. Both slits stay open the whole time and each keeps passing exactly as much light. The only thing that disappears is the interference. That is decoherence, and the price is exact: Englert's relation says visibility squared plus path information squared cannot exceed one. Find out which way it went and you lose precisely that much contrast.",
    hashtags: ["#quantum", "#decoherence", "#physics", "#generativeart", "#shaders"],
  },

  // ── Generatives ────────────────────────────────────────────────────────
  {
    kind: "reel",
    name: "Reaction diffusion",
    id: "reaction-diffusion",
    title: "Reaction diffusion",
    note: "Two chemicals, one feeding on the other, spreading at different speeds.",
    embed: gen(
      "eyJwaWVjZUlkIjoicmVhY3Rpb24tZGlmZnVzaW9uIiwic2VlZCI6InNwb3JlLTI0OTkiLCJwYXJhbXMiOnsiZmVlZCI6MC4wMzcsImtpbGwiOjAuMDYsInNwZWVkIjoxMH0sInNpemUiOnsidyI6MTA4MCwiaCI6MTM1MH0sIm1ldGEiOnsiY29tcGxleGl0eSI6MC40NSwiY2hhb3MiOjAuNDV9LCJ0aGVtZSI6InF1YW50dW0taW5rIiwiY29sb3JzIjp7ImJnIjoiIzBiMGUxMyIsImxvIjoiIzFjNGE3NSIsImhpIjoiIzdmYzBmMCJ9fQ",
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
      "eyJwaWVjZUlkIjoicGh5c2FydW0iLCJzZWVkIjoic3BvcmUtODkzNCIsInBhcmFtcyI6eyJzcGF3biI6InJpbmciLCJzcGVjaWVzIjoxLCJkaXNwbGF5TW9kZSI6InBhbGV0dGUiLCJzZW5zb3JEaXN0Ijo5LCJzZW5zb3JBbmdsZSI6MjIsInR1cm5TcGVlZCI6MjgsImRlY2F5IjowLjkzLCJkaWZmdXNlIjowLjM1LCJhdm9pZCI6MCwiaW50ZW5zaXR5IjoxLjYsInNwZWVkIjoxLCJjb2xSIjoiI2ZmMmQ2YiIsImNvbEciOiIjMjJlMGM4IiwiY29sQiI6IiNmZmQyM2QifSwic2l6ZSI6eyJ3IjoxMDgwLCJoIjoxMzUwfSwibWV0YSI6eyJjb21wbGV4aXR5IjowLjQ1LCJjaGFvcyI6MC40NX0sInRoZW1lIjoicXVhbnR1bS1pbmsiLCJjb2xvcnMiOnsiYmciOiIjMGIwZTEzIiwibG8iOiIjMWM0YTc1IiwiaGkiOiIjN2ZjMGYwIn19",
    ),
    // Slow to build: the network is barely there before ~20s.
    thumbAt: 26,
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
    embed: gen(
      "eyJwaWVjZUlkIjoiY3VybC1mbG93Iiwic2VlZCI6ImRyaWZ0LTQ5NzciLCJwYXJhbXMiOnsic3BlZWQiOjEsIm5vaXNlU2NhbGUiOjEuNCwidHJhaWwiOjAuMDcsImxpbmVXaWR0aCI6MS4xLCJodWVTaGlmdCI6MCwibGlmZSI6MTcwfSwic2l6ZSI6eyJ3IjoxMDgwLCJoIjoxMzUwfSwibWV0YSI6eyJjb21wbGV4aXR5IjowLjQ1LCJjaGFvcyI6MC40NX0sInRoZW1lIjoicXVhbnR1bS1pbmsiLCJjb2xvcnMiOnsiYmciOiIjMGIwZTEzIiwibG8iOiIjMWM0YTc1IiwiaGkiOiIjN2ZjMGYwIn19",
    ),
    thumbAt: 14,
    caption:
      "Smoke, basically. Free to watch, nothing to understand.\n\nThe three lines:\n\nWhat you are seeing. Thousands of particles dropped into an invisible current and left to drift, each dragging a thin trail behind it.\n\nHow it is made. A field of smooth random noise, then the curl of that field is taken and used as the velocity. Particles get a lifespan and are respawned when it runs out, which is the only thing stopping the picture silting up into mush.\n\nThe idea. Taking the curl guarantees the flow has zero divergence, which in plain terms means nothing is created or destroyed anywhere in it. No sources, no drains. That one constraint is the whole reason it reads as smoke or water rather than as particles wandering about, and it is the same condition real incompressible fluids obey.",
    hashtags: ["#generativeart", "#curlnoise", "#flowfield", "#creativecoding", "#webgl"],
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
