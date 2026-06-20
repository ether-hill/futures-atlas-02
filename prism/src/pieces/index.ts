// The piece registry list. Order = gallery order. New pieces append here.

import type { PieceFactory } from "../core/piece";
import { createCurlFlow } from "./curlFlow";

export const PIECES: PieceFactory[] = [
  createCurlFlow,
  // M1: strangeAttractor, phyllotaxis, truchetWeave, differentialGrowth,
  //     moireLattice, particleConstellation, superformula
  // M2: domainWarp, reactionDiffusion, physarum, waveInterference, phaseField,
  //     plasma, voronoiCells, cymatics
  // M3: particleNebula, latticeWaves
];
