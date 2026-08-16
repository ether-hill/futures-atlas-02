/**
 * Prototypes — a component of a bigger idea, carried into the Atlas whole.
 *
 * Deliberately NOT a Post: every entry in `posts.ts` is commentary on someone
 * else's work and always shows the canonical `url`, and squeezing something
 * else into that contract would break the feed's one promise.
 *
 * ── The first one is a reproduction, not a version ──────────────────────────
 *
 * Biome is Frond Studio's, and this carries it across as it stands: its own
 * eyebrow, title, description, the actual instrument, and the frequency atlas
 * exactly as published — same rows, same wording, same evidence ratings, same
 * two disclaimers. Nothing is added, nothing is re-scored and nothing is
 * summarised, because a reproduction that improves its source is no longer a
 * reproduction.
 *
 * ── Two things that are load-bearing ────────────────────────────────────────
 *
 * 1. **The instrument is the real one**, framed from the studio's own embed
 *    endpoint. It is not a rebuild: a reimplementation would drift from the
 *    original the first time either side changed, and this page would then be
 *    quietly claiming to be something it was not.
 * 2. **The evidence column and both disclaimers travel with the table.** The
 *    ratings are the source's own — R research-backed, T traditional, N
 *    numerology/folklore — and 29 of the 31 rows are N. Publishing the claims
 *    without the column that rates them, or without the line saying this is
 *    not a medical device, would turn a carefully hedged table into an
 *    assertion. That is the one edit this file must never make.
 *
 * The known data quirk is preserved rather than corrected: the row labelled
 * "555 · Angel — change" carries hz 528 in the source. It is reproduced as
 * published — fixing somebody else's data silently is its own kind of lie.
 */

export interface AtlasTone {
  /** Carrier frequency in Hz, as published. */
  hz: number;
  /** The source's own label, including its numeric prefix. */
  label: string;
  cat: string;
  /** What the tradition says it does — reported, never endorsed. */
  claim: string;
  /** R research-backed · T traditional/anecdotal · N numerology/folklore. */
  ev: "R" | "T" | "N";
}

export interface Prototype {
  slug: string;
  /** The source's own eyebrow, verbatim. */
  eyebrow: string;
  title: string;
  /** The source's own description, verbatim. */
  description: string;
  posted: string;
  visibility: "live" | "draft";
  /** Whose it is, and where it lives. Always rendered. */
  origin: { by: string; url: string };
  /**
   * The live instrument, framed. Points at the project page rather than the
   * compact embed: the embed endpoint only builds a 480px player strip, and the
   * ask was for the instrument's real UI.
   */
  embed: { src: string };
  atlas: {
    /** The panel heading, verbatim. */
    title: string;
    /** The evidence legend, verbatim. */
    legend: string;
    /** The mechanics-and-safety note, verbatim. */
    mechanics: string;
    tones: AtlasTone[];
  };
}

const BIOME_TONES: AtlasTone[] = [
  { hz: 174, label: "174 · Foundation", cat: "Solfeggio", claim: "Pain relief, grounding, safety", ev: "N" },
  { hz: 285, label: "285 · Tissue", cat: "Solfeggio", claim: "Tissue & field repair", ev: "N" },
  { hz: 396, label: "396 · Liberation (UT)", cat: "Solfeggio", claim: "Releases fear & guilt · Root", ev: "N" },
  { hz: 417, label: "417 · Change (RE)", cat: "Solfeggio", claim: "Undoing situations · Sacral", ev: "N" },
  { hz: 528, label: "528 · Love / DNA (MI)", cat: "Solfeggio", claim: "Transformation, “DNA repair” · Solar Plexus", ev: "N" },
  { hz: 639, label: "639 · Connection (FA)", cat: "Solfeggio", claim: "Relationships, harmony · Heart", ev: "N" },
  { hz: 741, label: "741 · Awakening (SOL)", cat: "Solfeggio", claim: "Detox, expression · Throat", ev: "N" },
  { hz: 852, label: "852 · Intuition (LA)", cat: "Solfeggio", claim: "Inner wisdom · Third Eye", ev: "N" },
  { hz: 963, label: "963 · Crown (SI)", cat: "Solfeggio", claim: "Pineal, oneness · Crown", ev: "N" },
  { hz: 432, label: "432 · Verdi tuning", cat: "Tuning", claim: "“Natural” calming pitch", ev: "N" },
  { hz: 440, label: "440 · Concert A", cat: "Tuning", claim: "Modern ISO standard", ev: "R" },
  { hz: 136.1, label: "136.1 · OM / Earth Year", cat: "Earth", claim: "OM chant tone, grounding", ev: "N" },
  { hz: 126.22, label: "126.22 · Sun", cat: "Earth", claim: "Centering, solar vitality", ev: "N" },
  { hz: 210.42, label: "210.42 · Moon", cat: "Earth", claim: "Emotional balance, intuition", ev: "N" },
  { hz: 194.18, label: "194.18 · Earth Day", cat: "Earth", claim: "Energising, vitality", ev: "N" },
  { hz: 172.06, label: "172.06 · Platonic Year", cat: "Earth", claim: "Clarity, cosmic consciousness", ev: "N" },
  { hz: 110, label: "110 · Hypogeum", cat: "Earth", claim: "Trance/hypnagogic shift", ev: "T" },
  { hz: 256, label: "256 · Root (C)", cat: "Chakra", claim: "Grounding, security", ev: "N" },
  { hz: 288, label: "288 · Sacral (D)", cat: "Chakra", claim: "Creativity, emotion", ev: "N" },
  { hz: 320, label: "320 · Solar (E)", cat: "Chakra", claim: "Personal power", ev: "N" },
  { hz: 341.3, label: "341 · Heart (F)", cat: "Chakra", claim: "Love, compassion", ev: "N" },
  { hz: 384, label: "384 · Throat (G)", cat: "Chakra", claim: "Expression, truth", ev: "N" },
  { hz: 480, label: "480 · Crown (B)", cat: "Chakra", claim: "Spirit, connection", ev: "N" },
  { hz: 369, label: "369 · Tesla 3·6·9", cat: "Tesla", claim: "“Key to the universe”, manifestation", ev: "N" },
  { hz: 111, label: "111 · Angel — new starts", cat: "Numerology", claim: "Manifestation, clarity", ev: "N" },
  { hz: 222, label: "222 · Angel — balance", cat: "Numerology", claim: "Harmony, trust", ev: "N" },
  { hz: 444, label: "444 · Angel — protection", cat: "Numerology", claim: "Protection, alignment", ev: "N" },
  { hz: 528, label: "555 · Angel — change", cat: "Numerology", claim: "Transformation", ev: "N" },
  { hz: 777, label: "777 · Angel — luck", cat: "Numerology", claim: "Awakening, inner wisdom", ev: "N" },
  { hz: 888, label: "888 · Angel — abundance", cat: "Numerology", claim: "Prosperity, infinite flow", ev: "N" },
  { hz: 999, label: "999 · Angel — completion", cat: "Numerology", claim: "Release, new phase", ev: "N" },
];

export const PROTOTYPES: Prototype[] = [
  {
    slug: "biome",
    eyebrow: "BIOME · SOUND HEALING SOUNDSCAPE ECOSYSTEM",
    title: "Biome.",
    description:
      "A living soundscape mixer built on the frequencies of sound healing — solfeggio, binaural & isochronic beats, Schumann and 40 Hz gamma, drones and noise beds — each a breathing channel. Power on, load a realm, randomise, save your own, or hit SPAWN and let the ecosystem grow itself — dial its SPEED and CHAOS. Best with headphones; a relaxation instrument, not a medical device.",
    posted: "2026-08-16",
    visibility: "live",
    origin: { by: "Frond Studio", url: "https://frond-studio.com/projects/instruments/biome" },
    // The project page itself, not the compact embed. The embed endpoint only
    // builds a 480px player strip, and stretched across a column it reads as an
    // empty bar; this is the instrument's real UI — transport, mixer, realms.
    embed: { src: "https://frond-studio.com/projects/instruments/biome" },
    atlas: {
      title: "FREQUENCY ATLAS · WHAT EACH TONE IS SAID TO DO",
      legend:
        "Evidence — R research-backed · T traditional/anecdotal · N numerology/folklore. Claims are reported as the sound-healing tradition frames them.",
      mechanics:
        "Mechanics — binaural beats need headphones (a tone in each ear; the brain hears the difference as a brainwave-rate beat). Isochronic tones pulse a single tone on/off, so they work on speakers. Keep the volume gentle. Avoid if prone to seizures; not for use while driving. A relaxation instrument — not a medical device.",
      tones: BIOME_TONES,
    },
  },
];

export const prototypesFor = (isEditor: boolean) =>
  PROTOTYPES.filter((p) => isEditor || p.visibility === "live");

export const prototypeBySlug = (slug: string) => PROTOTYPES.find((p) => p.slug === slug);
