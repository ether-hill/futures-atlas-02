/**
 * GET /api/swipe/recheck runs the weekly freshness pass for Swipe the Future.
 *
 * Claude re-reads each claim against current sources (server-side web search)
 * and says whether it still holds. It NEVER edits a live card: findings go into
 * a report in Redis that an editor reads at /admin/swipe and acts on by hand.
 * That keeps the hand-checked promise intact, nothing changes on the public
 * site without a person deciding it should.
 *
 * Runs from the Vercel cron in vercel.json (Mondays, 07:00 UTC) and is
 * authenticated with CRON_SECRET. A signed-in editor can also trigger it.
 *
 * Each run re-checks the least-recently-checked BATCH × BATCHES claims, so the
 * whole deck comes round every few weeks without a single expensive run.
 */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { extractJson } from "@/lib/signal-reactor/deck";
import { listSectors, readJson, writeJson, RECHECK_KEY } from "@/lib/swipe-sectors";
import { getEditor } from "@/lib/editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800;

const MODEL = "claude-opus-5";
const BATCH = 12;   // claims per model call
const BATCHES = 2;  // calls per run
const KEEP = 80;    // findings retained in the report

type Claim = {
  id: string; sectorId: string; sector: string; claim: string;
  verdict: string; note: string; source: { label: string; url?: string };
};

export type Finding = {
  id: string; sector: string; claim: string;
  status: "holds" | "drifting" | "wrong";
  suggestedVerdict: string | null;
  note: string;
  checkedAt: string;
};

type Report = {
  ranAt: string;
  lastRunChecked: number;
  lastRunSkipped: number;
  checkedAt: Record<string, string>;
  findings: Finding[];
};

const SYSTEM = `You are fact-checking claims for "Swipe the Future", a calibration game where every card carries a sourced verdict on how AI and quantum computing are reshaping a sector.

For each claim you are given, search the web for the current state of play and decide whether the card still tells the truth today.

Verdict scale: "unlikely" = the evidence says no. "contested" = experts genuinely split. "likely" = the evidence points this way but it has not fully landed. "already" = it has already happened.

Status for each claim:
- "holds": the claim and its verdict are still right. Most claims should land here; do not manufacture problems.
- "drifting": still broadly right, but a number in the reveal note is out of date, or the verdict is edging toward a neighbouring one.
- "wrong": the verdict is now incorrect, the source no longer supports it, or the source URL is dead.

Rules:
- Only report a problem you can point to evidence for. Say what changed and give the current figure. Never invent a statistic or a source.
- If your search turns up nothing that bears on the claim, that is "holds", not "wrong".
- Notes are one or two sentences, under 40 words, plain language, no em dashes.
- suggestedVerdict is the verdict you would set today, or null if it should not change.

Return ONLY a JSON object, no prose around it:
{"results": [{"id": "<the claim id>", "status": "holds", "suggestedVerdict": null, "note": "..."}]}`;

const ResultsSchema = z.object({
  results: z.array(z.object({
    id: z.string(),
    status: z.enum(["holds", "drifting", "wrong"]),
    suggestedVerdict: z.enum(["unlikely", "contested", "likely", "already"]).nullable().optional(),
    note: z.string().max(400),
  })),
});

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Every claim the game can show: the hand-written deck plus the generated ones. */
async function allClaims(origin: string): Promise<Claim[]> {
  const claims: Claim[] = [];
  try {
    const r = await fetch(`${origin}/swipe-the-future/deck.json`, { cache: "no-store" });
    if (r.ok) {
      const d = (await r.json()) as { cards?: Claim[] };
      if (Array.isArray(d.cards)) claims.push(...d.cards);
    }
  } catch { /* the sub-app bundle may not be built yet, generated decks still get checked */ }

  for (const s of await listSectors()) {
    for (const c of s.cards) {
      claims.push({ id: c.id, sectorId: s.id, sector: s.name, claim: c.claim, verdict: c.verdict, note: c.note, source: c.source });
    }
  }
  return claims;
}

async function checkBatch(client: Anthropic, batch: Claim[]): Promise<Finding[]> {
  const payload = batch.map((c) => ({
    id: c.id, claim: c.claim, currentVerdict: c.verdict, revealNote: c.note, source: c.source,
  }));
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 12000,
    system: SYSTEM,
    output_config: { effort: "high" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 16 }],
    messages: [{ role: "user", content: `Today is ${new Date().toISOString().slice(0, 10)}.\n\nCheck these claims:\n${JSON.stringify(payload, null, 2)}` }],
  });
  if (res.stop_reason === "refusal") return [];

  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  const parsed = ResultsSchema.parse(extractJson(text));
  const at = new Date().toISOString();
  const byId = new Map(batch.map((c) => [c.id, c]));

  return parsed.results.flatMap((r) => {
    const card = byId.get(r.id);
    if (!card) return [];
    return [{
      id: r.id, sector: card.sector, claim: card.claim,
      status: r.status, suggestedVerdict: r.suggestedVerdict ?? null,
      note: r.note, checkedAt: at,
    }];
  });
}

export async function GET(req: Request) {
  const editor = await getEditor();
  if (!authorised(req) && !editor) return NextResponse.json({ ok: false, code: "unauthorised" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ ok: false, code: "no_key" }, { status: 503 });

  const origin = new URL(req.url).origin;
  const claims = await allClaims(origin);
  if (!claims.length) return NextResponse.json({ ok: false, code: "no_claims", message: "Found no claims to check." }, { status: 503 });

  const prev = (await readJson<Report>(RECHECK_KEY)) ?? { ranAt: "", lastRunChecked: 0, lastRunSkipped: 0, checkedAt: {}, findings: [] };

  // Oldest-checked first, so the rotation covers the whole deck over a few runs.
  const queue = [...claims].sort((a, b) => (prev.checkedAt[a.id] ?? "").localeCompare(prev.checkedAt[b.id] ?? ""));
  const due = queue.slice(0, BATCH * BATCHES);

  const client = new Anthropic({ apiKey });
  const fresh: Finding[] = [];
  for (let i = 0; i < due.length; i += BATCH) {
    try {
      fresh.push(...(await checkBatch(client, due.slice(i, i + BATCH))));
    } catch (e) {
      console.error("[swipe/recheck] batch failed", e);
    }
  }

  const at = new Date().toISOString();
  const checkedAt = { ...prev.checkedAt };
  for (const f of fresh) checkedAt[f.id] = at;

  // Keep the newest finding per card, worst status first, then newest.
  const merged = new Map(prev.findings.map((f) => [f.id, f]));
  for (const f of fresh) merged.set(f.id, f);
  const rank = { wrong: 0, drifting: 1, holds: 2 } as const;
  const findings = [...merged.values()]
    .sort((a, b) => rank[a.status] - rank[b.status] || b.checkedAt.localeCompare(a.checkedAt))
    .slice(0, KEEP);

  const report: Report = {
    ranAt: at,
    lastRunChecked: fresh.length,
    lastRunSkipped: Math.max(0, claims.length - Object.keys(checkedAt).length),
    checkedAt,
    findings,
  };
  await writeJson(RECHECK_KEY, report);

  console.log(`[swipe/recheck] checked ${fresh.length} of ${claims.length} claims; ${fresh.filter((f) => f.status !== "holds").length} need a look`);
  return NextResponse.json({
    ok: true,
    checked: fresh.length,
    totalClaims: claims.length,
    neverChecked: report.lastRunSkipped,
    flagged: fresh.filter((f) => f.status !== "holds").length,
  });
}
