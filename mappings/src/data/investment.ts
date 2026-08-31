import type { Mapping } from "../types.ts";
import type { Snapshot } from "./snapshot.ts";
import raw from "./investment.json";

const snap = raw as unknown as Snapshot;

/** USD, compact: 4.1e10 -> "$41B". */
const fmt = (v: number) =>
  v >= 1e9 ? `$${(v / 1e9) >= 100 ? Math.round(v / 1e9) : (v / 1e9).toFixed(1).replace(/\.0$/, "")}B` : `$${Math.round(v / 1e6)}M`;

export const investment: Mapping = {
  slug: "ai-investment",
  title: "Mapping AI Investment",
  recordNoun: "funding round",
  intro:
    "Every dot is one disclosed funding round into a frontier AI lab, from Epoch AI's deal-level record — each round sourced, dated, and placed at the company's headquarters. The size of the dot is the size of the cheque.",
  format: fmt,
  headline(recs) {
    const withV = recs.filter((r) => r.value !== null);
    const total = withV.reduce((s, r) => s + (r.value ?? 0), 0);
    const closed = recs.filter((r) => r.dims.status === "Closed").length;
    return {
      big: fmt(total),
      sentence: `At least ___ of equity has been committed to frontier AI labs across ${recs.length} disclosed rounds.`,
      sub:
        `${closed} of ${recs.length} rounds have closed; the rest are announced or in late discussion — the status filter separates them. ` +
        `Frontier labs tracked by Epoch AI only: the long tail of AI startups is not in this data.`,
    };
  },
  dims: [
    { key: "company", label: "Company", filterable: true },
    { key: "status", label: "Status", filterable: true },
    { key: "type", label: "Round type", filterable: true },
    { key: "confidence", label: "Confidence", filterable: false },
  ],
  records: snap.records,
  sources: [
    {
      name: "Epoch AI — AI Companies: funding rounds",
      url: "https://epoch.ai/data/ai-companies",
      dataUrl: snap.sourceUrl,
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      retrieved: snap.retrieved,
      method: [
        `All ${snap.meta.total} published rounds are kept. Rounds without a close date (announced deals still being negotiated) are dated by the date they were reported, and each one says so on its record.`,
        "The published CSV carries no locations. We placed each round at the company's headquarters city ourselves — that placement is this project's addition, not Epoch's data, and it maps where the company sits, not where the money is spent.",
        "Sums count disclosed equity only. Debt facilities and undisclosed amounts are noted on the record but never added into a headline figure.",
      ],
    },
  ],
  map: {
    dotLegend: "Dot area is proportional to disclosed equity; dots sit at company headquarters, which is our own placement.",
  },
  timeline: {
    label: "Disclosed equity committed per year",
    metric: "value",
    openEndedYear: 2026,
  },
  calendar: {
    label: "Rounds landing, month by month",
  },
  cumulative: {
    label: "Disclosed equity, cumulative",
  },
  concentration: {
    dim: "company",
    top: 2,
    label: "of all disclosed equity goes to just two companies",
  },
  breakdowns: [
    { key: "status", label: "By status", span: 1 },
    { key: "company", label: "By company", span: 2 },
    { key: "type", label: "By round type", span: 1 },
  ],
  methodNotes: [
    "A committed round is not money in the bank: the biggest single record — NVIDIA's $100B letter of intent to OpenAI — has never been formally signed, and the record's own note says so. Filter status to 'Closed' for the conservative view.",
    "Deal-level data for a handful of frontier labs is a different thing from 'AI investment' economy-wide. For the economy-wide picture, country-level series (OECD.AI, Our World in Data's CC-BY mirrors of AI Index/CSET data) are the right sources — a candidate for a future mapping.",
  ],
};
