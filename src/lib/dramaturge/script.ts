import { CONSTRAINTS, generateJson } from "./anthropic";
import type { Play, Pool, SourceLine, Spine } from "./types";
import { slugify } from "./text";

/**
 * Stage 6 — the scenes, one call per act.
 *
 * The model writes Fountain and marks a sourced line by writing {{lineId}} on
 * its own. It never types the quoted wording. `expand` then substitutes the
 * verbatim text from the pool and appends a Fountain note carrying the id, so
 * the printed script says where every quoted line came from.
 */

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9]+)\s*\}\}/g;

function lineIndex(pool: Pool): Map<string, SourceLine> {
  return new Map(pool.lines.map((l) => [l.id, l]));
}

/**
 * A play is filed under a slug of its title. Two plays in one batch can land on
 * the same title — the framings differ but the subject does not — and the
 * second would silently overwrite the first, so a taken id gains a suffix.
 */
export function uniquePlayId(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}

export function expand(fountain: string, pool: Pool): { text: string; quoted: string[] } {
  const index = lineIndex(pool);
  const quoted: string[] = [];
  const text = fountain.replace(PLACEHOLDER, (_match, id: string) => {
    const line = index.get(id);
    if (!line) throw new Error(`the script cites "${id}", which is not in the pool`);
    quoted.push(id);
    return `${line.text} [[src:${id}]]`;
  });
  return { text, quoted };
}

async function writeAct(
  pool: Pool,
  spine: Spine,
  actIndex: number,
): Promise<string> {
  const act = spine.acts[actIndex];
  const index = lineIndex(pool);
  const citedIds = new Set(act.beats.flatMap((b) => b.citations));
  const cited = [...citedIds].map((id) => index.get(id)).filter((l): l is SourceLine => Boolean(l));
  // Other lines from the same leaves. Still pool text, still verified — this is
  // room to write with, not permission to reach outside the evidence.
  const samePages = pool.lines.filter(
    (l) => !citedIds.has(l.id) && cited.some((c) => c.passageId === l.passageId),
  );

  const render = (lines: SourceLine[]) =>
    lines.map((l) => `  ${l.id} — ${l.text}`).join("\n");

  return generateJson<string>(
    `${CONSTRAINTS}

You write scenes in Fountain, the plain-text screenplay format. A sourced line is written as {{lineId}} alone on the dialogue line — you never type the quoted words yourself. Invented dialogue is written normally.`,
    `PLAY: ${spine.title}
LOGLINE: ${spine.logline}

CHARACTERS:
${spine.dramatisPersonae.map((p) => `- ${p.name} (${p.origin}) — ${p.note}`).join("\n")}

ACT ${actIndex + 1}: ${act.title}

BEATS TO STAGE, in order:
${act.beats.map((b, i) => `${i + 1}. ${b.summary}\n   lines to speak: ${b.citations.join(", ")}`).join("\n")}

THE LINES THIS ACT MAY QUOTE:
${render(cited)}

ALSO AVAILABLE, from the same pages:
${render(samePages.slice(0, 60)) || "  (none)"}

Sources, for your own understanding of who is speaking whose words:
${[...new Set(cited.map((l) => l.bookId))]
  .map((id) => {
    const b = pool.books.find((x) => x.bookId === id);
    return `- ${b?.displayTitle ?? b?.title} — ${b?.author}, ${b?.published}`;
  })
  .join("\n")}

Write the act in Fountain. Rules:
- Do NOT open with the act's title or number. The renderer prints the act heading; repeating it prints the same words twice.
- Scene headings in caps: INT. / EXT. as appropriate.
- A sourced line is {{lineId}} alone on the dialogue line, under its character name. Nothing else on that line.
- Do not put quotation marks around a {{lineId}}.
- Every beat's cited lines must appear.
- Invented dialogue carries the scene between quoted lines. Keep it plainer than the source: the historical text should be the strangest thing on the page.
- No parenthetical stage directions inside dialogue blocks longer than four words.

Return JSON: {"fountain": "the act, as one Fountain string"}`,
    (value) => {
      const v = value as { fountain?: unknown };
      if (typeof v.fountain !== "string" || v.fountain.trim().length < 200) {
        throw new Error("fountain must be a substantial string");
      }
      const used = [...v.fountain.matchAll(PLACEHOLDER)].map((m) => m[1]);
      const unknown = used.filter((id) => !index.has(id));
      if (unknown.length > 0) {
        throw new Error(`these ids are not in the pool: ${[...new Set(unknown)].join(", ")}`);
      }
      const missing = [...citedIds].filter((id) => !used.includes(id));
      if (missing.length > 0) {
        throw new Error(`the act does not speak its beats' lines: ${missing.join(", ")}`);
      }
      return v.fountain;
    },
    24000,
  );
}

export async function writePlay(
  pool: Pool,
  spine: Spine,
  onEvent?: (message: string) => void,
): Promise<Play> {
  const acts: string[] = [];
  for (let i = 0; i < spine.acts.length; i++) {
    onEvent?.(`Act ${i + 1} of ${spine.acts.length}: ${spine.acts[i].title}`);
    acts.push(await writeAct(pool, spine, i));
  }

  const header = [
    `Title: ${spine.title}`,
    `Credit: assembled from`,
    `Source: ${pool.books.map((b) => `${b.displayTitle ?? b.title} (${b.author}, ${b.published})`).join("; ")}`,
    `Draft date: ${new Date().toISOString().slice(0, 10)}`,
    "",
  ].join("\n");

  // The spine agent usually numbers its own acts ("Act II — The Cross-
  // Examination"). Prefixing that again gives "ACT 2 — Act II — …", so the
  // number is added only when the title does not already carry one.
  const heading = (i: number) => {
    const title = spine.acts[i].title.trim();
    return /^act\b/i.test(title) ? title : `Act ${i + 1} — ${title}`;
  };

  const body = acts.map((text, i) => `# ${heading(i)}\n\n${text.trim()}`).join("\n\n");

  const { text, quoted } = expand(`${header}\n${body}\n`, pool);

  return {
    id: slugify(spine.title),
    spine,
    fountain: text,
    quoted,
  };
}
