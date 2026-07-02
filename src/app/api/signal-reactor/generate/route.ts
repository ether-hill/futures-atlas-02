/**
 * POST /api/signal-reactor/generate — Signal Reactor's server-side pipeline.
 * Two sequential Claude calls (analysis → facilitation), each zod-validated
 * with one corrective retry, assembled into the 8-slide Deck. The API key
 * lives here and only here — the sub-app at /signal-reactor is a static
 * export that calls this same-origin route.
 *
 * Body: { sector: string, model?: "sonnet" | "haiku" }
 * 200 → { ok: true, deck }        4xx/5xx → { ok: false, code, message }
 */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { PROMPT_VERSION, SYS_ANALYSIS, SYS_FACILITATION } from "@/lib/signal-reactor/prompts";
import {
  AnalysisSchema,
  FacilitationSchema,
  assemble,
  extractJson,
  type Analysis,
} from "@/lib/signal-reactor/deck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// model ids + $/MTok for the server-side cost log (config, not hardcoded below)
const MODELS = {
  sonnet: { id: "claude-sonnet-4-6", in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  haiku: { id: "claude-haiku-4-5", in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 },
} as const;
type ModelKey = keyof typeof MODELS;

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
  const sector =
    typeof body.sector === "string"
      ? body.sector.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
      : "";
  if (sector.length < 2) return fail(400, "bad_sector", "Describe the organization in at least 2 characters.");
  const modelKey: ModelKey = body.model === "haiku" ? "haiku" : "sonnet";
  const model = MODELS[modelKey];

  const client = new Anthropic();

  /** One prompted call: fenced-JSON-tolerant parse + zod, retrying once with
   *  a corrective instruction. System prompts are static → prompt-cached. */
  async function jsonCall<T>(
    label: "analysis" | "facilitation",
    system: string,
    user: string,
    schema: z.ZodType<T>,
  ): Promise<T> {
    let corrective = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await client.messages.create({
        model: model.id,
        max_tokens: 1400,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: corrective ? `${user}\n\n${corrective}` : user }],
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
          tool: "signal-reactor",
          promptVersion: PROMPT_VERSION,
          call: label,
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
        const parsed = schema.safeParse(extractJson(text));
        if (parsed.success) return parsed.data;
        corrective = `Your previous response failed validation: ${parsed.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}. Return ONLY the corrected JSON object matching the schema exactly.`;
      } catch (e) {
        corrective = `Your previous response was not parseable JSON (${(e as Error).message}). Return ONLY the JSON object — no markdown fences, no preamble.`;
      }
    }
    throw new Error(`${label} response failed validation after retry`);
  }

  try {
    const analysis = await jsonCall<Analysis>(
      "analysis",
      SYS_ANALYSIS,
      `Organization type: ${sector}`,
      AnalysisSchema,
    );

    // compact context summary from call 1 (per brief §3)
    const context = [
      `Organization type: ${sector}`,
      `Sector: ${analysis.sector_display}`,
      `Substance: ${analysis.signal.substance}`,
      `Quantum verdict: ${analysis.signal.quantum_verdict} — ${analysis.signal.quantum_note}`,
      `AI disruption: ${analysis.signal.ai_note}`,
      `Near-term horizon: ${analysis.horizons.near}`,
    ].join("\n");

    const facilitation = await jsonCall(
      "facilitation",
      SYS_FACILITATION,
      context,
      FacilitationSchema,
    );

    return NextResponse.json(
      { ok: true, deck: assemble(analysis, facilitation) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error(JSON.stringify({ tool: "signal-reactor", error: msg }));
    if (e instanceof Anthropic.APIError) {
      if (e.status === 429) return fail(429, "rate_limited", "The generator is busy — try again in a moment.");
      if (msg.includes("credit balance")) {
        return fail(503, "billing", "The connected Anthropic account is out of API credits — generation is paused until it's topped up.");
      }
      if (e.status === 401) {
        return fail(503, "bad_key", "The API key on this deployment was rejected — it may have been rotated.");
      }
      return fail(502, "upstream_error", "The model call failed. Try again.");
    }
    return fail(502, "invalid_output", "The model returned an unusable response twice. Try again or load the sample briefing.");
  }
}
