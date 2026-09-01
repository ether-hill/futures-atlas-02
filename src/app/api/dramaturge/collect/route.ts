import { NextResponse } from "next/server";
import { requireEditor, requireLocal } from "@/lib/dramaturge/guard";
import { collect } from "@/lib/dramaturge/harvest";
import { getBook } from "@/lib/dramaturge/sl";
import { buildTheme } from "@/lib/dramaturge/theme";
import { saveCollection } from "@/lib/dramaturge/studio-store";
import type { Asset } from "@/lib/dramaturge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Step one: turn a shelf and a sentence of instructions into verified
 * material. Every page is fetched, its sentences split, and any sentence
 * running across a leaf edge completed from the neighbouring leaf or dropped.
 */
export async function POST(req: Request) {
  const denied = (await requireEditor()) ?? requireLocal();
  if (denied) return denied;

  const body = (await req.json()) as {
    bookIds?: string[];
    instructions?: string;
    assets?: Asset[];
  };
  const bookIds = (body.bookIds ?? []).filter(Boolean);
  const instructions = (body.instructions ?? "").trim();

  if (bookIds.length < 1 || bookIds.length > 6) {
    return NextResponse.json({ error: "pick between 1 and 6 books" }, { status: 400 });
  }
  if (instructions.length < 8) {
    return NextResponse.json({ error: "write a line or two of instructions" }, { status: 400 });
  }

  try {
    const books = [];
    for (const id of bookIds) books.push(await getBook(id));
    const theme = await buildTheme(instructions, books);
    const collection = await collect(books, theme, { extraAssets: body.assets ?? [] });
    await saveCollection(collection);
    return NextResponse.json({
      collection: {
        id: collection.id,
        label: collection.theme.label,
        lines: collection.lines.length,
        passages: collection.passages.length,
        pagesRead: collection.stats.pagesRead,
        perBook: collection.stats.perBook,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "collecting failed" },
      { status: 500 },
    );
  }
}
