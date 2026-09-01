import { CONSTRAINTS, generateJson } from "./anthropic";
import type { Asset, Caption, Collection, Motion, Shot, Storyboard } from "./types";

/**
 * The storyboard agent.
 *
 * It chooses which leaves to show, in what order, for how long, and which
 * verified sentence to put under each. It does NOT write the captions: it
 * cites a line id and the wording is substituted here from the collection, so
 * what is burned into a frame cannot drift from what the book says.
 */

const MOTIONS: Motion[] = ["hold", "push-in", "pull-out", "pan-left", "pan-right", "tilt-down"];

type ProposedShot = {
  lineId?: string | null;
  assetSrc?: string | null;
  titleCard?: string | null;
  motion?: string;
  durationMs?: number;
  note?: string;
};

type Proposal = {
  title: string;
  logline: string;
  shots: ProposedShot[];
};

function digest(collection: Collection, maxLines = 260): string {
  const byBook = new Map<string, typeof collection.lines>();
  for (const line of collection.lines) {
    const list = byBook.get(line.bookId) ?? [];
    list.push(line);
    byBook.set(line.bookId, list);
  }
  const perBook = Math.max(8, Math.floor(maxLines / Math.max(byBook.size, 1)));
  const withImage = new Set(
    collection.passages.filter((p) => p.pageImageUrl).map((p) => p.id),
  );

  const sections: string[] = [];
  for (const book of collection.books) {
    const lines = (byBook.get(book.bookId) ?? [])
      // A line whose leaf has no scan cannot carry a picture, so it is worth
      // less to a film. Still offered, but ranked below.
      .sort((a, b) => Number(withImage.has(b.passageId)) - Number(withImage.has(a.passageId)))
      .slice(0, perBook);
    if (lines.length === 0) continue;
    sections.push(
      `## ${book.displayTitle ?? book.title} — ${book.author}, ${book.published}\n` +
        lines
          .map(
            (l) =>
              `  ${l.id} (leaf ${l.page}${withImage.has(l.passageId) ? ", scanned" : ", NO SCAN"}) — ${l.text}`,
          )
          .join("\n"),
    );
  }

  if (collection.extraAssets.length > 0) {
    sections.push(
      `## Images the operator added by URL\n` +
        collection.extraAssets
          .map((a) => `  ${a.src} — ${a.credit}${a.kind === "url" && a.note ? ` (${a.note})` : ""}`)
          .join("\n"),
    );
  }
  return sections.join("\n\n");
}

const FRAMINGS = [
  "open on the plainest statement in the collection and let the argument complicate it",
  "move chronologically through the books, oldest leaf to newest",
  "hold one question and answer it three different ways from three different books",
  "start close on a detail of a page and pull out until the whole leaf is legible",
];

export async function buildStoryboard(
  collection: Collection,
  index = 0,
  targetSeconds = 45,
): Promise<Storyboard> {
  const lines = new Map(collection.lines.map((l) => [l.id, l]));
  const passages = new Map(collection.passages.map((p) => [p.id, p]));
  const books = new Map(collection.books.map((b) => [b.bookId, b]));
  const extra = new Map(collection.extraAssets.map((a) => [a.src, a]));
  const framing = FRAMINGS[index % FRAMINGS.length];

  const proposal = await generateJson<Proposal>(
    `${CONSTRAINTS}

You are storyboarding a short film made entirely of photographs of the pages of historical books. There is no footage: every shot is a still of a scanned leaf, and the only movement is the camera crossing it. A shot may carry a caption, which is always a verbatim sentence from one of those pages, quoted by id.`,
    `THEME: ${collection.theme.label}

THE OPERATOR'S INSTRUCTIONS:
"""
${collection.theme.instructions}
"""

FRAMING FOR THIS CUT: ${framing}

TARGET LENGTH: about ${targetSeconds} seconds.

THE MATERIAL. Each line below is a verified sentence and the leaf it sits on. Cite lines by id; the renderer substitutes the wording, so do not retype it.

${digest(collection)}

Return JSON:
{
  "title": "a short title for the clip",
  "logline": "one sentence on what this cut is doing",
  "shots": [
    {
      "lineId": "the line to caption this shot with, or null for a silent shot",
      "assetSrc": "only for an image added by URL — paste its URL here and leave lineId null",
      "titleCard": "optional invented framing text, e.g. an opening card. Never a quotation.",
      "motion": "hold | push-in | pull-out | pan-left | pan-right | tilt-down",
      "durationMs": 3000,
      "note": "why this shot is here"
    }
  ]
}

Rules:
- A captioned shot shows the leaf that sentence is printed on. You do not choose the picture: citing the line chooses it.
- Prefer lines whose leaf is marked "scanned". A line marked NO SCAN can still caption a shot, but it will be set typographically with no picture behind it.
- 8 to 16 shots. Give a long sentence longer on screen: roughly 400ms per word, never under 2000ms, never over 9000ms.
- Open with a title card if it helps. Title cards are invented text and must never be phrased as a quotation.
- Do not use the same leaf twice running.`,
    (value) => {
      const p = value as Proposal;
      if (!p || !Array.isArray(p.shots) || p.shots.length < 3) {
        throw new Error("shots must be an array of at least 3");
      }
      for (const shot of p.shots) {
        if (shot.lineId && !lines.has(shot.lineId)) {
          throw new Error(`line "${shot.lineId}" is not in the collection`);
        }
        if (shot.assetSrc && !extra.has(shot.assetSrc)) {
          throw new Error(`asset "${shot.assetSrc}" was not added by the operator`);
        }
        if (!shot.lineId && !shot.assetSrc && !shot.titleCard) {
          throw new Error("a shot needs a line, an added image, or a title card");
        }
      }
      if (!p.title?.trim()) throw new Error("title is required");
      return p;
    },
    12000,
  );

  const shots: Shot[] = [];
  proposal.shots.forEach((proposed, i) => {
    const line = proposed.lineId ? lines.get(proposed.lineId) : undefined;
    const passage = line ? passages.get(line.passageId) : undefined;
    const book = line ? books.get(line.bookId) : undefined;

    let asset: Asset;
    if (proposed.assetSrc && extra.has(proposed.assetSrc)) {
      asset = extra.get(proposed.assetSrc)!;
    } else if (passage?.pageImageUrl) {
      asset = {
        kind: "leaf",
        passageId: passage.id,
        bookId: passage.bookId,
        page: passage.page,
        src: passage.pageImageUrl,
        credit: `${book?.author ?? "unknown"}, ${book?.displayTitle ?? book?.title ?? ""}, ${book?.published ?? ""} · leaf ${passage.page}`,
      };
    } else {
      // No picture for this one. The shot still exists and is set
      // typographically — an absent scan is not a reason to invent an image.
      asset = { kind: "url", src: "", credit: book ? `${book.author}, ${book.published}` : "" };
    }

    // The caption is built HERE, from the collection, never from model output.
    const caption: Caption | null = line
      ? {
          lineId: line.id,
          text: line.text,
          citationLink: line.citationLink,
          attribution: `${book?.author ?? "unknown"}, ${book?.displayTitle ?? book?.title ?? ""}, ${book?.published ?? ""} · p. ${line.page}`,
        }
      : null;

    const words = line ? line.words : 8;
    const proposedMs = Number(proposed.durationMs);
    const durationMs = Math.min(
      9000,
      Math.max(2000, Number.isFinite(proposedMs) ? proposedMs : words * 400 + 1200),
    );

    shots.push({
      id: `s${i + 1}`,
      asset,
      caption,
      titleCard: proposed.titleCard?.trim() || undefined,
      motion: (MOTIONS as string[]).includes(String(proposed.motion))
        ? (proposed.motion as Motion)
        : "push-in",
      durationMs,
      note: proposed.note,
    });
  });

  return {
    id: `${collection.id}-${index + 1}`,
    title: proposal.title.trim(),
    logline: proposal.logline?.trim() ?? "",
    aspect: "16:9",
    fps: 30,
    shots,
  };
}
