/**
 * Proof that the pipeline renders, using material already verified in this
 * repo: a handful of leaves from the shipped collection, hand-storyboarded, no
 * model call. It exists so the renderer can be exercised without spending an
 * API key or a page budget.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { renderStoryboard } from "../../src/lib/dramaturge/render";
import { validateStoryboard, describeIssue } from "../../src/lib/dramaturge/validate";
import type { Collection, Motion, Shot, Storyboard } from "../../src/lib/dramaturge/types";

async function main() {
  const raw = JSON.parse(
    await fs.readFile(path.join(process.cwd(), "src/data/dramaturge/gold.json"), "utf8"),
  );
  const collection: Collection = {
    id: "smoke",
    theme: raw.theme,
    createdAt: raw.createdAt,
    books: raw.books,
    passages: raw.passages,
    lines: raw.lines,
    extraAssets: [],
    stats: {
      perBook: raw.provenance.perBook,
      pagesRead: raw.provenance.pagesRead,
      cacheHits: 0,
      droppedSummaries: 0,
      continuityResolved: 0,
    },
  };

  const byPassage = new Map(collection.passages.map((p) => [p.id, p]));
  const books = new Map(collection.books.map((b) => [b.bookId, b]));
  const motions: Motion[] = ["push-in", "pan-right", "pull-out", "tilt-down", "pan-left"];

  // One line per book, longest first, on a leaf that actually has a scan.
  const picked = collection.books
    .flatMap((book) =>
      collection.lines
        .filter((l) => l.bookId === book.bookId && byPassage.get(l.passageId)?.pageImageUrl)
        .sort((a, b) => b.words - a.words)
        .slice(0, 2),
    )
    .slice(0, Number(process.env.SHOTS ?? 5));

  const shots: Shot[] = picked.map((line, i) => {
    const passage = byPassage.get(line.passageId)!;
    const book = books.get(line.bookId)!;
    return {
      id: `s${i + 1}`,
      asset: {
        kind: "leaf",
        passageId: passage.id,
        bookId: passage.bookId,
        page: passage.page,
        src: passage.pageImageUrl!,
        credit: `${book.author}, ${book.published}`,
      },
      caption: {
        lineId: line.id,
        text: line.text,
        citationLink: line.citationLink,
        attribution: `${book.author}, ${book.displayTitle ?? book.title}, ${book.published} · p. ${line.page}`,
      },
      motion: motions[i % motions.length],
      durationMs: Math.min(9000, Math.max(2600, line.words * 380 + 1200)),
    };
  });

  const board: Storyboard = {
    id: "smoke",
    title: "Gold, not gold",
    logline: "A render proof built from already-verified leaves.",
    aspect: "16:9",
    fps: 30,
    shots: [
      {
        id: "s0",
        asset: { kind: "url", src: "", credit: "" },
        caption: null,
        titleCard: "Whether a metal that does not corrupt can be made by art",
        motion: "hold",
        durationMs: 2600,
      },
      ...shots,
    ],
  };

  const report = validateStoryboard(board, collection);
  if (!report.ok) {
    console.error(report.issues.map(describeIssue).join("\n"));
    process.exit(1);
  }
  console.log(`captions verified: ${report.checked}`);

  const out = path.join(process.cwd(), "data/dramaturge/smoke.mp4");
  const started = Date.now();
  const clip = await renderStoryboard(board, {
    outFile: out,
    scale: Number(process.env.SCALE ?? 0.5),
    onProgress: (f, t) => {
      if (f % 30 === 0 || f === t) process.stdout.write(`\r  frame ${f}/${t}`);
    },
  });
  const size = (await fs.stat(out)).size;
  console.log(
    `\n${clip.width}×${clip.height} · ${(clip.durationMs / 1000).toFixed(1)}s · ` +
      `${(size / 1024 / 1024).toFixed(1)}MB · ${((Date.now() - started) / 1000).toFixed(0)}s to render\n${out}`,
  );
}

void main();
