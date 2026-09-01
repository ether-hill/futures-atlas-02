import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { bundles, quotedCount } from "@/data/dramaturge";
import "@/components/dramaturge/dramaturge.css";

export const metadata: Metadata = {
  title: "Dramaturge. Futures Atlas",
  description:
    "Stage plays assembled from a hand-picked shelf of historical books, in which every quoted line is a verbatim passage carrying its citation.",
};

/**
 * Dramaturge — draft project (gated by projects.ts visibility).
 *
 * A workflow that takes a few books from the Source Library corpus and a theme
 * and produces stage plays in which every line inside quotation marks is
 * verbatim, citation-linked source text. The invented dialogue carries the
 * scene between the quotations and is told apart structurally, never by tint.
 *
 * The plays are composed on a developer's machine and committed — see
 * src/data/dramaturge. A harvest reads a hundred leaves and a play is a dozen
 * model calls, both far past any serverless budget, so nothing here generates
 * at request time.
 */
export default function DramaturgePage() {
  const bundle = bundles[0];
  const totalQuoted = bundle.plays.reduce((n, p) => n + quotedCount(p), 0);

  return (
    <div className="dg">
      <Container>
        <div className="dg-play">
          <p className="dg-ap" style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}>
            {bundle.theme.label}
          </p>
          <h1 className="dg-title" style={{ marginTop: "0.6rem" }}>
            Dramaturge
          </h1>
          <p className="dg-logline">
            Three plays assembled from {bundle.books.length} books. Every line
            inside quotation marks is a verbatim passage from one of them,
            carrying its citation; everything else is invented.
          </p>

          <h2 className="dg-rule-label">The shelf</h2>
          <ul className="dg-cast" style={{ marginBottom: "3rem" }}>
            {bundle.books.map((book) => (
              <li key={book.bookId}>
                <span className="dg-origin">{book.published}</span>
                <span>
                  <a href={book.url} target="_blank" rel="noreferrer">
                    {book.displayTitle ?? book.title}
                  </a>
                  <span className="dg-note">
                    {book.author} · {book.language}
                    {book.textRole === "original"
                      ? " · quoted as the source's own words"
                      : " · quoted from the translation of this edition"}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <h2 className="dg-rule-label">The plays</h2>
          <ul className="dg-index">
            {bundle.plays.map((play) => (
              <li key={play.id}>
                <Link href={`/dramaturge/${play.id}`}>
                  <h3>{play.spine.title}</h3>
                  <p>{play.spine.logline}</p>
                  <span className="dg-meta">
                    {play.spine.acts.length} acts · {quotedCount(play)} quoted lines
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="dg-rule-label" style={{ marginTop: "4rem" }}>
            How it was made
          </h2>
          <p className="dg-action">
            Each book was searched for the theme by keyword and by meaning, and
            the pages that answered were fetched and verified: {bundle.provenance.pagesRead} leaves
            read, {bundle.provenance.pooledLines} quotable sentences kept. A
            sentence running across a page break was completed from the
            neighbouring leaf or not quoted at all.
          </p>
          <p className="dg-action">
            The writing model never types a quotation. It cites a sentence by
            id and the renderer substitutes the wording, so a quotation cannot
            drift; a byte comparison against the source then fails the build if
            one ever did. These three plays speak {totalQuoted} quoted lines
            between them.
          </p>
        </div>
      </Container>
    </div>
  );
}
