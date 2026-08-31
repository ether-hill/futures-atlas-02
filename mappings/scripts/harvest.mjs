#!/usr/bin/env node
/**
 * harvest.mjs — build the committed data snapshots in src/data/*.json.
 *
 * Fetches the raw CSVs from Epoch AI (CC BY 4.0), normalises them onto the
 * Rec shape in src/types.ts, and writes JSON with a `retrieved` stamp and a
 * `meta` block counting everything that was dropped — the methodology section
 * renders those counts, so a re-harvest keeps the page honest automatically.
 *
 * Snapshots are COMMITTED (the Vercel build must not depend on a third-party
 * host being up). Re-run `npm run harvest` to refresh, review the diff, commit.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(OUT, { recursive: true });
const today = new Date().toISOString().slice(0, 10);

/* ---------- tiny CSV parser (quoted fields, embedded newlines) ---------- */
function parseCSV(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c !== "\r") cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const header = rows[0];
  return rows
    .slice(1)
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "futures-atlas-mappings-harvest" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const num = (s) => (s === "" || s === undefined ? null : Number(s));

/* ---------------- Mapping 1: the compute buildout ---------------- */

const COUNTRY_SHORT = {
  "United States of America": "United States",
  "Korea (Republic of)": "South Korea",
  "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
  "Taiwan, Province of China": "Taiwan",
  "Russian Federation": "Russia",
  "Iran (Islamic Republic of)": "Iran",
  "Netherlands (Kingdom of the)": "Netherlands",
  "United Arab Emirates": "UAE",
};

async function harvestCompute() {
  const url = "https://epoch.ai/data/gpu_clusters.csv";
  const rows = parseCSV(await fetchText(url));
  const meta = { total: rows.length, noDate: 0, noValue: 0, noLocation: 0 };
  const records = [];
  // top countries become filter chips; the rest bucket into "Other"
  const countryCount = {};
  for (const r of rows) {
    const c = COUNTRY_SHORT[r["Country"]] ?? r["Country"];
    if (c) countryCount[c] = (countryCount[c] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([c]) => c);

  for (const r of rows) {
    if (!r["Name"]) continue;
    const date = r["First Operational Date"];
    if (!date) { meta.noDate++; continue; }
    const h100e = num(r["H100 equivalents"]);
    if (h100e === null) meta.noValue++;
    const lat = num(r["latitude"]);
    const lng = num(r["longitude"]);
    if (lat === null || lng === null) meta.noLocation++;
    const country = COUNTRY_SHORT[r["Country"]] ?? r["Country"] ?? "";
    const mw = num(r["Power Capacity (MW)"]);
    const chips = r["Total number of AI chips"] || r["Chip quantity (primary)"];
    const noteBits = [];
    if (mw !== null) noteBits.push(`${Math.round(mw).toLocaleString("en-US")} MW`);
    if (chips) noteBits.push(`${Number(chips).toLocaleString("en-US")} AI chips`);
    if (r["Chip type (primary)"]) noteBits.push(r["Chip type (primary)"]);
    records.push({
      id: slug(r["Name"]),
      name: r["Name"],
      date,
      ...(lat !== null && lng !== null ? { lat, lng } : {}),
      place: r["Location"] || country || undefined,
      value: h100e === null ? null : Math.round(h100e),
      dims: {
        country: country ? (topCountries.includes(country) ? country : "Other") : "Undisclosed",
        sector: r["Sector"] || "Undisclosed",
        certainty: r["Certainty"] || "Undisclosed",
        owner: r["Owner"] || "Undisclosed",
      },
      url: r["Source 1"] || undefined,
      note: noteBits.join(" · ") || undefined,
    });
  }
  records.sort((a, b) => (a.date < b.date ? 1 : -1));
  writeFileSync(join(OUT, "compute.json"), JSON.stringify({ retrieved: today, sourceUrl: url, meta, records }, null, 1));
  console.log(`compute: ${records.length} records (of ${meta.total} rows; ${meta.noDate} dropped for no date, ${meta.noLocation} unlocated, ${meta.noValue} without H100e)`);
}

/* ---------------- Mapping 2: AI investment ---------------- */

// The funding-rounds CSV has no location columns. The companies are few and
// their headquarters are public knowledge; we add HQ coordinates OURSELVES so
// the rounds can sit on the map, and the methodology says exactly that.
const HQ = {
  OpenAI:            { lat: 37.7620, lng: -122.4103, place: "San Francisco, US" },
  Anthropic:         { lat: 37.7876, lng: -122.3946, place: "San Francisco, US" },
  xAI:               { lat: 37.4419, lng: -122.1430, place: "Palo Alto, US" },
  "Mistral AI":      { lat: 48.8566, lng: 2.3522,   place: "Paris, France" },
  "Z.ai (Zhipu)":    { lat: 39.9906, lng: 116.3064, place: "Beijing, China" },
  MiniMax:           { lat: 31.2304, lng: 121.4737, place: "Shanghai, China" },
  DeepSeek:          { lat: 30.2741, lng: 120.1551, place: "Hangzhou, China" },
  "Safe Superintelligence": { lat: 37.7749, lng: -122.4194, place: "San Francisco, US" },
  "Thinking Machines Lab":  { lat: 37.7749, lng: -122.4194, place: "San Francisco, US" },
  "Meta AI":         { lat: 37.4530, lng: -122.1817, place: "Menlo Park, US" },
};

async function harvestInvestment() {
  const url = "https://epoch.ai/data/ai_companies_funding_rounds.csv";
  const rows = parseCSV(await fetchText(url));
  const meta = { total: rows.length, noDate: 0, noValue: 0, noLocation: 0, excludedByEpoch: 0 };
  const records = [];
  for (const r of rows) {
    if (!r["Company"]) continue;
    if (r["Exclude from graph view"]) { meta.excludedByEpoch++; continue; }
    // closed rounds carry a close date; announced-but-open deals only a report date
    const date = r["Close date"] || r["Report date"];
    if (!date) { meta.noDate++; continue; }
    const equity = num(r["Funding (equity)"]);
    if (equity === null) meta.noValue++;
    const hq = HQ[r["Company"]];
    if (!hq) meta.noLocation++;
    const val = num(r["Valuation (post-money)"]);
    const noteBits = [];
    if (val !== null) noteBits.push(`valued at $${(val / 1e9).toFixed(0)}B post-money`);
    if (num(r["Funding (debt)"]) !== null) noteBits.push(`+$${(num(r["Funding (debt)"]) / 1e9).toFixed(1)}B debt`);
    if (!r["Close date"]) noteBits.push("dated by report date — not yet closed");
    records.push({
      id: slug(`${r["Company"]}-${r["Id"]}`),
      name: `${r["Company"]} — ${r["Id"]}`,
      date,
      ...(hq ? { lat: hq.lat, lng: hq.lng, place: hq.place } : {}),
      value: equity,
      dims: {
        company: r["Company"],
        status: r["Status"] || "Undisclosed",
        type: (r["Type"] || "Undisclosed").split(",")[0],
        confidence: r["Confidence"] || "Undisclosed",
      },
      url: r["Source 1"] || undefined,
      note: noteBits.join(" · ") || undefined,
    });
  }
  records.sort((a, b) => (a.date < b.date ? 1 : -1));
  writeFileSync(join(OUT, "investment.json"), JSON.stringify({ retrieved: today, sourceUrl: url, meta, records }, null, 1));
  console.log(`investment: ${records.length} records (of ${meta.total} rows; ${meta.noDate} dropped for no date, ${meta.noLocation} without a mapped HQ, ${meta.excludedByEpoch} excluded by Epoch's own graph flag)`);
}

await harvestCompute();
await harvestInvestment();
