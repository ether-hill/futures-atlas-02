import { defineConfig } from "vite";

// Served as a self-contained static bundle inside the Futures Atlas site at
// /hyperscale, mounted under ../public/hyperscale.
export default defineConfig({
  base: "/hyperscale/",
  build: {
    outDir: "../public/hyperscale",
    emptyOutDir: true,
  },
  server: { open: true },
});
