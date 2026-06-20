// The system registry list. Order = dashboard order.

import type { GenerativeSystem } from "../harness/GenerativeSystem";
import { complexViewer } from "./complexViewer";
import { quantumWalk2D } from "./quantumWalk2D";
import { chladni } from "./chladni";
import { groverLandscape } from "./groverLandscape";
import { schrodingerSSF } from "./schrodingerSSF";
import { blochMajorana } from "./blochMajorana";

export const SYSTEMS: GenerativeSystem[] = [
  schrodingerSSF,
  quantumWalk2D,
  chladni,
  groverLandscape,
  blochMajorana,
  complexViewer,
];
