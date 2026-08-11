/**
 * The fifteen speculative "equivalent documents".
 *
 * Everything under `grounding` is REAL — sourced statements and positions.
 * Everything else (docTitle, summary, excerpts, convergence/divergence) is
 * PREDICTIVE FICTION: research-based extrapolation of what each leader might
 * write, in their voice. The UI labels it as such everywhere it appears.
 */

export interface Leader {
  id: string;
  name: string;
  office: string;
  tradition: string;
  bio: string;
  docTitle: string;
  docTitleTranslation?: string;
  docType: string;
  summary: string;
  excerpts: string[];
  convergence: string[];
  divergence: string[];
  grounding: { claim: string; url: string }[];
  voiceNotes?: string;
}

import { ORTHODOX_ANGLICAN } from "./leaders/orthodox-anglican";
import { ISLAM_JUDAISM } from "./leaders/islam-judaism";
import { DHARMIC } from "./leaders/dharmic";
import { GLOBAL } from "./leaders/global";

export const LEADERS: Leader[] = [
  ...DHARMIC,
  ...ISLAM_JUDAISM,
  ...ORTHODOX_ANGLICAN,
  ...GLOBAL,
];
