/**
 * Protects the control panel: /style-guide (all methods) and POST /api/tokens.
 * Basic auth against STYLE_GUIDE_USER / STYLE_GUIDE_PASSWORD.
 *
 * Fail-closed: if STYLE_GUIDE_PASSWORD is not set, these routes are locked (503)
 * — the panel and writes can never be public by accident. GET /api/tokens stays
 * open so the live site can read the saved overrides.
 */
import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/style-guide", "/api/tokens"],
};

export function middleware(req: NextRequest) {
  const isPanel = req.nextUrl.pathname === "/style-guide";
  const isWrite = req.nextUrl.pathname === "/api/tokens" && req.method === "POST";
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
