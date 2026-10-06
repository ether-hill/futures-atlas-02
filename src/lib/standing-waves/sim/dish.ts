// PORTED VERBATIM from the cymatics repo (~/Documents/claude/cymatics,
// components/projects/cymatics-v2/dish.ts at 680a369, "Cymatics V2: pick the
// figure from the physics, checked against data"). Fix upstream first and
// re-copy, so the two do not drift. Only the chrome (engine.ts) was rewritten,
// as src/components/standing-waves/Simulator.tsx, on this site's tokens.
//
// The dish without the page: the water physics that picks the figure, and the
// WebGL2 renderer that draws it. Kept apart from the chrome in engine.ts so
// the picture can be rendered on its own.
//
// What the camera sees. The CymaScope photographs a small dish of water from
// above, lit by a ring of LEDs around the lens, and the figure it records is
// a web: fine bright threads along the standing wave's nodes — the spokes and
// rings where the surface never moves and the reflection holds steady — meeting
// in a white star at the centre. Between the threads the moving surface
// throws the ring's reflection about, a translucent haze with a little sharp
// lace in it. One hue, white where the light piles up, glare in the lens, and
// an outline that is the pattern's own, not the dish wall's.
//
// Which figure forms is physics, checked against measurements (see
// selectModes). Where the picture departs from the bench, for the look: only
// the lead's radial neighbours join it, the exposure is read up where the
// modes run quiet, and the star's spokes are carried on into the centre.

export const TAU = Math.PI * 2;

// ---- water physics ----------------------------------------------------------

const G = 9.81, SIGMA = 0.072, RHO = 1000;

/** Wavenumber (rad/m) of a surface wave at angular frequency w in water of depth h (m). */
export function dispersionK(w: number, h: number): number {
  let k = Math.max(10, w * w / G);
  for (let i = 0; i < 40; i++) {
    const th = Math.tanh(k * h);
    const f = (G * k + (SIGMA / RHO) * k * k * k) * th - w * w;
    const df = (G + 3 * (SIGMA / RHO) * k * k) * th + (G * k + (SIGMA / RHO) * k * k * k) * h * (1 - th * th);
    const next = k - f / df;
    if (!Number.isFinite(next) || next <= 0) break;
    if (Math.abs(next - k) < 1e-6 * k) { k = next; break; }
    k = next;
  }
  return k;
}

// Bessel J_m on a grid, by Miller's backward recurrence: for each x every
// order comes out of one downward sweep, normalised by J0 + 2 Σ J2k = 1.
export const ORDERS = 34;     // m = 0 … 33 (m = 32, 33 feed the derivative identity)
export const LUT_W = 8192;
export const LUT_MAX = 220;   // k·a for a 20 cm dish at 200 Hz drive is ~190
export const LUT = new Float32Array(ORDERS * LUT_W);
(function buildLut() {
  for (let i = 0; i < LUT_W; i++) {
    const x = (i / (LUT_W - 1)) * LUT_MAX;
    if (x < 1e-6) { LUT[i] = 1; continue; }
    const N = 2 * (Math.ceil(x) + ORDERS + 20);
    let jp1 = 0, j = 1e-30, sum = 0;
    const vals = new Float64Array(ORDERS);
    for (let n = N; n >= 1; n--) {
      const jm1 = (2 * n / x) * j - jp1;
      jp1 = j; j = jm1;
      if (Math.abs(j) > 1e250) { j *= 1e-250; jp1 *= 1e-250; sum *= 1e-250; for (let q = 0; q < ORDERS; q++) vals[q] *= 1e-250; }
      const idx = n - 1;
      if (idx < ORDERS) vals[idx] = j;
      if (idx % 2 === 0 && idx > 0) sum += 2 * j;
    }
    const norm = 1 / (vals[0] + sum);
    for (let q = 0; q < ORDERS; q++) LUT[q * LUT_W + i] = vals[q] * norm;
  }
})();

/** J_m at grid index i; J_{-1} = −J_1. */
const jm = (m: number, i: number) => (m < 0 ? -LUT[LUT_W + i] : LUT[m * LUT_W + i]);
/** Zeros on (0.5, LUT_MAX] of f(i) sampled on the grid. */
function gridZeros(f: (i: number) => number): number[] {
  const out: number[] = [];
  let prev = f(4);
  for (let i = 5; i < LUT_W; i++) {
    const cur = f(i);
    if ((prev < 0 && cur >= 0) || (prev > 0 && cur <= 0)) {
      const t = prev / (prev - cur);
      const x = ((i - 1 + t) / (LUT_W - 1)) * LUT_MAX;
      if (x > 0.5) out.push(x);
    }
    prev = cur;
  }
  return out;
}
const MAX_M = ORDERS - 2;
/** Zeros of J_m' (J_m' = (J_{m-1} − J_{m+1}) / 2): the free-edge modes. */
const DZEROS: number[][] = [];
/** Zeros of J_m: the clamped-edge limit a pinned contact line leans toward. */
const JZEROS: number[][] = [];
for (let m = 0; m < MAX_M; m++) {
  DZEROS.push(gridZeros((i) => 0.5 * (jm(m - 1, i) - jm(m + 1, i))));
  JZEROS.push(gridZeros((i) => jm(m, i)));
}

export interface Mode { m: number; x: number; amp: number; phase: number }
/** How firmly the contact line holds the wall: 0 slides freely, 1 is pinned. */
export type Edge = number;

export function hash(n: number): number { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

/** Natural frequency (Hz) of a surface wave of wavenumber k (rad/m) at depth h (m). */
function naturalHz(k: number, h: number): number {
  return Math.sqrt((G * k + (SIGMA / RHO) * k * k * k) * Math.tanh(k * h)) / TAU;
}

/** The dish's modes as (m, n, k·a). A free contact line slides and the modes
 *  sit on the zeros of J_m'; a pinned one stiffens them toward the zeros of
 *  J_m, further for higher m (Shao et al. 2021, Wilson et al. 2022: pinned
 *  natural frequencies 7–18% up; the shift is ~70% of the way at m = 6, ~88%
 *  at m = 15). */
function dishModes(pin: number): { m: number; x: number }[] {
  const out: { m: number; x: number }[] = [];
  for (let m = 0; m < MAX_M; m++) for (const jp of DZEROS[m]) {
    let x = jp;
    if (pin > 0) {
      const j = JZEROS[m].find((z) => z > jp);
      if (j === undefined) continue;
      x = jp + pin * (1 - Math.min(0.7, 1.8 / Math.max(m, 1))) * (j - jp);
    }
    out.push({ m, x });
  }
  return out;
}
const modeCache = new Map<number, { m: number; x: number }[]>();
const modesAt = (pin: number) => {
  const key = Math.round(pin * 100) / 100;
  if (!modeCache.has(key)) modeCache.set(key, dishModes(key));
  return modeCache.get(key)!;
};

export interface Selection { modes: Mode[]; lead: { m: number; n: number; hz: number } | null; rival: { m: number; weight: number } | null }

/** The dish modes a drive frequency excites. The surface answers at half the
 *  drive frequency (Faraday), and the mode that sets in is the one with the
 *  lowest threshold: the one whose natural frequency sits nearest f/2, within
 *  a width set by damping (viscous, growing as k², plus the walls'). No
 *  preference for any petal count — the literature has none (Douady 1990;
 *  Batson et al. 2013; Shao et al. 2021). */
export function selectModes(hz: number, dishRadiusM: number, depthM: number, damping: number, edge: Edge, seed: number): Selection {
  const half = hz / 2;
  const NU = 1e-6;
  const scored = modesAt(edge).map((c) => {
    const k = c.x / dishRadiusM;
    const fn = naturalHz(k, depthM);
    // Viscous decay 2νk² (s⁻¹) as a frequency width, plus the walls' share.
    const width = (2 * NU * k * k) / TAU + damping * half;
    return { ...c, fn, w: 1 / (1 + Math.pow((fn - half) / width, 2)) };
  }).sort((a, b) => b.w - a.w);
  const lead = scored[0];
  if (!lead || lead.w < 0.02) return { modes: [], lead: null, rival: null };
  // The figure is the lead mode. Its radial neighbours — the same m at other
  // n — join weakly where they sit close (a real pattern is rarely one pure
  // mode; Douady 1990, Zhang et al. 2023); they share its orientation.
  const kin = scored.filter((c) => c !== lead && c.m === lead.m && c.w > 0.05).slice(0, 2);
  const orient = hash(seed + lead.m * 7.1) * TAU;
  const modes: Mode[] = [{ m: lead.m, x: lead.x, amp: 1, phase: orient }];
  for (const c of kin) modes.push({ m: c.m, x: c.x, amp: 0.35 * Math.sqrt(c.w / lead.w), phase: orient });
  // The meniscus at the wall emits axisymmetric waves at the drive frequency
  // itself, not half of it (Douady 1990; Shao et al. 2021): fine rings.
  modes.push({ m: 0, x: Math.min(LUT_MAX * 0.95, dispersionK(TAU * hz, depthM) * dishRadiusM), amp: 0.15, phase: 0 });
  const total = modes.reduce((a, md) => a + md.amp, 0);
  for (const md of modes) md.amp /= total;
  // A neighbour of another symmetry close behind: at a band edge either can
  // form (Sheldrake & Sheldrake 2017). Reported, not drawn.
  const r = scored.find((c) => c.m !== lead.m);
  const n = DZEROS[lead.m].length ? 1 + modesAt(edge).filter((c) => c.m === lead.m && c.x < lead.x).length : 1;
  return { modes, lead: { m: lead.m, n, hz: lead.fn * 2 }, rival: r && r.w > 0.5 * lead.w ? { m: r.m, weight: r.w / lead.w } : null };
}

/** Scale so the surface slope's RMS over the dish is 1 whatever modes are in
 *  it; the ring light's contour then sits at a known slope and every figure
 *  draws alike. Phases are independent, so the mean squares add. */
export function slopeNormaliser(modes: Mode[]): number {
  if (!modes.length) return 1;
  let acc = 0;
  for (const md of modes) {
    let s = 0;
    const n = 600;
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt((i + 0.5) / n);
      const xi = Math.min(LUT_W - 1, Math.round((md.x * r / LUT_MAX) * (LUT_W - 1)));
      const a = jm(md.m - 1, xi), c = jm(md.m + 1, xi);
      // ⟨cos²⟩ = ⟨sin²⟩ = ½ round the circle (both 1 for the rings, m = 0, whose sine term vanishes)
      const half = md.m === 0 ? 1 : 0.5;
      s += md.x * md.x * 0.25 * ((a - c) * (a - c) + (md.m === 0 ? 0 : (a + c) * (a + c))) * half;
    }
    acc += md.amp * md.amp * (s / n);
  }
  return 1 / (Math.sqrt(acc) || 1e-3);
}

// ---- colour -----------------------------------------------------------------

// One hue per light; the tone map runs each channel to white at its own rate,
// so the dense light comes out white-hot and the thin light keeps the colour.
export const PALETTES: Record<string, { name: string; hue: [number, number, number] }> = {
  blue: { name: "BLUE", hue: [0.26, 0.48, 1.0] },
  cyan: { name: "CYAN", hue: [0.16, 0.78, 1.0] },
  gold: { name: "GOLD", hue: [1.0, 0.66, 0.2] },
  lime: { name: "LIME", hue: [0.6, 1.0, 0.16] },
  violet: { name: "VIOLET", hue: [0.58, 0.4, 1.0] },
  ember: { name: "EMBER", hue: [1.0, 0.36, 0.12] },
  white: { name: "WHITE", hue: [0.9, 0.92, 1.0] },
};

// ---- the renderer -------------------------------------------------------------

export interface View {
  modesA: Mode[]; modesB: Mode[]; ampA: number; ampB: number;
  /** Weight of the second tone (0 = none) and its frequency over the first's. */
  mixB: number; ratioB: number;
  drive: number; strobe: number; chaos: number; spin: number;
  /** How much of each frame the next one keeps: the length of the exposure. */
  trails: number;
  hue: [number, number, number];
  /** Touch ripples: x, y (dish units), start time (s, < 0 = unused), strength. */
  ripples: number[];
}

const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

// The surface, its slope, and the ring light's reflection of it, averaged
// over the part of the cycle the shutter is open and blended into the frames
// before it. Writes a single intensity.
const SCENE = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 outColor;
uniform sampler2D uPrev; uniform sampler2D uLut; uniform float uLutMax; uniform float uLutW;
uniform vec2 uRes; uniform vec2 uCenter; uniform float uRadius; uniform float uTime;
uniform vec4 uModeA[10]; uniform vec4 uModeB[10]; uniform int uCountA; uniform int uCountB;
uniform float uAmpA; uniform float uAmpB; uniform float uMixB; uniform float uRatioB;
uniform float uSlope; uniform float uPhase; uniform float uJit; uniform float uKeep;
uniform float uLevel; uniform float uKx; uniform float uChaos; uniform float uSpin; uniform float uLead; uniform float uLeadPhase;
uniform vec4 uRipple[4];

float J(int m, float x){
  float sg = 1.0;
  if (m < 0) { m = -m; sg = -1.0; }
  float u = clamp(x / uLutMax, 0.0, 0.99999) * (uLutW - 1.0);
  float i0 = floor(u); float f = u - i0;
  float a = texelFetch(uLut, ivec2(int(i0), m), 0).r;
  float b = texelFetch(uLut, ivec2(int(i0) + 1, m), 0).r;
  return sg * mix(a, b, f);
}
float h1(float n){ return fract(sin(n) * 43758.5453); }

// The slope of one set of modes at a point, as the two quadratures of its
// oscillation: slope(φ) = P cos φ − Q sin φ. Each mode carries its own time
// phase, drifting slowly as the modes trade energy — the dish's breathing.
void slopes(vec4 md, int i, float r, float th, vec2 rh, vec2 tg, float t, inout vec2 P, inout vec2 Q, inout vec2 H, inout float E){
  float m = md.x; float x = md.y; float fi = float(i);
  float slow = 0.35 + 0.5 * h1(fi * 12.9898);
  // One drift for the whole figure, so its symmetry holds as it breathes;
  // turbulence alone sets the modes slipping against one another.
  float wob = uChaos * (0.25 * sin(t * 0.21) + 0.5 * sin(t * (0.23 + 0.07 * fi) + m));
  float ang = m * th + md.w + wob;
  float C = cos(ang), S = sin(ang);
  float z = x * r; int mi = int(m);
  float a = J(mi - 1, z), c = J(mi + 1, z);
  // ∂/∂r J_m(xr) = x (J_{m−1} − J_{m+1}) / 2 and (m/r) J_m(xr) = x (J_{m−1} + J_{m+1}) / 2
  vec2 g = x * 0.5 * ((a - c) * C * rh - (a + c) * S * tg);
  float amp = md.z * (i == 0 ? 1.0 : 1.0 + 0.35 * sin(0.17 * slow * t + md.w));
  float psi = md.w * 0.7 + (0.4 + uChaos) * sin(0.11 * slow * t + fi * 2.3);
  P += amp * cos(psi) * g; Q += amp * sin(psi) * g;
  float hgt = J(mi, z) * C;
  H += amp * hgt * vec2(cos(psi), sin(psi));
  E += amp * amp * x * x * 0.125 * ((a - c) * (a - c) + (a + c) * (a + c));
}

void main(){
  vec2 p = (vUv * uRes - uCenter) / uRadius;
  float r = length(p);
  float prev = texture(uPrev, vUv).r;
  if (r > 1.0) { outColor = vec4(prev * uKeep, 0.0, 0.0, 1.0); return; }
  float t = uTime;
  float th = atan(p.y, p.x) - uSpin * t;
  vec2 rh = vec2(cos(th), sin(th)); vec2 tg = vec2(-rh.y, rh.x);
  vec2 PA = vec2(0.0), QA = vec2(0.0), PB = vec2(0.0), QB = vec2(0.0);
  float EA = 0.0, EB = 0.0; vec2 HA = vec2(0.0), HB = vec2(0.0);
  for (int i = 0; i < 10; i++) { if (i >= uCountA) break; slopes(uModeA[i], i, r, th, rh, tg, t, PA, QA, HA, EA); }
  for (int i = 0; i < 10; i++) { if (i >= uCountB) break; slopes(uModeB[i], i + 3, r, th, rh, tg, t, PB, QB, HB, EB); }
  // Rotate back into the screen frame: the basis above turned with the spin.
  float cs = cos(uSpin * t), sn = sin(uSpin * t);
  mat2 back = mat2(cs, sn, -sn, cs);
  PA = back * PA * uAmpA * (1.0 - uMixB); QA = back * QA * uAmpA * (1.0 - uMixB);
  PB = back * PB * uAmpB * uMixB; QB = back * QB * uAmpB * uMixB;
  HA *= uAmpA * (1.0 - uMixB); HB *= uAmpB * uMixB;
  // The camera's exposure is set for the figure, not the dish: where the
  // modes run quiet (the hub of a many-petalled figure) it reads the small
  // slopes up, so the centre shows detail as it does in the photographs.
  float loc = EA * uAmpA * uAmpA * (1.0 - uMixB) * (1.0 - uMixB) + EB * uAmpB * uAmpB * uMixB * uMixB;
  float agc = pow(1.0 / (sqrt(loc) + 0.12), uLevel);
  PA *= agc; QA *= agc; PB *= agc; QB *= agc; HA *= agc; HB *= agc;
  // The figure ends well inside the wall, along its own lobed outline. The
  // camera blends both halves of the swing, so a mode of order m shows 2m
  // petals (Sheldrake & Sheldrake 2017): everything drawn here is 2m-fold.
  float lobe = cos(2.0 * (uLead * th + uLeadPhase));
  float edge = 0.82 + 0.035 * lobe;
  float env = smoothstep(edge + 0.06, edge - 0.16, r);
  // Touch ripples: an expanding ring that fades, as a slope pushed outward.
  vec2 rip = vec2(0.0);
  for (int i = 0; i < 4; i++) {
    vec4 rp = uRipple[i];
    if (rp.z < 0.0) continue;
    float age = t - rp.z;
    if (age < 0.0 || age > 4.0) continue;
    vec2 d = p - rp.xy; float dl = length(d) + 1e-4;
    float front = age * 0.28;
    float e = exp(-age * 0.9) * exp(-pow((dl - front) / 0.09, 2.0));
    rip += (d / dl) * rp.w * e * 40.0 * cos((dl - front) * 60.0);
  }
  float s0 = uSlope, w = uSlope * 0.05;
  // Never thinner than about a pixel and a half: the slope changes by about
  // s0 · k per dish radius, so a fine figure stays drawn.
  float wk = max(w, 1.2 * s0 * uKx / uRadius);
  // Glow: over the whole swing the reflection sweeps across every part of the
  // surface steep enough to catch it, lighting it as a translucent sheet, and
  // leaves dark only the flat crowns of the bumps — the lenses.
  float glow = 0.0;
  const int K = 10;
  for (int k = 0; k < K; k++) {
    float ph = uPhase + (float(k) + uJit) / float(K) * 3.14159265;
    vec2 g = (PA * cos(ph) - QA * sin(ph) + PB * cos(ph * uRatioB + 1.3) - QB * sin(ph * uRatioB + 1.3)) * env + rip;
    glow += exp(-pow((length(g) - s0) / (0.55 * s0), 2.0));
  }
  glow /= float(K);
  // The web: the lines where the standing wave never moves — its nodes, the
  // spokes and rings of the figure. Light gathers there (the surface is
  // still, the reflection steady) and the camera keeps it as a fine bright
  // thread. Drawn at a fixed width on screen: the distance to the line is the
  // height over its slope. Where spoke meets ring the slope vanishes too and
  // the thread swells into a bead.
  float web = 0.0;
  for (int k = 0; k < 4; k++) {
    float ph = uPhase * 0.25 + float(k) * 0.7854;
    float h = (HA.x * cos(ph) - HA.y * sin(ph) + HB.x * cos(ph * uRatioB + 1.3) - HB.y * sin(ph * uRatioB + 1.3)) * env;
    vec2 g = (PA * cos(ph) - QA * sin(ph) + PB * cos(ph * uRatioB + 1.3) - QB * sin(ph * uRatioB + 1.3)) * env;
    float px = 1.0 / uRadius;
    float d = abs(h) / (length(g) + 0.05);
    web += (k == 0 ? 1.0 : 0.4 / float(k)) * (exp(-pow(d / (0.8 * px), 2.0)) + 0.05 * exp(-d / (3.0 * px)));
  }
  // Lace: the strobe catches the surface at a few instants, and each leaves
  // the ring light's reflection as a sharp line; overlaid, they cross.
  float lace = 0.0;
  for (int k = 0; k < 3; k++) {
    float ph = uPhase * (1.0 + 0.13 * float(k)) + float(k) * 1.0472;
    vec2 g = (PA * cos(ph) - QA * sin(ph) + PB * cos(ph * uRatioB + 1.3) - QB * sin(ph * uRatioB + 1.3)) * env + rip;
    lace += (w / wk) * exp(-pow((length(g) - s0) / wk, 2.0));
  }
  lace /= 3.0;
  // The star: the lead mode's spokes run on into the centre, where its
  // amplitude has died but the light still threads along the nodes.
  float ang = uLead * th + uLeadPhase;
  float dth = abs(mod(ang + 1.5708, 3.14159265) - 1.5708) / max(uLead, 1.0);
  float spoke = exp(-pow(r * dth * uRadius / 1.1, 2.0)) * exp(-r / 0.16) * step(0.5, uLead);
  float I = 0.08 * glow * env + 1.0 * web * env + 0.35 * lace + 0.6 * spoke;
  // The rim of the figure, where the standing wave meets still water, catches
  // a little more light, beaded by the petals.
  float petal = 0.5 + 0.5 * cos(2.0 * ang);
  I += exp(-pow((r - edge) / 0.02, 2.0)) * (0.06 + 0.14 * petal);
  // The hub: every spoke meets at the centre, a white point.
  I += exp(-pow(r / 0.022, 2.0)) * 1.6 + exp(-r / 0.06) * 0.15;
  I += 0.012 * env;
  I *= smoothstep(1.0, 0.985, r);
  outColor = vec4(mix(I, prev, uKeep), 0.0, 0.0, 1.0);
}`;

// Quarter-size copy for the glare.
const DOWN = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 outColor;
uniform sampler2D uSrc; uniform vec2 uTexel;
void main(){
  vec2 o = uTexel * 0.75;
  float s = texture(uSrc, vUv + vec2(-o.x, -o.y)).r + texture(uSrc, vUv + vec2(o.x, -o.y)).r
          + texture(uSrc, vUv + vec2(-o.x, o.y)).r + texture(uSrc, vUv + vec2(o.x, o.y)).r;
  outColor = vec4(s * 0.25, 0.0, 0.0, 1.0);
}`;

const BLUR = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 outColor;
uniform sampler2D uSrc; uniform vec2 uDir;
void main(){
  float s = texture(uSrc, vUv).r * 0.2270;
  s += (texture(uSrc, vUv + uDir * 1.3846).r + texture(uSrc, vUv - uDir * 1.3846).r) * 0.3162;
  s += (texture(uSrc, vUv + uDir * 3.2308).r + texture(uSrc, vUv - uDir * 3.2308).r) * 0.0703;
  outColor = vec4(s, 0.0, 0.0, 1.0);
}`;

// Light plus glare, through a per-channel exposure curve: each channel runs
// to white at its own rate, so dense light goes white and thin light stays hue.
const COMPOSE = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 outColor;
uniform sampler2D uAcc; uniform sampler2D uGlowA; uniform sampler2D uGlowB; uniform vec3 uHue; uniform float uGain;
void main(){
  float I = texture(uAcc, vUv).r + 0.55 * texture(uGlowA, vUv).r + 0.45 * texture(uGlowB, vUv).r;
  vec3 c = 1.0 - exp(-I * uGain * uHue * (1.0 + 1.2 * I));
  outColor = vec4(pow(c, vec3(1.25)), 1.0);
}`;

export interface Renderer {
  /** Draw one frame at time t (s) into a w × h drawing buffer. */
  frame(w: number, h: number, t: number, v: View): void;
  /** Forget the exposure so far (after a jump the old figure should not linger). */
  clear(): void;
  /** The radius of the dish in drawing-buffer pixels for a w × h buffer. */
  radius(w: number, h: number): number;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!; gl.shaderSource(sh, src); gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || "shader");
  return sh;
}
function program(gl: WebGL2RenderingContext, fs: string) {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(prog, 0, "aPos");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
  const cache = new Map<string, WebGLUniformLocation | null>();
  const U = (n: string) => { if (!cache.has(n)) cache.set(n, gl.getUniformLocation(prog, n)); return cache.get(n)!; };
  return { prog, U };
}

export function createRenderer(gl: WebGL2RenderingContext): Renderer {
  // Float targets carry light well past 1 for the glare; without them, fall
  // back to bytes and a shorter exposure.
  const floatOk = !!gl.getExtension("EXT_color_buffer_float");
  const IFMT = floatOk ? gl.RGBA16F : gl.RGBA8, TYPE = floatOk ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;

  const scene = program(gl, SCENE), down = program(gl, DOWN), blur = program(gl, BLUR), compose = program(gl, COMPOSE);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const lut = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, lut);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, LUT_W, ORDERS, 0, gl.RED, gl.FLOAT, LUT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  interface Target { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number }
  const target = (w: number, h: number): Target => {
    const tex = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, IFMT, w, h, 0, gl.RGBA, TYPE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer()!; gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb, w, h };
  };
  const free = (t: Target) => { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); };
  let acc: Target[] = [], glow: Target[] = [], cur = 0, size = "";

  const resize = (w: number, h: number) => {
    const key = `${w}x${h}`;
    if (key === size) return;
    size = key;
    [...acc, ...glow].forEach(free);
    acc = [target(w, h), target(w, h)];
    const qw = Math.max(1, w >> 2), qh = Math.max(1, h >> 2), ew = Math.max(1, w >> 3), eh = Math.max(1, h >> 3);
    glow = [target(qw, qh), target(qw, qh), target(ew, eh), target(ew, eh)];
  };
  const pass = (to: Target | null, w: number, h: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, to ? to.fb : null);
    gl.viewport(0, 0, w, h);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const bind = (unit: number, tex: WebGLTexture) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); };
  const modeBuf = new Float32Array(40);
  const pack = (modes: Mode[]) => { modeBuf.fill(0); modes.slice(0, 10).forEach((md, i) => modeBuf.set([md.m, md.x, md.amp, md.phase], i * 4)); return modeBuf; };
  let jitter = 0;
  const radius = (w: number, h: number) => Math.min(w, h) * 0.46;

  return {
    radius,
    clear() { for (const t of acc) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); } },
    frame(w, h, t, v) {
      resize(w, h);
      gl.bindVertexArray(vao);
      const prev = acc[cur], next = acc[1 - cur];
      jitter = (jitter + 0.618034) % 1;

      const S = scene;
      gl.useProgram(S.prog);
      bind(0, lut); bind(1, prev.tex);
      gl.uniform1i(S.U("uLut"), 0); gl.uniform1i(S.U("uPrev"), 1);
      gl.uniform1f(S.U("uLutMax"), LUT_MAX); gl.uniform1f(S.U("uLutW"), LUT_W);
      const rad = radius(w, h);
      gl.uniform2f(S.U("uRes"), w, h); gl.uniform2f(S.U("uCenter"), w / 2, h / 2); gl.uniform1f(S.U("uRadius"), rad);
      gl.uniform1f(S.U("uTime"), t);
      gl.uniform4fv(S.U("uModeA[0]"), pack(v.modesA)); gl.uniform1i(S.U("uCountA"), Math.min(10, v.modesA.length));
      gl.uniform4fv(S.U("uModeB[0]"), pack(v.modesB)); gl.uniform1i(S.U("uCountB"), Math.min(10, v.modesB.length));
      gl.uniform1f(S.U("uAmpA"), v.ampA); gl.uniform1f(S.U("uAmpB"), v.ampB);
      gl.uniform1f(S.U("uMixB"), v.modesB.length ? v.mixB : 0); gl.uniform1f(S.U("uRatioB"), v.ratioB);
      // Drive is amplitude: the harder the dish is driven, the more of the
      // surface tilts past the ring's angle, and the denser the figure.
      gl.uniform1f(S.U("uSlope"), 0.55 / (0.3 + v.drive));
      gl.uniform1f(S.U("uLevel"), 0.7);
      gl.uniform1f(S.U("uKx"), Math.max(1, ...v.modesA.map((m) => m.x), ...v.modesB.map((m) => m.x)));
      // The camera aliases the 30-odd-hertz wave into a slow breath; the strobe
      // control sets its pace.
      gl.uniform1f(S.U("uPhase"), t * (0.25 + v.strobe * 1.4));
      gl.uniform1f(S.U("uJit"), jitter);
      gl.uniform1f(S.U("uKeep"), floatOk ? v.trails : Math.min(v.trails, 0.6));
      gl.uniform1f(S.U("uChaos"), v.chaos); gl.uniform1f(S.U("uSpin"), v.spin);
      const lead = v.modesA[0];
      gl.uniform1f(S.U("uLead"), lead ? lead.m : 0); gl.uniform1f(S.U("uLeadPhase"), lead ? lead.phase : 0);
      gl.uniform4fv(S.U("uRipple[0]"), new Float32Array(v.ripples));
      pass(next, w, h);

      // Glare: a quarter-size and an eighth-size blur of the light.
      const [qa, qb, ea, eb] = glow;
      gl.useProgram(down.prog); gl.uniform1i(down.U("uSrc"), 0);
      bind(0, next.tex); gl.uniform2f(down.U("uTexel"), 1 / w, 1 / h); pass(qa, qa.w, qa.h);
      bind(0, qa.tex); gl.uniform2f(down.U("uTexel"), 1 / qa.w, 1 / qa.h); pass(ea, ea.w, ea.h);
      gl.useProgram(blur.prog); gl.uniform1i(blur.U("uSrc"), 0);
      for (const [a, b] of [[qa, qb], [ea, eb]] as const) {
        for (let i = 0; i < 2; i++) {
          bind(0, a.tex); gl.uniform2f(blur.U("uDir"), 1 / a.w, 0); pass(b, b.w, b.h);
          bind(0, b.tex); gl.uniform2f(blur.U("uDir"), 0, 1 / a.h); pass(a, a.w, a.h);
        }
      }

      gl.useProgram(compose.prog);
      bind(0, next.tex); bind(1, qa.tex); bind(2, ea.tex);
      gl.uniform1i(compose.U("uAcc"), 0); gl.uniform1i(compose.U("uGlowA"), 1); gl.uniform1i(compose.U("uGlowB"), 2);
      gl.uniform3fv(compose.U("uHue"), v.hue); gl.uniform1f(compose.U("uGain"), 1.8);
      pass(null, w, h);
      cur = 1 - cur;
    },
  };
}
