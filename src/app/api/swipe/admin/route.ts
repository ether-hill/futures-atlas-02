/**
 * POST /api/swipe/admin handles editor actions on Swipe the Future's generated decks.
 *
 * Body: { slug: string, action: "approve" | "unapprove" | "delete" }
 *
 * Approving is what drops the "AI-drafted" badge from a visitor-added sector, so
 * it is the moment a person takes responsibility for those claims. Gated on the
 * editor session (the /admin pages are gated by middleware, this route is not).
 */
import { NextResponse } from "next/server";
import { getEditor } from "@/lib/editor";
import { setApproved, deleteSector } from "@/lib/swipe-sectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const editor = await getEditor();
  if (!editor) return NextResponse.json({ ok: false, code: "unauthorised" }, { status: 401 });

  let body: { slug?: unknown; action?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const slug = typeof body.slug === "string" ? body.slug.replace(/[^a-z0-9-]/g, "").slice(0, 40) : "";
  const action = body.action;
  if (!slug) return NextResponse.json({ ok: false, code: "bad_slug" }, { status: 400 });

  if (action === "delete") {
    await deleteSector(slug);
    return NextResponse.json({ ok: true, deleted: true });
  }
  if (action === "approve" || action === "unapprove") {
    const sector = await setApproved(slug, action === "approve");
    if (!sector) return NextResponse.json({ ok: false, code: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, approved: sector.approved });
  }
  return NextResponse.json({ ok: false, code: "bad_action" }, { status: 400 });
}
