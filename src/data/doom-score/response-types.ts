/**
 * The response: what governments, intergovernmental bodies and the labs have
 * done about AI risk. One row per action, each read in its primary text where
 * that is open. `namesCatastrophic` is true only when the text itself names
 * catastrophic, existential, extinction or loss-of-control risk, and `quote`
 * then carries those words exactly.
 */
export type ResponseKind = "law" | "bill" | "executive" | "declaration" | "commitment" | "institute" | "standard" | "hearing" | "treaty" | "strategy";
export type ResponseStatus = "proposed" | "passed" | "in-force" | "signed" | "vetoed" | "revoked" | "launched" | "held";

export interface ResponseAction {
  id: string;
  date: string;
  jurisdiction: string;
  actor: string;
  kind: ResponseKind;
  status: ResponseStatus;
  title: string;
  summary: string;
  namesCatastrophic: boolean;
  quote: string;
  url: string;
  outlet: string;
  verified: boolean;
}

export const KIND_LABEL_R: Record<ResponseKind, string> = {
  law: "Law",
  bill: "Bill",
  executive: "Executive action",
  declaration: "Declaration",
  commitment: "Commitment",
  institute: "Institute",
  standard: "Standard or framework",
  hearing: "Hearing",
  treaty: "Treaty",
  strategy: "Strategy",
};

/** Three plain outcomes for colour: it took effect, it is still only proposed or talked about, it was stopped. */
export const OUTCOME: Record<ResponseStatus, "effect" | "pending" | "stopped"> = {
  "in-force": "effect",
  passed: "effect",
  signed: "effect",
  launched: "effect",
  held: "effect",
  proposed: "pending",
  vetoed: "stopped",
  revoked: "stopped",
};

import { regionOf } from "./response-places";

/** The rows of the timeline, in reading order. */
const R = (id: string) => (j: string) => regionOf(j) === id;
export const GROUPS: { id: string; label: string; match: (j: string) => boolean }[] = [
  { id: "africa", label: "Africa", match: R("africa") },
  { id: "americas", label: "Americas", match: R("americas") },
  { id: "asia", label: "Asia", match: R("asia") },
  { id: "europe", label: "Europe", match: R("europe") },
  { id: "oceania", label: "Oceania", match: R("oceania") },
  { id: "intl", label: "International bodies", match: R("intl") },
  { id: "industry", label: "AI companies", match: R("industry") },
];
