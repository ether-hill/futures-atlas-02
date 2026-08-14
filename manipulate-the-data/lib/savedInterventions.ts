/**
 * Local cache of model-generated interventions, keyed to this browser only.
 *
 * A generated intervention has `keywords: []` (the API route leaves them dead,
 * since nothing matches a one-off). Once saved, a similar future question
 * should hit this cache instead of paying for another model call, so on save
 * we derive keywords from the sentence that produced it and let the existing
 * `matchFrom` scorer do the rest.
 */
import type { Intervention } from "@/lib/interventions";

const KEY = "gigawatt-custom-interventions";
const MAX = 24;

const STOP = new Set([
  "that", "this", "with", "from", "have", "what", "when", "were", "would",
  "could", "should", "about", "into", "over", "under", "their", "there",
  "which", "while", "being", "been", "then", "than", "them", "they", "also",
  "just", "only", "more", "most", "some", "such", "even", "much", "many",
  "very", "really", "does", "doesnt", "dont",
]);

function deriveKeywords(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? [];
  return [...new Set(words.filter((w) => !STOP.has(w)))].slice(0, 8);
}

export function loadSaved(): Intervention[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Intervention[]) : [];
  } catch {
    return [];
  }
}

export function saveGenerated(iv: Intervention): Intervention[] {
  if (typeof window === "undefined") return [];
  const keyed: Intervention = {
    ...iv,
    keywords: iv.keywords?.length ? iv.keywords : deriveKeywords(iv.asked ?? iv.prompt),
  };
  const rest = loadSaved().filter((s) => s.asked !== keyed.asked);
  const next = [keyed, ...rest].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked; this visit still has it in memory */
  }
  return next;
}
