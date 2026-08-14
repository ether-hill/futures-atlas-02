/**
 * Pushing back.
 *
 * The point of the project is that a counterfactual should be arguable, so the
 * argument has to do something. Type an objection and one of two things happens:
 * the transforms get adjusted and every chart redraws, or they don't and you get
 * told why not. Both are answers. A tool that agreed with every objection would
 * be as useless as one that ignored them.
 *
 * These are matched on keywords, which is weak, and they are written by hand,
 * which is the honest version of what a model will do later: it will emit the
 * same declarative adjustment over the same typed effects. Nothing here invents
 * a data point either.
 *
 * The adjustment is deliberately blunt. `scale` moves every effect's deviation
 * from neutral, so 0.5 halves the whole intervention without touching which way
 * anything points; `lag` pushes every effect later. Neither can reach a `freeze`
 * or a `converge`, because those name an absolute level rather than a rate, and
 * the responses say so where it matters.
 */

import type { Intervention } from "@/lib/interventions";

export type Rebuttal = {
  id: string;
  keywords: string[];
  /** How the objection gets read back, so you can see what was understood. */
  label: string;
  verdict: "revised" | "held";
  response: string;
  adjust?: { scale?: number; lag?: number };
};

export const REBUTTALS: Rebuttal[] = [
  {
    id: "overstated",
    keywords: [
      "too strong", "overstat", "exaggerat", "too big", "too much", "too dramatic",
      "wouldn't be that", "would not be that", "smaller effect", "less than that", "milder",
    ],
    label: "the effect is overstated",
    verdict: "revised",
    adjust: { scale: 0.5 },
    response:
      "Taken. Every rate is now half as far from neutral as it was, dates untouched, so the shape survives and the size drops. What that doesn't fix: the direction of each effect is still an authored guess, and halving a guess leaves you a smaller guess. Interventions built on a freeze or a hard cap barely move, because those name a level rather than a rate.",
  },
  {
    id: "understated",
    keywords: [
      "too weak", "understat", "much worse", "much bigger", "more severe", "too small",
      "harder than", "stronger effect", "underestimat",
    ],
    label: "the effect is understated",
    verdict: "revised",
    adjust: { scale: 1.7 },
    response:
      "Fine, pushed to nearly double. Notice what it does to the figures that were already near a ceiling: almost nothing, because a share of organisations can't pass 100% however hard you push the rate. If your argument is that the effect is bigger, the charts that can show you are the unbounded ones.",
  },
  {
    id: "slower",
    keywords: [
      "take longer", "takes longer", "slower", "years to", "not overnight", "not immediate",
      "lag", "delay", "wouldn't happen straight", "too fast", "too quick",
    ],
    label: "it would take longer to bite",
    verdict: "revised",
    adjust: { lag: 2 },
    response:
      "Agreed, and this is the correction the model most often needs. Everything now starts two years later than it did. On a horizon this short that eats a lot of the effect, which is itself the finding: an intervention with a slow fuse and a 2032 horizon is mostly a chart about the fuse.",
  },
  {
    id: "elsewhere",
    keywords: [
      "offshore", "elsewhere", "another country", "other countries", "china will", "move abroad",
      "jurisdiction", "evade", "loophole", "black market", "somewhere else", "relocat",
    ],
    label: "the activity relocates rather than stops",
    verdict: "revised",
    adjust: { scale: 0.55 },
    response:
      "Half conceded. Damped everything by 45%, which is the best this engine can do with your point, and it's the wrong shape: relocation moves activity between series, it doesn't shrink the total. Doing it properly needs a transform that takes from one country and gives to another, and the only figure here with the country breakdown to support that is private investment by geography. Everything else would be guessing.",
  },
  {
    id: "projection",
    keywords: [
      "projection", "made up", "invented", "forecast", "you don't know", "you do not know",
      "2032 is", "speculation", "fabricat", "crystal ball", "how do you know the future",
    ],
    label: "the projected half is invented",
    verdict: "held",
    response:
      "Yes, and it says so on the chart. Everything right of the dashed rule is one rule applied to every figure the same way: compound growth over the last four observations, capped at 50% a year, decayed 25% a year after that. It's stated because it can't be defended, only shown. If you want an argument with no invented numbers in it, date the intervention before 2026 and it rewrites the published record instead, where every value traces to a cell in Stanford's own CSV.",
  },
  {
    id: "data",
    keywords: [
      "data is wrong", "bad data", "unreliable", "methodology", "sample", "survey",
      "source is", "who counted", "self-report", "biased data", "epoch", "quid",
    ],
    label: "the underlying data is unreliable",
    verdict: "held",
    response:
      "Probably right about some of it, and the chart can't fix that. Open Data under any figure and you get the numbers; open Source CSV and you get Stanford's file. The AI incident count is the one I'd distrust most: the AI Incident Database counts reported incidents from news coverage, so it measures reporting and harm together and can't separate them.",
  },
  {
    id: "causation",
    keywords: [
      "correlation", "causation", "causal", "coincidence", "doesn't cause", "does not cause",
      "spurious", "confound", "reverse causal",
    ],
    label: "these figures don't cause each other",
    verdict: "held",
    response:
      "Correct, and nothing here claims they do. An effect is a stated belief about a mechanism, tagged with how much weight it deserves, and roughly a third of them are marked speculative for exactly this reason. Open the reasoning on any figure and the sentence either convinces you or it doesn't. That's the whole test.",
  },
  {
    id: "politics",
    keywords: [
      "never happen", "unrealistic", "impossible", "no government", "won't pass", "will not pass",
      "not feasible", "politically", "who would agree", "never get through",
    ],
    label: "it could never actually happen",
    verdict: "held",
    response:
      "Almost certainly true of most of them, and it changes nothing here. This isn't a forecast of what gets legislated; it's a way of asking how much of the trend is downstream of a decision at all. The interesting result is usually how little moves, not how much.",
  },
  {
    id: "wrong-direction",
    keywords: [
      "wrong direction", "opposite", "would go up", "would go down", "backwards",
      "other way", "increase not decrease", "decrease not increase",
    ],
    label: "the effect points the wrong way",
    verdict: "held",
    response:
      "Can't do that one, and I'd rather say so than fake it. Flipping a sign isn't a smaller version of the same claim, it's a different claim, and it needs its own reason and its own confidence rather than a slider. Open the reasoning, find the effect you disagree with, and the sentence you're arguing with is right there.",
  },
];

export function matchRebuttal(text: string): Rebuttal | null {
  const q = text.toLowerCase().trim();
  if (q.length < 4) return null;
  let best: { r: Rebuttal; score: number } | null = null;
  for (const r of REBUTTALS) {
    const score = r.keywords.reduce((n, w) => n + (q.includes(w) ? w.length : 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { r, score };
  }
  return best?.r ?? null;
}

/** Applies a rebuttal's adjustment to every effect it can reach. */
export function reviseWith(iv: Intervention, r: Rebuttal | null): Intervention {
  if (!r?.adjust) return iv;
  const scale = r.adjust.scale ?? 1;
  const lag = r.adjust.lag ?? 0;
  return {
    ...iv,
    effects: iv.effects.map((e) => {
      let magnitude = e.magnitude;
      if (e.op === "growthRate") magnitude = 1 + (e.magnitude - 1) * scale;
      else if (e.op === "levelShift") magnitude = e.magnitude * scale;
      else if (e.op === "cap" && scale > 0) magnitude = e.magnitude / scale;
      return { ...e, magnitude, lag: (e.lag ?? 0) + lag };
    }),
  };
}
