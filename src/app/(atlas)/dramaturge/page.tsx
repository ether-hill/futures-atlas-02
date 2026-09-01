import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { clips } from "@/data/dramaturge";
import "@/components/dramaturge/dramaturge.css";

export const metadata: Metadata = {
  title: "Dramaturge. Futures Atlas",
  description:
    "Short films cut from photographs of the pages of historical books, where every caption is a verbatim sentence carrying its citation.",
};

/**
 * Dramaturge — draft project (gated by projects.ts visibility).
 *
 * Pick a shelf from the Source Library corpus, say what the film is about, and
 * the studio proposes a storyboard of leaves and captions. Every caption is a
 * verbatim sentence from the page shown behind it; the writing model never
 * types a quotation, it cites a sentence and the renderer substitutes the
 * wording, so what is burned into a frame cannot drift from the book.
 *
 * The studio is at /admin/dramaturge and runs locally — see the note there.
 */
export default function DramaturgePage() {
  return (
    <div className="dg">
      <Container>
        <div className="dg-play">
          <p
            className="dg-ap"
            style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            Source texts
          </p>
          <h1 className="dg-title" style={{ marginTop: "0.6rem" }}>
            Dramaturge
          </h1>
          <p className="dg-logline">
            Short films cut from photographs of the pages of old books. There is
            no footage: every shot is a scanned leaf and the only movement is
            the camera crossing it. Every caption is a verbatim sentence from
            the page behind it, carrying its citation.
          </p>

          {clips.length === 0 ? (
            <>
              <h2 className="dg-rule-label">No clips published yet</h2>
              <p className="dg-action">
                The studio proposes a storyboard, the storyboard is edited by
                hand, and only then are the frames photographed. Nothing is
                published until a clip has been cut and its captions checked
                against the pages they came from.
              </p>
            </>
          ) : (
            <ul className="dg-index">
              {clips.map((clip) => (
                <li key={clip.id}>
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    poster={clip.poster}
                    width={clip.width}
                    height={clip.height}
                    style={{ width: "100%", height: "auto", background: "var(--dg-leaf)" }}
                  >
                    <source src={clip.file} type="video/mp4" />
                  </video>
                  <h3 style={{ marginTop: "1rem" }}>{clip.title}</h3>
                  <p>{clip.logline}</p>
                  <span className="dg-meta">
                    {(clip.durationMs / 1000).toFixed(0)}s ·{" "}
                    {clip.citations.length} quotations · cut from{" "}
                    {clip.sources.map((s) => s.published).join(", ")}
                  </span>

                  {/*
                    Every quotation spoken on screen, with the page it is
                    printed on and a link to that page. A caption is only worth
                    burning into a frame if the viewer can go and check it.
                  */}
                  <details className="dg-cites">
                    <summary>Every quotation in this clip, with its source</summary>
                    <ol>
                      {clip.citations.map((c, i) => (
                        <li key={`${clip.id}-${i}`}>
                          <span className="dg-quoted">&ldquo;{c.text}&rdquo;</span>
                          <span className="dg-src">
                            {c.attribution}{" "}
                            <a href={c.citationLink} target="_blank" rel="noreferrer">
                              {c.citationLink.replace("https://", "")}
                            </a>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </details>

                  <p className="dg-ap" style={{ marginTop: "1rem" }}>
                    Sources:{" "}
                    {clip.sources.map((src, i) => (
                      <span key={src.url}>
                        {i > 0 ? "; " : ""}
                        <a href={src.url} target="_blank" rel="noreferrer">
                          {src.title}
                        </a>{" "}
                        — {src.author}, {src.published}
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </div>
  );
}
