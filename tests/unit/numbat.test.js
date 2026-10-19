import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import init, {
  Numbat,
  FormatType,
} from "../../vendor/numbat@1.24.0/numbat_wasm.js";
import { statements } from "../../src/formats/numbat/statements.js";
import { evaluateNumbat } from "../../src/formats/numbat/engine.js";
await init({
  module_or_path: await readFile(
    new URL("../../vendor/numbat@1.24.0/numbat_wasm_bg.wasm", import.meta.url),
  ),
});
const { cases } = JSON.parse(
  await readFile(
    new URL("../fixtures/numbat/statements.json", import.meta.url),
  ),
);
for (const fixture of cases)
  test(`Numbat parser and source locations: ${fixture.id}`, () => {
    // Whole-document output was captured with the original unmodified WASM.
    // This path does not use the adapter or its source-range API.
    const context = Numbat.new(true, true, FormatType.Html);
    try {
      const result = context.interpret(fixture.source);
      try {
        assert.equal(result.is_error, fixture.reference.isError);
        assert.equal(result.output, fixture.reference.output);
      } finally {
        result.free();
      }
    } finally {
      context.free();
    }
    const chunks = statements(fixture.source);
    assert.equal(chunks.map((row) => row.source).join(""), fixture.source);
    for (const row of chunks)
      assert.equal(
        fixture.source.slice(row.offset, row.offset + row.source.length),
        row.source,
      );
    const result = evaluateNumbat(fixture.source),
      active = result.rows.filter((row) => row.output);
    assert.equal(active.length, fixture.statements);
    if (fixture.contains)
      assert.ok(
        active
          .at(-1)
          .output.replace(/<[^>]*>/g, "")
          .includes(fixture.contains),
        active.at(-1).output,
      );
    if (!fixture.reference.isError) assert.deepEqual(result.diagnostics, []);
    if (fixture.diagnostics) {
      assert.equal(result.diagnostics.length, fixture.diagnostics.length);
      for (const [i, expected] of fixture.diagnostics.entries()) {
        const diagnostic = result.diagnostics[i];
        assert.equal(diagnostic.line, expected.line);
        assert.equal(diagnostic.column, expected.column);
        assert.equal(
          fixture.source.slice(diagnostic.start, diagnostic.end),
          expected.text,
        );
      }
    }
  });

test("Numbat keeps related labels in earlier source inputs and module labels unmapped", () => {
  const src = "fn sheet_f(x: Length) = x\n\nlet value = sheet_f(2 s)\n42";
  const result = evaluateNumbat(src);
  assert.equal(result.diagnostics.length, 1);
  const diagnostic = result.diagnostics[0];
  assert.equal(diagnostic.line, 3);
  assert.ok(
    diagnostic.related.some((label) => label.mapped && label.line === 1),
  );
  assert.match(result.rows.at(-1).output.replace(/<[^>]*>/g, ""), /= 42/);
  const reserved = evaluateNumbat("let g = 2\n42");
  assert.equal(reserved.diagnostics[0].line, 1);
  assert.ok(
    reserved.diagnostics[0].related.some(
      (label) => !label.mapped && /Module/.test(label.source),
    ),
  );
});

test("Numbat contexts reset after errors and retain print output", () => {
  const first = evaluateNumbat(
    "let sheetvalue = 8\nassert(false)\nprint(sheetvalue)\n42",
  );
  assert.equal(first.diagnostics.length, 1);
  assert.match(first.rows.at(-2).output, /8/);
  assert.match(first.rows.at(-1).output.replace(/<[^>]*>/g, ""), /= 42/);
  assert.equal(evaluateNumbat("sheetvalue").diagnostics.length, 1);
});
