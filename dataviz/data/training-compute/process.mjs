// Training compute of notable AI models.
// raw/notable_ai_models.csv (Epoch AI, untouched) -> clean.csv
//
// Keeps every notable model that has a training compute estimate and a
// confidence status. Adds Epoch's own published 90% interval for that status
// (docs: /data/ai-models-documentation/estimation, saved as raw/doc-estimation.html):
//   Confident ±3x, Likely ±10x, Speculative ±31x.
// No values are changed, rounded or filled in.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv, toCsv } from "../../templates/csv.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const raw = parseCsv(readFileSync(join(here, "raw/notable_ai_models.csv"), "utf8"));

const CI_FACTOR = { Confident: 3, Likely: 10, Speculative: 31 };

function decimalYear(iso) {
  const d = new Date(iso + "T00:00:00Z");
  const y = d.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  return y + (d - start) / (end - start);
}

const clean = raw
  .filter((r) => r["Training compute (FLOP)"].trim() !== "" && CI_FACTOR[r.Confidence])
  .map((r) => {
    const flop = Number(r["Training compute (FLOP)"]);
    const k = CI_FACTOR[r.Confidence];
    return {
      model: r.Model.trim(),
      organization: r.Organization.trim(),
      country: r["Country (of organization)"].trim(),
      domain: r.Domain.trim(),
      publication_date: r["Publication date"],
      year: decimalYear(r["Publication date"]).toFixed(4),
      training_compute_flop: flop,
      confidence: r.Confidence,
      ci90_factor: k,
      ci90_low_flop: flop / k,
      ci90_high_flop: flop * k,
      frontier: r["Frontier model"] === "True" ? 1 : 0,
    };
  })
  .filter((r) => Number.isFinite(r.training_compute_flop) && r.training_compute_flop > 0)
  .sort((a, b) => a.publication_date.localeCompare(b.publication_date));

writeFileSync(join(here, "clean.csv"), toCsv(clean));

// Every frontier record, INCLUDING those with no compute estimate. The
// disclosure slide counts these: a model Epoch cannot estimate at all is the
// far end of "how sure are we", and dropping it would understate the point.
const frontier = raw
  .filter((r) => r["Frontier model"] === "True")
  .map((r) => ({
    model: r.Model.trim(),
    organization: r.Organization.trim(),
    publication_date: r["Publication date"],
    year: decimalYear(r["Publication date"]).toFixed(4),
    training_compute_flop: r["Training compute (FLOP)"].trim(),
    confidence: r["Training compute (FLOP)"].trim() === "" ? "No estimate" : r.Confidence,
  }))
  .sort((a, b) => a.publication_date.localeCompare(b.publication_date));
writeFileSync(join(here, "clean-frontier.csv"), toCsv(frontier));
console.log(`  frontier records ${frontier.length}, of which no compute estimate ${frontier.filter((r) => r.confidence === "No estimate").length}`);

const n = (f) => clean.filter(f).length;
console.log(`training-compute: ${clean.length} models (from ${raw.length} notable rows)`);
console.log(`  frontier ${n((r) => r.frontier)}, since 2010 ${n((r) => r.year >= 2010)}`);
console.log(`  confident ${n((r) => r.confidence === "Confident")}, likely ${n((r) => r.confidence === "Likely")}, speculative ${n((r) => r.confidence === "Speculative")}`);
console.log(`  dates ${clean[0].publication_date} .. ${clean.at(-1).publication_date}`);
