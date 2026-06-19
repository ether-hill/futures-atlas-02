// The system registry list. Order = dashboard order. New systems append here.

import type { GenerativeSystem } from "../harness/GenerativeSystem";
import { complexViewer } from "./complexViewer";

export const SYSTEMS: GenerativeSystem[] = [
  complexViewer,
  // M1: quantumWalk2D, chladni, groverLandscape
  // M2: schrodingerSSF, blochMajorana, decoherence
];
