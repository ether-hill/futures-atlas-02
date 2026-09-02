import { NextResponse, type NextRequest } from "next/server";
import { requireEditor } from "@/lib/dramaturge/guard";
import { readCollection } from "@/lib/dramaturge/studio-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The verified sentences in one collection, for swapping a caption by hand. */
export async function GET(req: NextRequest) {
  const denied = await requireEditor();
  if (denied) return denied;

  const id = req.nextUrl.searchParams.get("collection") ?? "";
  const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();
  const collection = await readCollection(id);
  if (!collection) return NextResponse.json({ error: "no such collection" }, { status: 404 });

  const books = new Map(collection.books.map((b) => [b.bookId, b]));
  const scanned = new Set(
    collection.passages.filter((p) => p.pageImageUrl).map((p) => p.id),
  );
  const lines = collection.lines
    .filter((l) => !q || l.text.toLowerCase().includes(q))
    .slice(0, 300)
    .map((l) => ({
      id: l.id,
      text: l.text,
      page: l.page,
      scanned: scanned.has(l.passageId),
      book: books.get(l.bookId)?.displayTitle ?? books.get(l.bookId)?.title ?? "",
      attribution: `${books.get(l.bookId)?.author ?? ""}, ${books.get(l.bookId)?.displayTitle ?? books.get(l.bookId)?.title ?? ""}, ${books.get(l.bookId)?.published ?? ""} · p. ${l.page}`,
      citationLink: l.citationLink,
      passageId: l.passageId,
      pageImageUrl: collection.passages.find((p) => p.id === l.passageId)?.pageImageUrl ?? null,
      bookId: l.bookId,
    }));
  return NextResponse.json({ lines, total: collection.lines.length });
}
