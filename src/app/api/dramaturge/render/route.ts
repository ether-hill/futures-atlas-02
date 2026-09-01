import path from "node:path";
import { NextResponse } from "next/server";
import { requireEditor, requireLocal } from "@/lib/dramaturge/guard";
import { renderStoryboard } from "@/lib/dramaturge/render";
import { clipFile, readCollection, readStoryboard, saveClip } from "@/lib/dramaturge/studio-store";
import { describeIssue, validateStoryboard } from "@/lib/dramaturge/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Step three: photograph the film.
 *
 * The captions are checked against the collection one last time before a single
 * frame is taken. Rendering is the point of no return — once a quotation is
 * burned into a frame there is nothing left to compare it against.
 */
export async function POST(req: Request) {
  const denied = (await requireEditor()) ?? requireLocal();
  if (denied) return denied;

  const { storyboardId, collectionId, scale } = (await req.json()) as {
    storyboardId?: string;
    collectionId?: string;
    scale?: number;
  };
  const board = storyboardId ? await readStoryboard(storyboardId) : null;
  const collection = collectionId ? await readCollection(collectionId) : null;
  if (!board || !collection) {
    return NextResponse.json({ error: "no such storyboard or collection" }, { status: 404 });
  }

  const report = validateStoryboard(board, collection);
  if (!report.ok) {
    return NextResponse.json({ error: report.issues.map(describeIssue).join("\n") }, { status: 422 });
  }

  try {
    const outFile = clipFile(board.id);
    const clip = await renderStoryboard(board, { outFile, scale: scale ?? 1 });
    await saveClip({ ...clip, file: `/dramaturge/${path.basename(outFile)}` });
    return NextResponse.json({ clip: { ...clip, file: `/dramaturge/${path.basename(outFile)}` } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "rendering failed" },
      { status: 500 },
    );
  }
}
