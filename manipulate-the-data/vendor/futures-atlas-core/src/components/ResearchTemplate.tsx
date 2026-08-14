"use client";

import { useMemo, useState } from "react";
import { Section } from "./Section";
import { Card, CardBody } from "./Card";
import { VideoEmbed, youTubeId } from "./VideoEmbed";

/** What a resource IS — drives the filter tabs and the card treatment. */
export type ResearchType = "news" | "research" | "video" | "resource";

/** Where the thumbnail came from, in priority order (best first). Authoring
 *  rule: screengrab > official press image > logo > Wikimedia Commons /
 *  very-relevant Unsplash (last resort). See RESEARCH-AUTHORING.md. */
export type ThumbnailType = "screengrab" | "press" | "logo" | "commons" | "unsplash";

export interface ResearchItem {
  id: string;
  type: ResearchType;
  title: string;
  source: string;
  year?: string;
  /** Concise: what this resource is. */
  summary: string;
  /** Optional: how it relates to THIS project. */
  relation?: string;
  /** Canonical link; for a video, the YouTube watch URL. */
  url: string;
  thumbnail?: string;
  thumbnailType?: ThumbnailType;
  credit?: string;
  /** Explicit YouTube id; otherwise derived from `url`. */
  videoId?: string;
  featured?: boolean;
}

const TYPE_ORDER: ResearchType[] = ["news", "research", "video", "resource"];
const TYPE_LABELS: Record<ResearchType, string> = {
  news: "News",
  research: "Research",
  video: "Videos",
  resource: "Resources",
};
const TYPE_TAG: Record<ResearchType, string> = {
  news: "News",
  research: "Research",
  video: "Video",
  resource: "Resource",
};
const CTA: Record<ResearchType, string> = {
  news: "Read the source ↗",
  research: "Read the source ↗",
  video: "Watch on YouTube ↗",
  resource: "Open ↗",
};

/** Data-driven evidence base: framing header + content-type filter + card grid.
 *  Cards are News / Research articles / YouTube videos / other Resources.
 *  All content via props; all design via tokens. */
export function ResearchTemplate({
  eyebrow = "The evidence base",
  heading,
  intro,
  items,
  emptyHint,
}: {
  eyebrow?: string;
  heading: string;
  intro?: string;
  items: ResearchItem[];
  /** Shown when there are no items yet (scaffolded, awaiting real data). */
  emptyHint?: string;
}) {
  // Only offer tabs for types that actually have items, in a fixed order.
  const presentTypes = useMemo(
    () => TYPE_ORDER.filter((t) => items.some((i) => i.type === t)),
    [items],
  );
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const it of items) c[it.type] = (c[it.type] ?? 0) + 1;
    return c;
  }, [items]);

  const [filter, setFilter] = useState<"all" | ResearchType>("all");
  const visible = filter === "all" ? items : items.filter((i) => i.type === filter);
  const tabs: ("all" | ResearchType)[] = ["all", ...presentTypes];

  return (
    <Section variant="header">
      <header style={{ maxWidth: "48rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
          <span className="fa-eyebrow">{eyebrow}</span>
          <span style={{ height: 1, flex: 1, background: "var(--hairline)" }} />
        </div>
        <h1 className="fa-t-display-l">{heading}</h1>
        {intro && (
          <p className="fa-t-body" style={{ marginTop: "var(--space-6)", maxWidth: "62ch" }}>
            {intro}
          </p>
        )}
      </header>

      {items.length === 0 ? (
        <p className="fa-t-body" style={{ marginTop: "var(--space-7)", color: "var(--muted)" }}>
          {emptyHint ?? "No resources yet — add entries to this project’s research data file."}
        </p>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Filter by type"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-2)",
              margin: "var(--space-7) 0",
              borderBottom: "var(--border-hairline) solid var(--hairline)",
              paddingBottom: "var(--space-6)",
            }}
          >
            {tabs.map((key) => {
              const active = filter === key;
              const label = key === "all" ? "All" : TYPE_LABELS[key];
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(key)}
                  className="fa-btn"
                  style={{
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "var(--paper)" : "var(--muted)",
                    borderColor: active ? "var(--accent)" : "color-mix(in srgb, var(--text) 25%, transparent)",
                    boxShadow: "none",
                    padding: "8px 14px",
                  }}
                >
                  {label}
                  <span style={{ opacity: 0.6, marginLeft: 6 }}>{counts[key] ?? 0}</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gap: "var(--space-5)",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
            }}
          >
            {visible.map((it) => (
              // id doubles as a deep-link anchor (e.g. citations → /research#<id>)
              <div key={it.id} id={it.id} style={{ scrollMarginTop: "var(--space-section)" }}>
                <ResearchCard item={it} />
              </div>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}

function TypeTag({ type }: { type: ResearchType }) {
  return (
    <span
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        padding: "4px 8px",
        background: "var(--accent)",
        color: "var(--paper)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-micro)",
        textTransform: "uppercase",
        letterSpacing: "var(--track-label)",
      }}
    >
      {TYPE_TAG[type]}
    </span>
  );
}

/** One evidence card. Video cards play inline (the card is not a link); every
 *  other type makes the whole card a link to its source. */
function ResearchCard({ item }: { item: ResearchItem }) {
  const [imgOk, setImgOk] = useState(true);
  const vid = item.type === "video" ? item.videoId ?? youTubeId(item.url) : null;

  const body = (
    <CardBody>
      <span className="fa-card__meta" style={{ marginBottom: "var(--space-3)" }}>
        {item.source}
        {item.year ? ` · ${item.year}` : ""}
      </span>
      <h3 className="fa-card__title">{item.title}</h3>
      <p className="fa-t-body" style={{ marginTop: "var(--space-3)" }}>
        {item.summary}
      </p>
      {item.relation && (
        <p
          className="fa-t-body"
          style={{
            marginTop: "var(--space-3)",
            paddingLeft: "var(--space-3)",
            borderLeft: "var(--border-emphasis) solid var(--accent)",
            color: "var(--muted)",
            fontStyle: "italic",
          }}
        >
          {item.relation}
        </p>
      )}
      <span
        style={{
          marginTop: "var(--space-6)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-label)",
          textTransform: "uppercase",
          letterSpacing: "var(--track-label)",
          color: "var(--accent-deep)",
        }}
      >
        {CTA[item.type]}
      </span>
    </CardBody>
  );

  // Media: video facade, image, or a designed source-plate fallback.
  const media =
    item.type === "video" && vid ? (
      <div style={{ position: "relative" }}>
        <TypeTag type={item.type} />
        <VideoEmbed id={vid} title={item.title} thumbnail={item.thumbnail} credit={item.credit} />
      </div>
    ) : (
      <div
        className={item.thumbnail && imgOk ? "" : "fa-hatch"}
        style={{
          position: "relative",
          aspectRatio: "16 / 10",
          borderBottom: "var(--border-hairline) solid var(--text)",
          overflow: "hidden",
        }}
      >
        <TypeTag type={item.type} />
        {item.thumbnail && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt={`${item.source}: ${item.title}`}
            loading="lazy"
            onError={() => setImgOk(false)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              padding: "var(--space-3)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-label)",
              color: "color-mix(in srgb, var(--text) 70%, transparent)",
            }}
          >
            {item.source}
          </span>
        )}
        {item.thumbnail && imgOk && item.credit && (
          <span
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              maxWidth: "100%",
              padding: "2px 6px",
              background: "color-mix(in srgb, var(--text) 65%, transparent)",
              color: "var(--paper)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-micro)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.credit}
          </span>
        )}
      </div>
    );

  // Video card is a non-link (so the player works); others link out wholesale.
  if (item.type === "video") {
    return (
      <Card>
        {media}
        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
          {body}
        </a>
      </Card>
    );
  }
  return (
    <Card href={item.url}>
      {media}
      {body}
    </Card>
  );
}
