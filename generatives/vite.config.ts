import { defineConfig } from "vite";

// Served as a self-contained static bundle inside the Futures Atlas site at
// /generatives, mounted under ../public/generatives. Two entries: the dashboard
// (index.html) and the stripped embeddable player (embed.html) that iframes load.
export default defineConfig({
  base: "/generatives/",
  build: {
    outDir: "../public/generatives",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "index.html",
        embed: "embed.html",
      },
    },
  },
  server: { open: true },
});
