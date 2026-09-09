/**
 * POST /api/contact. The one way a visitor reaches us.
 *
 * The form used to swallow everything it was given: it called preventDefault,
 * showed the thank-you card and dropped the message on the floor. This route is
 * what makes that card true. It hands the message to Web3Forms, the same
 * service the Frond Studio site uses, and sets the reply-to to the visitor's
 * address so answering is just hitting reply.
 *
 * SERVER-SIDE, unlike the usual Web3Forms integration. Their own example posts
 * from the browser, which puts the access key in the page and lets anyone
 * submit through it directly, around every check below. Going through this
 * route instead means the key stays on the server (so the env var is
 * WEB3FORMS_ACCESS_KEY, deliberately NOT the NEXT_PUBLIC_ name Frond uses) and
 * the honeypot, the validation and the rate limit are all things a sender
 * cannot skip.
 *
 * Where the mail lands is set on the key itself, in the Web3Forms dashboard,
 * so no address appears in this repo. An address in source is an address in the
 * crawlers' index, and it also means changing who gets the mail needs a deploy.
 *
 * Body: { project?, name?, email, subject?, message, website? }
 * 200 → { ok: true }      4xx/5xx → { ok: false, code, message }
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Single-line fields: control characters out, runs of space collapsed. Someone
 *  pasting a signature block into the subject shouldn't reshape the email. */
const line = (s: string) =>
  s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();

/** The message keeps its paragraphs, so newlines survive and the rest goes. */
const block = (s: string) =>
  s.replace(/\r\n/g, "\n").replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, " ").trim();

const BodySchema = z.object({
  project: z.string().max(120).transform(line).optional(),
  name: z.string().max(200).transform(line).optional(),
  email: z.string().max(254).transform(line).pipe(z.email()),
  subject: z.string().max(200).transform(line).optional(),
  message: z.string().max(5000).transform(block).pipe(z.string().min(1)),
  // Honeypot. Real people never see this field, so anything in it is a bot.
  website: z.string().max(200).optional(),
});

const fail = (status: number, code: string, message: string, headers?: HeadersInit) =>
  NextResponse.json({ ok: false, code, message }, { status, headers });

const ok = () => NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });

export async function POST(req: Request) {
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    return fail(503, "not_configured", "The contact form is not connected on this deployment.");
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return fail(400, "bad_request", "Body must be JSON.");
  }

  // A bot that is told it failed learns how to pass, so it gets the same answer
  // a person gets and nothing is sent. Checked before validation and before the
  // limiter on purpose: bot traffic must not spend the daily budget that keeps
  // the form open for people, and a bot with a malformed body gets no hint that
  // its body was the problem.
  const honeypot = (raw as { website?: unknown } | null)?.website;
  if (typeof honeypot === "string" && honeypot.trim()) return ok();

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "email") return fail(400, "bad_email", "That address doesn't look right.");
    if (field === "message") {
      return fail(400, "bad_message", "Write a message before sending, up to 5000 characters.");
    }
    return fail(400, "bad_request", "Some of that didn't come through. Check the fields and try again.");
  }
  const { project, name, email, subject, message } = parsed.data;

  // A person sends one message. Three an hour is already generous, and the daily
  // backstop caps a distributed run whatever addresses it comes from.
  const verdict = await rateLimit(req, "contact", {
    perIp: 3,
    perIpWindowSec: 3600,
    budget: 60,
  });
  if (!verdict.ok) {
    console.log(JSON.stringify({ tool: "contact", call: "rate-limited", hit: verdict.hit }));
    return fail(
      429,
      "rate_limited",
      verdict.hit === "budget"
        ? "The form has taken as many messages as it accepts today. Please try again tomorrow."
        : "That is a few messages already. Try again a little later.",
      { "retry-after": String(verdict.retryAfter) },
    );
  }

  const heading = subject || "New message";
  const emailSubject = (project ? `Atlas contact · ${project} · ${heading}` : `Atlas contact · ${heading}`)
    .slice(0, 200);

  // Plain text only. A message body is untrusted input and there is no HTML
  // part for it to break out of. Web3Forms puts `email` in the reply-to, and
  // renders every other key as its own row, so the fields stay legible in the
  // inbox instead of arriving as one blob.
  const payload = {
    access_key: accessKey,
    subject: emailSubject,
    from_name: "Futures Atlas",
    email,
    name: name || "not given",
    project: project || "not stated",
    message,
  };

  try {
    const res = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      // Their API is normally quick. A hung request should not hold a function
      // open until the platform kills it, taking the visitor's message with it.
      signal: AbortSignal.timeout(12000),
    });
    const out = (await res.json().catch(() => null)) as { success?: boolean; message?: string } | null;
    if (!res.ok || !out?.success) {
      // The status and their own message only. The body and the sender's
      // address are the visitor's, and they do not belong in a log.
      console.error(JSON.stringify({ tool: "contact", status: res.status, error: out?.message || "no body" }));
      return fail(502, "send_failed", "The message didn't go through. Try again in a moment.");
    }
  } catch (e) {
    console.error(JSON.stringify({ tool: "contact", error: e instanceof Error ? e.name : "unknown" }));
    return fail(502, "send_failed", "The message didn't go through. Try again in a moment.");
  }

  return ok();
}
