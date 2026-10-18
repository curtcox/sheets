import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
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
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
