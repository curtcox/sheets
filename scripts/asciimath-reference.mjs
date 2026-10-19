// Check the imported test data from the exact npm 1.5.0 source commit.
// Usage: node scripts/asciimath-reference.mjs /path/to/upstream/test.js
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
const path = process.argv[2];
const url =
  "https://raw.githubusercontent.com/christianp/asciimath2tex/4f4be2ca744afe0a82c2a24d559aee86688c570e/test.js";
let text;
if (path) text = await readFile(path, "utf8");
else {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok)
    throw new Error(`Upstream test request failed (${response.status}).`);
  text = await response.text();
}
assert.equal(
  createHash("sha256").update(text).digest("hex"),
  "9ef396cfcd577505bd80927d9468bdec5709cd6f98c654f458e8a849fc767775",
  "The upstream test data does not match the reviewed commit.",
);
const data = runInNewContext(
  text.slice(
    text.indexOf("const unittests = [") + "const unittests = ".length,
    text.indexOf("\nfunction run_tests()"),
  ),
  {},
  { timeout: 1000 },
);
const fixture = JSON.parse(
  await readFile(
    new URL(
      "../tests/fixtures/asciimath/upstream-corpus.json",
      import.meta.url,
    ),
  ),
);
assert.deepEqual(
  JSON.parse(
    JSON.stringify(
      data.map((item, i) => ({
        id: i + 1,
        source: item.input,
        expected: item.tex,
      })),
    ),
  ),
  fixture.cases,
);
console.log(
  `Checked ${fixture.cases.length} AsciiMath fixtures against the pinned upstream test data.`,
);
