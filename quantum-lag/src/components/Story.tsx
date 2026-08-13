"use client";

import type { Claim, Evidence, Source } from "@/content/types";
import { asset } from "@/lib/asset";
import { Figure } from "./visuals";

/*
  The story: a hook, then paragraphs and figures in the order the author put
  them. Figures sit mid-story, at the point where the reader has just been given
  a fact they cannot quite picture, so they are rendered inline rather than
  collected at the end.

  One column at a reading measure. This is the part people are here to read.
*/

function Ref({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="ql-ref" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="ql-ref__mark" aria-hidden="true" />
      <span className="ql-sr"> (opens in a new tab)</span>
    </a>
  );
}

function Photograph({ image }: { image: Evidence }) {
  /*
    Wide pictures run full bleed. Tall ones do not: forcing one into a letterbox
    is how the Kamerlingh Onnes photograph became a picture of a collar. Either
    way the frame takes the image's own aspect, so `cover` has nothing to crop
    except the few percent the parallax drifts through.
  */
  const ratio = image.width / image.height;
  const bleed = ratio >= 1.3;
  const frameRatio = Math.min(Math.max(ratio, 0.62), 2.4);

  return (
    <figure
      className={`ql-story__figure ${
        bleed ? "ql-story__figure--bleed" : "ql-story__figure--upright"
      }`}
      style={{ "--frame-ratio": frameRatio } as React.CSSProperties}
    >
      <div className="ql-story__frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="ql-story__img"
          src={asset(image.src)}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
        />
      </div>
      <figcaption className="ql-story__credit">
        {image.credit} · <Ref href={image.sourceUrl}>{image.licence}</Ref>
      </figcaption>
    </figure>
  );
}

export function Story({
  claim,
  lead,
}: {
  claim: Claim;
  /** The consequence line, where the claim has one. Prose, so it belongs with
      the prose rather than sitting between the chart and the read. */
  lead?: string | null;
}) {
  const sources: Source[] = claim.sources;

  return (
    <section className="ql-story">
      <div className="ql-story__head">
        <span className="ql-label">The story</span>
        <span className="ql-label">
          {sources.length === 1 ? "1 source" : `${sources.length} sources`}
        </span>
      </div>

      <p className="ql-story__hook">{claim.hook}</p>

      {lead && <p className="ql-story__lead">{lead}</p>}

      {claim.image && <Photograph image={claim.image} />}

      <div className="ql-story__body">
        {claim.story.map((block, i) =>
          block.kind === "text" ? (
            <p key={i} className="ql-story__p" data-rise>
              {block.text}
            </p>
          ) : (
            <Figure key={i} id={block.id} caption={block.caption} />
          ),
        )}
      </div>

      <p className="ql-story__sources">
        {sources.map((source, i) => (
          <span key={source.text}>
            {i > 0 && <span className="ql-ev__sep"> · </span>}
            {source.url ? (
              <Ref href={source.url}>{source.text}</Ref>
            ) : (
              source.text
            )}
          </span>
        ))}
      </p>
    </section>
  );
}
