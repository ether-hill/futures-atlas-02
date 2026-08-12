/**
 * Feed polls — the reader's view, asked plainly.
 *
 * These are the site's own questions, not surveys of anyone else, and the
 * results shown are the real tally of answers given here. That matters: the
 * feed deliberately carries no like or view counts because those numbers don't
 * exist for this site, and a poll showing invented percentages would be the
 * same failure in a different costume. If the store is unavailable the card
 * says so rather than showing a number it made up.
 */

export interface Poll {
  id: string;
  question: string;
  /** Short framing under the question — why it is worth asking. */
  note?: string;
  options: { id: string; label: string }[];
}

export const POLLS: Poll[] = [
  {
    id: "crqc-2035",
    question: "Will a quantum computer break RSA-2048 before 2035?",
    note: "Error correction is the whole argument. Everything else is engineering.",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "unsure", label: "Too early to say" },
    ],
  },
  {
    id: "bottleneck",
    question: "Which constraint bites hardest on AI over the next five years?",
    options: [
      { id: "power", label: "Power and grid" },
      { id: "silicon", label: "Silicon supply" },
      { id: "data", label: "Training data" },
      { id: "people", label: "People who can build it" },
    ],
  },
  {
    id: "open-weights",
    question: "Should frontier model weights be published openly?",
    note: "The answer most people give moves once a capability threshold is named.",
    options: [
      { id: "always", label: "Yes, always" },
      { id: "threshold", label: "Up to a capability line" },
      { id: "never", label: "No" },
    ],
  },
];

export const pollById = (id: string) => POLLS.find((p) => p.id === id);
