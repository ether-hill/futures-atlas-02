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
  try {
    const upstream = await fetch(url, {
      headers: { accept: "application/json, text/plain, */*", "user-agent": "futures-atlas-visualize" },
      // upstream content is stable; let the platform cache it
      next: { revalidate: 3600 },
    });
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
        "cache-control": "public, max-age=600, s-maxage=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "upstream unreachable" }, { status: 502 });
  }
}
