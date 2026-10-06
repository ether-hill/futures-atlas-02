import type { Lane, Status } from "./types";

/**
 * The working title lives here and nowhere else, so a rename is one edit.
 * The slug is separate on purpose: renaming the project should not move its
 * URLs (the same call Magnifica made).
 */
export const SW_TITLE = "Standing Waves";
export const SW_BASE = "/standing-waves";

export const SW_PAGES = [
  { label: "Overview", href: SW_BASE },
  { label: "Timeline", href: `${SW_BASE}/timeline` },
  { label: "Read", href: `${SW_BASE}/read` },
  { label: "People", href: `${SW_BASE}/people` },
  { label: "Gallery", href: `${SW_BASE}/gallery` },
  { label: "Simulator", href: `${SW_BASE}/simulator` },
  { label: "Sources", href: `${SW_BASE}/sources` },
] as const;

export const LANE_ORDER: Lane[] = ["cymatics", "wave-physics", "quantum", "pilot-wave"];

export const LANE_LABEL: Record<Lane, string> = {
  cymatics: "Cymatics",
  "wave-physics": "Wave physics",
  quantum: "Quantum",
  "pilot-wave": "Pilot-wave",
};

export const STATUS_ORDER: Status[] = ["established", "historical", "contested", "not-replicated", "unsupported-claim"];

export const STATUS_LABEL: Record<Status, string> = {
  established: "Established",
  historical: "Historical",
  contested: "Contested",
  "not-replicated": "Not replicated",
  "unsupported-claim": "Unsupported claim",
};

/** The 4-point spine. Every section serves one of these. */
export const SPINE = [
  {
    n: "01",
    short: "Same maths",
    plain:
      "A sand pattern on a ringing plate and an electron in an atom obey the same kind of wave equation, and in both cases the walls are what force the waves into a few allowed shapes.",
    href: `${SW_BASE}/read/same-math-different-worlds`,
  },
  {
    n: "02",
    short: "The walking droplet",
    plain:
      "Since 2005, oil droplets bouncing on a vibrating bath have copied some quantum behaviour. It is the one serious research programme linking a vibrating fluid to quantum physics.",
    href: `${SW_BASE}/read/the-walking-droplet`,
  },
  {
    n: "03",
    short: "Where it breaks",
    plain:
      "The droplets were said to pass the most famous quantum test, the double slit. Careful repeats found they do not, and the reason why is the most useful part of the story.",
    href: `${SW_BASE}/read/where-the-analogy-breaks`,
  },
  {
    n: "04",
    short: "Not magic",
    plain:
      "Claims that cymatics proves quantum physics, or that vibration creates matter, have no published evidence behind them. Here is where the line sits, and why.",
    href: `${SW_BASE}/read/vibration-isnt-magic`,
  },
] as const;
