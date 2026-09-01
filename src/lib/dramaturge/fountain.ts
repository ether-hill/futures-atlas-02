/**
 * A small Fountain reader — only the subset the scene agent is asked to write.
 *
 * The one addition to the format is the note the renderer appends to a quoted
 * line, [[src:lineId]]. It is what tells this parser that a line is evidence
 * rather than invention, and it is the same mark the validator reads.
 */

export type Block =
  | { kind: "act"; text: string }
  | { kind: "scene"; text: string }
  | { kind: "transition"; text: string }
  | { kind: "action"; text: string }
  | { kind: "character"; text: string }
  | { kind: "parenthetical"; text: string }
  | { kind: "dialogue"; text: string }
  | { kind: "sourced"; text: string; lineId: string };

/**
 * Fountain marks emphasis with asterisks and underscores. They are formatting
 * instructions, not characters the reader should see, so they are removed for
 * display — and never from a sourced line, whose text is substituted after the
 * model has written and must stay byte-identical to the pool.
 */
function stripEmphasis(s: string): string {
  return s
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1");
}

const SOURCED = /^(.*?)\s*\[\[src:([a-zA-Z0-9]+)\]\]\s*$/;
const SCENE = /^(?:\.|(?:INT|EXT|EST|INT\.\/EXT|I\/E)[. ])/i;
const ACT = /^#+\s*(.+)$/;
/** CUT TO:, FADE OUT., and the like — a transition, not a character cue. */
const TRANSITION = /^(?:>\s*)?(?:[A-Z][A-Z0-9 '’.\-]*(?:TO:|OUT\.|IN:|OUT:)|FADE (?:IN|OUT)\.?)\s*$/;
const PARENTHETICAL = /^\(.*\)$/;
/** A note the renderer did not write, e.g. [[a stray author note]]. */
const BARE_NOTE = /^\[\[(?!src:).*\]\]$/;

export function parseFountain(source: string): { title: string; blocks: Block[] } {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let title = "";
  let inTitlePage = true;
  let previousBlank = true;
  /** The heading just emitted, so the act's own restatement of it can be dropped. */
  let pendingAct: string | null = null;

  const sameHeading = (a: string, b: string) => {
    const norm = (x: string) =>
      x
        .toUpperCase()
        .replace(/^ACT\s+[IVXLC0-9]+\s*[—:-]?\s*/u, "")
        .replace(/[^A-Z0-9 ]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
    return norm(a) === norm(b) && norm(a).length > 0;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (inTitlePage) {
      const kv = line.match(/^([A-Za-z ]+):\s*(.*)$/);
      if (kv) {
        if (kv[1].toLowerCase() === "title") title = kv[2].trim();
        continue;
      }
      if (!line) continue;
      inTitlePage = false;
    }

    if (!line) {
      previousBlank = true;
      continue;
    }

    const act = line.match(ACT);
    if (act) {
      // Collapse a heading that was numbered twice, as happens when the spine
      // titled its own act and the renderer numbered it again.
      const text = act[1].trim().replace(/^act\s+[0-9ivxlc]+\s*[—:-]\s*(?=act\b)/iu, "");
      blocks.push({ kind: "act", text });
      pendingAct = text;
      previousBlank = false;
      continue;
    }

    // The renderer writes the act heading; a scene that opens by restating it
    // would print the same words twice, so the restatement is dropped.
    if (pendingAct && sameHeading(pendingAct, line)) {
      pendingAct = null;
      previousBlank = false;
      continue;
    }
    if (line) pendingAct = null;

    if (BARE_NOTE.test(line)) {
      previousBlank = false;
      continue; // an author note is not part of the play
    }

    if (TRANSITION.test(line)) {
      blocks.push({ kind: "transition", text: stripEmphasis(line.replace(/^>\s*/, "")).trim() });
      previousBlank = false;
      continue;
    }

    if (SCENE.test(line)) {
      blocks.push({ kind: "scene", text: stripEmphasis(line.replace(/^\./, "")).trim() });
      previousBlank = false;
      continue;
    }

    const sourced = line.match(SOURCED);
    if (sourced) {
      blocks.push({ kind: "sourced", text: sourced[1].trim(), lineId: sourced[2] });
      previousBlank = false;
      continue;
    }

    const last0 = blocks[blocks.length - 1];
    if (
      PARENTHETICAL.test(line) &&
      last0 &&
      (last0.kind === "character" || last0.kind === "dialogue" || last0.kind === "sourced")
    ) {
      blocks.push({ kind: "parenthetical", text: stripEmphasis(line) });
      previousBlank = false;
      continue;
    }

    // A character cue: all caps, short, blank line before, dialogue after.
    const isCue =
      previousBlank &&
      line === line.toUpperCase() &&
      /[A-Z]/.test(line) &&
      line.length <= 60 &&
      Boolean(lines[i + 1]?.trim());
    if (isCue) {
      const name = stripEmphasis(line.replace(/\s*\(.*\)$/, "")).trim();
      // The scene agent gives each sourced line its own cue, so the same
      // speaker's name can appear twice running. One speech, one cue.
      let sameSpeaker = false;
      for (let k = blocks.length - 1; k >= 0; k--) {
        const b = blocks[k];
        if (b.kind === "dialogue" || b.kind === "sourced" || b.kind === "parenthetical") continue;
        sameSpeaker = b.kind === "character" && b.text === name;
        break;
      }
      if (!sameSpeaker) blocks.push({ kind: "character", text: name });
      previousBlank = false;
      continue;
    }

    const last = blocks[blocks.length - 1];
    const inDialogue =
      last &&
      (last.kind === "character" ||
        last.kind === "dialogue" ||
        last.kind === "sourced" ||
        last.kind === "parenthetical");
    blocks.push({
      kind: inDialogue && !previousBlank ? "dialogue" : "action",
      text: stripEmphasis(line),
    });
    previousBlank = false;
  }

  return { title, blocks };
}
