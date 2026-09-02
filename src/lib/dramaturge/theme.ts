import { generateJson, hasKey, CONSTRAINTS } from "./anthropic";
import { slugify } from "./text";
import type { BookRef, ThemeSpec } from "./types";

/**
 * Stage 0 — the brief agent. Turns the operator's plain instructions into the
 * search vocabulary the harvest needs: exact terms the corpus would actually
 * print, meaning-match prompts, and terms that would drag the pool off-theme.
 *
 * Without an API key this falls back to the operator's own words as seed terms.
 * That is a worse search, not a wrong one, so harvest still runs.
 */
export async function buildTheme(instructions: string, books: BookRef[]): Promise<ThemeSpec> {
  const label = instructions.trim().split(/\n/)[0].slice(0, 80) || "Untitled theme";
  // Without a model the seed terms come from the operator's own words, so the
  // grammar has to be filtered out or the search runs on "whether" and "people".
  const STOPWORDS = new Set([
    "about", "after", "again", "against", "these", "those", "their", "there",
    "which", "while", "whether", "would", "could", "should", "people", "theme",
    "thing", "things", "something", "someone", "every", "other", "where", "when",
    "being", "because", "through", "between", "before", "under", "over", "into",
    "make", "made", "makes", "does", "doing", "costs", "cost", "them", "they",
    "that", "this", "with", "from", "have", "having", "like", "want", "wants",
    "story", "stories", "play", "plays", "write", "written", "should", "really",
  ]);
  const fallback: ThemeSpec = {
    id: slugify(label),
    label,
    seedTerms: [
      ...new Set(
        instructions
          .toLowerCase()
          .split(/[^a-zà-ÿ']+/)
          .filter((w) => w.length > 3 && !STOPWORDS.has(w)),
      ),
    ].slice(0, 8),
    conceptPrompts: [instructions.trim().slice(0, 200)],
    exclude: [],
    instructions: instructions.trim(),
  };
  if (!hasKey()) return fallback;

  const shelf = books
    .map((b) => `- ${b.displayTitle ?? b.title} — ${b.author}, ${b.published} (${b.language})`)
    .join("\n");

  const theme = await generateJson<ThemeSpec>(
    `${CONSTRAINTS}

You are preparing a search plan over a set of historical books held in a digital library. The library searches each book by both exact keyword and meaning.`,
    `The operator's instructions:
"""
${instructions.trim()}
"""

The books they picked:
${shelf}

Produce a search plan as JSON with these fields:
{
  "label": "a short human title for this theme",
  "seedTerms": ["6-10 single words or short phrases that these particular books would literally print. Prefer the period's own vocabulary and the original language where the edition is a translation."],
  "conceptPrompts": ["4-6 short natural-language descriptions of the idea, for meaning-matching. These do not need to appear in the text."],
  "exclude": ["0-5 terms that would pull results off this theme in these particular books"]
}`,
    (value) => {
      const v = value as Partial<ThemeSpec>;
      if (!Array.isArray(v.seedTerms) || v.seedTerms.length === 0) {
        throw new Error("seedTerms must be a non-empty array");
      }
      if (!Array.isArray(v.conceptPrompts) || v.conceptPrompts.length === 0) {
        throw new Error("conceptPrompts must be a non-empty array");
      }
      const chosenLabel = typeof v.label === "string" && v.label.trim() ? v.label.trim() : label;
      return {
        id: slugify(chosenLabel),
        label: chosenLabel,
        seedTerms: v.seedTerms.map(String).slice(0, 10),
        conceptPrompts: v.conceptPrompts.map(String).slice(0, 6),
        exclude: Array.isArray(v.exclude) ? v.exclude.map(String).slice(0, 5) : [],
        instructions: instructions.trim(),
      } satisfies ThemeSpec;
    },
    4000,
  );
  return theme;
}
