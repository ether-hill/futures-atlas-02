/**
 * GET  /api/swipe/sector — list the visitor-added sector decks (for the picker).
 * POST /api/swipe/sector — draft a deck for a sector nobody has covered yet.
 *
 * The draft is written by Claude with the server-side web-search tool switched on,
 * so every claim has to come back with a real, resolvable source URL. The result is
 * zod-validated, cached in Redis (lib/swipe-sectors) and served to everyone after
 * that — but flagged `approved: false` until an editor signs it off at /admin/swipe,
 * which is what puts the "AI-drafted" badge on the card.
 *
 * The API key lives here and only here — /swipe-the-future is a static export that
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
  verdict: z.enum(["unlikely", "contested", "likely", "already"]),
  note: z.string().min(20).max(320),
  source: z.object({ label: z.string().min(2).max(80), url: z.string().url() }),
});
const DraftSchema = z.object({
  name: z.string().min(2).max(48),
  blurb: z.string().min(4).max(70),
  cards: z.array(CardSchema).min(6).max(12),
});

const SYSTEM = `You write fact-checked true/false claims for "Swipe the Future", a calibration game in the Futures Atlas. Players read a claim about how AI and quantum computing are reshaping a sector and swipe TRUE or FALSE. Then the card flips and shows where the evidence actually sits.

Your job: given a sector, research it with web search and return ${CARDS} claims about that sector in 2026.

Rules that matter more than anything else:
- Every claim must be checkable against a real, current source you actually found via search. Never invent a statistic, a study, an organisation or a URL. If you cannot source a claim, drop it and write a different one.
- The source URL must be one you saw in search results and must resolve. Prefer primary sources: the IEA, NIST, a named journal, a government statistics office, a company's own report, a court record. Avoid content farms and SEO blogspam.
- Spread the verdicts. Aim for roughly 3 "already", 3 "likely", 2 "unlikely", 2 "contested". A deck where everything is true teaches nothing.
- "unlikely" claims should be things people plausibly believe but that the evidence contradicts — the hype traps. Not strawmen.
- "already" claims should be things that sound like the future but have already shipped — the blind spots.
- "contested" is for genuine expert disagreement, not for things you are simply unsure about. If you are unsure, do more research.
- Claims are one sentence, plain language, no jargon, under 25 words. Written the way a knowledgeable person talks to a friend. No em dashes.
- The reveal note is one or two sentences, under 35 words, and carries the specific number or ruling that settles it.

Verdict scale: "unlikely" = the evidence says no. "contested" = experts genuinely split. "likely" = the evidence points this way but it has not fully landed. "already" = it has already happened.

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
  // Letters, spaces and the odd ampersand/hyphen — this string reaches a prompt.
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
