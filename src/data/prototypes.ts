/**
 * Prototypes — a component of a bigger idea, shown as a moodboard.
 *
 * Deliberately NOT a Post, for the same reason a report is not: every entry in
 * `posts.ts` is commentary on someone ELSE's work and always shows the
 * canonical `url`. A prototype is ours and there is nothing to link to yet, so
 * squeezing it into that contract would break the feed's one promise.
 *
 * ── What a prototype post is, and is not ────────────────────────────────────
 *
 * It is a PIECE — a module, an element, one moving part of something larger —
 * presented before it exists, as a board of the decisions already made: the
 * palette, the materials, the mapping, the lineage, the open questions. It is
 * closer to a sketchbook spread than to a product page.
 *
 * It is NOT a demo, a teaser or a roadmap. Three rules follow:
 *
 * 1. **It says it does not exist.** `state` is rendered on the card and at the
 *    top of the page. A concept board that reads like a shipped feature is a
 *    lie with good typography.
 * 2. **The lineage is credited.** Where a prototype is a version of somebody
 *    else's idea, `lineage` names it, links it, and says plainly what is
 *    different. An homage that hides its source is a copy with better manners
 *    — the same rule Trajectories already follows.
 * 3. **Numbers on the board are real ones.** Where a panel quotes a figure it
 *    comes from a published Atlas report, and the panel says which. The
 *    MAPPING of those figures onto anything (a pitch, a colour) is a design
 *    decision, not a measurement, and is labelled as one.
 */

/** The kinds of panel a board can hold. Closed, because each one is drawn differently. */
export type PanelKind = "note" | "palette" | "spectrum" | "material" | "question";

export interface Swatch {
  name: string;
  /** A CSS colour built from tokens — never a raw hex. See the design rules. */
  value: string;
  note: string;
}

/** One partial in the drone, and the measured figure that sets it. */
export interface Partial {
  /** The Atlas figure this partial is tuned from. */
  figure: string;
  /** Where that figure comes from — a report and its finding. */
  from: string;
  /** 0–100, the value itself. Drives the mark's position and weight. */
  value: number;
  /** What the partial is meant to sound like, in a few words. */
  character: string;
}

export interface Panel {
  kind: PanelKind;
  /** Short label in the corner of the panel. */
  label: string;
  /** Body copy. Optional on panels whose content is the visual. */
  body?: string;
  /** Wide panels take two columns on the board. */
  wide?: boolean;
  swatches?: Swatch[];
  partials?: Partial[];
  /** For `material`: a code or spec fragment, rendered mono. */
  fragment?: string;
}

export interface Prototype {
  slug: string;
  title: string;
  /** One sentence: what the piece is. */
  dek: string;
  /** The bigger thing it is a component OF. Always stated. */
  partOf: string;
  /** Where it actually stands. Rendered, always. Never aspirational. */
  state: string;
  posted: string;
  visibility: "live" | "draft";
  /** The credited ancestor, where there is one. */
  lineage?: { name: string; by: string; url: string; different: string };
  panels: Panel[];
}

export const PROTOTYPES: Prototype[] = [
  {
    slug: "ground-tone",
    title: "Ground Tone",
    dek: "A living drone tuned by the Atlas's own measured numbers — the evidence, sounding.",
    partOf: "An instrument rack for the Atlas: pieces that let you hear a dataset instead of reading it.",
    state:
      "Concept board. Nothing is built — no audio graph, no code, no scheduled work. This is the decisions so far.",
    posted: "2026-08-16",
    visibility: "live",
    lineage: {
      name: "Biome",
      by: "Frond Studio",
      url: "https://frond-studio.com/projects/instruments/biome",
      different:
        "Biome is a sound-healing soundscape built from a frequency atlas — the drone is the subject. Here the drone is a READOUT: every partial is tuned from a figure in a published Atlas report, so the thing you are listening to is the evidence base rather than an ecosystem. Same instrument family, opposite intent.",
    },
    panels: [
      {
        kind: "note",
        label: "The idea",
        wide: true,
        body: "A single sustained chord that never resolves and never repeats exactly. Each partial in it is set by one measured figure from the reports — the share of GPT-3's training mix that was English, the share of the world's data-centre electricity the US consumes, the seconds of human review per machine-generated target. Louder findings sit louder in the chord. You do not read the number; you sit inside the balance of them.",
      },
      {
        kind: "spectrum",
        label: "The frequency atlas",
        wide: true,
        body: "Nine partials over a 55 Hz root. The figures are real and each names its report; the mapping of a figure onto a partial is a design decision, not a measurement, and is not evidence of anything.",
        partials: [
          { figure: "92.6%", from: "Whose common sense? — gpt3-english", value: 92.6, character: "the dominant tone; almost the whole chord" },
          { figure: "51.3%", from: "Whose common sense? — c4-us-hosting", value: 51.3, character: "a fifth above, steady, unmoving" },
          { figure: "45%", from: "Whose common sense? — datacentre-geography", value: 45, character: "low and mechanical, a room tone" },
          { figure: "40.6%", from: "Whose common sense? — manufactured-skew", value: 40.6, character: "the same tone as 92.6, an octave down and quieter — the web before the filtering" },
          { figure: "25%", from: "Whose common sense? — datacentre-geography", value: 25, character: "a second room, further away" },
          { figure: "16.1%", from: "Whose common sense? — wikipedia-editors", value: 16.1, character: "thin, high, easy to miss" },
          { figure: "15%", from: "Whose common sense? — ml-values", value: 15, character: "brief, appearing once a minute" },
          { figure: "10%", from: "Twenty seconds — error-rate", value: 10, character: "a beat frequency; audible only against the others" },
          { figure: "8%", from: "Whose common sense? — llama3-multilingual", value: 8, character: "the quietest thing in the chord, and the one it is about" },
        ],
      },
      {
        kind: "palette",
        label: "Sound palette",
        body: "Three layers, no melody, no rhythm. The bed is continuous; the partials fade in and out on long, unequal cycles so the chord never repeats.",
        swatches: [
          { name: "Bed", value: "color-mix(in oklab, var(--accent) 22%, transparent)", note: "55 Hz root, filtered noise, always present" },
          { name: "Partials", value: "var(--accent)", note: "the nine measured tones, each on its own cycle" },
          { name: "Breath", value: "color-mix(in oklab, var(--c-ink) 45%, transparent)", note: "slow amplitude drift, unsynced — keeps it alive" },
          { name: "Silence", value: "color-mix(in oklab, var(--c-ink) 12%, transparent)", note: "one partial drops out at a time; the gap is the point" },
        ],
      },
      {
        kind: "material",
        label: "Shape of it",
        body: "Web Audio, no samples, no library. Sketched as a graph, not written.",
        fragment: [
          "root      OscillatorNode  55 Hz  sine",
          "partial×9 OscillatorNode  root × f(figure)",
          "          → GainNode      gain = figure / 100",
          "          → LFO           0.01–0.08 Hz, unsynced per partial",
          "bed       BufferSource    pink noise → BiquadFilter lowpass 180 Hz",
          "master    → DynamicsCompressor → destination",
        ].join("\n"),
      },
      {
        kind: "question",
        label: "Still open",
        body: "Whether a listener should be able to see which figure is which while it plays, or whether naming them turns an instrument back into a chart. Currently minded to keep the readout hidden until you ask for it — the whole point is to hear the balance before you know what it is made of.",
      },
      {
        kind: "question",
        label: "Still open",
        body: "Autoplay is out of the question and a play button is a weak invitation for something that takes a minute to become anything. No good answer yet.",
      },
    ],
  },
];

export const prototypesFor = (isEditor: boolean) =>
  PROTOTYPES.filter((p) => isEditor || p.visibility === "live");

export const prototypeBySlug = (slug: string) => PROTOTYPES.find((p) => p.slug === slug);
