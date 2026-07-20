/**
 * Password check for the internal /admin area.
 *
 * Node runtime (not Edge) so the comparison can use crypto.timingSafeEqual.
 * On success: sets the signed httpOnly session cookie and redirects to the
 * originally requested /admin path. On failure: back to the form with a
 * generic message — no hint about whether the password was close, or whether
 * a password is even configured.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, createSession, safeNext } from "@/lib/admin-session";

export const runtime = "nodejs";

/** Compare via fixed-length digests so timingSafeEqual never sees a length mismatch. */
function matches(a: string, b: string): boolean {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

function backToForm(req: NextRequest, next: string) {
  const url = new URL("/admin/login", req.url);
  url.searchParams.set("next", next);
  url.searchParams.set("error", "1");
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const submitted = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? ""));

  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !secret) {
    return new NextResponse("Admin auth is not configured.", { status: 503 });
  }

  if (!matches(submitted, password)) return backToForm(req, next);

  const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  res.cookies.set(ADMIN_COOKIE, await createSession(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
  return res;
}
