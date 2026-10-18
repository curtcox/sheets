import { readdir, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { publicAssets } from "./public-assets.mjs";
const runtime =
  /\.(?:html|js|mjs|css|json|wasm|woff2?|ttf|svg|png|md|txt|am|nbt|calc|org|calca|hurmet|bean|qmd)$/;
export async function offlineManifest(root) {
  const paths = [];
  async function walk(relative) {
    if ((await stat(path.join(root, relative))).isDirectory()) {
      for (const name of (await readdir(path.join(root, relative))).sort())
        await walk(`${relative}/${name}`);
    } else if (
      relative !== "sw.js" &&
      (runtime.test(relative) ||
        /(?:^|\/)(?:licenses?|LICENSE[^/]*|COPYING[^/]*|NOTICE[^/]*)(?:\/|$)/i.test(
          relative,
        ))
    )
      paths.push(relative);
  }
  for (const entry of publicAssets) await walk(entry);
  let bytes = 0;
  const assets = [];
  for (const relative of paths.sort()) {
    const content = await readFile(path.join(root, relative));
    bytes += content.length;
    assets.push({
      path: relative,
      integrity:
        "sha256-" + createHash("sha256").update(content).digest("base64"),
    });
  }
  const worker = (await readFile(path.join(root, "sw.js"), "utf8")).replace(
    /const VERSION = "[^\"]+";/,
    'const VERSION = "__OFFLINE_VERSION__";',
  );
  const version = createHash("sha256")
    .update(JSON.stringify(assets))
    .update(worker)
    .digest("hex")
    .slice(0, 20);
  return { version, bytes, assets };
}
