/**
 * POST /api/magnifica/tts — Magnifica's read-aloud pipeline.
 * The static sub-app at /magnifica calls this same-origin route; the
 * ElevenLabs key lives here and only here. For non-English requests the text
 * is first translated by Claude Haiku (translations cached in KV), then
 * spoken with an ElevenLabs multilingual narrator voice. Voices are stock
 * ElevenLabs narrators by design — never clones of the real leaders.
 *
 * Body: { text: string, lang?: LangCode, voice?: VoiceKey }
 * 200 → audio/mpeg   4xx/5xx → { ok: false, code, message }
 */
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readTranslation, translationKey, writeTranslation } from "@/lib/magnifica/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_CHARS = 1600;

// Stock ElevenLabs narrator voices (premade library IDs, stable across accounts).
const VOICES = {
  daniel: "onwK4e9ZLuTAKqWW03F9", // deep, measured British
  george: "JBFqnCBsd6RMkjVDRZzb", // warm British storyteller
  charlotte: "XB0fDUnXU5powFXDhCwa", // calm, luminous
  lily: "pFZP5JQG7iQjIQuC4Bku", // clear, gentle
} as const;
type VoiceKey = keyof typeof VOICES;

const LANGS = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
  pt: "Portuguese",
  hi: "Hindi",
  ar: "Arabic",
  zh: "Simplified Chinese",
} as const;
type LangCode = keyof typeof LANGS;

const fail = (status: number, code: string, message: string) =>
  NextResponse.json({ ok: false, code, message }, { status });

async function translate(text: string, lang: LangCode): Promise<string> {
  const key = translationKey(text, lang);
  const cached = await readTranslation(key);
  if (cached) return cached;
  const client = new Anthropic();
  const res = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2000,
    system:
      "You translate text for a text-to-speech narrator. Translate the user's text into " +
      LANGS[lang] +
      ". Preserve tone and register. Return ONLY the translation, no preamble, no quotes.",
    messages: [{ role: "user", content: text }],
  });
  const out = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!out) throw new Error("empty translation");
  await writeTranslation(key, out);
  return out;
}

export async function POST(req: Request) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return fail(503, "not_configured", "Read-aloud is not configured on this deployment.");
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(400, "bad_request", "Body must be JSON.");
  }

  const text =
    typeof body.text === "string"
      ? body.text.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_CHARS)
      : "";
  if (text.length < 2) return fail(400, "bad_text", "Nothing to read.");

  const lang: LangCode = typeof body.lang === "string" && body.lang in LANGS ? (body.lang as LangCode) : "en";
  const voice: VoiceKey =
    typeof body.voice === "string" && body.voice in VOICES ? (body.voice as VoiceKey) : "daniel";

  let spoken = text;
  if (lang !== "en") {
    if (!process.env.ANTHROPIC_API_KEY) {
      return fail(503, "no_translation", "Translation is not configured; English only for now.");
    }
    try {
      spoken = await translate(text, lang);
    } catch (e) {
      console.error(JSON.stringify({ tool: "magnifica-tts", stage: "translate", error: String(e) }));
      return fail(502, "translate_failed", "Translation failed. Try again or switch to English.");
    }
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICES[voice]}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          text: spoken,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.45, similarity_boost: 0.7, style: 0.25 },
        }),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        JSON.stringify({ tool: "magnifica-tts", stage: "tts", status: res.status, detail: detail.slice(0, 300) }),
      );
      if (res.status === 401) return fail(503, "bad_key", "The ElevenLabs key on this deployment was rejected.");
      if (res.status === 429) return fail(429, "rate_limited", "The narrator is busy, try again in a moment.");
      return fail(502, "upstream_error", "Voice generation failed. Try again.");
    }
    const audio = await res.arrayBuffer();
    console.log(
      JSON.stringify({ tool: "magnifica-tts", chars: spoken.length, lang, voice, bytes: audio.byteLength }),
    );
    return new NextResponse(audio, {
      headers: { "content-type": "audio/mpeg", "cache-control": "no-store" },
    });
  } catch (e) {
    console.error(JSON.stringify({ tool: "magnifica-tts", error: String(e) }));
    return fail(502, "upstream_error", "Voice generation failed. Try again.");
  }
}
