import { defineConfig } from "vite";

// Served as a self-contained static bundle inside the Futures Atlas site at
// /trajectories, mounted under ../public/trajectories.
export default defineConfig({
  base: "/trajectories/",
  build: {
    outDir: "../public/trajectories",
    emptyOutDir: true,
  },
  server: { open: true },
});
