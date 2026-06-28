// Shared constants for the Trajectories field.
// A non-commercial homage to Jeongho Park's "Collective Trajectories" (CC BY-NC 4.0).

export const SPHERE_R = 8;

export interface Params {
  strands: number; // number of filaments
  points: number; // samples per filament (center → surface)
  flow: number; // outward pulse speed
  shimmer: number; // lateral ripple speed
  amp: number; // lateral noise amplitude (× radius)
  glow: number; // bloom strength
  autorotate: number; // rad/s
}

export const DEFAULTS: Params = {
  strands: 1300,
  points: 44,
  flow: 0.13,
  shimmer: 0.5,
  amp: 1.7,
  glow: 0.62,
  autorotate: 0.05,
};

export const STRAND_RANGE = { min: 200, max: 4000 } as const;

// luminous palette: warm core → cool shell (linear-ish RGB, amplified by bloom)
export const COLORS = {
  bg: 0x05060c,
  core: [1.0, 0.82, 0.5] as [number, number, number],
  tip: [0.36, 0.66, 1.0] as [number, number, number],
  ring: [0.55, 0.82, 1.0] as [number, number, number],
  orb: [0.6, 0.85, 1.0] as [number, number, number],
};
