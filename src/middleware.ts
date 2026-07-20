/**
 * Two independent gates:
 *
 * 1. The control panel: /style-guide (all methods) and POST /api/tokens.
 *    Basic auth against STYLE_GUIDE_USER / STYLE_GUIDE_PASSWORD.
 *
 * 2. The internal area: /admin/* — a signed session cookie (see
 *    lib/admin-session.ts). Unauthenticated requests are rewritten to the login
 *    form, so no /admin page ever renders or ships markup before auth passes.
 *
 * Both fail closed: if the relevant env var is unset the routes are locked
 * (503) — they can never become public by accident. GET /api/tokens stays open
 * so the live site can read the saved overrides.
 */
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-session";

export const config = {
  matcher: ["/style-guide", "/api/tokens", "/admin/:path*"],
};

const LOGIN_PATH = "/admin/login";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return adminGate(req);
  }

  const isPanel = pathname === "/style-guide";
  const isWrite = pathname === "/api/tokens" && req.method === "POST";
  if (!isPanel && !isWrite) return NextResponse.next();

  const password = process.env.STYLE_GUIDE_PASSWORD;
  const user = process.env.STYLE_GUIDE_USER || "admin";
  if (!password) {
    return new NextResponse("Style guide auth is not configured.", { status: 503 });
  }

  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const [u, p] = atob(header.slice(6)).split(":");
      if (u === user && p === password) return NextResponse.next();
    } catch {
      /* fall through to challenge */
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Futures Atlas style guide"' },
  });
}

async function adminGate(req: NextRequest) {
  // The login form itself must stay reachable, or the rewrite below loops.
  if (req.nextUrl.pathname === LOGIN_PATH) return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !process.env.ADMIN_PASSWORD) {
    return new NextResponse("Admin auth is not configured.", { status: 503 });
  }

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (await verifySession(cookie, secret)) return NextResponse.next();

  // Rewrite (not redirect) so the requested URL stays in the address bar and
  // the visitor lands on it directly once they sign in.
  const url = req.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.rewrite(url);
}
