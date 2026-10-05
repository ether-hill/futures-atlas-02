// Build the reference list for every piece: dataviz/references.json
//   node build-references.mjs
//
// Nothing is typed in by hand here. Peer-reviewed papers are cited from their
// Crossref record (saved in raw/crossref/), so authors, title, journal, volume,
// pages and year are the publisher's own metadata. Company documents and
// reports are cited from the title, organisation and URL recorded with the
// data. Each reference says what it supports on the chart and where in the
// source (page, table or figure) the number is.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./templates/csv.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), "utf8");
const ACCESSED = "5 October 2026";

const initials = (given = "") => given.split(/[\s-]+/).filter(Boolean).map((g) => `${g[0]}.`).join(" ");
function authors(list) {
  const names = list.map((a) => (a.family ? `${a.family}, ${initials(a.given)}` : a.name));
  if (names.length === 1) return names[0];
  if (!list[0].family) return names[0]; // a collective author, e.g. "Google Quantum AI and Collaborators"
  if (names.length <= 3) return `${names.slice(0, -1).join(", ")}, & ${names.at(-1)}`;
  return `${names[0]}, et al.`;
}

function crossref(doi) {
  const f = join(root, "data/qubits-vs-quality/raw/crossref", `${doi.replace("/", "_")}.json`);
  if (!existsSync(f)) throw new Error(`no Crossref record for ${doi}`);
  const m = JSON.parse(readFileSync(f, "utf8")).message;
  const year = (m["published-print"] ?? m["published-online"] ?? m.published ?? m.issued)["date-parts"][0][0];
  return {
    authors: authors(m.author ?? []),
    year,
    title: m.title[0],
    venue: m["container-title"][0],
    volume: m.volume ?? "",
    pages: m.page ?? m["article-number"] ?? "",
    doi,
    url: `https://doi.org/${doi}`,
    type: "Peer-reviewed article",
  };
}

const fmt = (n) => (n >= 10 ? String(Math.round(n)) : String(+n.toPrecision(2)));

// ── qubits-vs-quality ───────────────────────────────────────────────────────
const qrows = parseCsv(read("data/qubits-vs-quality/clean.csv"));
const trans = Object.fromEntries(parseCsv(read("data/qubits-vs-quality/raw/transcription.csv")).map((r) => [r.id, r]));
const SHORT = {
  "google-sycamore-2019": "Google Sycamore", "ustc-zuchongzhi-2021": "USTC Zuchongzhi", "ibm-osprey-2022": "IBM Osprey",
  "harvard-evered-2023": "Harvard/MIT atom array", "quantinuum-h2-2023": "Quantinuum H2 (2023)", "ibm-condor-2023": "IBM Condor",
  "ibm-heron-r1-2023": "IBM Heron r1", "harvard-bluvstein-2023": "Harvard/MIT/QuEra logical processor", "caltech-6100-2024": "Caltech atom array",
  "quantinuum-h2-2024": "Quantinuum H2 (2024)", "google-willow-2024-logical": "Google Willow error-correction result", "atom-msft-2024": "Atom Computing/Microsoft",
  "google-willow-2024": "Google Willow", "ustc-zuchongzhi3-2024": "USTC Zuchongzhi 3.0", "ibm-heron-r3-2025": "IBM Heron r3", "quantinuum-helios-2025": "Quantinuum Helios",
};
// the rows the chart draws: devices, plus any logical result that carries a two-qubit error
const plotted = (r) => r.physical_qubits !== "" && !(r.record_type === "logical_demo" && r.twoq_error === "");
const byKey = new Map();
for (const r of qrows) {
  const key = r.doi || r.url;
  if (!byKey.has(key)) {
    const t = trans[r.id];
    const ref = r.doi
      ? crossref(r.doi)
      : {
          authors: r.id === "atom-msft-2024" ? "Reichardt, B. W., et al." : r.url.includes("ibm.com") ? "IBM" : "Google Quantum AI",
          year: r.date_first_public.slice(0, 4),
          title: t.source_title.replace(/\s*\((?:blog|QDC)[^)]*\)\s*$/, ""),
          venue: r.id === "atom-msft-2024" ? "arXiv preprint arXiv:2411.11822 (version 3)" : r.url.includes("newsroom") ? "IBM Newsroom" : r.url.includes("ibm.com") ? "IBM Quantum blog" : "Product specification sheet",
          volume: "", pages: "", doi: "", url: r.url,
          type: r.id === "atom-msft-2024" ? "Company preprint, not peer-reviewed" : "Company document",
        };
    // open copy where the publisher's version may be paywalled
    if (r.doi && /arxiv\.org/.test(r.url)) ref.openAccess = r.url;
    ref.uses = []; ref.plotted = false;
    byKey.set(key, ref);
  }
  const ref = byKey.get(key);
  const err = r.twoq_error ? `${fmt(+r.twoq_error * 1000)} two-qubit errors per 1,000` : "no average two-qubit error given";
  ref.uses.push({ what: `${SHORT[r.id]}: ${Number(r.physical_qubits).toLocaleString("en-GB")} qubits, ${err}`, where: r.locator });
  if (plotted(r)) ref.plotted = true;
}
const qubitsRefs = [...byKey.values()].sort((a, b) => (b.plotted - a.plotted) || String(a.year).localeCompare(String(b.year)));

// ── q-day ───────────────────────────────────────────────────────────────────
const qdayRefs = [{
  authors: "Mosca, M., & Piani, M.", year: 2026, title: "Quantum Threat Timeline Report 2025",
  venue: "Global Risk Institute in Financial Services and evolutionQ Inc.", volume: "", pages: "",
  doi: "", url: "https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/",
  pdf: "https://globalriskinstitute.org/mp-files/pdf-quantum-threat-timeline-report-2025.pdf",
  type: "Expert survey report", plotted: true,
  uses: [
    { what: "Answers of the 26 experts at each time horizon (the bars)", where: "Appendix A.4, p. 70" },
    { what: "The question as asked", where: "Appendix A.3, p. 68" },
    { what: "Number of respondents, 26", where: "p. 19" },
    { what: "The publisher's declaration of potential conflict of interest", where: "p. 3" },
  ],
}];

// ── training-compute ────────────────────────────────────────────────────────
const computeRefs = [
  {
    authors: "Epoch AI", year: 2026, title: "Data on Notable AI Models", venue: "Dataset, CC BY licence (records to 9 September 2026)",
    volume: "", pages: "", doi: "", url: "https://epoch.ai/data/notable-ai-models", type: "Dataset", plotted: true,
    uses: [{ what: "Training compute, date and confidence rating of every model (the dots)", where: "notable_ai_models.csv, columns Training compute (FLOP), Publication date, Confidence, Frontier model" }],
  },
  {
    authors: "Epoch AI", year: 2026, title: "AI models documentation: Estimation", venue: "Epoch AI", volume: "", pages: "", doi: "",
    url: "https://epoch.ai/data/ai-models-documentation/estimation", type: "Dataset documentation", plotted: true,
    uses: [{ what: "The 90% ranges behind each streak: confident ±3x, likely ±10x, speculative ±31x", where: "section Estimating confidence" }],
  },
  {
    authors: "Sevilla, J., & Roldán, E.", year: 2024, title: "Training compute of frontier AI models grows by 4-5x per year", venue: "Epoch AI",
    volume: "", pages: "", doi: "", url: "https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year", type: "Research report", plotted: true,
    uses: [{ what: "The 4.2x a year growth rate and its 90% range, 3.6x to 4.9x (frontier models, 2018 to May 2024)", where: "section Frontier model growth has slowed, and now aligns with overall trends" }],
  },
];

const out = { accessed: ACCESSED, "q-day": qdayRefs, "qubits-vs-quality": qubitsRefs, "training-compute": computeRefs };
writeFileSync(join(root, "references.json"), JSON.stringify(out, null, 2) + "\n");
const q = qubitsRefs.filter((r) => r.plotted);
console.log(`references: q-day ${qdayRefs.length}, compute ${computeRefs.length}, qubits ${qubitsRefs.length} (${q.filter((r) => r.type === "Peer-reviewed article").length} peer-reviewed + ${q.filter((r) => r.type !== "Peer-reviewed article").length} company plotted, ${qubitsRefs.length - q.length} consulted only)`);
