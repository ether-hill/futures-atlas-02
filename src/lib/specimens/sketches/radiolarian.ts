import { raymarchSketch, SF_GLSL } from "../raymarch";

/**
 * A lattice shell: struts along the cell walls of a Voronoi pattern on the
 * sphere and a spine on every cell. One shell only: an inner shell and radial
 * beams were here and were taken out, because every ray that got through the
 * outer lattice then paid for a second one, which was most of the cost of a
 * frame and made playback and video export crawl. The Fibonacci lattice puts one pole at the camera,
 * which is the spiral at the centre of the reference image.
 */
export const radiolarian = raymarchSketch({
  id: "radiolarian",
  title: "Lattice shell",
  family: "Radiolaria",
  blurb:
    "A sphere of struts drawn along the walls of a Voronoi pattern, spines outward. Haeckel drew these by the hundred.",
  method: [
    "Several hundred points are spread over a sphere on a Fibonacci spiral, the most even way of placing any number of points there and the reason a pole looks like a sunflower head.",
    "Every point on the shell asks which lattice point it is nearest, and how far it is from the halfway plane to the next nearest. Where that distance is small you are on a cell wall, and a tube is grown along it. The minimum is taken smoothly, which is what fills each junction with a web rather than a sharp corner.",
    "The vortex bends latitude before the lattice is looked up: near the facing pole a small step on the sphere becomes a large step through the lattice, so cells, and the struts between them, shrink toward the centre.",
    "The cell centres carry the spines.",
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


    { key: "spike", label: "Spine length", group: "Spines", kind: "range", min: 0, max: 0.6, step: 0.005, default: 0.035 },
    { key: "spikeEvery", label: "Spine on one cell in", group: "Spines", kind: "range", min: 1, max: 12, step: 1, default: 1 },
    { key: "knob", label: "Tip knob", group: "Spines", kind: "range", min: 0, max: 3, step: 0.01, default: 1.4,
      hint: "Size of the bead on each tip, in strut widths." },
  ],
  presets: [
    { name: "Reference", values: {} },
    { name: "Even", values: { pinch: 0 } },
    { name: "Wire", values: { pinch: 0, cells: 260, strut: 0.007, web: 0, warp: 0, spike: 0 } },
    { name: "Coral", values: { cells: 900, strut: 0.012, web: 0.08, warp: 0.18, warpScale: 6, spike: 0.03 } },
    { name: "Urchin", values: { pinch: 0.2, cells: 180, strut: 0.016, web: 0.03, spike: 0.45, spikeEvery: 1, knob: 0.8 } },
    { name: "Heliozoa", values: { pinch: 0, cells: 120, strut: 0.02, web: 0.05, spike: 0.5, spikeEvery: 3, knob: 2.2 } },
    { name: "Foam", values: { cells: 1800, strut: 0.006, web: 0.05, warp: 0.1, spike: 0.02 } },
  ],
  stepScale: 0.6,
  field: true,
  glsl: `
// the longest a spine gets while the wave runs down them
#define SPIKE_MAX (u_spike * (1.0 + 0.4 * EV))
#define BOUND (1.08 + SPIKE_MAX + u_strut * max(u_knob, 1.0))
#define SHADE_R 1.0
// the vortex, breathing
#define PINCH (u_pinch <= 0.0 ? 0.0 : min(0.9, u_pinch * (1.0 + 0.14 * EV * sin(PH))))
${SF_GLSL}
// a lattice point back from vortex space to the sphere, for the spines
vec3 unpinch(vec3 c) {
  if (PINCH <= 0.0) return c;
  float th2 = acos(clamp(c.z, -1.0, 1.0));
  float th = PI * pow(th2 / PI, 1.0 / (1.0 - PINCH));
  vec2 xy = normalize(c.xy + 1e-7);
  return vec3(xy * sin(th), cos(th));
}
// Everything about the lattice depends on direction alone, not on distance
// from the centre: which cell a direction falls in, how far it is from that
// cell's walls, how much the vortex stretches it there, and whether the cell
// carries a spine. So it is computed once per frame per direction into a cube
// map (field(), run by raymarch.ts), and every march step only reads it.
// Looking it up from scratch at every step (sixteen candidate cells, the
// noise warp, the vortex) cost about 0.9 s a 1080p frame on integrated
// graphics; the read is a texture fetch.
struct Cell { float edge; float stretch; vec3 c; float pick; };
Cell cellDirect(vec3 dir) {
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
  SFCell A = sfCells(w, floor(u_cells), u_web);
  // which cells carry a spine: a hash of the lattice point (before the
  // vortex moves it), so the choice holds still while the form moves
  float pick = hash13(floor(A.c * 997.0) + u_seed);
  return Cell(A.edge, stretch, unpinch(A.c), pick);
}
// the cube map's two layers: edge and stretch (filtered), centre and pick
// (unfiltered, or a texel on a cell wall would blend two centres into one
// that belongs to neither)
void field(vec3 dir, out vec4 lin, out vec4 near) {
  Cell k = cellDirect(dir);
  lin = vec4(k.edge, k.stretch, 0.0, 1.0);
  near = vec4(k.c, k.pick);
}
Cell cellAt(vec3 dir) {
#ifdef FIELD
  vec2 a = texture(u_fieldLin, dir).xy;
  vec4 b = texture(u_fieldNear, dir);
  return Cell(a.x, a.y, b.xyz, b.w);
#else
  return cellDirect(dir);
#endif
}
float map(vec3 p) {
  float r = length(p);
  // Empty space first, without touching the lattice: beyond the spines, and
  // inside the shell, the nearest surface is at least this far.
  float outer = 1.0 + SPIKE_MAX + u_strut * max(u_knob, 1.0);
  if (r > outer + 0.03) return r - outer;
  // widest a strut can get under the vortex stretch
  float swMax = u_strut / max(1.0 - PINCH, 0.15);
  const float R = 1.0;
  // inside the shell is empty: the nearest surface is the shell itself
  float core = R - swMax - 0.005;
  if (r < core - 0.03) return core - r;
  float band = abs(r - R) - swMax;
  bool spines = u_spike > 0.0 && r > R - swMax;
  if (band >= 0.03 && !spines) return band;

  Cell k = cellAt(p / r);
  float d = band < 0.03 ? (length(vec2((r - R) * k.stretch, k.edge * R)) - u_strut) / k.stretch : band;
  float sw = u_strut / k.stretch; // strut width here, for the spines

  if (spines && (u_spikeEvery <= 1.0 || k.pick < 1.0 / u_spikeEvery)) {
    vec3 c = k.c;
    float along = dot(p, c);
    float perp = length(p - c * along);
    // a wave running down from the pole, two crests a cycle
    float L = u_spike * (1.0 + 0.4 * EV * (0.5 + 0.5 * sin(2.0 * PH - 7.0 * c.z))) / sqrt(k.stretch);
    float s = clamp((along - R) / L, 0.0, 1.0);
    float rad = sw * mix(1.0, 0.45, s);
    float sp = max(perp - rad, max(R - along, along - (R + L)));
    float knob = length(p - c * (R + L)) - sw * u_knob;
    d = smin(d, min(sp, knob), sw * 1.5);
  }
  return d;
}
`,
});
