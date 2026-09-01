import { NextResponse } from "next/server";
import { requireEditor, requireLocal } from "@/lib/dramaturge/guard";
import { buildStoryboard } from "@/lib/dramaturge/storyboard";
import { readCollection, saveStoryboard } from "@/lib/dramaturge/studio-store";
import { describeIssue, validateStoryboard } from "@/lib/dramaturge/validate";
import type { Storyboard } from "@/lib/dramaturge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Step two: propose a cut. POST a storyboard back to save an edit. */
export async function POST(req: Request) {
  const denied = (await requireEditor()) ?? requireLocal();
  if (denied) return denied;

  const body = (await req.json()) as {
    collectionId?: string;
    index?: number;
    seconds?: number;
    storyboard?: Storyboard;
  };
  const collection = body.collectionId ? await readCollection(body.collectionId) : null;
  if (!collection) return NextResponse.json({ error: "no such collection" }, { status: 404 });

  try {
    // An edited board arrives whole. It is checked against the collection
    // before it is stored, so a hand-edited caption cannot silently drift.
    if (body.storyboard) {
      const edited: Storyboard = { ...body.storyboard, editedAt: new Date().toISOString() };
      const report = validateStoryboard(edited, collection);
      if (!report.ok) {
        return NextResponse.json(
          { error: report.issues.map(describeIssue).join("\n") },
          { status: 422 },
        );
      }
      await saveStoryboard(edited);
      return NextResponse.json({ storyboard: edited });
    }

    const board = await buildStoryboard(collection, body.index ?? 0, body.seconds ?? 45);
    const report = validateStoryboard(board, collection);
    if (!report.ok) {
      return NextResponse.json(
        { error: report.issues.map(describeIssue).join("\n") },
        { status: 500 },
      );
    }
    await saveStoryboard(board);
    return NextResponse.json({ storyboard: board });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "storyboarding failed" },
      { status: 500 },
    );
  }
}
