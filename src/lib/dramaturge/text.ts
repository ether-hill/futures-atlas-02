/**
 * Text handling. Everything that touches source wording lives here, so there is
 * one place to audit when the question is "could a quotation have changed?".
 */

/**
 * Source Library interleaves an invisible provenance watermark through page
 * text — a single page can carry five thousand zero-width characters. They are
 * not part of what the book says, and they would survive into a printed script
 * as invisible garbage while making every byte comparison meaningless.
 *
 * They are removed exactly ONCE, here, at harvest. The stripped string is what
 * pool.json stores, what an agent reads, what the reader renders and what the
 * validator compares. Nothing downstream may run this again.
 */
const WATERMARK = /[​‌‍⁠﻿]/g;

/** Apparatus the transcription marks up: running heads, signatures, page numbers. */
const APPARATUS = /<(page-num|header|sig|footer)>[\s\S]*?<\/\1>/g;
const MARGIN = /<margin>([\s\S]*?)<\/margin>|\[\[margin:\s*([\s\S]*?)\]\]/g;

/**
 * Editorial apparatus written INTO the translation: a <note> or a <gloss> is a
 * modern explanation of the word beside it, not something the book says.
 * Leaving one inside a quotation would present generated description as source
 * text, which is the one thing this project may never do. Removing it restores
 * the source's own wording, so it is removed, not unwrapped.
 */
const EDITORIAL = /<(note|gloss)>[\s\S]*?<\/\1>/g;

/**
 * Markup that WRAPS the source's own words rather than adding to them —
 * a technical term, a Greek phrase, a passage the scan leaves hard to read.
 * The inner text is what the book says, so the tag goes and the words stay.
 */
const WRAPPERS = /<\/?(term|foreign|greek|latin|hebrew|italic|bold|center|sup|sub|i|b|em|strong|unclear|column-break|line-break)[^>]*>/g;

/** A reading the transcriber marked as uncertain, kept but flagged. */
const UNCLEAR = /<unclear>/;

export function stripWatermark(s: string): string {
  return s.replace(WATERMARK, "");
}

export type CleanedPage = {
  body: string;
  marginalia: string[];
  /** True when the leaf carries a reading the transcription marks as unclear. */
  uncertain: boolean;
};

/**
 * Split a raw page into its body text and its marginal notes. Marginalia are
 * copy-specific — they exist in one physical volume, not in the work — so they
 * are held apart and never become a spoken line.
 */
export function cleanPage(raw: string): CleanedPage {
  const marginalia: string[] = [];
  let s = stripWatermark(raw);
  const uncertain = UNCLEAR.test(s);
  s = s.replace(MARGIN, (_m, a, b) => {
    const note = (a ?? b ?? "").trim();
    if (note) marginalia.push(note);
    return " ";
  });
  s = s.replace(APPARATUS, " ");
  s = s.replace(EDITORIAL, "");
  s = s.replace(WRAPPERS, "");
  // Anything still in angle brackets is apparatus this parser does not know.
  // Dropping it is safer than speaking it, and it is logged by the tag audit.
  s = s.replace(/<[^>]{1,40}>/g, " ");
  s = s.replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/ ([,.;:?!])/g, "$1").trim();
  return { body: s, marginalia, uncertain };
}

const ABBREV = new Set([
  "mr", "mrs", "dr", "st", "cap", "cf", "ed", "fig", "lib", "cap", "vol",
  "p", "pp", "n", "no", "l", "ll", "c", "ca", "etc", "vs", "viz", "i.e", "e.g",
]);

/**
 * Split page text into sentences. Deliberately conservative: a boundary needs
 * terminal punctuation followed by whitespace and a capital or quote, and a
 * known abbreviation before the stop blocks it. Over-splitting would present
 * half a thought as a whole one, which the brief counts as a misattribution.
 */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    buf += ch;
    if (!/[.!?]/.test(ch)) continue;
    const rest = text.slice(i + 1);
    if (!/^\s+["“‘(]?[A-Z0-9]/.test(rest)) continue;
    const word = buf.slice(0, -1).split(/[\s(]/).pop()?.toLowerCase() ?? "";
    if (ABBREV.has(word.replace(/[^a-z.]/g, ""))) continue;
    if (word.length === 1 && /[a-z]/.test(word)) continue; // initial
    out.push(buf.trim());
    buf = "";
  }
  if (buf.trim()) out.push(buf.trim());
  // A sentence is stored as ONE line. The page's own line breaks are typesetting,
  // not content, and a newline inside a quotation breaks both the Fountain
  // dialogue block and the byte comparison the validator depends on. Collapsing
  // happens here, once, so pool.json is the single baseline.
  return out.map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
}

/** A page whose text runs on from the previous leaf starts mid-sentence. */
export function opensMidSentence(body: string): boolean {
  const first = body.trimStart()[0];
  if (!first) return false;
  return /[a-z,;]/.test(first);
}

/** A page whose last sentence has no terminal punctuation runs on to the next. */
export function closesMidSentence(body: string): boolean {
  const t = body.trimEnd();
  if (!t) return false;
  return !/[.!?:—”"']$/.test(t.slice(-1));
}

export function words(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

/**
 * Is this sentence usable as a spoken line? Rejects reference debris
 * ("Vir.Geor.L3. 70."), single fragments, and anything too long to say.
 */
export function isSpeakable(s: string): boolean {
  const w = words(s);
  if (w < 6 || w > 60) return false;
  const letters = s.replace(/[^A-Za-z]/g, "").length;
  if (letters < s.length * 0.55) return false; // mostly numerals or punctuation
  if (/^[A-Z][a-z]{0,3}\.[A-Z]/.test(s)) return false; // citation shorthand
  return true;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "untitled";
}

/**
 * Join a sentence that runs across a page break. A word split at the leaf edge
 * ("our move-" / "ments") closes up and loses its hyphen; anything else is
 * joined with a single space. No hyphen split appears in the translated text
 * this harvests, so the branch is defensive — it is the OCR originals that
 * carry them.
 */
export function joinAcrossBreak(before: string, after: string): string {
  const a = before.trimEnd();
  const b = after.trimStart();
  if (/[-\u2010\u2011]$/.test(a)) return `${a.slice(0, -1)}${b}`.replace(/\s+/g, " ");
  return `${a} ${b}`.replace(/\s+/g, " ");
}
