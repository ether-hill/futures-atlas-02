/**
 * Three gates, all keyed on the same signed session cookie (see
 * lib/admin-session.ts) except the first:
 *
 * 1. The control panel: /style-guide (all methods) and POST /api/tokens.
 *    Basic auth against STYLE_GUIDE_USER / STYLE_GUIDE_PASSWORD.
 *
 * 2. The internal areas: /admin/*, the editor overview /editor, and the
 *    unlinked design experiments (/home-lab, /mocks).
 *
 * 3. Draft projects: every path belonging to a project marked
 *    `visibility: "draft"` in src/data/projects.ts. The public never renders
 *    one, unauthenticated requests are rewritten to the sign-in form, so the
 *    page's markup is never sent.
 *
 * All fail closed: if the relevant env var is unset the routes are locked
 * (503), they can never become public by accident. GET /api/tokens stays open
 * so the live site can read the saved overrides.
 */
import { NextResponse, type NextRequest } from "next/server";
// Relative, not "@/lib/…": the social-composer sub-app build also picks this
// file up and resolves "@/" against its own src/, which breaks the root build.
import { ADMIN_COOKIE, readSession } from "./lib/admin-session";
import { isDraftPath } from "./data/projects";

// Runs on page-ish requests only: static assets, image optimisation and files
// with an extension are skipped, so a draft bundle's own JS/CSS costs nothing
// here (its pages are what the gate closes).
export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.[^/]+$).*)"],
};

const LOGIN_PATH = "/admin/login";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/style-guide" || (pathname === "/api/tokens" && req.method === "POST")) {
    return styleGuideGate(req);
  }

  // /home-lab and /mocks are unlinked design experiments that list every
  // project by name, drafts included, internal by nature, so they sign in too.
  const isInternal = ["/admin", "/editor", "/home-lab", "/mocks"].some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );

  if (isInternal || isDraftPath(pathname)) return sessionGate(req);

  return NextResponse.next();
}

function styleGuideGate(req: NextRequest) {
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

async function sessionGate(req: NextRequest) {
  // The login form itself must stay reachable, or the rewrite below loops.
  if (req.nextUrl.pathname === LOGIN_PATH) return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET;
  const configured = process.env.EDITOR_USERS || process.env.ADMIN_PASSWORD;
  if (!secret || !configured) {
    return new NextResponse("Editor auth is not configured.", { status: 503 });
  }

  const editor = await readSession(req.cookies.get(ADMIN_COOKIE)?.value, secret);
  if (editor) return NextResponse.next();

  // Rewrite (not redirect) so the requested URL stays in the address bar and
  // the visitor lands on it directly once they sign in.
  const url = req.nextUrl.clone();
  const next = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  url.pathname = LOGIN_PATH;
  url.search = "";
  url.searchParams.set("next", next);
  return NextResponse.rewrite(url);
}
