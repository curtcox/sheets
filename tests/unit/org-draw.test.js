import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { recalculateOrg } from "../../src/formats/org/engine.js";
import { renderOrg } from "../../src/formats/org/index.js";
import { ORG_EMACS } from "../../src/compatibility-profiles.js";

const file = (name) => readFile(new URL(`../fixtures/org/${name}`, import.meta.url), "utf8");
const reference = JSON.parse(await file("reference.json"));
const rows = (result) => result.tables.flatMap((t) => t.table.rows);

test("In-cell bars equal Emacs recalculation in both modes, including empty, text and out-of-range values", async () => {
  for (const name of ["draw.org", "draw-errors.org"])
    for (const profile of [undefined, ORG_EMACS])
      assert.deepEqual(rows(recalculateOrg(await file(name), { profile })), reference[name], `${name} ${profile}`);
  const bars = reference["draw.org"];
  assert.deepEqual(bars[2].slice(2), ["WWWW", "▉▉▌", "██"]);
  assert.deepEqual(bars[4].slice(2), ["too large", "too large", "too large"]);
  assert.deepEqual(bars[6].slice(2), ["", "", ""]);
});

test("Emacs #ERROR results are written and explained; other Lisp stays unsupported", async () => {
  const result = recalculateOrg(await file("draw-errors.org"));
  assert.deepEqual(
    result.diagnostics.map((d) => [d.severity, d.message.replace(/^.*because /, "")]),
    [
      ["warning", "min and max are equal."],
      ["warning", "min and max must be numbers; field arguments are strings unless the formula ends with ;N."],
      ["warning", "the width must be a number."],
      ["warning", "division by zero: characters needs at least two characters."],
      ["warning", "orgtbl-uc-draw-cont takes 3 to 4 arguments."],
    ],
  );
  const other = recalculateOrg("| 2 | 0 |\n#+TBLFM: $2='(identity 42)");
  assert.equal(rows(other)[0][1], "0");
  assert.match(other.diagnostics[0].message, /Emacs Lisp formulas are unsupported, except orgtbl-ascii-draw/);
  for (const [formula, message] of [
    ["'(orgtbl-ascii-draw (car x) 0 10)", /unsupported/],
    ["'(orgtbl-ascii-draw $1 0 10 foo)", /argument foo is unsupported/],
    ["'(orgtbl-ascii-draw $1 0 10);%.2f", /printf format/],
    ["'(orgtbl-ascii-draw $1 0 10);L", /Literal mode/],
    ["'(orgtbl-ascii-draw $1 0 10);T", /Duration mode/],
    ["'(orgtbl-ascii-draw $1 0 10 5000)", /longer than 1000/],
  ]) {
    const result = recalculateOrg(`| 5 | kept |\n#+TBLFM: $2=${formula}`);
    assert.equal(rows(result)[0][1], "kept", formula);
    assert.match(result.diagnostics[0].message, message, formula);
  }
});

test("Bars read file constants and redraw when they change", () => {
  const source = (top) => `#+CONSTANTS: top=${top}\n| 5 |  |\n#+TBLFM: $2='(orgtbl-ascii-draw $1 0 $top 4)`;
  assert.equal(rows(recalculateOrg(source(10)))[0][1], "WW");
  assert.equal(rows(recalculateOrg(source(20)))[0][1], "W");
  const html = renderOrg(source(10)).html;
  assert.match(html, />WW</);
});
