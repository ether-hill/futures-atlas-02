import { CONSTRAINTS, generateJson } from "./anthropic";
import type { Pool, Spine } from "./types";

/**
 * Different framings, one per play. The brief left open whether to generate
 * spines in one call with a diversity instruction or independently with
 * different seeds; these are independent calls, so one play's shape cannot
 * flatten another's, and the framings guarantee the three are not variations.
 */
const FRAMINGS = [
  "a dispute between two people who cannot both be right, staged in one room over one night",
  "one object passing through many hands across a long span of years",
  "a trial, where the evidence is read aloud and the verdict is never given",
  "a workshop at work: the labour itself is the action, and the argument surfaces through it",
  "a single figure at the end of their life, answering voices that are not in the room",
  "two strangers who meet at a border and discover they are describing the same thing",
];

function poolDigest(pool: Pool, maxLines = 420): string {
  const byBook = new Map<string, typeof pool.lines>();
  for (const line of pool.lines) {
    const list = byBook.get(line.bookId) ?? [];
    list.push(line);
    byBook.set(line.bookId, list);
  }
  // Take a fair share from each book rather than the first N overall, so the
  // digest cannot quietly exclude a book the play is required to draw on.
  const perBook = Math.max(8, Math.floor(maxLines / Math.max(byBook.size, 1)));
  const sections: string[] = [];
  for (const book of pool.books) {
    const lines = (byBook.get(book.bookId) ?? []).slice(0, perBook);
    if (lines.length === 0) continue;
    const body = lines
      .map((l) => `  ${l.id} (p.${l.page}) — ${l.text}`)
      .join("\n");
    sections.push(
      `## ${book.displayTitle ?? book.title} — ${book.author}, ${book.published}\n` +
        `Edition language: ${book.language}. Attribute quotations to: ${
          book.textRole === "original" ? "the author's own words" : "the translator of this edition"
        }.\n${body}`,
    );
  }
  return sections.join("\n\n");
}

export async function buildSpine(pool: Pool, index: number): Promise<Spine> {
  const ids = new Set(pool.lines.map((l) => l.id));
  const bookIds = new Set(pool.books.filter((b) => (pool.stats.perBook[b.bookId] ?? 0) > 0).map((b) => b.bookId));
  const lineBook = new Map(pool.lines.map((l) => [l.id, l.bookId]));
  const framing = FRAMINGS[index % FRAMINGS.length];

  return generateJson<Spine>(
    `${CONSTRAINTS}

You are a dramaturge. You build the skeleton of a play — its people, its acts, and its beats — out of a pool of passages from historical books. Each beat says what happens in plain prose and names the passages that will be spoken in it.`,
    `THEME: ${pool.theme.label}

THE OPERATOR'S INSTRUCTIONS:
"""
${pool.theme.instructions}
"""

FRAMING FOR THIS PLAY (the other plays in this batch use different framings; commit to yours):
${framing}

THE POOL. Every line below is a verbatim sentence from a real book, already verified. These ids are the only things you may cite.

${poolDigest(pool)}

Return JSON:
{
  "title": "the play's title",
  "logline": "one sentence",
  "dramatisPersonae": [{"name": "...", "origin": "source" | "invented", "note": "one line: who they are, and if 'source', which book they come from"}],
  "acts": [{"title": "...", "beats": [{"id": "a1b1", "summary": "what happens, in plain prose", "citations": ["line ids spoken in this beat"]}]}]
}

Requirements:
- 3 acts, 3 to 5 beats each.
- Every beat cites at least one line id from the pool.
- Across the whole play, cite at least one line from EVERY book listed above.
- A beat's summary describes action, not the quotation. Do not restate a quoted line in the summary.`,
    (value) => {
      const spine = value as Spine;
      if (!spine || !Array.isArray(spine.acts) || spine.acts.length === 0) {
        throw new Error("acts must be a non-empty array");
      }
      const cited = new Set<string>();
      for (const act of spine.acts) {
        for (const beat of act.beats ?? []) {
          if (!Array.isArray(beat.citations) || beat.citations.length === 0) {
            throw new Error(`beat "${beat?.id ?? "?"}" has no citations; every beat needs at least one`);
          }
          for (const id of beat.citations) {
            if (!ids.has(id)) {
              throw new Error(`citation "${id}" is not a line id in the pool`);
            }
            cited.add(id);
          }
        }
      }
      const booksUsed = new Set([...cited].map((id) => lineBook.get(id)));
      const missing = [...bookIds].filter((b) => !booksUsed.has(b));
      if (missing.length > 0) {
        const names = missing
          .map((id) => pool.books.find((b) => b.bookId === id))
          .map((b) => b?.displayTitle ?? b?.title ?? "unknown")
          .join(", ");
        throw new Error(`the play cites nothing from: ${names}. Every book must be drawn on.`);
      }
      if (!Array.isArray(spine.dramatisPersonae) || spine.dramatisPersonae.length === 0) {
        throw new Error("dramatisPersonae must be a non-empty array");
      }
      return spine;
    },
    20000,
  );
}
