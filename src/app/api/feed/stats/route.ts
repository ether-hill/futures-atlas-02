/**
 * GET  /api/feed/stats            → { ok, configured, views, subscribers }
 * POST /api/feed/stats            → same, having counted this view first
 *
 * The client posts once per browser session, so the number is views rather
 * than renders. It is a counter, not analytics: nothing about who or where is
 * recorded, and when there is no store the panel is told so rather than shown
 * a figure.
 */
import { NextResponse } from "next/server";
import { bumpViews, feedStoreConfigured, readViews, subscriberCount } from "@/lib/feed/feed-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function payload(views: number | null) {
  return {
    ok: true,
    configured: feedStoreConfigured(),
    views,
    subscribers: await subscriberCount(),
  };
}

export async function GET() {
  return NextResponse.json(await payload(await readViews()), {
    headers: { "cache-control": "no-store" },
  });
}

export async function POST() {
  return NextResponse.json(await payload(await bumpViews()), {
    headers: { "cache-control": "no-store" },
  });
}
