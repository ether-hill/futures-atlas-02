// Static server for the dataviz folder. `node serve.mjs` -> http://localhost:8997
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".csv": "text/csv; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".ttf": "font/ttf", ".md": "text/plain; charset=utf-8", ".mp4": "video/mp4",
};

export function startServer(port = Number(process.env.PORT) || 8997) {
  const server = createServer(async (req, res) => {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = normalize(join(root, path));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    try {
      if ((await stat(file)).isDirectory()) { res.writeHead(302, { location: path + "/" }).end(); return; }
      const body = await readFile(file);
      const type = TYPES[extname(file)] ?? "application/octet-stream";
      const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
      if (range) { // video players ask for byte ranges
        const start = range[1] ? +range[1] : 0, end = range[2] ? +range[2] : body.length - 1;
        res.writeHead(206, { "content-type": type, "content-range": `bytes ${start}-${end}/${body.length}`, "accept-ranges": "bytes", "content-length": end - start + 1 });
        res.end(body.subarray(start, end + 1));
        return;
      }
      res.writeHead(200, { "content-type": type, "cache-control": "no-store", "accept-ranges": "bytes" });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  return new Promise((ok) => server.listen(port, () => ok(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const s = await startServer();
  console.log(`dataviz on http://localhost:${s.address().port}/`);
}
