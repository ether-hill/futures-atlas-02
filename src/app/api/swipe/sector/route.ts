/**
 * GET  /api/swipe/sector, list the visitor-added sector decks (for the picker).
 * POST /api/swipe/sector, draft a deck for a sector nobody has covered yet.
 *
 * The draft is written by Claude with the server-side web-search tool switched on,
 * so every claim has to come back with a real, resolvable source URL. The result is
 * zod-validated, cached in Redis (lib/swipe-sectors) and served to everyone after
 * that, but flagged `approved: false` until an editor signs it off at /admin/swipe,
 * which is what puts the "AI-drafted" badge on the card.
 *
 * The API key lives here and only here, /swipe-the-future is a static export that
 * calls this same-origin route.
 *
 * Body: { sector: string, fresh?: boolean }
 * 200 → { ok: true, sector, cached }   4xx/5xx → { ok: false, code, message }
 */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { extractJson } from "@/lib/signal-reactor/deck";
import {
  listSectors, readSector, writeSector, slugify, sectorsConfigured,
  type GenSector,
} from "@/lib/swipe-sectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800;

const MODEL = "claude-opus-5";
const CARDS = 10;

const fail = (status: number, code: string, message: string) =>
  NextResponse.json({ ok: false, code, message }, { status });

const CardSchema = z.object({
  claim: z.string().min(20).max(220),
  verdict: z.enum(["notyet", "already"]),
  note: z.string().min(20).max(320),
  source: z.object({ label: z.string().min(2).max(80), url: z.string().url() }),
});
const DraftSchema = z.object({
  name: z.string().min(2).max(48),
  blurb: z.string().min(4).max(70),
  cards: z.array(CardSchema).min(6).max(12),
});

const SYSTEM = `You write fact-checked claims for "Swipe the Future", a calibration game in the Futures Atlas.

THE QUESTION. Every card is one statement about the world as it stands, and the player answers with one of exactly two things: ALREADY REAL, or NOT YET. Then the card flips and shows the sourced answer. The game measures two mistakes: buying a thing that was only announced, and doubting a thing that has been running for years.

Your job: given a sector, research it with web search and return ${CARDS} claims about that sector.

Rules that matter more than anything else:
- Every claim must be checkable against a real, current source you actually found via search. Never invent a statistic, a study, an organisation or a URL. If you cannot source a claim, drop it and write a different one.
- The source URL must be one you saw in search results and must resolve. Prefer primary sources: a regulator, a standards body, a named journal, a government statistics office, a court record, a company's own filing. Avoid content farms and SEO blogspam.
- KEY THE DECK EVENLY. Exactly half the cards must be "already" and half "notyet". A deck where one answer keeps working is a deck people stop reading.
- Write every claim in the PRESENT TENSE, about the world as it is. Never "by 2030, X will happen". A claim in the future tense has no answer. Turn it into the present-tense version and check whether that has happened.
- Aim for one of the two good surprises. Either it sounds like science fiction and it shipped years or decades ago ("already"), or it sounds inevitable and has flatly not happened ("notyet"). A claim that is neither teaches nothing.
- "notyet" claims should be things people plausibly believe have happened: announced, demonstrated, proposed, legislated somewhere else, or promised. Not strawmen.
- "already" claims should be things that sound like the future and are old news. Reach back: a 1990s clearance or a 1980s deployment makes a far better card than this year's launch.
- It has to be answerable wrong. If you cannot picture a well-read person swiping the other way, drop the card.
- Give each claim something checkable: a number, a named organisation, a shipped product, a ruling, a date.
- Claims are one sentence, plain language, no jargon, under 25 words. Written the way a knowledgeable person talks to a friend. No em dashes.
- The reveal note is one or two sentences, under 35 words, and carries the specific date, number or ruling that settles it. For a "notyet" card, say what DOES exist, so the player learns the boundary rather than just being told no.

Verdicts: "already" = it has happened, and you can point to when. "notyet" = it has not happened, however close it looks.

Return ONLY a JSON object, no prose around it:
{"name": "<sector name, title case, max 4 words>", "blurb": "<3-6 word subtitle, topics separated by ' · '>", "cards": [{"claim": "...", "verdict": "already", "note": "...", "source": {"label": "<publisher, year>", "url": "https://..."}}]}`;

export async function GET() {
  const sectors = await listSectors();
  return NextResponse.json(
    { ok: true, sectors: sectors.map(strip) },
    { headers: { "cache-control": "no-store" } },
  );
}

/** The picker only needs the shape the sub-app's Sector type declares. */
function strip(s: GenSector) {
  return { id: s.id, kind: s.kind, name: s.name, blurb: s.blurb, cards: s.cards, approved: s.approved };
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fail(503, "no_key", "The sector builder isn't configured.");
  if (!sectorsConfigured()) return fail(503, "no_store", "The sector store isn't configured.");

  let body: { sector?: unknown; fresh?: unknown };
  try { body = await req.json(); } catch { return fail(400, "bad_body", "Bad request."); }

  const raw = typeof body.sector === "string" ? body.sector.trim().slice(0, 40) : "";
  if (raw.length < 3) return fail(400, "too_short", "Give the sector a name of at least three letters.");
  // Letters, spaces and the odd ampersand/hyphen, this string reaches a prompt.
  if (!/^[\p{L}][\p{L} &'-]*$/u.test(raw)) return fail(400, "bad_name", "Letters and spaces only, please.");

  const slug = slugify(raw);
  if (!slug) return fail(400, "bad_name", "That name doesn't work as a sector.");

  if (!body.fresh) {
    const cached = await readSector(slug);
    if (cached) return NextResponse.json({ ok: true, sector: strip(cached), cached: true });
  }

  const client = new Anthropic({ apiKey });
  let draft: z.infer<typeof DraftSchema>;
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      output_config: { effort: "high" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 12 }],
      messages: [{ role: "user", content: `Sector: ${raw}\n\nResearch it and return the JSON.` }],
    });

    if (res.stop_reason === "refusal") return fail(422, "refused", "Couldn't research that one. Try a different sector.");

    const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    if (!text) return fail(502, "empty", "The sector builder came back empty. Try again.");
    draft = DraftSchema.parse(extractJson(text));
  } catch (e) {
    const msg = e instanceof z.ZodError ? "The draft came back malformed." : "Couldn't build that sector right now.";
    console.error("[swipe/sector]", raw, e);
    return fail(502, "generate_failed", msg);
  }

  const today = new Date().toISOString().slice(0, 10);
  const sector: GenSector = {
    id: slug,
    kind: "generated",
    name: draft.name,
    blurb: draft.blurb,
    approved: false,
    createdAt: new Date().toISOString(),
    requestedAs: raw,
    cards: draft.cards.map((c, i) => ({ ...c, id: `gen-${slug}-${i + 1}`, checked: today })),
  };

  await writeSector(sector);
  return NextResponse.json({ ok: true, sector: strip(sector), cached: false });
}
