import { test } from "node:test";
import assert from "node:assert/strict";
import { recalculateOrg } from "../../src/formats/org/engine.js";
import { buildWorkbook, workbookBytes } from "../../src/exports/workbook.js";
const snapshot = (src) => ({
  title: "Model",
  state: { type: "org", src },
  model: [],
  workbook: recalculateOrg(src).workbook,
});
test("Org workbook formulas retain references, inputs, precedence and cached values", async () => {
  const src =
    "#+CONSTANTS: rate=2\n| A | B | Result |\n|---+---+---|\n| 3 | 4 | 0 |\n| 5 | 6 | 0 |\n#+TBLFM: $3=$1+$2*$rate";
  const doc = snapshot(src),
    result = buildWorkbook(doc),
    sheet = result.sheets[0];
  assert.equal(result.formulaCount, 2);
  assert.equal(sheet.rows[1][2].value, "11");
  assert.match(sheet.rows[1][2].formula, /\$A\$2/);
  assert.match(sheet.rows[1][2].formula, /'Inputs'!\$B\$2/);
  const { bytes } = await workbookBytes(doc, "xlsx", {});
  assert.ok(bytes.byteLength > 2000);
});
test("workbook translates conditions, ranges, hlines and absolute references", () => {
  const doc = snapshot(
    "| A | B | C |\n|---+---+---|\n| 2 | 3 | 0 |\n| 4 | 5 | 0 |\n| 0 | 0 | 0 |\n#+TBLFM: @2$3=if($1<$2,10,20)::@3$3=@-1$3+1::@4$3=vsum(@I$1..@3$1)",
  );
  const result = buildWorkbook(doc);
  assert.equal(result.formulaCount, 3);
  assert.match(result.sheets[0].rows[1][2].formula, /IF\(/);
  assert.match(result.sheets[0].rows[3][2].formula, /SUM\(/);
});
test("working exports block unsupported formulas, cycles and engine gaps; snapshots are explicit", () => {
  for (const formula of ["$2=sin($1)", "$2=$2+1"])
    assert.throws(
      () => buildWorkbook(snapshot("| 2 | 0 |\n#+TBLFM: " + formula)),
      /subset|self-referencing/,
    );
  const doc = snapshot("| 2 | 0 |\n#+TBLFM: $2=sin($1)");
  assert.equal(buildWorkbook(doc, { valuesOnly: true }).formulaCount, 0);
  assert.throws(
    () =>
      buildWorkbook({ ...doc, workbook: undefined, state: { type: "hurmet" } }),
    /not supported yet/,
  );
});
test("formula-looking literals stay strings and precision-sensitive numeric strings are not coerced", () => {
  const doc = snapshot(
    '| =HYPERLINK("evil") | +cmd | @evil | 123456789012345678 |',
  );
  const row = buildWorkbook(doc).sheets[0].rows[0];
  assert.ok(row.every((c) => !c.numeric && !c.formula));
});
