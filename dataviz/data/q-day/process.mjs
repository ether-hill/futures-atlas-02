// Q-Day: GRI / evolutionQ Quantum Threat Timeline, expert likelihood bins.
//
// Reads  raw/transcription.csv  (literal transcription of the reports' printed tables and labels)
//        raw/corrections.csv    (documented corrections of printing errors, with evidence)
// Writes clean.csv               tidy bin counts, one row per edition x horizon x bucket
//        clean-averages.csv      optimistic / pessimistic / mid-point averages, recomputed from the
//                                counts with the report's own method, next to the values the reports print
//        clean-point-estimates.csv  the 2025 n=15 point-estimate quartiles, as printed
//
// Run: node process.mjs   (no dependencies). Fails loudly if any check does not hold.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const toCsv = (rows) => {
  const cols = Object.keys(rows[0]);
  const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n";
};

// The seven bins of the key question (2025 report, Appendix A.3, p68) and the
// cumulative-probability bounds the authors assign to each (Appendix A.4, p71).
// bucket_low = "pessimistic assignment", bucket_high = "optimistic assignment".
const BINS = [
  { bucket: "<1%",  label: "Extremely unlikely (< 1% chance)",                low: 0,  high: 1 },
  { bucket: "<5%",  label: "Very unlikely (< 5% chance)",                     low: 1,  high: 5 },
  { bucket: "<30%", label: "Unlikely (< 30% chance)",                         low: 5,  high: 30 },
  { bucket: "~50%", label: "Neither likely nor unlikely (about 50% chance)",  low: 30, high: 70 },
  { bucket: ">70%", label: "Likely (> 70% chance)",                           low: 70, high: 95 },
  { bucket: ">95%", label: "Very likely (> 95% chance)",                      low: 95, high: 99 },
  { bucket: ">99%", label: "Extremely likely (> 99% chance)",                 low: 99, high: 100 },
];
const HORIZONS = [5, 10, 15, 20, 30];

const raw = parseCsv(readFileSync(join(here, "raw/transcription.csv"), "utf8"));
const corrections = parseCsv(readFileSync(join(here, "raw/corrections.csv"), "utf8"));

const key = (r) => [r.edition, r.kind, r.horizon_years, r.bucket].join("|");
const fixes = new Map(corrections.map((c) => [key(c), c]));

const failures = [];
const value = (r) => {
  const fix = fixes.get(key(r));
  if (fix) {
    if (String(fix.value_as_printed) !== String(r.value_as_printed))
      failures.push(`correction for ${key(r)} expects printed ${fix.value_as_printed}, found ${r.value_as_printed}`);
    return { v: Number(fix.corrected_value), corrected: true };
  }
  return { v: Number(r.value_as_printed), corrected: false };
};

const editions = [...new Set(raw.map((r) => r.edition))].sort();
const N = Object.fromEntries(
  raw.filter((r) => r.kind === "n_respondents").map((r) => [r.edition, Number(r.value_as_printed)]),
);

// ---- clean.csv ---------------------------------------------------------
const clean = [];
const counts = {}; // counts[edition][horizon][bucket]
for (const ed of editions) {
  counts[ed] = {};
  for (const h of HORIZONS) {
    counts[ed][h] = {};
    let sum = 0;
    for (const b of BINS) {
      const r = raw.find((x) => x.edition === ed && x.kind === "count" && Number(x.horizon_years) === h && x.bucket === b.bucket);
      if (!r) { failures.push(`missing count ${ed} ${h}y ${b.bucket}`); continue; }
      const { v, corrected } = value(r);
      counts[ed][h][b.bucket] = v;
      sum += v;
      clean.push({
        edition: ed,
        horizon_years: h,
        bucket: b.bucket,
        bucket_label: b.label,
        bucket_low: b.low,
        bucket_high: b.high,
        n_experts: v,
        n_respondents: N[ed],
        share_of_respondents: (v / N[ed]).toFixed(4),
        source_page: r.pdf_page,
        corrected_from_print: corrected ? r.value_as_printed : "",
      });
    }
    // Check 1: every horizon's bins sum to the edition's stated sample size.
    if (sum !== N[ed]) failures.push(`${ed} ${h}y: bins sum to ${sum}, report states N=${N[ed]}`);
  }
}

// ---- clean-averages.csv ------------------------------------------------
// The report's method (2025 Appendix A.4, p71): assign each response the lowest
// (pessimistic) or highest (optimistic) cumulative probability compatible with
// its bin, then take the plain mean across respondents. Mid-point = mean of the two.
const stated = (ed, kind, h) => {
  const r = raw.find((x) => x.edition === ed && x.kind === kind && Number(x.horizon_years) === h);
  return r ? { v: Number(r.value_as_printed), page: r.pdf_page, ref: r.table_or_figure, crossCheck: r.note === "cross-check only" } : null;
};
// A mismatch against a primary table fails the run. A mismatch against a
// "cross-check only" label (the 2025 report's Figure 4 re-plot of older waves)
// is reported and written to the output, because the counts in each edition's
// own appendix are the primary record. See METHOD.md, "Known discrepancies".
const warnings = [];
const averages = [];
for (const ed of editions) {
  for (const h of HORIZONS) {
    const c = counts[ed][h];
    const mean = (pick) => BINS.reduce((s, b) => s + c[b.bucket] * pick(b), 0) / N[ed];
    const pess = mean((b) => b.low);
    const opt = mean((b) => b.high);
    const sp = stated(ed, "avg_pessimistic_pct", h);
    const so = stated(ed, "avg_optimistic_pct", h);
    const sm = stated(ed, "avg_midpoint_pct", h);
    const mismatches = [];
    // Check 2: recomputed averages round to the values the report prints (labels are whole percents).
    for (const [name, calc, s] of [["pessimistic", pess, sp], ["optimistic", opt, so], ["midpoint", (pess + opt) / 2, sm]]) {
      if (s && Math.abs(calc - s.v) > 0.5 + 1e-9) {
        const msg = `${ed} ${h}y ${name}: recomputed ${calc.toFixed(2)} vs printed ${s.v} (2025 report p${s.page})`;
        (s.crossCheck ? warnings : failures).push(msg);
        mismatches.push(name);
      }
    }
    averages.push({
      edition: ed,
      horizon_years: h,
      n_respondents: N[ed],
      avg_pessimistic_pct: pess.toFixed(2),
      avg_optimistic_pct: opt.toFixed(2),
      avg_midpoint_pct: ((pess + opt) / 2).toFixed(2),
      printed_pessimistic_pct: sp ? sp.v : "",
      printed_optimistic_pct: so ? so.v : "",
      printed_midpoint_pct: sm ? sm.v : "",
      printed_where: sp ? `2025 report p${sp.page}, ${sp.ref.split(";")[0]}` : "",
      printed_mismatch: mismatches.join(" "),
    });
  }
}

// ---- clean-point-estimates.csv ------------------------------------------
const point = HORIZONS.map((h) => {
  const g = (k) => stated("2025", k, h)?.v ?? "";
  return { edition: "2025", horizon_years: h, n_respondents: 15, q1_pct: g("point_q1_pct"), median_pct: g("point_median_pct"), mean_pct: g("point_mean_pct"), q3_pct: g("point_q3_pct"), source: "2025 report p31, Figure 18" };
});

if (failures.length) {
  console.error("CHECKS FAILED:\n  " + failures.join("\n  "));
  process.exit(1);
}

writeFileSync(join(here, "clean.csv"), toCsv(clean));
writeFileSync(join(here, "clean-averages.csv"), toCsv(averages));
writeFileSync(join(here, "clean-point-estimates.csv"), toCsv(point));
console.log(`ok: ${clean.length} bin rows, ${averages.length} average rows, ${point.length} point-estimate rows`);
console.log(`    editions ${editions.join(", ")}; N = ${editions.map((e) => N[e]).join(", ")}`);
console.log(`    corrections applied: ${corrections.length}`);
if (warnings.length) console.log("WARNINGS (cross-check labels that do not match the counts):\n  " + warnings.join("\n  "));
