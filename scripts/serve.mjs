import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { offlineManifest } from "./offline-assets.mjs";
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".md": "text/plain",
  ".txt": "text/plain",
};
export function createStaticServer(root = process.cwd()) {
  root = path.resolve(root);
  return http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (pathname === "/offline-assets.json") {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify(await offlineManifest(root)));
        return;
      }
      let file = path.resolve(root, "." + pathname);
      if (!file.startsWith(root + path.sep) && file !== root)
        throw new Error("Forbidden");
      if (
        pathname
          .split("/")
          .some((part) => part.startsWith(".") && part !== ".nojekyll")
      )
        throw new Error("Forbidden");
      if ((await stat(file)).isDirectory())
        file = path.join(file, "index.html");
      let data = await readFile(file);
      if (pathname === "/sw.js" && data.includes("__OFFLINE_VERSION__"))
        data = Buffer.from(
          data
            .toString()
            .replaceAll(
              "__OFFLINE_VERSION__",
              (await offlineManifest(root)).version,
            ),
        );
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "text/plain",
        "Cache-Control": "no-cache",
      });
      res.end(data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url))
  createStaticServer().listen(port, "127.0.0.1", () =>
    console.log(`Sheets: http://127.0.0.1:${port}`),
  );
