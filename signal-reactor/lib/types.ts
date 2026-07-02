/**
 * Client mirror of the Deck contract. Source of truth lives in the host at
 * src/lib/signal-reactor/deck.ts (the generate route) — keep in sync.
 */

export type Severity = "low" | "medium" | "high";
export type Verdict = "minimal" | "narrow" | "significant";
export type Provenance = "documented" | "projection" | "speculation";

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
  mode: "provocation" | "grounded";
  generatedAt: string;
  promptVersion: string;
  slides: Slide[];
}

export type GenerateResponse =
  | { ok: true; deck: Deck }
  | { ok: false; code: string; message: string };

/** Mono kicker per slide type (fixed slugs from the brief). */
export const SLIDE_SLUGS: Record<Slide["type"], string> = {
  cover: "Foresight Briefing",
  signal: "The Signal, Deflated",
  horizons: "Time Horizons",
  vectors: "Impact Vectors",
  considerations: "Things to Consider",
  discussion: "For the Room",
  assumptions: "Assumptions Exposed",
  monday: "What to Do Now",
};

/** The standing honesty frame — visible in viewer, cover and exports. */
export const HONESTY_LINE =
  "AI-generated foresight, not verified analysis. Use it to structure a conversation, not to make the decision.";
