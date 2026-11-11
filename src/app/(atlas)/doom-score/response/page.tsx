import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { RESPONSE } from "@/data/doom-score/response";
import { GROUPS, KIND_LABEL_R, OUTCOME } from "@/data/doom-score/response-types";
import { ALL_STATES, placeOf } from "@/data/doom-score/response-places";
import { Panel } from "../dashboard/Panel";
import { DoomHeader } from "../_hub/DoomHeader";
import { Reveal } from "./Reveal";
import { ResponseTimeline } from "./ResponseTimeline";
import { ResponseBrowser } from "./ResponseBrowser";
import "../doom-score.css";

export const metadata: Metadata = {
  title: "Response. The Doom Score. Futures Atlas",
  description: "What governments, international bodies and the AI labs have done about AI risk: laws, executive actions, summits, institutes and commitments, each from its primary text.",
  robots: { index: false },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d: string) => (d.length === 4 ? d : d.length === 7 ? `${MONTHS[+d.slice(5) - 1]} ${d.slice(0, 4)}` : `${+d.slice(8, 10)} ${MONTHS[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`);
const tOf = (d: string) => +d.slice(0, 4) + (d.length >= 7 ? (+d.slice(5, 7) - 1) / 12 : 0.5) + (d.length >= 10 ? (+d.slice(8, 10) - 1) / 365 : d.length === 7 ? 0.04 : 0);
const STATUS_WORD: Record<string, string> = { "in-force": "In force", passed: "Passed", signed: "Signed", launched: "Launched", held: "Held", proposed: "Proposed", vetoed: "Vetoed", revoked: "Revoked" };
const OUT_COLOUR = { effect: "var(--ds-cat-5)", pending: "var(--muted)", stopped: "var(--ds-cat-2)" } as const;
const OUT_LABEL = { effect: "took effect: passed, signed, in force, launched or held", pending: "proposed only", stopped: "vetoed or revoked" } as const;

export default function ResponsePage() {
  const rows = RESPONSE.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  const naming = rows.filter((r) => r.namesCatastrophic).length;
  const jur = new Set(rows.filter((r) => !["INDUSTRY", "INTL", "EU"].includes(r.jurisdiction)).map((r) => (r.jurisdiction.startsWith("US-") ? "US" : r.jurisdiction))).size;
  const present = new Set(rows.map((r) => (r.jurisdiction.startsWith("US-") ? "US" : r.jurisdiction)));
  const covered = ALL_STATES.filter((c) => present.has(c)).length;
  const missing = ALL_STATES.filter((c) => !present.has(c)).map((c) => placeOf(c)[1]).sort((a, b) => a.localeCompare(b));
  const stopped = rows.filter((r) => OUTCOME[r.status] === "stopped").length;
  return (
    <Container className="py-10">
      <Reveal />
      <DoomHeader compact title="The response" lead="What governments, international bodies and the AI labs have done about AI risk: laws, executive actions, summits, safety institutes and commitments, each read in its own text." />
      <dl className="dh-stats rs-stats">
        <div>
          <dt>Actions on the record</dt>
          <dd>{rows.length}</dd>
        </div>
        <div>
          <dt>Name catastrophic or existential risk in their own text</dt>
          <dd>{naming}</dd>
        </div>
        <div>
          <dt>Countries that have acted</dt>
          <dd>{jur}</dd>
        </div>
        <div>
          <dt>Vetoed or revoked</dt>
          <dd>{stopped}</dd>
        </div>
      </dl>
      <details className="rs-coverage">
        <summary>
          {covered} of the world&rsquo;s {ALL_STATES.length} countries are on the record. No action found yet for {missing.length}.
        </summary>
        <p>
          We searched every country, not only the large ones, but the search ran out before every small state was checked, and some government websites block automated reading. A country listed here has no action on the record yet. That does not mean it has done nothing.
        </p>
        <p className="rs-coverage-list">{missing.join(", ")}</p>
      </details>
      <ResponseBrowser rows={rows}>
      <div className="ds-grid12 rs-grid">
        <div id="who-acted" className="rs-anchor" style={{ gridColumn: "span 12" }} />
        <Panel span={12} title="Who acted, and when" caption="Every action on the record, one row per continent, in alphabetical order, then international bodies and AI companies. Continents follow the UN regions, which put the Middle East in Asia. Filled: it took effect. Hollow: proposed only. Orange: vetoed or revoked. A ring around a mark: the text itself names catastrophic or existential risk. Hover a mark to see what it is; click it for a link to its entry.">
          <ResponseTimeline rows={rows} />
          <ul className="ds-key">
            {(["effect", "pending", "stopped"] as const).map((o) => (
              <li key={o}>
                <i style={{ background: o === "pending" ? "transparent" : OUT_COLOUR[o], border: `2px solid ${OUT_COLOUR[o]}` }} />
                {OUT_LABEL[o]}
              </li>
            ))}
            <li>
              <i style={{ background: "transparent", border: "1.5px solid var(--text)", borderRadius: "50%" }} />
              names catastrophic or existential risk
            </li>
          </ul>
        </Panel>
      </div>
      </ResponseBrowser>
    </Container>
  );
}
