/**
 * The feed's masthead line. One of these is picked at random per visit, in
 * place of the word "Feed".
 *
 * House rules, so additions stay in key: dry rather than zany, aimed at the
 * beats this site actually covers — quantum, frontier AI, compute and power,
 * and the social weather around them. No fake statistics, no vendor names in
 * the punchline, nothing that reads as a claim about the world. It is a
 * greeting, not a headline.
 */
export const FEED_HEADLINES: string[] = [
  "Welcome back.",
  "The word on the street.",
  "Explore the feed.",
  "Everything, all at once, in order.",
  "Superposition of unread tabs.",
  "Still not decohered.",
  "The grid is fine. The grid is fine.",
  "Somebody built a data centre again.",
  "Reading so you don't have to. Mostly.",
  "Signal, with the hype filtered out.",
  "Qubits go up, error bars go sideways.",
  "This week in things that scale.",
  "Compute is the new weather.",
  "Now with 100% fewer roadmap slides.",
  "Benchmarks were harmed in the making of this.",
  "The future, cited.",
  "Extremely normal week for computing.",
  "Where the footnotes live.",
  "Nothing here is a press release.",
  "Ten gigawatts and a dream.",
  "Every claim has a link. That's the whole trick.",
  "Warmer than a server room, colder than a dilution fridge.",
  "The scaling laws send their regards.",
  "Arrived already, or still brochure?",
  "Someone's error correction is working.",
  "Latency: hours. Accuracy: we tried.",
  "Not financial advice. Not any advice.",
  "The bottleneck moved again.",
  "Reports of the wall have been exaggerated. Possibly.",
  "Written by humans, about machines.",
];

/** Deterministic only in that it always returns one of them. */
export const randomHeadline = () =>
  FEED_HEADLINES[Math.floor(Math.random() * FEED_HEADLINES.length)];
