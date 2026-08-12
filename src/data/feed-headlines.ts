/**
 * The line that follows FEED in the masthead. One is picked at random per
 * visit and set in a light weight against the caps.
 *
 * The register is Kraftwerk-adjacent — clipped, declarative, man-and-machine,
 * precision and repetition — but these are ORIGINAL lines, not their lyrics.
 * Lifting twenty-five phrases from a catalogue of songs would be reproducing
 * copyrighted text however short each one is, and it would also waste the slot:
 * written fresh, each line can be about what this site actually covers.
 *
 * House rules for additions: four to seven words, present tense, no vendor
 * names, no numbers that could read as a claim about the world, and nothing
 * that pretends to be a headline. It is a greeting in a machine voice.
 */
export const FEED_HEADLINES: string[] = [
  "We are the operators.",
  "Man, machine, and the argument between.",
  "Transmission received.",
  "The computer is listening.",
  "Numbers, in every language.",
  "Precision. Repetition. Power.",
  "The network hums.",
  "Programmed to read.",
  "Frequency rising.",
  "Cool, mechanical, and on time.",
  "Energy in, signal out.",
  "The circuit is complete.",
  "Electric minds at work.",
  "Silicon and rhythm.",
  "The future arrives on schedule.",
  "Data in motion.",
  "Voltage steady.",
  "A calculated tomorrow.",
  "All systems reading.",
  "The tape is running.",
  "Antenna up.",
  "Machines that count for us.",
  "Endless loop, endless progress.",
  "We built the instruments.",
  "Human, after all.",
];

/** Deterministic only in that it always returns one of them. */
export const randomHeadline = () =>
  FEED_HEADLINES[Math.floor(Math.random() * FEED_HEADLINES.length)];
