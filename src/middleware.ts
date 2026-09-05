/**
 * Three gates, all keyed on the same signed session cookie (lib/admin-session.ts):
 *
 * 0. On a PREVIEW deployment, everything. Staging is where unfinished work is
 *    looked at, so having the link is not the same as being allowed to read it.
 *    Production is deliberately exempt — it is the public site. The two gates
 *    below still do the work on production, and on a developer's machine.
 *
 * 1. The working pages: /admin/*, the editor overview /editor, the unlinked
 *    design experiments (/home-lab, /mocks), the logo animator, the design
 *    reference and the /style-guide panel that writes its overrides, plus POST
 *    /api/tokens, which is that panel saving. Most of them do not exist at all
 *    on production — see STAGING_ONLY below.
 *
 * 2. Draft projects and draft posts: every path belonging to a project marked
 *    `visibility: "draft"` in src/data/projects.ts, and every unpublished post
 *    in src/data/posts.ts. On staging an unauthenticated request is rewritten
 *    to the sign-in form, so the page's markup is never sent. On PRODUCTION
 *    they are not gated but absent, like the staging-only paths above: a
 *    sign-in form sitting on a draft project's URL still announces the project
 *    and its name.
 *
 * There used to be a third, HTTP Basic against STYLE_GUIDE_PASSWORD, guarding
 * the panel. It meant a second password and a browser dialog that looked like
 * it came from somewhere else, for people who had already signed in. One gate
 * now covers everything.
 *
 * Both fail closed: if the session env vars are unset the routes are locked,
 * they can never become public by accident. GET /api/tokens stays open so the
 * live site can read the saved overrides.
 */
import { NextResponse, type NextRequest } from "next/server";
// Relative, not "@/lib/…": the social-composer sub-app build also picks this
// file up and resolves "@/" against its own src/, which breaks the root build.
import { ADMIN_COOKIE, readSession } from "./lib/admin-session";
import { isDraftPath } from "./data/projects";
import { isDraftPostPath } from "./data/posts";

// Runs on page-ish requests only: static assets, image optimisation and files
// with an extension are skipped, so a draft bundle's own JS/CSS costs nothing
// here (its pages are what the gate closes).
/** Signed-in only, on every environment. */
const INTERNAL_PATHS = [
  "/admin",
  "/editor",
  "/home-lab",
  "/plan",
  "/mocks",
  // The mock-ups' own endpoints: the Instagram grid's shared arrangement is
  // read and written by a page that already required the cookie, so the same
  // gate covers it, on both verbs.
  "/api/mocks",
  "/logo-animator",
  "/design-system",
  "/style-guide",
  "/listen", // audio-reel build page (see src/components/audio-reel)
];

/**
 * The working pages: tools that exist for whoever is building the Atlas, not
 * for anyone reading it. On production these are not hidden, they are absent.
 *
 * /admin and /editor are deliberately NOT here. They are the sign-in machinery
 * and the draft overview, and a draft project on production depends on both, so
 * they stay reachable and merely gated.
 */
const STAGING_ONLY = [
  "/home-lab",
  "/plan",
  "/mocks",
  "/api/mocks",
  // The reading log and everything it is made of. It is not part of the site
  // being launched, so on production it is absent rather than hidden — same
  // treatment as the working pages, and NOT in INTERNAL_PATHS, because on
  // staging the feed is for anyone looking, not only a signed-in editor.
  "/feed",
  "/api/feed",
  "/logo-animator",
  "/design-system",
  "/style-guide",
];

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.[^/]+$).*)"],
};

/**
 * The one exception to gate 0: paths anyone may open on a PREVIEW deployment
 * without signing in.
 *
 * Staging is closed by default and that stays the default — having the link
 * should not be the same as being allowed to read the site. But a single page
 * sometimes has to go to someone outside, on its own, with everything else
 * still behind the sign-in. A path listed here is open; every other path on
 * staging is untouched.
 *
 * Exact matches, not prefixes. A prefix would open everything beneath it, and
 * the whole point of /interference/solo is that /interference — the page with
 * the bar, the footer and the way into the rest of the Atlas — is NOT what the
 * visitor gets. The bundle's own JS and CSS never reach this file (the matcher
 * above skips anything with an extension), so naming the page is enough.
 */
const PREVIEW_PUBLIC = ["/interference/solo"];


const LOGIN_PATH = "/admin/login";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The working pages: the design reference and the style-guide panel behind it,
  // the mark's motion bench, the social mock-ups, the draft overview. Unlinked
  // design experiments that list every project by name, drafts included.
  const isInternal = INTERNAL_PATHS.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );

  // A sign-in form sitting on a public URL still announces that the page is
  // there, so on production the working pages answer as though they were never
  // built. The footer's internal column is built to match, so production never
  // links to a dead end either.
  //
  // Draft projects and posts get the same treatment on production, and for a
  // stronger reason: a sign-in form on /some-unreleased-project still tells the
  // world the project exists and what it is called. On production a draft is
  // absent, and that holds for a signed-in editor too — the listings drop them
  // there as well (draftsVisible() in lib/editor.ts), so production never shows
  // a card pointing at a page it will not serve.
  if (
    process.env.VERCEL_ENV === "production" &&
    (STAGING_ONLY.some((base) => pathname === base || pathname.startsWith(`${base}/`)) ||
      isDraftPath(pathname) ||
      isDraftPostPath(pathname))
  ) {
    return NextResponse.rewrite(new URL("/_internal-not-here", req.url));
  }

  // On a PREVIEW deployment the whole site is behind the sign-in, not only its
  // drafts. Staging is where unfinished work is looked at, and a link to it
  // should not be a way to read the site. Production is untouched: it is the
  // public site, and gating it would close the Atlas to its readers.
  //
  // The sign-in machinery itself has to stay reachable or nobody can ever get
  // in — the form is handled by sessionGate, this is the endpoint it posts to.
  // Trailing slash normalised so /interference/solo/ is the same page to the
  // list below as /interference/solo.
  const bare = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (
    process.env.VERCEL_ENV === "preview" &&
    !PREVIEW_PUBLIC.includes(bare) &&
    pathname !== "/api/admin/login" &&
    pathname !== "/api/admin/logout"
  ) {
    return sessionGate(req);
  }

  // /api/tokens is the style-guide panel writing an override. It is a fetch from
  // a page that already required the editor cookie, so the same gate covers it.
  const isTokenWrite = pathname === "/api/tokens" && req.method === "POST";

  if (isInternal || isTokenWrite || isDraftPath(pathname) || isDraftPostPath(pathname)) {
    return sessionGate(req);
  }

  return NextResponse.next();
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

  // A fetch wants an answer it can read, not the sign-in page's markup with a
  // 200 on it. Only the browser gets redirected to the form.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  // Rewrite (not redirect) so the requested URL stays in the address bar and
  // the visitor lands on it directly once they sign in.
  const url = req.nextUrl.clone();
  const next = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  url.pathname = LOGIN_PATH;
  url.search = "";
  url.searchParams.set("next", next);
  return NextResponse.rewrite(url);
}
