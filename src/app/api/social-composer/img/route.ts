/**
 * GET /api/img?u=<encoded-url> — same-origin image proxy.
 *
 * The Social Studio composites remote thumbnails (YouTube hqdefault, press
 * og:images, portraits) onto a <canvas> and then exports the canvas to PNG /
 * GIF / video. A cross-origin image without CORS headers taints the canvas
 * and blocks export. Routing every remote image through this proxy makes it
 * same-origin, so the canvas stays clean. `/api/*` is exempt from the site
 * gate (see proxy.ts).
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

export async function GET(request: Request) {
  const u = new URL(request.url).searchParams.get("u");
  if (!u) return new NextResponse("missing u", { status: 400 });

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return new NextResponse("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return new NextResponse("bad protocol", { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (AIRapture Studio image proxy)" },
      redirect: "follow",
    });
    if (!upstream.ok) return new NextResponse("upstream error", { status: 502 });
    const type = upstream.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return new NextResponse("not an image", { status: 415 });
    const buf = await upstream.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return new NextResponse("too large", { status: 413 });
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "content-type": type,
        "cache-control": "public, max-age=86400, immutable",
        "access-control-allow-origin": "*",
      },
    });
  } catch {
    return new NextResponse("fetch failed", { status: 502 });
  }
}
