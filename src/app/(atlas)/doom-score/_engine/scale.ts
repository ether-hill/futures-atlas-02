/**
 * Probability → pitch. The y axis of the plot IS the scale: 0% sits on the
 * lowest note, 100% on the highest, two octaves apart, and every row is
 * quantised to the nearest degree so the data sounds like music rather than
 * a theremin. Semitone offsets from the root, per octave.
 *
 * The default is Phrygian: a minor scale with a flattened second, the
 * half-step above the root that film scores use for dread. It still resolves,
 * so a run of notes sounds like a piece and not an alarm.
 */
export type ScaleName = "dread" | "harmonic" | "pentatonic" | "dorian" | "wholetone" | "chromatic";

export const SCALES: Record<ScaleName, { label: string; steps: number[] }> = {
  dread: { label: "Dread (Phrygian)", steps: [0, 1, 3, 5, 7, 8, 10] },
  harmonic: { label: "Harmonic minor", steps: [0, 2, 3, 5, 7, 8, 11] },
  pentatonic: { label: "Minor pentatonic", steps: [0, 3, 5, 7, 10] },
  dorian: { label: "Dorian", steps: [0, 2, 3, 5, 7, 9, 10] },
  wholetone: { label: "Whole tone", steps: [0, 2, 4, 6, 8, 10] },
  chromatic: { label: "Chromatic", steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
};

export const ROOT_HZ = 110; // A2
export const OCTAVES = 2;

/** All semitone offsets across the range, lowest first, including the top root. */
export function degrees(scale: ScaleName): number[] {
  const steps = SCALES[scale].steps;
  const out: number[] = [];
  for (let o = 0; o < OCTAVES; o++) for (const s of steps) out.push(o * 12 + s);
  out.push(OCTAVES * 12);
  return out;
}

/** Which degree (index into degrees()) a percentage lands on. */
export function degreeFor(p: number, scale: ScaleName): number {
  const n = degrees(scale).length;
  const clamped = Math.max(0, Math.min(100, p));
  return Math.round((clamped / 100) * (n - 1));
}

export function hzFor(p: number, scale: ScaleName): number {
  const semis = degrees(scale)[degreeFor(p, scale)];
  return ROOT_HZ * Math.pow(2, semis / 12);
}

/** The percentage a degree sits at, for drawing the quantised grid. */
export function pForDegree(i: number, scale: ScaleName): number {
  const n = degrees(scale).length;
  return (i / (n - 1)) * 100;
}

const NAMES = ["A", "B♭", "B", "C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭"];
export function noteName(semisFromRoot: number): string {
  return NAMES[((semisFromRoot % 12) + 12) % 12] + (2 + Math.floor(semisFromRoot / 12));
}
