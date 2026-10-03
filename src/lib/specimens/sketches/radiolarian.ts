import { raymarchSketch, SF_GLSL } from "../raymarch";

/**
 * A lattice shell: struts along the cell walls of a Voronoi pattern on the
 * sphere, a smaller second shell inside it, radial beams between the two and a
 * spine on every outer cell. The Fibonacci lattice puts one pole at the camera,
 * which is the spiral at the centre of the reference image.
 */
export const radiolarian = raymarchSketch({
  id: "radiolarian",
  title: "Lattice shell",
  family: "Radiolaria",
  blurb:
    "A sphere of struts drawn along the walls of a Voronoi pattern, a second shell inside it, spines outward. Haeckel drew these by the hundred.",
  method: [
    "Several hundred points are spread over a sphere on a Fibonacci spiral, the most even way of placing any number of points there and the reason a pole looks like a sunflower head.",
    "Every point on the shell asks which lattice point it is nearest, and how far it is from the halfway plane to the next nearest. Where that distance is small you are on a cell wall, and a tube is grown along it. The minimum is taken smoothly, which is what fills each junction with a web rather than a sharp corner.",
    "The vortex bends latitude before the lattice is looked up: near the facing pole a small step on the sphere becomes a large step through the lattice, so cells, and the struts between them, shrink toward the centre.",
    "The same construction at a smaller radius and a finer count gives the inner shell. Beams run from it to the outer shell through every outer cell centre, and the same centres carry the spines.",
    "Nothing is modelled as a mesh. The whole form is a single distance function, rendered by marching rays into it.",
    "In motion the noise that bends the lattice is drawn along a closed loop through itself, so the cells shift and settle; the vortex tightens and relaxes; and a wave runs down the spines from the pole. All three close on the cycle, so the film loops.",
  ],
  sources: [
    { label: "Ernst Haeckel, Kunstformen der Natur (1904)", href: "https://en.wikipedia.org/wiki/Kunstformen_der_Natur" },
    { label: "Keinert et al., Spherical Fibonacci Mapping (2015)", href: "https://doi.org/10.1145/2816795.2818131" },
    { label: "Radiolaria", href: "https://en.wikipedia.org/wiki/Radiolaria" },
  ],
  params: [
    { key: "cells", label: "Cells", kind: "range", min: 40, max: 2000, step: 1, default: 360,
      hint: "Lattice points on the outer shell." },
    { key: "strut", label: "Strut thickness", kind: "range", min: 0.003, max: 0.06, step: 0.0005, default: 0.011 },
    { key: "web", label: "Webbing", kind: "range", min: 0, max: 0.12, step: 0.001, default: 0.03,
      hint: "How much each junction fills in. Zero is a clean wire frame." },
    { key: "warp", label: "Irregularity", kind: "range", min: 0, max: 0.4, step: 0.001, default: 0.06,
      hint: "Noise in the lattice, so no two cells are quite the same." },
    { key: "warpScale", label: "Irregularity scale", kind: "range", min: 1, max: 12, step: 0.1, default: 4 },
    { key: "pinch", label: "Vortex", kind: "range", min: 0, max: 0.85, step: 0.005, default: 0.5,
      hint: "Crowds the cells toward the pole facing you, so they spiral down to nothing at the centre." },
    { key: "seed", label: "Seed", kind: "range", min: 0, max: 999, step: 1, default: 7 },

    { key: "inner", label: "Inner shell", group: "Inner shell", kind: "toggle", default: 1 },
    { key: "innerR", label: "Inner radius", group: "Inner shell", kind: "range", min: 0.3, max: 0.95, step: 0.005, default: 0.72 },
    { key: "innerDensity", label: "Inner density", group: "Inner shell", kind: "range", min: 0.2, max: 3, step: 0.01, default: 1.6,
      hint: "Inner cells per outer cell." },
    { key: "beams", label: "Radial beams", group: "Inner shell", kind: "toggle", default: 1 },

    { key: "spike", label: "Spine length", group: "Spines", kind: "range", min: 0, max: 0.6, step: 0.005, default: 0.035 },
    { key: "spikeEvery", label: "Spine on one cell in", group: "Spines", kind: "range", min: 1, max: 12, step: 1, default: 1 },
    { key: "knob", label: "Tip knob", group: "Spines", kind: "range", min: 0, max: 3, step: 0.01, default: 1.4,
      hint: "Size of the bead on each tip, in strut widths." },
  ],
  presets: [
    { name: "Reference", values: {} },
    { name: "Even", values: { pinch: 0 } },
    { name: "Wire", values: { pinch: 0, cells: 260, strut: 0.007, web: 0, warp: 0, inner: 0, spike: 0 } },
    { name: "Coral", values: { cells: 900, strut: 0.012, web: 0.08, warp: 0.18, warpScale: 6, spike: 0.03 } },
    { name: "Urchin", values: { pinch: 0.2, cells: 180, strut: 0.016, web: 0.03, spike: 0.45, spikeEvery: 1, knob: 0.8, innerR: 0.6 } },
    { name: "Heliozoa", values: { pinch: 0, cells: 120, strut: 0.02, web: 0.05, spike: 0.5, spikeEvery: 3, knob: 2.2, inner: 1, innerDensity: 0.6 } },
    { name: "Foam", values: { cells: 1800, strut: 0.006, web: 0.05, warp: 0.1, innerR: 0.86, innerDensity: 1.2, spike: 0.02 } },
  ],
  stepScale: 0.6,
  glsl: `
// the longest a spine gets while the wave runs down them
#define SPIKE_MAX (u_spike * (1.0 + 0.4 * EV))
#define BOUND (1.08 + SPIKE_MAX + u_strut * max(u_knob, 1.0))
#define SHADE_R 1.0
// the vortex, breathing
#define PINCH (u_pinch <= 0.0 ? 0.0 : min(0.9, u_pinch * (1.0 + 0.14 * EV * sin(PH))))
${SF_GLSL}
// a lattice point back from vortex space to the sphere, for beams and spines
vec3 unpinch(vec3 c) {
  if (PINCH <= 0.0) return c;
  float th2 = acos(clamp(c.z, -1.0, 1.0));
  float th = PI * pow(th2 / PI, 1.0 / (1.0 - PINCH));
  vec2 xy = normalize(c.xy + 1e-7);
  return vec3(xy * sin(th), cos(th));
}
float map(vec3 p) {
  float r = length(p);
  // Empty space first, without touching the lattice: beyond the spines, and
  // inside the innermost shell, the nearest surface is at least this far.
  float outer = 1.0 + SPIKE_MAX + u_strut * max(u_knob, 1.0);
  if (r > outer + 0.03) return r - outer;
  float core = (u_inner > 0.5 ? u_innerR : 1.0) - u_strut - 0.005;
  if (r < core - 0.03) return core - r;
  vec3 dir = p / r;
  vec3 w = dir;
  // the noise is read along a closed loop through itself, so it flows and returns
  vec3 drift = EV * 1.4 * vec3(cos(PH), sin(PH), 0.0);
  if (u_warp > 0.0) w = normalize(dir + u_warp * vnoise3(dir * u_warpScale + u_seed * 3.17 + drift));
  // vortex: theta' = PI * (theta/PI)^g, g < 1, so the pole is crowded.
  // The lattice is then uniform in theta', and every distance measured in it
  // is divided by the local stretch to stay a (conservative) distance here.
  float stretch = 1.0;
  float pinch = PINCH;
  if (pinch > 0.0) {
    float g = 1.0 - pinch;
    float th = acos(clamp(w.z, -1.0, 1.0));
    float x = max(th / PI, 1e-4);
    float th2 = PI * pow(x, g);
    stretch = max(g * pow(x, g - 1.0), sin(th2) / max(sin(th), 1e-4));
    vec2 xy = normalize(w.xy + 1e-7);
    w = vec3(xy * sin(th2), cos(th2));
  }
  const float R = 1.0;
  float n = floor(u_cells);
  // widest a strut can get under the vortex stretch
  float swMax = u_strut / max(1.0 - pinch, 0.15);

  // outer shell: the full cell-wall lookup only within reach of it
  float d;
  vec3 ac = vec3(0.0);
  bool haveC = false;
  float band = abs(r - R) - swMax;
  if (band < 0.03) {
    SFCell A = sfCells(w, n, u_web);
    d = (length(vec2((r - R) * stretch, A.edge * R)) - u_strut) / stretch;
    ac = A.c;
    haveC = true;
  } else {
    d = band;
  }
  float sw = u_strut / stretch; // strut width here, for beams and spines

  if (u_inner > 0.5) {
    float Ri = R * u_innerR;
    float bandI = abs(r - Ri) - swMax;
    if (bandI < 0.03) {
      SFCell B = sfCells(w, floor(u_cells * u_innerDensity), u_web);
      d = smin(d, (length(vec2((r - Ri) * stretch, B.edge * Ri)) - u_strut * 0.8) / stretch, sw);
    } else {
      d = min(d, bandI);
    }
    if (u_beams > 0.5 && r > Ri - swMax && r < R + swMax) {
      if (!haveC) { ac = sfNearest(w, n); haveC = true; }
      vec3 c = unpinch(ac);
      float along = dot(p, c);
      float perp = length(p - c * along);
      float beam = max(perp - sw * 0.7, abs(along - (R + Ri) * 0.5) - (R - Ri) * 0.5);
      d = smin(d, beam, sw * 2.0);
    }
  }

  if (u_spike > 0.0 && r > R - swMax) {
    if (!haveC) ac = sfNearest(w, n);
    vec3 c = unpinch(ac);
    // which cells carry a spine: a hash of the lattice point (before the
    // vortex moves it), so the choice holds still while the form moves
    float pick = hash13(floor(ac * 997.0) + u_seed);
    if (u_spikeEvery <= 1.0 || pick < 1.0 / u_spikeEvery) {
      float along = dot(p, c);
      float perp = length(p - c * along);
      // a wave running down from the pole, two crests a cycle
      float L = u_spike * (1.0 + 0.4 * EV * (0.5 + 0.5 * sin(2.0 * PH - 7.0 * c.z))) / sqrt(stretch);
      float s = clamp((along - R) / L, 0.0, 1.0);
      float rad = sw * mix(1.0, 0.45, s);
      float sp = max(perp - rad, max(R - along, along - (R + L)));
      float knob = length(p - c * (R + L)) - sw * u_knob;
      d = smin(d, min(sp, knob), sw * 1.5);
    }
  }
  return d;
}
`,
});
