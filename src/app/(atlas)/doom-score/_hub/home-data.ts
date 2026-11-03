import { MENTIONS } from "@/data/doom-score/ledger";
import { VOLUME } from "@/data/doom-score/volume";
import { FEED } from "@/data/doom-score/feed";
import { WIKI_PDOOM, WIKI_XRISK } from "@/data/doom-score/series";
import type { VolumePoint } from "@/data/doom-score/types";
import openalex from "@/data/doom-score/auto/openalex.json";
import gdelt from "@/data/doom-score/auto/gdelt.json";
import manifold from "@/data/doom-score/auto/manifold.json";
import polymarket from "@/data/doom-score/auto/polymarket.json";
import type { Moment, PileMonth } from "../_engine/DoomScore";
import { CHRONICLE } from "@/data/doom-score/chronicle";
import { thumbFor } from "./media";
import { linkable } from "./pushed";

/** Everything the home page (and its hero variants) computes on the server, in one place. */

/** p(doom) is an AI word. The ledger also keeps the odds people put on the bomb
 *  and on extinction from any cause; those rows feed the chronicle's first
 *  chapter and stay out of the score. */
export const AI_ROWS = MENTIONS.filter((m) => m.scope === "ai");

/** All talk a month, shared with the chronicle. */
export function buildTalk(): VolumePoint[] {
  const by = new Map<string, number>();
  const add = (m: string, n: number) => by.set(m, (by.get(m) ?? 0) + n);
  for (const v of VOLUME) add(v.month, v.count);
  const oa = openalex as unknown as { queries: { existential_risk_ai: { yearly: { year: number; count: number }[] } } };
  const y0 = new Date().getUTCFullYear(), m0 = new Date().getUTCMonth() + 1;
  for (const y of oa.queries.existential_risk_ai.yearly) {
    const months = y.year === y0 ? m0 : 12;
    for (let m = 1; m <= months; m++) add(`${y.year}-${String(m).padStart(2, "0")}`, Math.round((y.count * (m + 1)) / months) - Math.round((y.count * m) / months));
  }
  const gd = gdelt as unknown as { queries: { existential_risk_ai: { monthly: { month: string; count: number }[] } } };
  for (const v of gd.queries.existential_risk_ai.monthly) add(v.month, v.count);
  for (const m of (manifold as unknown as { items?: { date: string }[] }).items ?? []) add(m.date.slice(0, 7), 1);
  for (const m of (polymarket as unknown as { items?: { date: string }[] }).items ?? []) add(m.date.slice(0, 7), 1);
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

/** The same talk as buildTalk, split by kind for the grains: forum, paper, news, market. (Television is kept out: GDELT's caption index holds ten clips and stops in 2024.) */
export function buildPile(): PileMonth[] {
  const by = new Map<string, [number, number, number, number, number]>();
  const add = (m: string, k: number, n: number) => {
    const row = by.get(m) ?? [0, 0, 0, 0, 0];
    row[k] += n;
    by.set(m, row);
  };
  for (const v of VOLUME) add(v.month, 0, v.count);
  const oa = openalex as unknown as { queries: { existential_risk_ai: { yearly: { year: number; count: number }[] } } };
  const y0 = new Date().getUTCFullYear(), m0 = new Date().getUTCMonth() + 1;
  for (const y of oa.queries.existential_risk_ai.yearly) {
    const months = y.year === y0 ? m0 : 12;
    for (let m = 1; m <= months; m++) add(`${y.year}-${String(m).padStart(2, "0")}`, 1, Math.round((y.count * (m + 1)) / months) - Math.round((y.count * m) / months));
  }
  const gd = gdelt as unknown as { queries: { existential_risk_ai: { monthly: { month: string; count: number }[] } } };
  for (const v of gd.queries.existential_risk_ai.monthly) add(v.month, 2, v.count);
  for (const m of (manifold as unknown as { items?: { date: string }[] }).items ?? []) add(m.date.slice(0, 7), 3, 1);
  for (const m of (polymarket as unknown as { items?: { date: string }[] }).items ?? []) add(m.date.slice(0, 7), 3, 1);
  // the items we have a date for, so they can sit on their real day: forum posts, markets, papers, TV
  const dated = new Map<string, [number, number][]>();
  for (const f of FEED) {
    if (f.ledgerId) continue;
    const k = /Hacker News|LessWrong/.test(f.via) ? 0 : /OpenAlex/.test(f.via) ? 1 : /Manifold|Polymarket/.test(f.via) ? 3 : -1;
    if (k < 0 || f.date.length < 10) continue;
    const key = f.date.slice(0, 7);
    const list = dated.get(key) ?? [];
    list.push([k, +f.date.slice(8, 10)]);
    dated.set(key, list);
  }
  const keys = [...new Set([...by.keys(), ...dated.keys()])].sort();
  const out: PileMonth[] = [];
  if (!keys.length) return out;
  let [y, m] = keys[0].split("-").map(Number);
  const [ey, em] = keys.at(-1)!.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    const k = `${y}-${String(m).padStart(2, "0")}`;
    const counts = by.get(k) ?? [0, 0, 0, 0, 0];
    const d = dated.get(k) ?? [];
    // a kind's count is never below the number of dated items we hold for it
    for (let i = 0; i < 4; i++) counts[i] = Math.max(counts[i], d.filter(([kk]) => kk === i).length);
    out.push({ month: k, counts, dated: d });
    m++;
    if (m > 12) (m = 1), y++;
  }
  return out;
}

/** The chronicle's turning points, with the picture their source publishes, for the cards beside the player. */
export function buildMoments(): Moment[] {
  const out: Moment[] = [];
  for (const sec of CHRONICLE)
    for (const e of sec.entries) {
      if (e.weight !== 3 || e.kind === "number" || e.kind === "survey") continue; // things that happened, not numbers given
      const thumb = e.links
        .filter((l) => !/wikipedia\.org/.test(l.url))
        .map((l) => thumbFor(l.url))
        .find((t) => t && t.w >= 300) ?? null;
      const first = e.summary.split(/(?<=[.!?])\s+/)[0] ?? e.summary;
      out.push({ id: e.id, date: e.date, title: e.title, blurb: first.length > 170 ? `${first.slice(0, 168)}…` : first, thumb: thumb ? { src: thumb.src, w: thumb.w, h: thumb.h } : null, href: linkable(`/doom-score/chronicle#${e.id}`) ? `/doom-score/chronicle#${e.id}` : "", outlet: e.links[0]?.outlet });
    }
  return out;
}


/** Wikipedia views a month, both articles together. */
export function buildReaders(): VolumePoint[] {
  const by = new Map<string, number>();
  for (const v of [...WIKI_XRISK, ...WIKI_PDOOM]) by.set(v.month, (by.get(v.month) ?? 0) + v.count);
  return [...by.entries()].sort().map(([month, count]) => ({ month, count }));
}

export function buildTotals(talk: VolumePoint[], readers: VolumePoint[]) {
  const oa = openalex as unknown as { queries: { existential_risk_ai: { total: number } } };
  return {
    caught: talk.reduce((a, t) => a + t.count, 0),
    read: readers.reduce((a, r) => a + r.count, 0),
    papers: oa.queries.existential_risk_ai.total,
    markets: ((manifold as unknown as { items?: unknown[] }).items?.length ?? 0) + ((polymarket as unknown as { items?: unknown[] }).items?.length ?? 0),
  };
}

const num = (m: { p?: number; pLow?: number; pHigh?: number }) => m.p ?? (m.pLow != null && m.pHigh != null ? (m.pLow + m.pHigh) / 2 : (m.pLow ?? m.pHigh ?? null));
const parse = (d: string) => (/^\d{4}$/.test(d) ? Date.UTC(+d, 6, 1) : /^\d{4}-\d{2}$/.test(d) ? Date.UTC(+d.slice(0, 4), +d.slice(5) - 1, 15) : Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)));

/** The clock's reading: the median of every AI number given in the twelve months to the latest entry. */
export function buildClock() {
  const rows = AI_ROWS.filter((m) => num(m) != null).map((m) => ({ t: parse(m.date), p: num(m)! }));
  const latest = Math.max(...rows.map((r) => r.t));
  const win = rows.filter((r) => r.t > latest - 365 * 864e5).map((r) => r.p).sort((a, b) => a - b);
  const q = (k: number) => {
    const pos = (win.length - 1) * k, lo = Math.floor(pos), hi = Math.ceil(pos);
    return win[lo] + (win[hi] - win[lo]) * (pos - lo);
  };
  return { median: win.length ? q(0.5) : null, q1: win.length ? q(0.25) : null, q3: win.length ? q(0.75) : null, n: win.length, latest };
}
