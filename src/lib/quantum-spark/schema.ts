/**
 * Quantum Spark — zod schema for the model response (untrusted input) and the
 * result shape returned to the client. The client sub-app mirrors these types
 * in quantum-spark/lib/types.ts — this file is the source of truth.
 */

import { z } from "zod";

const tight = z.string().trim().min(1).max(400);

export const SparkSchema = z.object({
  business_display: tight.pipe(z.string().max(80)),
  insights: z
    .array(
      z.object({
        tag: tight.pipe(z.string().max(48)),
        headline: tight.pipe(z.string().max(110)),
        insight: tight,
      }),
    )
    .min(5),
});

export type SparkPayload = z.infer<typeof SparkSchema>;

export interface SparkResult extends SparkPayload {
  generatedAt: string;
  promptVersion: string;
}

/** Strip ``` fences and extract the outer {…} before JSON.parse. */
export function extractJson(raw: string): unknown {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) throw new Error("no JSON object found in response");
  return JSON.parse(text.slice(first, last + 1));
}
