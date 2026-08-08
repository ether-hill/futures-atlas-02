/**
 * Sign out: clear both cookies and return to the public homepage.
 * POST only, so a stray link or a prefetch can't end someone's session.
 */
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, EDITOR_FLAG_COOKIE } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url), { status: 303 });
  for (const name of [ADMIN_COOKIE, EDITOR_FLAG_COOKIE]) {
    res.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return res;
}
