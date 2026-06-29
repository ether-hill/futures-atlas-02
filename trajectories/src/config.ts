// Shared constants + the full parameter set for the Trajectories field.
// Control names/ranges mirror Jeongho Park's "Collective Trajectories" GUI
// (CC BY-NC 4.0). Implementation is original.

export interface Params {
  // field
  strands: number;
  radius: number;
  curl: number;
  freq: number;
  shimmer: number;
  flow: number;
  pulse: number;
  tipPow: number;
  lineBase: number;
  opacity: number;
  extendFrac: number;
  extendReach: number;
  growDur: number;
  growSpread: number;
  glowStrength: number;
  glowSize: number;
  shellStrength: number;
  shellSize: number;
  audioReact: number;
  autoRotate: boolean;
  // core
  coreStrength: number;
  coreRadius: number;
  coreNoise: number;
  coreFreq: number;
  // fog
  fogStrength: number;
  fogNear: number;
  fogFar: number;
  // depth of field (depth-based dimming)
  dofDim: number;
  focus: number;
  focusRange: number;
  // surface ripple
  rippleStrength: number;
  rippleSpan: number;
  ringSpacing: number;
  rippleFade: number;
}

export const POINTS_PER_STRAND = 64;
export const INNER_R = 0.95; // strands emanate from the orb surface

export const DEFAULTS: Params = {
  strands: 1400,
  radius: 5,
  curl: 1.0,
  freq: 1.0,
  shimmer: 0.09,
  flow: 0.5,
  pulse: 3,
  tipPow: 1.6,
  lineBase: 0.12,
  opacity: 1.0,
  extendFrac: 0.16,
  extendReach: 1.4,
  growDur: 1.2,
  growSpread: 3.0,
  glowStrength: 0.7,
  glowSize: 0.012,
  shellStrength: 0.0,
  shellSize: 0.02,
  audioReact: 0.0,
  autoRotate: true,
  coreStrength: 0.85,
  coreRadius: 0.95,
  coreNoise: 0.28,
  coreFreq: 1.4,
  fogStrength: 0.0,
  fogNear: 4,
  fogFar: 26,
  dofDim: 0.0,
  focus: 17,
  focusRange: 7,
  rippleStrength: 0.85,
  rippleSpan: 0.6,
  ringSpacing: 0.12,
  rippleFade: 1.7,
};

// GUI slider bounds (label, min, max, step) — keyed by Params field.
export const RANGES: Record<string, [number, number, number]> = {
  strands: [100, 5000, 1],
  radius: [2, 7, 0.05],
  curl: [0, 2, 0.01],
  freq: [0.1, 3, 0.01],
  shimmer: [0, 0.4, 0.001],
  flow: [0, 1.5, 0.01],
  pulse: [0, 10, 0.1],
  tipPow: [0.3, 5, 0.01],
  lineBase: [0, 1, 0.01],
  opacity: [0.05, 2, 0.01],
  extendFrac: [0, 1, 0.01],
  extendReach: [1, 3, 0.01],
  growDur: [0.1, 3, 0.01],
  growSpread: [0, 15, 0.01],
  glowStrength: [0, 1.5, 0.01],
  glowSize: [0, 0.03, 0.001],
  shellStrength: [0, 1, 0.01],
  shellSize: [0.005, 0.08, 0.001],
  audioReact: [0, 4, 0.01],
  coreStrength: [0, 1, 0.01],
  coreRadius: [0.3, 2.4, 0.01],
  coreNoise: [0, 0.6, 0.005],
  coreFreq: [0.5, 6, 0.05],
  fogStrength: [0, 1, 0.01],
  fogNear: [0, 20, 0.1],
  fogFar: [1, 40, 0.1],
  dofDim: [0, 1, 0.01],
  focus: [4, 30, 0.05],
  focusRange: [1, 14, 0.05],
  rippleStrength: [0, 2, 0.01],
  rippleSpan: [0.1, 1.5, 0.01],
  ringSpacing: [0.02, 0.4, 0.005],
  rippleFade: [0.2, 4, 0.05],
};

export const COLORS = {
  bg: 0x05060c,
  core: [1.0, 0.82, 0.5] as [number, number, number],
  tip: [0.36, 0.66, 1.0] as [number, number, number],
  ring: [0.55, 0.82, 1.0] as [number, number, number],
  orb: [0.6, 0.85, 1.0] as [number, number, number],
};
