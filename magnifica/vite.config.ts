import { defineConfig } from "vite";

// Served as a self-contained static bundle inside the Futures Atlas site at
// /magnifica (basePath baked in), mounted under ../public/magnifica.
// Rebuilt from source on every Vercel deploy via scripts/build-subapps.sh.
export default defineConfig({
  base: "/magnifica/",
  build: {
    outDir: "../public/magnifica",
    emptyOutDir: true,
  },
  server: { open: true },
});
