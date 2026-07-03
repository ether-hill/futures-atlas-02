/**
 * POST /api/quantum-spark/spark — Quantum Spark's server-side pipeline: ONE
 * Claude call, zod-validated with one corrective retry. The API key lives
 * here and only here — the sub-app at /quantum-spark is a static export
 * calling this same-origin route. No persistence: every spark is fresh by
 * design (regeneration for live audiences).
 *
 * Body: { business: string, model?: "sonnet" | "haiku" }
 * 200 → { ok: true, result }      4xx/5xx → { ok: false, code, message }
 */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PROMPT_VERSION, SYS_SPARK } from "@/lib/quantum-spark/prompts";
import { SparkSchema, extractJson, type SparkResult } from "@/lib/quantum-spark/schema";
import { readSpark, sparkKey, writeSpark } from "@/lib/quantum-spark/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// model ids + $/MTok for the server-side cost log (config, not hardcoded below)
const MODELS = {
  sonnet: { id: "claude-sonnet-4-6", in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  haiku: { id: "claude-haiku-4-5", in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 },
} as const;

const fail = (status: number, code: string, message: string) =>
  NextResponse.json({ ok: false, code, message }, { status });

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail(503, "not_configured", "Generation is not configured on this deployment.");
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(400, "bad_request", "Body must be JSON.");
  }
  const business =
    typeof body.business === "string"
      ? body.business.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
      : "";
  if (business.length < 2) return fail(400, "bad_business", "Describe the business in at least 2 characters.");
  const model = MODELS[body.model === "haiku" ? "haiku" : "sonnet"];

  // archive first: a stored spark for this business is served as-is unless
  // the caller forces a fresh set ("Spark 5 more")
  const key = sparkKey(business, PROMPT_VERSION, model.id);
  if (!body.fresh) {
    const archived = await readSpark(key);
    if (archived) {
      console.log(JSON.stringify({ tool: "quantum-spark", call: "archive-hit", key }));
      return NextResponse.json(
        { ok: true, result: archived, cached: true },
        { headers: { "cache-control": "no-store" } },
      );
    }
  }

  const client = new Anthropic();
  let corrective = "";
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await client.messages.create({
        model: model.id,
        max_tokens: 1200,
        system: [{ type: "text", text: SYS_SPARK, cache_control: { type: "ephemeral" } }],
        messages: [
          { role: "user", content: corrective ? `Business: ${business}\n\n${corrective}` : `Business: ${business}` },
        ],
      });
      const u = res.usage;
      const est =
        ((u.input_tokens ?? 0) * model.in +
          (u.output_tokens ?? 0) * model.out +
          (u.cache_read_input_tokens ?? 0) * model.cacheRead +
          (u.cache_creation_input_tokens ?? 0) * model.cacheWrite) /
        1e6;
      console.log(
        JSON.stringify({
          tool: "quantum-spark",
          promptVersion: PROMPT_VERSION,
          attempt,
          model: model.id,
          input_tokens: u.input_tokens,
          output_tokens: u.output_tokens,
          cache_read_input_tokens: u.cache_read_input_tokens,
          cache_creation_input_tokens: u.cache_creation_input_tokens,
          est_cost_usd: Number(est.toFixed(5)),
        }),
      );
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      try {
        const parsed = SparkSchema.safeParse(extractJson(text));
        if (parsed.success) {
          const result: SparkResult = {
            business_display: parsed.data.business_display,
            insights: parsed.data.insights.slice(0, 5), // exactly 5, clamped defensively
            generatedAt: new Date().toISOString(),
            promptVersion: PROMPT_VERSION,
          };
          await writeSpark(key, result); // archive for next time (best-effort)
          return NextResponse.json(
            { ok: true, result, cached: false },
            { headers: { "cache-control": "no-store" } },
          );
        }
        const issues = parsed.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        console.log(JSON.stringify({ tool: "quantum-spark", validation_failed: issues, attempt }));
        corrective = `Your previous response failed validation: ${issues}. Return ONLY the corrected JSON object matching the schema exactly, with exactly 5 insights.`;
      } catch (e) {
        corrective = `Your previous response was not parseable JSON (${(e as Error).message}). Return ONLY the JSON object — no markdown fences, no preamble.`;
      }
    }
    return fail(502, "invalid_output", "The model returned an unusable response twice. Try again.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error(JSON.stringify({ tool: "quantum-spark", error: msg }));
    if (e instanceof Anthropic.APIError) {
      if (e.status === 429) return fail(429, "rate_limited", "The spark chamber is busy — try again in a moment.");
      if (msg.includes("credit balance")) {
        return fail(503, "billing", "The connected Anthropic account is out of API credits.");
      }
      return fail(502, "upstream_error", "The model call failed. Try again.");
    }
    return fail(500, "unknown", "Something went wrong. Try again.");
  }
}
