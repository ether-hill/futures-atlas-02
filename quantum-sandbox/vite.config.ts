import { defineConfig } from "vite";

// Served as a self-contained static bundle inside the Futures Atlas site at
// /quantum-sandbox (basePath baked in), mounted under
// ../public/quantum-sandbox. `npm run build` here refreshes that bundle.
export default defineConfig({
  base: "/quantum-sandbox/",
  build: {
    outDir: "../public/quantum-sandbox",
    emptyOutDir: true,
  },
  server: { open: true },
});
