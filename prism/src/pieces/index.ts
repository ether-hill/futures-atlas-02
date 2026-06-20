// The piece registry list. Order = gallery order. New pieces append here.

import type { PieceFactory } from "../core/piece";
import { createCurlFlow } from "./curlFlow";
import { createDomainWarp } from "./domainWarp";
import { createPlasma } from "./plasma";
import { createVoronoiCells } from "./voronoiCells";
import { createWaveInterference } from "./waveInterference";
import { createPhaseField } from "./phaseField";

export const PIECES: PieceFactory[] = [
  createDomainWarp,
  createPhaseField,
  createWaveInterference,
  createPlasma,
  createVoronoiCells,
  createCurlFlow,
  // Canvas2D: strangeAttractor, phyllotaxis, moireLattice, particleConstellation, superformula, truchetWeave, differentialGrowth
  // feedback: reactionDiffusion, physarum, cymatics
  // three: particleNebula, latticeWaves
];
