import { raymarchSketch } from "../raymarch";

/**
 * A triply periodic minimal surface cut by a sphere. The surfaces are one
 * trigonometric line each; the interest is in thickening them, letting the
 * frequency climb toward the centre, and twisting the space they sit in.
 */
export const gyroid = raymarchSketch({
  id: "gyroid",
  title: "Minimal sphere",
  family: "Minimal surfaces",
  blurb:
    "A gyroid, or one of its cousins, thickened into a sheet and carved down to a sphere. The same geometry turns up in butterfly-wing scales and in bone.",
  method: [
    "A triply periodic minimal surface divides space into two interlocking labyrinths with a sheet of zero mean curvature between them. The gyroid has no closed formula, but sin x cos y + sin y cos z + sin z cos x = 0 is close enough that everyone uses it.",
    "That level set is thickened into a sheet of a chosen width and intersected with a ball, or with a hollow shell.",
    "The frequency can rise toward the centre, so the cells shrink as they go in, and the space can be twisted about the vertical axis before the surface is evaluated. Both bend the field, so it is marched in smaller steps.",
  ],
  sources: [
    { label: "Gyroid", href: "https://en.wikipedia.org/wiki/Gyroid" },
    { label: "Triply periodic minimal surface", href: "https://en.wikipedia.org/wiki/Triply_periodic_minimal_surface" },
    { label: "Schoen, Infinite periodic minimal surfaces without self-intersections (NASA, 1970)", href: "https://ntrs.nasa.gov/citations/19700020472" },
  ],
  params: [
    { key: "surface", label: "Surface", kind: "choice", default: 0, options: [
      { value: 0, label: "Gyroid" },
      { value: 1, label: "Schwarz P" },
      { value: 2, label: "Schwarz D" },
      { value: 3, label: "Neovius" },
    ] },
    { key: "freq", label: "Cell frequency", kind: "range", min: 2, max: 40, step: 0.1, default: 14 },
    { key: "thick", label: "Sheet thickness", kind: "range", min: 0.01, max: 0.6, step: 0.001, default: 0.12,
      hint: "In units of one cell." },
    { key: "level", label: "Level offset", kind: "range", min: -1, max: 1, step: 0.01, default: 0,
      hint: "Moves the sheet off zero, so one labyrinth grows at the other's expense." },
    { key: "gradient", label: "Shrink toward centre", kind: "range", min: 0, max: 3, step: 0.01, default: 0.8 },
    { key: "twist", label: "Twist", kind: "range", min: -6, max: 6, step: 0.01, default: 0 },
    { key: "shell", label: "Hollow shell", group: "Envelope", kind: "toggle", default: 0 },
    { key: "shellTh", label: "Shell depth", group: "Envelope", kind: "range", min: 0.05, max: 1, step: 0.005, default: 0.3 },
    { key: "squash", label: "Squash", group: "Envelope", kind: "range", min: 0.5, max: 1.5, step: 0.01, default: 1 },
  ],
  presets: [
    { name: "Gyroid ball", values: {} },
    { name: "Bone", values: { freq: 22, thick: 0.08, gradient: 1.4, level: 0.35 } },
    { name: "Shell", values: { shell: 1, shellTh: 0.18, freq: 18, thick: 0.1, gradient: 0 } },
    { name: "Schwarz P", values: { surface: 1, freq: 12, thick: 0.14, gradient: 0.4 } },
    { name: "Twisted D", values: { surface: 2, freq: 10, thick: 0.1, twist: 3.2, gradient: 0.3 } },
    { name: "Seed pod", values: { surface: 3, freq: 9, thick: 0.08, squash: 1.35, shell: 1, shellTh: 0.4 } },
  ],
  stepScale: 0.45,
  glsl: `
#define BOUND (1.04 * max(1.0, u_squash))
#define SHADE_R 1.0
float tpms(vec3 q) {
  if (u_surface < 0.5) return dot(sin(q), cos(q.yzx));
  if (u_surface < 1.5) return cos(q.x) + cos(q.y) + cos(q.z);
  if (u_surface < 2.5) {
    vec3 s = sin(q), c = cos(q);
    return s.x*s.y*s.z + s.x*c.y*c.z + c.x*s.y*c.z + c.x*c.y*s.z;
  }
  return 3.0 * (cos(q.x) + cos(q.y) + cos(q.z)) + 4.0 * cos(q.x) * cos(q.y) * cos(q.z);
}
float map(vec3 p) {
  vec3 e = p / vec3(1.0, u_squash, 1.0);
  float r = length(e);
  float env = (r - 1.0) * min(1.0, u_squash);
  if (u_shell > 0.5) env = max(env, (1.0 - u_shellTh) - r);
  if (env > 0.05) return env;
  float a = u_twist * p.y;
  float ca = cos(a), sa = sin(a);
  vec3 q = vec3(ca * p.x - sa * p.z, p.y, sa * p.x + ca * p.z);
  float f = u_freq * (1.0 + u_gradient * (1.0 - clamp(r, 0.0, 1.0)));
  float amp = u_surface > 2.5 ? 6.0 : 1.5;
  float g = (tpms(q * f) / amp - u_level * 0.5) / f;
  float sheet = abs(g) - u_thick * 3.14159 / f * 0.5;
  return max(sheet, env);
}
`,
});
