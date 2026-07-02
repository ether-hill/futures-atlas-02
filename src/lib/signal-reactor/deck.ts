/**
 * Signal Reactor — deck data model, zod schemas for the two model responses,
 * and the assembly step that merges them into the fixed 8-slide Deck.
 *
 * Model output is untrusted input: every response is zod-validated before it
 * touches assembly, and array lengths are clamped defensively per the brief.
 * The client sub-app (signal-reactor/lib/types.ts) mirrors the Deck types —
 * this file is the source of truth; keep them in sync.
 */

import { z } from "zod";
import { PROMPT_VERSION } from "./prompts";

export type Severity = "low" | "medium" | "high";
export type Verdict = "minimal" | "narrow" | "significant";
export type Provenance = "documented" | "projection" | "speculation";

const tight = z.string().trim().min(1).max(600);

export const AnalysisSchema = z.object({
  sector_display: tight,
  one_liner: tight,
  signal: z.object({
    hype: tight,
    substance: tight,
    quantum_verdict: z.enum(["minimal", "narrow", "significant"]),
    quantum_note: tight,
    ai_note: tight,
  }),
  horizons: z.object({ near: tight, mid: tight, far: tight }),
  vectors: z
    .array(
      z.object({
        area: tight,
        note: tight,
        severity: z.enum(["low", "medium", "high"]),
      }),
    )
    .min(1),
});

export const FacilitationSchema = z.object({
  considerations: z.array(tight).min(1),
  discussion: z.array(tight).min(1),
  assumptions: z.array(z.object({ claim: tight, condition: tight })).min(1),
  monday: z.array(tight).min(1),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
export type Facilitation = z.infer<typeof FacilitationSchema>;

export type Slide =
  | { type: "cover"; sector: string; one: string; verdict: Verdict }
  | { type: "signal"; hype: string; substance: string; verdict: Verdict; qnote: string; ainote: string }
  | { type: "horizons"; near: string; mid: string; far: string }
  | { type: "vectors"; vectors: { area: string; note: string; severity: Severity }[] }
  | { type: "considerations"; items: string[] }
  | { type: "discussion"; items: string[] }
  | { type: "assumptions"; items: { claim: string; condition: string; provenance?: Provenance }[] }
  | { type: "monday"; items: string[] };

export interface Deck {
  sector: string;
  mode: "provocation" | "grounded"; // grounded lands in M2
  generatedAt: string;
  promptVersion: string;
  slides: Slide[];
}

/** Merge the two validated payloads into the fixed 8-slide deck. */
export function assemble(analysis: Analysis, facilitation: Facilitation): Deck {
  const verdict = analysis.signal.quantum_verdict;
  return {
    sector: analysis.sector_display,
    mode: "provocation",
    generatedAt: new Date().toISOString(),
    promptVersion: PROMPT_VERSION,
    slides: [
      { type: "cover", sector: analysis.sector_display, one: analysis.one_liner, verdict },
      {
        type: "signal",
        hype: analysis.signal.hype,
        substance: analysis.signal.substance,
        verdict,
        qnote: analysis.signal.quantum_note,
        ainote: analysis.signal.ai_note,
      },
      { type: "horizons", ...analysis.horizons },
      { type: "vectors", vectors: analysis.vectors.slice(0, 5) },
      { type: "considerations", items: facilitation.considerations.slice(0, 4) },
      { type: "discussion", items: facilitation.discussion.slice(0, 5) },
      {
        type: "assumptions",
        // v1 is a provocation engine: everything is honestly a projection
        items: facilitation.assumptions.slice(0, 3).map((a) => ({ ...a, provenance: "projection" as const })),
      },
      { type: "monday", items: facilitation.monday.slice(0, 3) },
    ],
  };
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
