import type { Mapping } from "../types.ts";
import type { Snapshot } from "./snapshot.ts";
import raw from "./compute.json";

const snap = raw as unknown as Snapshot;

/** H100-equivalents, compact: 275796 -> "276k", 1900000 -> "1.9M". */
const fmt = (v: number) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(1)}M H100e` : v >= 1e3 ? `${Math.round(v / 1e3)}k H100e` : `${Math.round(v)} H100e`;

export const compute: Mapping = {
  slug: "compute",
  title: "Mapping the Compute Buildout",
  recordNoun: "AI supercomputer",
  intro:
    "Every dot is one AI supercomputer — a GPU cluster large enough to train frontier models — from Epoch AI's census of disclosed systems. Sized by computing power, placed where it was built, dated by when it first ran.",
  format: fmt,
  headline(recs) {
    const withV = recs.filter((r) => r.value !== null);
    const total = withV.reduce((s, r) => s + (r.value ?? 0), 0);
    return {
      big: recs.length.toLocaleString("en-US"),
      sentence: `At least ___ AI supercomputers have come online worldwide — together the computing power of ${fmt(total).replace(" H100e", "")} NVIDIA H100 GPUs.`,
      sub:
        `Disclosed, verified systems only — Epoch AI estimates this census covers roughly 10–20% of the world's GPU-cluster capacity. ` +
        `${recs.length - withV.length} of these systems report no usable size estimate and are counted, not summed.`,
    };
  },
  dims: [
    { key: "country", label: "Country", filterable: true },
    { key: "sector", label: "Sector", filterable: true },
    { key: "certainty", label: "Certainty", filterable: true },
    { key: "owner", label: "Owner", filterable: false },
  ],
  records: snap.records,
  sources: [
    {
      name: "Epoch AI — AI Supercomputers (GPU clusters)",
      url: "https://epoch.ai/data/ai-supercomputers",
      dataUrl: snap.sourceUrl,
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      retrieved: snap.retrieved,
      method: [
        `The snapshot keeps every row of the published CSV that carries a first-operational date: ${snap.records.length} of ${snap.meta.total} systems. ${snap.meta.noDate} rows without a date were dropped and are not counted anywhere.`,
        `${snap.meta.approxLocation} systems disclose only their country (Epoch codes them at the country's centre — most are Chinese clusters it anonymises deliberately); the map pools those into dashed country markers rather than pretending each has a site. ${snap.meta.noLocation} systems publish no location at all and count in every figure without being drawn.`,
        `"Computing power" uses Epoch's H100-equivalents estimate — how many NVIDIA H100 GPUs would match the system's performance. ${snap.meta.noValue} systems have no such estimate and appear with the size undisclosed.`,
      ],
    },
  ],
  map: {
    dotLegend: "Dot area is proportional to computing power (H100-equivalents).",
  },
  timeline: {
    label: "Computing power brought online per year",
    metric: "value",
    openEndedYear: 2025,
  },
  calendar: {
    label: "Systems coming online, month by month",
  },
  cumulative: {
    label: "Mapped computing power, cumulative",
  },
  concentration: {
    dim: "owner",
    top: 5,
    label: "of mapped computing power sits with the five biggest owners",
  },
  breakdowns: [
    // top matches the harvest's own country bucketing (8 + Other + Undisclosed),
    // so the panel never wraps the CSV's "Other" bucket in a second "Other"
    { key: "country", label: "By country", top: 12, span: 1 },
    { key: "owner", label: "By owner", top: 10, span: 2 },
    { key: "sector", label: "By sector", span: 1 },
  ],
  methodNotes: [
    "One record is one system as Epoch delimits it: successive phases of the same site (xAI's Colossus, for instance) appear as separate systems, because each phase was a distinct buildout with its own date and hardware.",
    "This is a mapping of what has been publicly disclosed and verified — the true buildout is larger. Where a claim is 'Likely' rather than 'Confirmed', the certainty filter says so.",
  ],
};
