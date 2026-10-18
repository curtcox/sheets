import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
const root = new URL("../../", import.meta.url);
test("every gallery example has a current cover with the declared dimensions", async () => {
  const examples = JSON.parse(
    await readFile(new URL("examples/catalog.json", root)),
  );
  const directory = new URL("examples/covers/", root);
  const manifest = JSON.parse(
    await readFile(new URL("manifest.json", directory)),
  );
  assert.deepEqual(
    Object.keys(manifest.sources).sort(),
    examples.map((item) => item.id).sort(),
  );
  assert.deepEqual(
    (await readdir(directory)).filter((name) => name.endsWith(".png")).sort(),
    examples.map((item) => item.id + ".png").sort(),
  );
  for (const item of examples) {
    const source = await readFile(new URL(item.path, root));
    assert.equal(
      manifest.sources[item.id],
      createHash("sha256").update(source).digest("hex"),
      `Regenerate the cover for ${item.id}`,
    );
    const png = await readFile(new URL(item.id + ".png", directory));
    assert.deepEqual(
      png.subarray(0, 8),
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    assert.equal(png.readUInt32BE(16), manifest.width, item.id);
    assert.equal(png.readUInt32BE(20), manifest.height, item.id);
  }
});
