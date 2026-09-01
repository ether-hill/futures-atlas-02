import { NextResponse } from "next/server";
import { requireEditor } from "@/lib/dramaturge/guard";
import { listClips, listCollections, listStoryboards } from "@/lib/dramaturge/studio-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Everything the studio has on disk, for the three panels. */
export async function GET() {
  const denied = await requireEditor();
  if (denied) return denied;

  const [collections, storyboards, clips] = await Promise.all([
    listCollections(),
    listStoryboards(),
    listClips(),
  ]);
  return NextResponse.json({
    local: !process.env.VERCEL,
    collections: collections.map((c) => ({
      id: c.id,
      label: c.theme.label,
      books: c.books.map((b) => b.displayTitle ?? b.title),
      lines: c.lines.length,
      passages: c.passages.length,
      extraAssets: c.extraAssets.length,
      createdAt: c.createdAt,
    })),
    storyboards,
    clips,
  });
}
