/**
 * /api/sl/* — a same-origin read proxy to the Source Library API
 * (https://sourcelibrary.org/api/*). Source Library does not send CORS headers,
 * so the Visualize sub-app (served from this origin) cannot call it directly; it
 * calls /api/sl/... and we forward server-side. GET only, and only the public
 * read endpoints (books / catalog).
 */
import { NextResponse, type NextRequest } from "next/server";

const UPSTREAM = "https://sourcelibrary.org/api";
const ALLOW = /^(books|catalog)(\/|$)/;

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const sub = (path ?? []).join("/");
  if (!ALLOW.test(sub)) return NextResponse.json({ error: "not found" }, { status: 404 });

  const url = `${UPSTREAM}/${sub}${req.nextUrl.search}`;
  // An API key lifts the (otherwise tight) rate limit on the text endpoint. Set
  // SOURCE_LIBRARY_API_KEY in the Vercel env; without it, text requests 429.
  const key = process.env.SOURCE_LIBRARY_API_KEY;
  const headers: Record<string, string> = {
    accept: "application/json, text/plain, */*",
    "user-agent": "futures-atlas-visualize",
  };
  if (key) headers.authorization = `Bearer ${key}`;
  try {
    const upstream = await fetch(url, { headers, next: { revalidate: 86400 } });
    const body = await upstream.arrayBuffer();
    const res = new NextResponse(body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8" },
    });
    if (upstream.ok) {
      // book content is immutable → cache hard so repeat views never re-hit upstream
      res.headers.set("cache-control", "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400");
    } else {
      res.headers.set("cache-control", "no-store");
      const ra = upstream.headers.get("retry-after");
      if (ra) res.headers.set("retry-after", ra);
    }
    return res;
  } catch {
    return NextResponse.json({ error: "upstream unreachable" }, { status: 502 });
  }
}
