import { parseFountain } from "@/lib/dramaturge/fountain";
import type { Bundle, Play, SourceLine } from "@/lib/dramaturge/types";
import { Leaf } from "./Leaf";

/**
 * The reader.
 *
 * A sourced line steps in from the invented text, carries a rule, and hangs its
 * citation in the margin. The first time a leaf is quoted, the scan of that
 * leaf is placed at full width before the line: the facsimile is the evidence,
 * so it gets real presence rather than a thumbnail.
 */
export function PlayView({ play, bundle }: { play: Play; bundle: Bundle }) {
  const lines = new Map(bundle.lines.map((l) => [l.id, l]));
  const passages = new Map(bundle.passages.map((p) => [p.id, p]));
  const books = new Map(bundle.books.map((b) => [b.bookId, b]));
  const { blocks } = parseFountain(play.fountain);

  const shown = new Set<string>();
  const appendix: SourceLine[] = [];

  return (
    <article className="dg-play">
      <header>
        <h1 className="dg-title">{play.spine.title}</h1>
        <p className="dg-logline">{play.spine.logline}</p>
        <p className="dg-ap" style={{ maxWidth: "34rem" }}>
          Assembled from {bundle.books.length} books in the Source Library corpus.
          Every indented line is a verbatim passage from one of them; everything
          else is invented.
        </p>

        <section style={{ margin: "2.5rem 0" }}>
          <h2 className="dg-rule-label">Dramatis personae</h2>
          <ul className="dg-cast">
            {play.spine.dramatisPersonae.map((person) => (
              <li key={person.name}>
                <span className="dg-origin">{person.origin === "source" ? "from a book" : "invented"}</span>
                <span>
                  <strong style={{ fontWeight: 600 }}>{person.name}</strong>
                  <span className="dg-note">{person.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </header>

      {blocks.map((block, i) => {
        if (block.kind === "act") {
          return (
            <h2 className="dg-act" key={i}>
              {block.text}
            </h2>
          );
        }
        if (block.kind === "scene") {
          return (
            <p className="dg-scene" key={i}>
              {block.text}
            </p>
          );
        }
        if (block.kind === "transition") {
          return (
            <p className="dg-transition" key={i}>
              {block.text}
            </p>
          );
        }
        if (block.kind === "parenthetical") {
          return (
            <p className="dg-paren" key={i}>
              {block.text}
            </p>
          );
        }
        if (block.kind === "character") {
          return (
            <p className="dg-character" key={i}>
              {block.text}
            </p>
          );
        }
        if (block.kind === "dialogue") {
          return (
            <p className="dg-dialogue" key={i}>
              {block.text}
            </p>
          );
        }
        if (block.kind === "action") {
          return (
            <p className="dg-action" key={i}>
              {block.text}
            </p>
          );
        }

        const line = lines.get(block.lineId);
        const passage = line ? passages.get(line.passageId) : undefined;
        const book = line ? books.get(line.bookId) : undefined;
        if (line) appendix.push(line);

        const firstSighting = passage && !shown.has(passage.id);
        if (passage && firstSighting) shown.add(passage.id);

        return (
          <div key={i}>
            <p className="dg-sourced">
              {block.text}
              <span className="dg-cite">
                {book?.author ?? "unknown"}, {book?.published ?? "n.d."} · p.&nbsp;{line?.page ?? "?"}
                {line?.spansPages ? ` (continues across ${line.pages.join("–")})` : ""}
                {line?.uncertain ? " · the scan leaves part of this leaf hard to read" : ""}
                {line?.citationLink && (
                  <>
                    {" "}
                    <a href={line.citationLink} target="_blank" rel="noreferrer">
                      {line.citationLink.replace("https://", "")}
                    </a>
                  </>
                )}
              </span>
            </p>
            {/*
              The leaf follows the line it carries, so the evidence answers the
              quotation instead of separating a character cue from its dialogue.
              It appears once per leaf, at that leaf's first quotation.
            */}
            {passage && firstSighting  && (
              <Leaf
                page={passage.page}
                src={passage.pageImageUrl}
                caption={`${book?.displayTitle ?? book?.title ?? "the book"}, leaf ${passage.page}. ${
                  passage.textSource === "ocr_original"
                    ? "The source's own words, transcribed from the scan."
                    : "Read here in translation."
                }`}
              />
            )}
          </div>
        );
      })}

      <Appendix lines={appendix} bundle={bundle} />
    </article>
  );
}

function Appendix({ lines, bundle }: { lines: SourceLine[]; bundle: Bundle }) {
  const passages = new Map(bundle.passages.map((p) => [p.id, p]));
  const books = new Map(bundle.books.map((b) => [b.bookId, b]));

  return (
    <section className="dg-appendix">
      <h2 className="dg-rule-label">Citations</h2>
      <p className="dg-ap" style={{ maxWidth: "34rem", marginBottom: "1.5rem" }}>
        Every quoted line in the order it is spoken. Where the edition read is a
        translation, the wording is the translator&rsquo;s and the attribution
        says so.
      </p>
      <ol>
        {lines.map((line, i) => {
          const passage = passages.get(line.passageId);
          const book = books.get(line.bookId);
          const translated = passage?.textSource === "translation";
          return (
            <li key={`${line.id}-${i}`}>
              <span className="dg-quoted">&ldquo;{line.text}&rdquo;</span>
              <span className="dg-src">
                {book?.author ?? "unknown"}. <cite>{book?.displayTitle ?? book?.title}</cite>
                {book?.published ? `, ${book.published}` : ""}. Page {line.page}
                {line.spansPages ? ` (the sentence runs across pages ${line.pages.join("–")})` : ""}.{" "}
                {translated
                  ? `Wording from the Source Library translation of the ${book?.language ?? ""} edition.`
                  : "The source's own words, transcribed from the scan."}
                {passage?.translationNote ? ` ${passage.translationNote}` : ""}
                {line.uncertain
                  ? " The transcription marks a reading on this leaf as unclear."
                  : ""}{" "}
                <a href={line.citationLink} target="_blank" rel="noreferrer">
                  {line.citationLink}
                </a>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
