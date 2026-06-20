import { defineConfig } from "vite";

// Served as a self-contained static bundle inside the Futures Atlas site at
// /prism, mounted under ../public/prism. Two entries: the dashboard (index.html)
// and the stripped embeddable player (embed.html) that iframes load.
export default defineConfig({
  base: "/prism/",
  build: {
    outDir: "../public/prism",
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
