/**
 * Client mirror of the Spark contract. Source of truth lives in the host at
 * src/lib/quantum-spark/schema.ts (the spark route) — keep in sync.
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

/** The one restrained honesty line (brief §9 — verbatim, never inflated). */
export const HONESTY_LINE =
  "Forward-looking, inspirational scenarios grounded in real quantum and AI capabilities — provocations to spark imagination and conversation, not forecasts or investment advice.";

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
  "Aerospace & Defense",
  "Construction",
  "Education",
  "Legal services",
  "Media & Entertainment",
  "Hospitality & Tourism",
  "Real estate",
  "Fashion retail",
] as const;
