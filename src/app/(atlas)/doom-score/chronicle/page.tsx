import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { MENTIONS } from "@/data/doom-score/ledger";
import { CHRONICLE } from "@/data/doom-score/chronicle";
import { VOLUME } from "@/data/doom-score/volume";
import type { VolumePoint } from "@/data/doom-score/types";
import openalex from "@/data/doom-score/auto/openalex.json";
import gdelt from "@/data/doom-score/auto/gdelt.json";
import manifold from "@/data/doom-score/auto/manifold.json";
import polymarket from "@/data/doom-score/auto/polymarket.json";
import { DoomHeader } from "../_hub/DoomHeader";
import { Chronicle } from "./Chronicle";
import "../doom-score.css";

export const metadata: Metadata = {
  title: "Chronicle. The Doom Score. Futures Atlas",
  description: "The extended timeline: how extinction risk from AI became a public question, section by section, with the numbers, the quotes and the press that carried them.",
  robots: { index: false },
};

/** All talk a month: forum mentions, papers, news, markets, broadcasts. */
function buildTalk(): VolumePoint[] {
  const by = new Map<string, number>();
  const add = (m: string, n: number) => by.set(m, (by.get(m) ?? 0) + n);
  for (const v of VOLUME) add(v.month, v.count);
  const oa = openalex as unknown as { queries: { existential_risk_ai: { yearly: { year: number; count: number }[] } } };
  const thisYear = new Date().getUTCFullYear();
  const thisMonth = new Date().getUTCMonth() + 1;
  for (const y of oa.queries.existential_risk_ai.yearly) {
    const months = y.year === thisYear ? thisMonth : 12;
    for (let m = 1; m <= months; m++) add(`${y.year}-${String(m).padStart(2, "0")}`, Math.round((y.count * (m + 1)) / months) - Math.round((y.count * m) / months));
  }
  const gd = gdelt as unknown as { queries: { existential_risk_ai: { monthly: { month: string; count: number }[] } } };
  for (const v of gd.queries.existential_risk_ai.monthly) add(v.month, v.count);
  for (const m of ((manifold as unknown as { items?: { date: string }[] }).items ?? [])) add(m.date.slice(0, 7), 1);
  for (const m of ((polymarket as unknown as { items?: { date: string }[] }).items ?? [])) add(m.date.slice(0, 7), 1);
  const keys = [...by.keys()].sort();
  const out: VolumePoint[] = [];
  if (!keys.length) return out;
  let [y, m] = keys[0].split("-").map(Number);
  const [ey, em] = keys.at(-1)!.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    const k = `${y}-${String(m).padStart(2, "0")}`;
    out.push({ month: k, count: by.get(k) ?? 0 });
    m++;
    if (m > 12) (m = 1), y++;
  }
  return out;
}

export default function ChroniclePage() {
  const entries = CHRONICLE.reduce((a, s) => a + s.entries.length, 0);
  return (
    <Container className="py-10">
      <DoomHeader title="Chronicle" lead={`The long version. ${entries} dated entries in ${CHRONICLE.length} chapters, from the first odds on the bomb to the latest resignation letter: what happened, who said what, which papers and articles carried it, and how loud the talk was at the time. Every entry rests on the links under it.`} />
      <Chronicle sections={CHRONICLE} mentions={MENTIONS} talk={buildTalk()} />
    </Container>
  );
}
