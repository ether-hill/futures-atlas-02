import Anthropic from "@anthropic-ai/sdk";

/**
 * The one place that talks to Claude. Every generation call returns JSON and is
 * parsed defensively: fences stripped, one repair retry, then a loud failure.
 * A half-parsed spine would silently produce a play with unsupported beats.
 */
export const MODEL = process.env.DRAMATURGE_MODEL || "claude-opus-5";

export function hasKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

/**
 * The constraint block both generation stages carry. It is deliberately
 * absolute: the model may invent staging and connective dialogue, and may not
 * produce quoted wording at all — it cites a line id and the renderer
 * substitutes the text, so a quotation cannot drift.
 */
export const CONSTRAINTS = `You are assembling a stage play from a fixed pool of historical passages.

You may invent connective dialogue, staging, scene description, and characters.

You may NOT invent, alter, modernise, or paraphrase any text presented as a quotation. You never type quoted text at all: you cite a line by its id and the renderer substitutes the exact wording from the pool. You may not cite a line id that is not in the pool. If the pool cannot support a beat, drop the beat rather than inventing support.

Return JSON only: no preamble, no markdown fences, no commentary.`;

function extractJson(text: string): string {
  let s = text.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) s = fence[1].trim();
  const first = s.search(/[[{]/);
  if (first > 0) s = s.slice(first);
  const lastBrace = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (lastBrace >= 0) s = s.slice(0, lastBrace + 1);
  return s;
}

async function call(system: string, user: string, maxTokens: number): Promise<string> {
  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    thinking: { type: "adaptive" as const },
    output_config: { effort: "high" as const },
    messages: [{ role: "user" as const, content: user }],
  };
  try {
    const stream = getClient().beta.messages.stream({
      ...params,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    } as never);
    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") {
      throw new Error(`the model declined this request (${message.stop_details?.category ?? "unspecified"})`);
    }
    return message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch (error) {
    // Refusal fallbacks are a beta an organisation may not have enabled. Any
    // rejection of the parameter itself is retried once without it, so a
    // missing beta degrades to a plain call rather than failing the run.
    const message = error instanceof Error ? error.message : String(error);
    if (!/beta|fallback|unexpected|not supported/i.test(message)) throw error;
    const stream = getClient().messages.stream(params);
    const final = await stream.finalMessage();
    return final.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  }
}

/**
 * Ask for JSON and get JSON, or fail loudly. `validate` runs on the parsed
 * value; throwing inside it triggers the single repair retry with the error
 * text fed back, which is how a dangling citation gets fixed rather than shipped.
 */
export async function generateJson<T>(
  system: string,
  user: string,
  validate: (value: unknown) => T,
  maxTokens = 16000,
): Promise<T> {
  let raw = await call(system, user, maxTokens);
  try {
    return validate(JSON.parse(extractJson(raw)));
  } catch (first) {
    const reason = first instanceof Error ? first.message : String(first);
    raw = await call(
      system,
      `${user}\n\nYour previous reply was rejected: ${reason}\n\nReturn corrected JSON only. No fences, no commentary.`,
      maxTokens,
    );
    return validate(JSON.parse(extractJson(raw)));
  }
}
