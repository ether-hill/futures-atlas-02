import { defineConfig } from "vite";

// Served as a self-contained static bundle inside the Futures Atlas site at
// /gigawatt, mounted under ../public/gigawatt.
export default defineConfig({
  base: "/gigawatt/",
  build: {
    outDir: "../public/gigawatt",
    emptyOutDir: true,
  },
  server: { open: true },
});
