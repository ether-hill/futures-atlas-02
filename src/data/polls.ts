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
  {
    id: "entry-level",
    question: "Is AI already closing the bottom rung of the career ladder?",
    note: "Payroll records say the effect lands on hiring, not on firing — which is far harder to see.",
    options: [
      { id: "already", label: "Yes, it is visible now" },
      { id: "soon", label: "Not yet, but within a few years" },
      { id: "demand", label: "No — junior hiring tracks demand, not AI" },
    ],
  },
  {
    id: "who-pays",
    question: "Who should pay for the grid a new data centre needs?",
    note: "Contracts run about fifteen years. Gas plants run about forty.",
    options: [
      { id: "operator", label: "The operator, in full" },
      { id: "split", label: "Split, and fix it in the contract" },
      { id: "ratepayers", label: "Ratepayers — it is shared infrastructure" },
      { id: "state", label: "The state, as industrial policy" },
    ],
  },
  {
    id: "agent-trust",
    question: "How much of your own work would you hand to an autonomous agent today?",
    options: [
      { id: "none", label: "None of it" },
      { id: "chores", label: "Small chores I would check anyway" },
      { id: "reviewable", label: "Anything I can review afterwards" },
      { id: "unsupervised", label: "Whole tasks, unsupervised" },
    ],
  },
];

export const pollById = (id: string) => POLLS.find((p) => p.id === id);
