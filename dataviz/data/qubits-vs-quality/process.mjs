// qubits-vs-quality: raw/transcription.csv -> clean.csv
//
// raw/transcription.csv is the ONE hand step in this piece: each row copies a
// value literally as printed in a saved source document (raw/), with a locator.
// Everything below is mechanical. No number is typed here.
//
// Run: node process.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// Minimal RFC 4180 CSV parser (quoted fields, doubled quotes, commas, newlines).
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x !== ""));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Normalise the unicode minus and multiplication signs used in the papers.
const norm = (s) => s.replace(/[−–]/g, "-").replace(/×/g, "x").replace(/\s+/g, "");
// Drop a parenthesised uncertainty in the last digits: "1.84(5)" -> "1.84".
const stripUnc = (s) => s.replace(/\(\d+\)/g, "");

// Round away float noise (0.0062 not 0.006200000000000001) without changing
// the value at the precision it was printed.
const tidy = (x) => (x === null ? null : Number(x.toPrecision(10)));

function parseError(literal, form) {
  if (!literal) return { error: null, lo: null, hi: null };
  const s = stripUnc(norm(literal));
  let m;
  switch (form) {
    case "percent_error":
      m = s.match(/^([\d.]+)%$/);
      return m && { error: tidy(+m[1] / 100), lo: null, hi: null };
    case "permille_error":
      m = s.match(/^([\d.]+)‰$/);
      return m && { error: tidy(+m[1] / 1000), lo: null, hi: null };
    case "sci_error":
      m = s.match(/^([\d.]+)x10-(\d+)$/);
      return m && { error: tidy(+m[1] * 10 ** -+m[2]), lo: null, hi: null };
    case "percent_fidelity":
      m = s.match(/^([\d.]+)%$/);
      return m && { error: tidy(1 - +m[1] / 100), lo: null, hi: null };
    case "percent_fidelity_range": {
      // "99.3%-99.5%": a range is kept as a range, never collapsed to a point.
      m = s.match(/^([\d.]+)%-([\d.]+)%$/);
      if (!m) return null;
      const a = tidy(1 - +m[1] / 100), b = tidy(1 - +m[2] / 100);
      return { error: null, lo: Math.min(a, b), hi: Math.max(a, b) };
    }
  }
  return null;
}

// Harmonised column, documented in METHOD.md. For two qubits (d = 4) the
// average gate infidelity r and the Pauli (process) error e_P are related by
// r = d/(d+1) * e_P = 0.8 * e_P. Only the Pauli rows are converted; rows whose
// definition we cannot pin down are passed through and flagged.
function harmonise(error, kind) {
  if (error === null) return { value: null, note: "" };
  if (/^Pauli error/i.test(kind)) return { value: tidy(error * 0.8), note: "converted: Pauli error x 0.8" };
  if (/average infidelity|average error/i.test(kind)) return { value: error, note: "already average infidelity" };
  return { value: error, note: "passed through: definition not converted" };
}

const raw = parseCsv(readFileSync(join(here, "raw/transcription.csv"), "utf8"));
const out = [];
const problems = [];

for (const r of raw) {
  const parsed = parseError(r.twoq_literal, r.twoq_literal_form);
  if (r.twoq_literal && !parsed) problems.push(`${r.id}: could not parse twoq_literal "${r.twoq_literal}" as ${r.twoq_literal_form}`);
  const { error, lo, hi } = parsed ?? { error: null, lo: null, hi: null };
  const h = harmonise(error, r.twoq_error_kind);

  let logicalErr = null;
  if (r.logical_error_literal) {
    const m = stripUnc(norm(r.logical_error_literal)).match(/^([\d.]+)%$/);
    if (!m) problems.push(`${r.id}: could not parse logical_error_literal "${r.logical_error_literal}"`);
    else logicalErr = tidy(+m[1] / 100);
  }

  const q = Number(r.physical_qubits);
  if (!Number.isInteger(q) || q <= 0) problems.push(`${r.id}: physical_qubits "${r.physical_qubits}" is not a positive integer`);

  out.push({
    id: r.id,
    record_type: r.record_type,
    system: r.system,
    organisation: r.organisation,
    modality: r.modality,
    date_first_public: r.date_first_public,
    year: r.date_first_public.slice(0, 4),
    physical_qubits: q,
    qubits_basis: r.qubits_basis,
    twoq_error: error,
    twoq_error_lo: lo,
    twoq_error_hi: hi,
    twoq_errors_per_1000: error === null ? null : tidy(error * 1000),
    twoq_error_kind: r.twoq_error_kind,
    twoq_statistic: r.twoq_statistic,
    twoq_benchmark: r.twoq_benchmark,
    twoq_simultaneous: r.twoq_simultaneous,
    twoq_avg_infidelity_harmonised: h.value,
    harmonisation_note: h.note,
    // A logical demo with no gate figure of its own points at its device row
    // (Willow); "no" is reserved for a device whose maker published none.
    twoq_published: error !== null || lo !== null ? "yes" : r.record_type === "logical_demo" ? "n/a (see device row)" : "no",
    logical_qubits: r.logical_qubits === "" ? null : Number(r.logical_qubits),
    logical_code: r.logical_code,
    logical_error: logicalErr,
    logical_error_unit: r.logical_error_unit,
    below_threshold: r.below_threshold,
    source_type: r.source_type,
    citation: r.source_org,
    doi: r.doi,
    url: r.url,
    locator: r.locator,
    raw_file: r.raw_file,
    access_date: r.access_date,
  });
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

out.sort((a, b) => a.date_first_public.localeCompare(b.date_first_public) || a.id.localeCompare(b.id));
const cols = Object.keys(out[0]);
writeFileSync(join(here, "clean.csv"), [cols.join(","), ...out.map((o) => cols.map((c) => csvCell(o[c])).join(","))].join("\n") + "\n");

const count = (v) => out.filter((o) => o.twoq_published === v).length;
console.log(`clean.csv: ${out.length} rows (${count("yes")} with a published two-qubit error, ${count("no")} devices without one, ${out.length - count("yes") - count("no")} logical demo pointing at its device row)`);
for (const o of out) {
  const e = o.twoq_error !== null ? `${(o.twoq_error * 100).toFixed(3)}%` : o.twoq_error_lo !== null ? `${(o.twoq_error_lo * 100).toFixed(1)}-${(o.twoq_error_hi * 100).toFixed(1)}%` : o.twoq_published === "no" ? "not published" : "(logical demo)";
  console.log(`  ${o.year}  ${String(o.physical_qubits).padStart(5)} qubits  2Q err ${e.padEnd(14)} ${o.system}`);
}
