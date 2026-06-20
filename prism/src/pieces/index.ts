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
import { createCymatics } from "./cymatics";
import { createReactionDiffusion } from "./reactionDiffusion";
import { createParticleNebula } from "./particleNebula";
import { createLatticeWaves } from "./latticeWaves";

export const PIECES: PieceFactory[] = [
  // GPU shader fields (banner sweet spot — ~zero CPU)
  createDomainWarp,
  createPhaseField,
  createWaveInterference,
  createCymatics,
  createPlasma,
  createVoronoiCells,
  // GPU feedback sim
  createReactionDiffusion,
  // three.js (3D)
  createParticleNebula,
  createLatticeWaves,
  // Canvas2D
  createPhyllotaxis,
  createSuperformula,
  createMoireLattice,
  createTruchetWeave,
  createParticleConstellation,
  createStrangeAttractor,
  createDifferentialGrowth,
  createCurlFlow,
];
