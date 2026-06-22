// The piece registry list. Order = gallery order. New pieces append here.

import type { PieceFactory } from "../core/piece";
import { createDomainWarp } from "./domainWarp";
import { createWaveInterference } from "./waveInterference";
import { createPlasma } from "./plasma";
import { createVoronoiCells } from "./voronoiCells";
import { createPhyllotaxis } from "./phyllotaxis";
import { createSuperformula } from "./superformula";
import { createMoireLattice } from "./moireLattice";
import { createParticleConstellation } from "./particleConstellation";
import { createStrangeAttractor } from "./strangeAttractor";
import { createDifferentialGrowth } from "./differentialGrowth";
import { createCurlFlow } from "./curlFlow";
import { createParticleNebula } from "./particleNebula";
import { createLatticeWaves } from "./latticeWaves";
import { createPhysarum } from "./physarum";
import { createBoids } from "./boids";
import { createFieldDynamics } from "./fieldDynamics";
import { createOrganicTurbulence } from "./organicTurbulence";
import { createReactionDiffusion } from "./reactionDiffusion";

export const PIECES: PieceFactory[] = [
  // GPU shader fields (banner sweet spot — ~zero CPU)
  createDomainWarp,
  createWaveInterference,
  createPlasma,
  createVoronoiCells,
  // three.js (3D)
  createParticleNebula,
  createLatticeWaves,
  // Agent / particle systems
  createPhysarum,
  createBoids,
  createFieldDynamics,
  createOrganicTurbulence,
  createReactionDiffusion,
  // Canvas2D
  createPhyllotaxis,
  createSuperformula,
  createMoireLattice,
  createParticleConstellation,
  createStrangeAttractor,
  createDifferentialGrowth,
  createCurlFlow,
];
