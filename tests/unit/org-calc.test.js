import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateCalc,
  formatCalc,
  parseModes,
  elispNumber,
} from "../../src/formats/org/calc.js";
import { recalculateOrg } from "../../src/formats/org/engine.js";

const calc = (expression, suffix = null, refs = []) => {
  const modes = parseModes(suffix);
  return formatCalc(evaluateCalc(expression, refs, modes), modes);
};
const cell = (formula, ...cells) => {
  const result = recalculateOrg(
    `| ${[...cells, ""].join(" | ")} |\n#+TBLFM: $${cells.length + 1}=${formula}\n`,
  );
  return {
    value: result.tables[0].table.rows[0][cells.length],
    diagnostics: result.diagnostics,
  };
};

test("Org Calc defaults: degrees, 12 internal digits and an 8-digit float display (ORG-09)", () => {
  // Values recorded from Emacs 31.1 / Org 9.8.7 (see design/org-calc.md).
  for (const [expression, expected] of [
    ["sin(30)", "0.5"],
    ["1/3", "0.33333333"],
    ["2^0.5", "1.4142136"],
    ["sin(90)", "1"],
    ["sin(180.0)", "0."],
    ["tan(45)", "1."],
    ["arcsin(0.5)", "30."],
    ["sin(1e10)", "-0.98480808"],
    ["10/4*2", "1.25"],
    ["2*3/4", "1.5"],
    ["-2^2", "-4"],
    ["2^3^2", "512"],
    ["2 3", "6"],
    ["(1+2)(3+4)", "21"],
    ["2^100", "1267650600228229401496703205376"],
    ["2.5*2", "5."],
    ["0.001", "1e-3"],
    ["123456789012.", "123456790000."],
    ["1234567890123.", "1.2345679e12"],
    ["sqrt(2)^2", "2.0000000"],
    ["log10(2)", "0.30103000"],
    ["log(2,8)", "0.33333333"],
    ["round(1.005,2)", "1.01"],
    ["-7%3", "2"],
    ["7\\2", "3"],
    ["5!", "120"],
    ["3!!", "3"],
    ["50%", "0.5"],
    ["[1,2]*[3,4]", "11"],
    ["[1,2]/2", "[0.5, 1]"],
  ])
    assert.equal(calc(expression), expected, expression);
});

test("Org mode letters follow org-table-eval-formula, including printf on the displayed value", () => {
  for (const [expression, suffix, expected] of [
    ["sin(30)", "R", "-0.98803162"],
    ["sin(30)", "RD", "0.5"],
    ["1/3", "p4", "0.3333"],
    ["1/3", "n3", "0.333"],
    ["100/3", "f2", "33.33"],
    ["1/3", "s2", "3.3e-1"],
    ["1/3", "e2", "330e-3"],
    ["6/4", "F", "3:2"],
    ["1/3", "%.10f", "0.3333333300"],
    ["0.125", "%.2f", "0.12"],
    ["0.375", "%.2f", "0.38"],
    ["-0.001", "%.2f", "-0.00"],
    ["2.7", "%d", "2"],
    ["2/3", "%.3e", "6.667e-01"],
    ["1e20/3", "%g", "3.33333e+19"],
    ["1/3", "N%.2f", "0.33"],
    ["1/3", "%.2fN", "0.33"],
    ["1/3", "L", "0.33333333"],
  ])
    assert.equal(calc(expression, suffix), expected, `${expression};${suffix}`);
  assert.equal(parseModes("N", "%.3f").printf, "%.3f");
  assert.equal(parseModes(null, "%.3f").printf, null);
});

test("Org field references use org-table-make-reference empty, E and N rules", () => {
  assert.equal(cell("$1+1", "").value, "1");
  assert.equal(cell("$1+1;E", "").value, "nan");
  assert.equal(cell("$1+1;EN", "").value, "1");
  assert.equal(cell("$1;N", "12abc").value, "12");
  assert.equal(cell("$1;N", "3.").value, "3");
  assert.equal(cell("$1", "3.").value, "3.");
  assert.equal(cell("$1", "1e3").value, "1000.");
  assert.equal(cell("vsum($1..$3)", "1", "", "2.5").value, "3.5");
  assert.equal(cell("vmean($1..$3);E", "1", "", "2").value, "nan");
  assert.equal(cell("vcount($1..$2)", "x", "12ab").value, "2");
  assert.deepEqual(elispNumber(" -.5x"), { float: -0.5 });
  assert.deepEqual(elispNumber("1."), { int: 1n });
  assert.deepEqual(elispNumber("0x10"), { int: 0n });
  const symbolic = cell("vsum($1..$2)", "1", "Total");
  assert.equal(symbolic.value, "");
  assert.match(symbolic.diagnostics[0].message, /symbolic.*;N/);
});

test("Unsupported Calc results and modes are diagnosed and retain the cell", () => {
  for (const [formula, pattern] of [
    ["asin(0.5)", /Use arcsin\(\)/],
    ["pi*2", /symbolic/],
    ["sqrt(-4)", /complex/],
    ["ln(-1)", /complex/],
    ["1/0", /Division by zero/],
    ["tan(90)", /Division by zero/],
    ["1;T", /Duration mode/],
    ["1;S", /Symbolic mode/],
    ["1;u", /Unit simplification/],
    ["1;p500", /precision/],
    ["1;%s", /unsupported/],
    ["1;%.1f%.2f", /exactly one/],
    ["(1, 2)", /complex/],
    ["a := 2", /Unsupported Calc syntax/],
    ["2^100000", /exceeds/],
    ["5000!", /too large/],
    ["0.5!", /nonnegative integers/],
    ["vmean()", /at least one/],
    ['"text"', /Unsupported Calc syntax/],
  ]) {
    const result = recalculateOrg(`| 7 |\n#+TBLFM: @1$1=${formula}\n`);
    assert.equal(result.diagnostics.length, 1, formula);
    assert.match(result.diagnostics[0].message, pattern, formula);
    assert.equal(result.diagnostics[0].line, 2, formula);
    assert.equal(result.tables[0].table.rows[0][0], "7", formula);
  }
});

test("Calc parsing is bounded in length, size and nesting", () => {
  for (const expression of [
    "1+".repeat(2100) + "1",
    "1+".repeat(1200) + "1",
    "(".repeat(300) + "1" + ")".repeat(300),
  ])
    assert.throws(() => calc(expression), /too long|too complex|too deep/);
});
