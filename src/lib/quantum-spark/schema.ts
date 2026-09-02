/**
 * Quantum Spark, zod schema for the model response (untrusted input) and the
 * result shape returned to the client. The client sub-app mirrors these types
 * in quantum-spark/lib/types.ts, this file is the source of truth.
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

/** Plain-text pass over model output: dashes become commas (digit ranges
 *  become "X to Y"), doubled commas/spaces collapse. Applied recursively to
 *  every string field before a result is stored or returned. */
export function plainText(s: string): string {
  return s
    .replace(/(\d|\b(?:now|today))\s*[\u2014\u2013]\s*(\d)/gi, "$1 to $2")
    .replace(/\s*\u2014\s*|\s+\u2013\s+/g, ", ")
    .replace(/,(\s*,)+/g, ",")
    .replace(/^,\s*|\s*,$/g, "")
    .replace(/ {2,}/g, " ")
    .trim();
}

export function sanitizeDeep<T>(v: T): T {
  if (typeof v === "string") return plainText(v) as T;
  if (Array.isArray(v)) return v.map(sanitizeDeep) as T;
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, sanitizeDeep(x)])) as T;
  }
  return v;
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
