/**
 * GET /api/vid?u=<encoded-url> — same-origin, range-aware video proxy.
 *
 * Transmutated remote videos are drawn onto a <canvas> and exported to PNG /
 * GIF / video. A cross-origin video without CORS headers taints the canvas and
 * blocks export, so we stream it through here to keep it same-origin. Range
 * requests are forwarded (and 206 responses passed back) so the browser can
 * seek and start playback without buffering the whole file. `/api/*` is exempt
 * from the site gate.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB ceiling for declared content-length

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

  const range = request.headers.get("range") ?? undefined;
  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Social Composer video proxy)",
        ...(range ? { range } : {}),
      },
      redirect: "follow",
    });
    if (!upstream.ok && upstream.status !== 206) return new NextResponse("upstream error", { status: 502 });
    const type = upstream.headers.get("content-type") ?? "";
    if (!/^(video\/|application\/octet-stream|application\/ogg|application\/mp4)/.test(type)) {
      return new NextResponse("not a video", { status: 415 });
    }
    const cl = upstream.headers.get("content-length");
    if (cl && Number(cl) > MAX_BYTES) return new NextResponse("too large", { status: 413 });

    const headers = new Headers({
      "content-type": type || "video/mp4",
      "accept-ranges": "bytes",
      "cache-control": "public, max-age=86400",
      "access-control-allow-origin": "*",
    });
    if (cl) headers.set("content-length", cl);
    const cr = upstream.headers.get("content-range");
    if (cr) headers.set("content-range", cr);

    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch {
    return new NextResponse("fetch failed", { status: 502 });
  }
}
