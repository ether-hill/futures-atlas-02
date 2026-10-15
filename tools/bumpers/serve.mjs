// Serves the repo root on localhost only, so the bumper page can fetch the
// logo animator and the Archivo font by relative path.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".ttf": "font/ttf", ".png": "image/png", ".mp4": "video/mp4", ".json": "application/json" };

export function startServer(port = Number(process.env.PORT) || 8996) {
  const server = createServer(async (req, res) => {
    let path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (path.endsWith("/")) path += "index.html";
    const allowed = path.startsWith("/tools/") || path.startsWith("/dataviz/fonts/") || path.startsWith("/public/interference/");
    try {
      if (!allowed) throw new Error("not here");
      const body = await readFile(join(root, path));
      res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404); res.end("not found");
    }
  });
  return new Promise((ok) => server.listen(port, "127.0.0.1", () => ok(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const s = await startServer();
  console.log(`bumpers on http://localhost:${s.address().port}/tools/bumpers/`);
}
