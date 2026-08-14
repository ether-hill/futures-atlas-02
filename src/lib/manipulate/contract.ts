/**
 * The contract a free-text intervention has to satisfy.
 *
 * Manipulate the data rests on one rule: an intervention never emits a data
 * point. It emits typed, dated transforms over the published series, each with
 * a stated reason and a confidence, and the engine in the sub-app applies them.
 * Letting a model write numbers into the chart would throw that away, so the
 * model is held to exactly the same shape the eight authored interventions use,
 * and anything that does not type-check is rejected rather than repaired.
 *
 * The figure catalogue is read from the sub-app's own generated data file, so
 * the ids the model is offered cannot drift from the ids the engine knows.
 */
import { z } from "zod";
import figuresJson from "../../../manipulate-the-data/data/figures.json";

type RawFigure = {
  id: string;
  title: string;
  levers?: string[];
  yAxis?: { label?: string };
  categories?: string[];
  hero?: boolean;
};

const RAW = (figuresJson as { figures: RawFigure[] }).figures;

export const FIGURES = RAW.map((f) => ({
  id: f.id,
  title: f.title,
  levers: f.levers ?? [],
  unit: f.yAxis?.label ?? "",
}));

export const FIGURE_IDS = FIGURES.map((f) => f.id);
export const LEVERS = [...new Set(FIGURES.flatMap((f) => f.levers))].sort();

const OPS = ["growthRate", "levelShift", "cap", "freeze", "converge"] as const;
const CONFIDENCE = ["well-evidenced", "arguable", "speculative"] as const;

/** The projected horizon the boards run to, and the earliest history to rewrite. */
export const YEAR_MIN = 2015;
export const YEAR_MAX = 2032;

export const EffectSchema = z.object({
  figureId: z.enum(FIGURE_IDS as [string, ...string[]]),
  op: z.enum(OPS),
  magnitude: z.number().finite(),
  from: z.number().int().min(YEAR_MIN).max(YEAR_MAX),
  lag: z.number().int().min(0).max(6).optional(),
  rampYears: z.number().int().min(1).max(10).optional(),
  rationale: z.string().min(20).max(400),
  confidence: z.enum(CONFIDENCE),
});

export const InterventionSchema = z.object({
  prompt: z.string().min(4).max(120),
  short: z.string().min(3).max(38),
  summary: z.string().min(20).max(320),
  levers: z.array(z.string().min(2).max(30)).min(1).max(6),
  from: z.number().int().min(YEAR_MIN).max(YEAR_MAX),
  effects: z.array(EffectSchema).min(1).max(10),
  objection: z.object({
    claim: z.string().min(20).max(300),
    response: z.string().min(20).max(700),
  }),
});

export type ModelIntervention = z.infer<typeof InterventionSchema>;

/**
 * `cap` and `converge` name an absolute value in the figure's own units, which
 * a model gets wrong far more often than it gets a rate wrong: a cap of 0.5 on
 * a figure measured in petaFLOP is not a small cap, it is a demolition. Both
 * are therefore only accepted where the request is unambiguous, and a magnitude
 * that lands below the series' own floor is rejected rather than clamped.
 */
export const OP_GUIDE = `
growthRate  multiplier on year-on-year change. 1 is no change, 0.5 halves the
            rate of growth, 1.4 raises it by 40%. Use this for almost everything:
            it is the only op that cannot produce an absurd absolute value.
levelShift  fractional shift of the level. 0.8 is 20% lower, 1.25 is 25% higher.
cap         a hard ceiling, in the FIGURE'S OWN UNITS. Only use it when the
            intervention names a limit and you are certain of the unit.
freeze      the series stops moving from that year. magnitude is ignored, pass 1.
converge    the series drifts toward an absolute value, in the figure's own units.
`.trim();

export function systemPrompt() {
  const catalogue = FIGURES.map(
    (f) => `  ${f.id}  ${f.title}\n      unit: ${f.unit || "unitless"}\n      levers: ${f.levers.join(", ") || "none"}`
  ).join("\n");

  return `You turn a sentence about AI policy into a set of typed, dated transforms over published Stanford AI Index figures. You are one half of a tool whose entire claim is that it never invents data, so you must never write a data point, a series, or a chart value. You write only transforms, and the reason for each.

FIGURES you may act on. Use the id exactly.
${catalogue}

OPS
${OP_GUIDE}

RULES
- Only touch a figure whose levers the intervention actually reaches. Three or four well-argued effects beat ten thin ones. Leaving a figure alone is a result, and the tool says so on your behalf.
- Before deciding a figure is out of reach, trace the sentence one step further. A change to how much AI actually gets run (more people using it, more of it built into daily work, a habit going mainstream) is a "usage" lever even when the sentence itself reads as cultural rather than technical: more usage is more inference happening somewhere, which is what data-centre capacity and adoption figures literally measure. Don't stop at the surface category (jobs, sentiment, culture) if the sentence also implies more AI running.
- Prefer growthRate. Use cap or converge only when the request names an explicit limit and the unit is unambiguous from the figure's own unit string.
- "from" is the year the decision is taken. If the sentence names a year, use it. If not, choose the year the sentence implies, defaulting to 2026. History before "from" is never rewritten.
- Every effect needs a rationale that states the mechanism, in one or two plain sentences, and a confidence you would defend: well-evidenced only when the transform follows from the premise almost definitionally, speculative when you have a direction but no defensible size.
- The objection must be the STRONGEST argument against your own reading, not the easiest, and the response must concede what it should.
- Write in plain British English. No em dashes. No hedging, no marketing, no lists of three.

Reply with a single JSON object and nothing else:
{"prompt":"the intervention as a short sentence someone would type","short":"3 or 4 word label","summary":"one or two sentences on what happens","levers":["..."],"from":2026,"effects":[{"figureId":"1.2.4","op":"growthRate","magnitude":0.6,"from":2026,"lag":1,"rationale":"...","confidence":"arguable"}],"objection":{"claim":"...","response":"..."}}

If the sentence is not an intervention in the world (a greeting, a question about the tool, gibberish), reply exactly: {"refuse":"say what you would change and roughly when"}`;
}

/** Pulls the first balanced JSON object out of a reply that may be fenced. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  if (start === -1) throw new Error("no JSON object in reply");
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < body.length; i++) {
    const c = body[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (c === "\\") {
      esc = true;
      continue;
    }
    if (c === '"') inStr = !inStr;
    if (inStr) continue;
    if (c === "{") depth++;
    if (c === "}" && --depth === 0) return JSON.parse(body.slice(start, i + 1));
  }
  throw new Error("unbalanced JSON in reply");
}
