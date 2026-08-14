/**
 * POST /api/manipulate/interpret. Free text into a typed intervention.
 *
 * The key lives here and only here: /manipulate-the-data is a static export and
 * anything shipped to it is public, so the sub-app calls this same-origin route
 * instead. Only the ai-gigawatts page uses it; the two boards stay on their
 * authored presets.
 *
 * The model is held to the same contract the authored interventions use and its
 * reply is validated rather than trusted. Nothing it returns can put a number
 * into a chart: it returns transforms, and the sub-app's own engine applies them
 * to Stanford's published series exactly as it applies the hand-written ones.
 *
 * Body: { text: string }
 * 200 → { ok: true, intervention }   4xx/5xx → { ok: false, code, message }
 */
import { NextResponse } from "next/server";
import {
  InterventionSchema,
  extractJson,
  systemPrompt,
  type ModelIntervention,
} from "@/lib/manipulate/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GATEWAY = "https://api.makemode.eu/v1/chat/completions";
const MODEL = process.env.MAKEMODE_MODEL || "glm-5.2";

/* Best effort, and deliberately cheap. Serverless instances are ephemeral so a
   determined caller gets a fresh bucket by waiting for a cold start; this is
   here to stop a stuck client or an idle afternoon costing real money, not to
   stop an attacker. */
const WINDOW_MS = 60 * 60 * 1000;
const PER_WINDOW = 12;
const seen = new Map<string, number[]>();

function overLimit(ip: string) {
  const now = Date.now();
  const hits = (seen.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  seen.set(ip, hits);
  if (seen.size > 500) for (const [k, v] of seen) if (!v.some((t) => now - t < WINDOW_MS)) seen.delete(k);
  return hits.length > PER_WINDOW;
}

const fail = (status: number, code: string, message: string) =>
  NextResponse.json({ ok: false, code, message }, { status });

export async function POST(req: Request) {
  if (!process.env.MAKEMODE_API_KEY) {
    return fail(503, "not_configured", "Free text is not configured on this deployment.");
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (overLimit(ip)) {
    return fail(429, "rate_limited", "That is a lot of interventions. Try again in an hour.");
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(400, "bad_request", "Body must be JSON.");
  }

  const text =
    typeof body.text === "string"
      ? body.text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 240)
      : "";
  if (text.length < 4) return fail(400, "too_short", "Say what you would change, in a few words.");

  /* One corrective retry, because the failure mode is nearly always a shape
     slip rather than a bad idea: a lever spelled differently, a rationale one
     clause too short, an op the engine does not have. Telling the model exactly
     which field it got wrong costs one call and saves the reader a dead end. */
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt() },
      { role: "user", content: text },
    ];
    if (attempt > 0) {
      messages.push({
        role: "user",
        content: `Your last reply was rejected: ${lastError}. Return the same intervention with only that fixed, as a single JSON object and nothing else.`,
      });
    }

    let reply: string;
    try {
      const res = await fetch(GATEWAY, {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.MAKEMODE_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ model: MODEL, temperature: 0.4, max_tokens: 3000, messages }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 200);
        console.error("[manipulate] gateway", res.status, detail);
        return fail(502, "gateway", "The model gateway refused that. Try again in a moment.");
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string }; finish_reason?: string }[];
      };
      reply = json.choices?.[0]?.message?.content ?? "";
      /* A reasoning model can spend the whole budget thinking and return an
         empty message. That is a truncation, not a refusal, and it is worth
         one more try rather than a shrug. */
      if (!reply.trim()) {
        lastError = "you returned an empty message, probably by running out of room; be brief in the rationales";
        continue;
      }
    } catch (e) {
      console.error("[manipulate] gateway threw", e);
      return fail(504, "timeout", "The model took too long. Try a shorter sentence.");
    }

    let parsed: unknown;
    try {
      parsed = extractJson(reply);
    } catch {
      lastError = "it was not a single JSON object";
      continue;
    }

    if (parsed && typeof parsed === "object" && "refuse" in parsed) {
      return fail(
        422,
        "not_an_intervention",
        "That does not name something to change. Say what you would do, and roughly when."
      );
    }

    const checked = InterventionSchema.safeParse(parsed);
    if (checked.success) {
      return NextResponse.json({ ok: true, intervention: shape(checked.data, text) });
    }
    lastError = checked.error.issues
      .slice(0, 4)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    console.error("[manipulate] rejected", lastError);
  }

  return fail(422, "invalid", "The model could not put that into a shape the engine can apply. Try phrasing it differently.");
}


/**
 * Fills in the fields the engine needs but the model has no business choosing:
 * the id, the keyword list (dead here, since nothing matches a one-off), and the
 * slider range, which is the intervention's own year give or take a few years
 * and is clamped rather than taken on trust.
 */
function shape(m: ModelIntervention, asked: string) {
  const from = m.from;
  return {
    id: `free-${Date.now().toString(36)}`,
    generated: true,
    asked,
    keywords: [],
    prompt: m.prompt,
    short: m.short,
    summary: m.summary,
    levers: m.levers,
    from,
    fromRange: [Math.max(2015, from - 4), Math.min(2032, from + 4)] as [number, number],
    effects: m.effects,
    objection: m.objection,
  };
}
