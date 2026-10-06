// The four looks every piece can be rendered in (?v=field|interf|band|ember).
// Each is a frame class (colours, in frame.css) plus a background drawn from
// the site's own generative art, kept to the top of the post so the chart
// below sits on a clean ground.
import { flowField, rings, PALETTES } from "./site-art.js";

const topFade = (stop) => (u, v) => (v < stop * 0.55 ? 1 : Math.max(0, 1 - (v - stop * 0.55) / (stop * 0.45)));

export const VARIANTS = {
  field: {
    theme: "site v-field",
    bg: (ctx, W, H, t, f) => flowField(ctx, W, H, t, { palette: PALETTES.violetCyan, region: f === "ig" ? [0.3, -0.05, 1.05, 0.42] : [0.45, -0.05, 1.05, 0.6], mask: topFade(f === "ig" ? 0.42 : 0.62) }),
  },
  interf: {
    theme: "site v-interf",
    bg: (ctx, W, H, t, f) => rings(ctx, W, H, t, f === "ig" ? { a: [0.7, 0.14], b: [0.96, 0.2], reach: 0.32 } : { a: [0.78, 0.18], b: [0.97, 0.3], reach: 0.22, wavelength: 22 }),
  },
  band: {
    theme: "site v-band",
    bg: (ctx, W, H, t, f) => flowField(ctx, W, H, t, { palette: { lo: "#8fc3ee", hi: "#f4efe4" }, alpha: 0.4, region: f === "ig" ? [0.3, -0.05, 1.05, 0.42] : [0.45, -0.05, 1.05, 0.6], mask: topFade(f === "ig" ? 0.42 : 0.62) }),
  },
  ember: {
    theme: "site v-ember",
    bg: (ctx, W, H, t, f) => flowField(ctx, W, H, t, { palette: PALETTES.emberGold, seed: 23, region: f === "ig" ? [0.3, -0.05, 1.05, 0.42] : [0.45, -0.05, 1.05, 0.6], mask: topFade(f === "ig" ? 0.42 : 0.62) }),
  },
};
