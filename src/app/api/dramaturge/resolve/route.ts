import { NextResponse } from "next/server";
import { requireEditor } from "@/lib/dramaturge/guard";
import { resolveBookInput } from "@/lib/dramaturge/sl";
import type { Asset } from "@/lib/dramaturge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resolve whatever the operator pasted. A Source Library book URL, slug or id
 * becomes a book to search; anything else that looks like an image becomes an
 * asset the storyboard may use directly.
 *
 * The image is fetched HEAD-first and refused unless it really answers as an
 * image. An asset that 404s at render time would put a caption over an empty
 * frame, which reads as a claim about nothing.
 */
export async function POST(req: Request) {
  const denied = await requireEditor();
  if (denied) return denied;

  const { input, credit } = (await req.json()) as { input?: string; credit?: string };
  const raw = input?.trim();
  if (!raw) return NextResponse.json({ error: "paste a URL, a slug or an id" }, { status: 400 });

  const looksLikeLibrary = /sourcelibrary\.org\/(book|q)\//.test(raw) || !/^https?:\/\//i.test(raw);
  if (looksLikeLibrary) {
    try {
      const book = await resolveBookInput(raw);
      if (!book.bookId) throw new Error("that did not resolve to a book");
      return NextResponse.json({ kind: "book", book });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "could not resolve that" },
        { status: 404 },
      );
    }
  }

  try {
    const head = await fetch(raw, { method: "HEAD", redirect: "follow" });
    const type = head.headers.get("content-type") ?? "";
    if (!head.ok || !type.startsWith("image/")) {
      return NextResponse.json(
        { error: `that URL answered ${head.status} ${type || "with no image"}` },
        { status: 415 },
      );
    }
    const asset: Asset = {
      kind: "url",
      src: raw,
      credit: credit?.trim() || new URL(raw).hostname,
    };
    return NextResponse.json({ kind: "asset", asset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "could not reach that URL" },
      { status: 502 },
    );
  }
}
