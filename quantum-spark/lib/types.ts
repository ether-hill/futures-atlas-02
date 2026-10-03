/**
 * Client mirror of the Spark contract. Source of truth lives in the host at
 * src/lib/quantum-spark/schema.ts (the spark route), keep in sync.
 */

export interface Insight {
  tag: string; // 2-3 word theme label
  headline: string; // punchy, <= ~9 words
  insight: string; // 1-2 electric sentences
}

export interface SparkResult {
  business_display: string;
  insights: Insight[]; // exactly 5 (clamped server-side)
  generatedAt: string;
  promptVersion: string;
}

export type SparkResponse =
  | { ok: true; result: SparkResult; cached?: boolean }
  | { ok: false; code: string; message: string };

/** The one restrained honesty line (brief §9, never inflated). It has to say
 *  plainly that the output is AI-generated, the way Signal Reactor's does. */
export const HONESTY_LINE =
  "These five sparks are AI-generated and unverified. Treat them as speculation, not as forecasts and not as investment advice.";

/** The leading grid: 20 curated industries; "Other…" reveals free text. */
export const INDUSTRY_OPTIONS = [
  "Logistics",
  "Healthcare",
  "Finance",
  "Insurance",
  "Manufacturing",
  "Retail & E-commerce",
  "Agriculture",
  "Energy & Utilities",
  "Renewable energy",
  "Telecommunications",
  "Pharma & Biotech",
  "Automotive",
  "Aerospace & Defence",
  "Construction",
  "Education",
  "Legal services",
  "Media & Entertainment",
  "Hospitality & Tourism",
  "Real estate",
  "Fashion retail",
] as const;
