"use client";

import { useMemo, useState } from "react";
import { Section } from "./Section";
import { Card, CardBody } from "./Card";

export interface ResearchItem {
  id: string;
  title: string;
  source: string;
  year?: string;
  summary: string;
  url: string;
  category: string;
  image?: string;
}

/** Data-driven evidence-base page: framing header + category filter + card grid.
 *  All content via props. */
export function ResearchTemplate({
  eyebrow = "The evidence base",
  heading,
  intro,
  items,
  categoryLabels = {},
}: {
  eyebrow?: string;
  heading: string;
  intro?: string;
  items: ResearchItem[];
  categoryLabels?: Record<string, string>;
}) {
  const cats = useMemo(() => {
    const seen: string[] = [];
    for (const it of items) if (!seen.includes(it.category)) seen.push(it.category);
    return seen;
  }, [items]);

  const [filter, setFilter] = useState<string>("all");
  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);
  const tabs = ["all", ...cats];

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

      <div
        role="tablist"
        aria-label="Filter by category"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-2)",
          margin: "var(--space-7) 0 var(--space-7)",
          borderBottom: "var(--border-hairline) solid var(--hairline)",
          paddingBottom: "var(--space-6)",
        }}
      >
        {tabs.map((key) => {
          const active = filter === key;
          const label = key === "all" ? "All" : categoryLabels[key] ?? key;
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
          <Card key={it.id} href={it.url}>
            <div
              className={it.image ? "" : "fa-hatch"}
              style={{ aspectRatio: "16 / 10", borderBottom: "var(--border-hairline) solid var(--text)", overflow: "hidden" }}
            >
              {it.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image} alt={it.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
            <CardBody>
              <span className="fa-card__meta" style={{ marginBottom: "var(--space-3)" }}>
                {it.source}
                {it.year ? ` · ${it.year}` : ""}
              </span>
              <h3 className="fa-card__title">{it.title}</h3>
              <p className="fa-t-body" style={{ marginTop: "var(--space-3)" }}>
                {it.summary}
              </p>
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
                Read the source ↗
              </span>
            </CardBody>
          </Card>
        ))}
      </div>
    </Section>
  );
}
