import { NextResponse, type NextRequest } from "next/server";
import { requireEditor } from "@/lib/dramaturge/guard";
import { searchBooks } from "@/lib/dramaturge/sl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireEditor();
  if (denied) return denied;

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ books: [] });
  try {
    return NextResponse.json({ books: await searchBooks(q, 24) });
  } catch (error) {
    return NextResponse.json(
      { books: [], error: error instanceof Error ? error.message : "search failed" },
      { status: 502 },
    );
  }
}
