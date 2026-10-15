// Bundles gen-entry.ts (the Generatives pieces) into build/gen.js as window.GEN,
// using the Generatives project's own Vite.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "../../generatives/package.json"));
const { build } = await import(require.resolve("vite"));
await build({
  root: join(here, "../../generatives"),
  configFile: false,
  logLevel: "warn",
  build: {
    outDir: join(here, "build"), emptyOutDir: true, minify: true,
    lib: { entry: join(here, "gen-entry.ts"), name: "GEN", formats: ["iife"], fileName: () => "gen.js" },
  },
});
console.log("built tools/bumpers/build/gen.js");
