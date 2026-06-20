// The piece registry list. Order = gallery order. New pieces append here.

import type { PieceFactory } from "../core/piece";
import { createDomainWarp } from "./domainWarp";
import { createPhaseField } from "./phaseField";
import { createWaveInterference } from "./waveInterference";
import { createPlasma } from "./plasma";
import { createVoronoiCells } from "./voronoiCells";
import { createPhyllotaxis } from "./phyllotaxis";
import { createSuperformula } from "./superformula";
import { createMoireLattice } from "./moireLattice";
import { createTruchetWeave } from "./truchetWeave";
import { createParticleConstellation } from "./particleConstellation";
import { createStrangeAttractor } from "./strangeAttractor";
import { createDifferentialGrowth } from "./differentialGrowth";
import { createCurlFlow } from "./curlFlow";

export const PIECES: PieceFactory[] = [
  // GPU shader fields (banner sweet spot — ~zero CPU)
  createDomainWarp,
  createPhaseField,
  createWaveInterference,
  createPlasma,
  createVoronoiCells,
  // Canvas2D
  createPhyllotaxis,
  createSuperformula,
  createMoireLattice,
  createTruchetWeave,
  createParticleConstellation,
  createStrangeAttractor,
  createDifferentialGrowth,
  createCurlFlow,
  // feedback: reactionDiffusion, physarum, cymatics
  // three: particleNebula, latticeWaves
];
