import { defineConfig } from "vite";

// Served as a self-contained static bundle inside the Futures Atlas site at
// /mappings, mounted under ../public/mappings.
export default defineConfig({
  base: "/mappings/",
  build: {
    outDir: "../public/mappings",
    emptyOutDir: true,
  },
  server: { open: true },
});
