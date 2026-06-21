import { defineConfig } from "vite";

// Served as a self-contained static bundle inside the Futures Atlas site at
// /visualize, mounted under ../public/visualize.
export default defineConfig({
  base: "/visualize/",
  build: {
    outDir: "../public/visualize",
    emptyOutDir: true,
  },
  // Local dev/preview: proxy the same-origin /api/sl path to the real API (in
  // production the host Next app serves /api/sl — see src/app/api/sl).
  server: {
    open: true,
    proxy: {
      "/api/sl": { target: "https://sourcelibrary.org", changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/sl/, "/api") },
    },
  },
  preview: {
    proxy: {
      "/api/sl": { target: "https://sourcelibrary.org", changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/sl/, "/api") },
    },
  },
});

