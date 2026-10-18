import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm, appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { offlineManifest } from "../../scripts/offline-assets.mjs";
import { stage, served } from "../../scripts/stage.mjs";
test("Pages stage contains only served assets and the commit marker", async () => {
  const directory = await mkdtemp(`${tmpdir()}/sheets-stage-`);
  try {
    await stage(directory, "abc1234");
    assert.deepEqual((await readdir(directory)).sort(), served.slice().sort());
    const html = await readFile(`${directory}/index.html`, "utf8");
    assert.ok(html.includes("sheets-editor-v1"));
    assert.ok(html.includes("abc1234"));
    assert.ok(!html.includes("__COMMIT_SHA__"));
    const manifest = JSON.parse(
      await readFile(`${directory}/offline-assets.json`, "utf8"),
    );
    assert.equal(manifest.version, (await offlineManifest(directory)).version);
    assert.ok(manifest.assets.some((asset) => asset.path.endsWith(".wasm")));
    assert.ok(
      manifest.assets.some((asset) => asset.path.includes("/licenses/")),
    );
    assert.ok(
      manifest.assets.some(
        (asset) => asset.path === "examples/covers/gfm-basic.png",
      ),
    );
    for (const asset of manifest.assets) {
      assert.ok(
        /^(?:index.html|gallery.html|docs.html|src\/|vendor\/|docs\/|examples\/)/.test(
          asset.path,
        ),
      );
      assert.ok(!/[?#]|(?:^|\/)\.\.(?:\/|$)/.test(asset.path));
      const bytes = await readFile(`${directory}/${asset.path}`);
      assert.equal(
        asset.integrity,
        "sha256-" + createHash("sha256").update(bytes).digest("base64"),
      );
    }
    const worker = await readFile(`${directory}/sw.js`, "utf8");
    assert.ok(worker.includes(manifest.version));
    assert.ok(!worker.includes("__OFFLINE_VERSION__"));
    await appendFile(
      `${directory}/sw.js`,
      "\n// A worker-only update must get a separate cache.\n",
    );
    assert.notEqual(
      (await offlineManifest(directory)).version,
      manifest.version,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
