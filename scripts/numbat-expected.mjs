// Check the recorded oracle with an independently built, unpatched upstream pkg.
// Usage: node scripts/numbat-expected.mjs /absolute/path/to/numbat-wasm/www/pkg
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const path = process.argv[2];
if (!path)
  throw new Error("Supply the unmodified upstream WASM package directory.");
const {
  default: init,
  Numbat,
  FormatType,
} = await import(pathToFileURL(resolve(path, "numbat_wasm.js")));
await init({
  module_or_path: await readFile(resolve(path, "numbat_wasm_bg.wasm")),
});
const { cases } = JSON.parse(
  await readFile(
    new URL("../tests/fixtures/numbat/statements.json", import.meta.url),
  ),
);
for (const fixture of cases) {
  const context = Numbat.new(true, true, FormatType.Html);
  try {
    const result = context.interpret(fixture.source);
    try {
      assert.deepEqual(
        { isError: result.is_error, output: result.output },
        fixture.reference,
        fixture.id,
      );
    } finally {
      result.free();
    }
  } finally {
    context.free();
  }
}
console.log(
  `Checked ${cases.length} Numbat fixtures against the supplied upstream WASM.`,
);
