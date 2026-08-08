/**
 * Sign-in for editors.
 *
 * The password identifies the person as well as authenticating them: each
 * account in EDITOR_USERS has its own, so there is no username to type. Node
 * runtime (not Edge) so the comparison can use crypto.timingSafeEqual, and every
 * configured account is checked so the timing doesn't leak which one matched.
 *
 * On success: sets the signed httpOnly session cookie (plus the readable
 * `fa_editor` flag the static nav uses) and redirects to the originally
 * requested path. On failure: back to the form with a generic message — no hint
 * about whether the password was close, or whether any are even configured.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_MAX_AGE,
  EDITOR_FLAG_COOKIE,
  createSession,
  safeNext,
} from "@/lib/admin-session";
import { editorAccounts } from "@/lib/editors";

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

  const accounts = editorAccounts();
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!accounts.length || !secret) {
    return new NextResponse("Editor auth is not configured.", { status: 503 });
  }

  // Check them all rather than short-circuiting: constant work, whoever matches.
  const matched = accounts.reduce<string | null>(
    (found, account) => (matches(submitted, account.password) ? account.id : found),
    null,
  );
  if (!matched) return backToForm(req, next);

  const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(ADMIN_COOKIE, await createSession(matched, secret), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
  // Readable by the static nav bundle so it can list drafts. Carries no
  // authority — the middleware always re-checks the signed cookie above.
  res.cookies.set(EDITOR_FLAG_COOKIE, "1", {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
  return res;
}
