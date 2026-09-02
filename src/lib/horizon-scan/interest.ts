/**
 * Is this paper worth opening?
 *
 * A keyword feed cannot tell a finding from a framework, and academia produces
 * far more frameworks. Everything here is read off the paper's own words, so it
 * stays the same kind of rule as the topic terms and gets published beside
 * them. See SPARK in data/horizon-scan.ts for the lists.
 *
 * It is a heuristic about wording and not a judgement about worth. A careful
 * review is not a bad paper, it is a bad thing to open a page with. Nothing is
 * ever removed for a low spark; it just sorts lower.
 */
import { SPARK } from "@/data/horizon-scan";

export interface Interest {
  /** 0-1. Weighted into the ranking by SPARK_WEIGHT. */
  spark: number;
  /** The claim and stakes phrases that fired, for the line under the entry. */
  claims: string[];
  /** The dull markers that fired, printed too. The rule cuts both ways. */
  drags: string[];
  /**
   * The paper's own strongest sentence: whichever one carries the finding.
   * Extracted, never written, because this page has no editor and a generated
   * summary would be the one thing on it that nobody can check against the
   * source.
   */
  keySentence?: string;
}

/** A digit that is part of a quantity, not a citation year or a version. */
const HAS_NUMBER = /\b\d+(\.\d+)?\s?(%|per cent|percent|x|×|fold|billion|million|trillion|gw|tw|mw)\b/i;

function count(haystack: string, needles: string[]): string[] {
  return needles.filter((n) => haystack.includes(n));
}

/**
 * Sentences, roughly. Abstracts are one paragraph of prose with the odd
 * decimal and "et al." in them, so the split guards those two cases and does
 * not try to be a parser.
 */
function sentences(text: string): string[] {
  return text
    .replace(/(\d)\.(\d)/g, "$1<dot>$2")
    .replace(/\b(et al|e\.g|i\.e|vs|approx|Fig|Dr|Prof)\./gi, "$1<dot>")
    .split(/(?<=[.!?])\s+(?=[A-Z(])/)
    .map((s) => s.replace(/<dot>/g, ".").trim())
    .filter((s) => s.length > 0);
}

/** Openers that are always throat-clearing, whatever follows them. */
const THROAT_CLEARING = [
  "in this paper",
  "in this article",
  "in this study",
  "this paper",
  "this article",
  "this study",
  "this work",
  "we propose",
  "we present",
  "we introduce",
  "we develop",
  "we describe",
  "recent years have seen",
  "in recent years",
  "with the rapid",
  "the rapid development",
  "has attracted",
];

/**
 * The one sentence to show.
 *
 * Prefer the sentence that states what the paper found: a claim marker, a real
 * quantity, a workable length. Penalise the opening throat-clear and anything
 * that is still setting the scene. If nothing scores, fall back to the second
 * sentence, which in an abstract is usually where the content starts, and only
 * then to the first.
 */
function keySentence(abstract: string): string | undefined {
  const all = sentences(abstract).filter((s) => s.length >= 40 && s.length <= 320);
  if (all.length === 0) return undefined;

  let best: { s: string; score: number } | null = null;
  for (const [i, s] of all.entries()) {
    const low = s.toLowerCase();
    let score = 0;
    score += Math.min(2, count(low, SPARK.claim).length) * 3;
    score += Math.min(2, count(low, SPARK.stakes).length);
    if (HAS_NUMBER.test(s)) score += 2;
    // A claim marker is not enough on its own: "Here we propose a unified
    // framework connecting five sovereignty pillars" scores three for "here we"
    // and is exactly the sentence not to quote. Dull markers cancel it.
    score -= Math.min(2, count(low, SPARK.dull).length) * 3;
    if (THROAT_CLEARING.some((t) => low.startsWith(t) || low.startsWith(`here ${t}`) || low.startsWith(`here, ${t}`)))
      score -= 4;
    if (i === 0) score -= 1; // the first sentence is nearly always background
    if (s.length >= 80 && s.length <= 240) score += 1;
    if (!best || score > best.score) best = { s, score };
  }
  if (best && best.score > 0) return best.s;
  return all[1] ?? all[0];
}

export function readInterest(title: string, abstract?: string): Interest {
  const t = title.toLowerCase();
  const body = `${t} ${(abstract ?? "").toLowerCase()}`;

  const claims = count(body, SPARK.claim);
  const stakes = count(body, SPARK.stakes);
  const dullBody = count(body, SPARK.dull);
  const dullTitle = count(t, SPARK.dull);

  let raw = 0;
  raw += Math.min(3, claims.length) * 2;
  raw += Math.min(2, stakes.length);
  if (HAS_NUMBER.test(title)) raw += 2; // a quantity in the title is a result
  // A title is a promise. "Towards a conceptual framework for…" is telling you
  // there is no finding inside, so it counts double.
  raw -= Math.min(3, dullBody.length);
  raw -= Math.min(3, dullTitle.length) * 2;

  // −9…+10 squashed to 0-1, with a plain paper (raw 0) landing at about 0.45.
  const spark = Math.max(0, Math.min(1, (raw + 8) / 18));

  return {
    spark: Math.round(spark * 100) / 100,
    claims: Array.from(new Set([...claims, ...stakes])).slice(0, 4),
    drags: Array.from(new Set([...dullTitle, ...dullBody])).slice(0, 3),
    keySentence: abstract ? keySentence(abstract) : undefined,
  };
}
