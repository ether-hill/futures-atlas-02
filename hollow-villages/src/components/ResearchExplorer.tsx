"use client";

import { useMemo, useState } from "react";
import { type ResearchType } from "futures-atlas-core";
import {
  categoryLabels,
  research,
  type ResearchCategory,
} from "@/data/research";
import { ResearchCard } from "./ResearchCard";

type TopicFilter = "all" | ResearchCategory;
type TypeFilter = "all" | ResearchType;

const topicOrder: TopicFilter[] = [
  "all",
  "the-crisis",
  "what-worked",
  "the-mechanisms",
  "go-deeper",
];

const typeOrder: ResearchType[] = ["news", "research", "video", "resource"];
const typeLabels: Record<ResearchType, string> = {
  news: "News",
  research: "Research",
  video: "Videos",
  resource: "Resources",
};

/**
 * Content type of each (real) source — the second filter axis. Kept here rather
 * than in research.ts so the oracle's citation data shape stays untouched.
 * No videos yet; add a `video` entry and the Videos tab appears automatically.
 */
export const researchType: Record<string, ResearchType> = {
  "oecd-shrinking-smartly": "research",
  "eurostat-rural-demographics": "research",
  "empty-spain-overview": "resource",
  "ostana-first-baby": "news",
  "sambuca-one-euro-houses": "news",
  "riace-refugees-revival": "news",
  "lacaixa-immigration-rural-spain": "research",
  "albinen-newcomer-payments": "news",
  "plunkett-more-than-a-pub": "research",
  "agrafa-rural-telehealth": "research",
  "extremadura-digital-nomad-grants": "news",
  "pnrr-borghi-fund": "research",
  "espana-vaciada-movement": "research",
  "bistrot-de-pays-network": "news",
  "uwe-rural-demand-responsive-transport": "research",
  "eu-young-farmers-land-access": "research",
  "euronews-digital-nomad-villages": "news",
  "tarpino-spaesati": "resource",
  "revolt-empty-spain-video": "video",
  "sicily-one-euro-afp-video": "video",
  "digital-nomad-village-dw-video": "video",
};

const typeOf = (id: string): ResearchType => researchType[id] ?? "research";

const tabCls = (active: boolean) =>
  `rounded-[2px] border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
    active
      ? "border-accent bg-accent text-paper"
      : "border-ink/25 text-graphite hover:border-ink/45 hover:text-ink"
  }`;

export function ResearchExplorer() {
  const [topic, setTopic] = useState<TopicFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");

  const topicCounts = useMemo(() => {
    const c: Record<string, number> = { all: research.length };
    for (const r of research) c[r.category] = (c[r.category] ?? 0) + 1;
    return c;
  }, []);

  // Only show type tabs that actually have entries, in a fixed order.
  const presentTypes = useMemo(
    () => typeOrder.filter((t) => research.some((r) => typeOf(r.id) === t)),
    [],
  );
  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: research.length };
    for (const r of research) {
      const t = typeOf(r.id);
      c[t] = (c[t] ?? 0) + 1;
    }
    return c;
  }, []);

  const visible = research.filter(
    (r) =>
      (topic === "all" || r.category === topic) &&
      (type === "all" || typeOf(r.id) === type),
  );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 border-b border-ink/15 pb-6">
        <div role="tablist" aria-label="Filter research by topic" className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.16em] text-graphite/70">Topic</span>
          {topicOrder.map((key) => {
            const active = topic === key;
            return (
              <button key={key} role="tab" aria-selected={active} onClick={() => setTopic(key)} className={tabCls(active)}>
                {key === "all" ? "All" : categoryLabels[key]}
                <span className={`ml-2 ${active ? "text-paper/60" : "text-graphite/60"}`}>{topicCounts[key] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <div role="tablist" aria-label="Filter research by type" className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.16em] text-graphite/70">Type</span>
          {(["all", ...presentTypes] as TypeFilter[]).map((key) => {
            const active = type === key;
            return (
              <button key={key} role="tab" aria-selected={active} onClick={() => setType(key)} className={tabCls(active)}>
                {key === "all" ? "All" : typeLabels[key]}
                <span className={`ml-2 ${active ? "text-paper/60" : "text-graphite/60"}`}>{typeCounts[key] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="font-mono text-[13px] leading-[1.7] text-ink-70">
          Nothing matches that combination yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((entry) => (
            <ResearchCard key={entry.id} entry={entry} type={typeOf(entry.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
