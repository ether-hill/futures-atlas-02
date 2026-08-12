/**
 * POST /api/feed/subscribe  { email }  → { ok, subscribers }
 *
 * Stores the address and nothing else — no name, no IP, no timestamp — in a
 * set, so a repeat sign-up does not double-count.
 *
 * WHAT THIS DELIBERATELY IS NOT: there is no double opt-in, no unsubscribe
 * link, and no sending pipeline behind it. It is a list of people who asked to
 * be told, and the form on the page says exactly that. Before this is used to
 * send anything, it needs a confirmation step and a way out; see the note in
 * the sign-up card.
 */
import { NextResponse } from "next/server";
import { addSubscriber, feedStoreConfigured, subscriberCount } from "@/lib/feed/feed-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deliberately permissive: the job is to reject obvious rubbish, not to
// adjudicate RFC 5322. Anything odd gets caught when a confirmation is added.
const EMAIL = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (email.length > 254 || !EMAIL.test(email)) {
    return NextResponse.json({ ok: false, code: "bad_email" }, { status: 400 });
  }

  if (!feedStoreConfigured()) {
    return NextResponse.json({ ok: false, code: "not_configured" }, { status: 503 });
  }

  await addSubscriber(email);
  return NextResponse.json(
    { ok: true, subscribers: await subscriberCount() },
    { headers: { "cache-control": "no-store" } },
  );
}
