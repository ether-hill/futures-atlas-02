import { defineConfig } from "vite";

// Served as a self-contained static bundle inside the Futures Atlas site at
// /literal-frequency, mounted under ../public/literal-frequency.
export default defineConfig({
  base: "/literal-frequency/",
  build: {
    outDir: "../public/literal-frequency",
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

