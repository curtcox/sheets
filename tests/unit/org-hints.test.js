import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { hasDivisionProduct, formulaPrecedenceHints, PRECEDENCE_HINT } from "../../src/formats/org/precedence-hints.js";
import { parseCalc } from "../../src/formats/org/calc.js";
import { recalculateOrg } from "../../src/formats/org/engine.js";
import { renderOrg } from "../../src/formats/org/index.js";
import { detect } from "../../src/formats/registry.js";
import { readURL, writeURL } from "../../src/url-state.js";
import { HashBinDocuments } from "../../src/hashbin.js";

const option = "#+SHEETS_HINTS: precedence\n";
const fixture = () => readFile(new URL("../fixtures/org/calc-precedence-hints.org", import.meta.url), "utf8");
const rows = (result) => result.tables.flatMap(({ table }) => table.rows);

test("parser-aware hints distinguish multiplication from powers, explicit grouping and implicit-only products", () => {
  for (const expression of [
    "10/4*2", "10 / 4 * 2 * 3", "10/-4*2", "(10/4*2)", "10/4^2*3",
    "10/(4)*2", "10/4*(2)", "10/4 2*3", "if(0,10/4*2,7)", "sqrt(10/4*2)",
    "$price/$users*$rate", "@2$1/@2$2*$3", "vsum(@I$1..@II$1)/2*3",
    "remote(inputs,@1$1)/2*remote(inputs,@1$2)", "vsum($start..$end)/2*3",
  ]) assert.equal(hasDivisionProduct(expression), true, expression);
  for (const expression of [
    "(10/4)*2", "10/(4*2)", "10/((4)*2)", "(10/4)*(2*3)", "10/4**2", "10/4^2",
    "10/4 2", "10/(4*2) 3", "10/4/2", "10/4+2*3", "10/4%2*3", "2*3/4",
    "if(1,(10/4)*2,10/(4*2))", "vsum(@1$1..@2$1)/(2*3)",
    "'(+ 1 (/ 10 4) (* 2 3))", '"10/4*2"', "10/4*2+???", "10/4*2)",
    "(".repeat(201) + "10/4*2" + ")".repeat(201), "1+".repeat(2001) + "10/4*2",
  ]) assert.equal(hasDivisionProduct(expression), false, expression.slice(0, 90));
  const expression = "if(1,10/4*2,(10/4)*2)";
  assert.deepEqual(parseCalc(expression), parseCalc(expression, { onDivisionProduct() {} }));
});

test("active formulas get one informational hint per original line without changing native results or source", async () => {
  const src = await fixture(), reference = JSON.parse(await readFile(new URL("../fixtures/org/reference.json", import.meta.url), "utf8"));
  for (const profile of [undefined, "org-emacs-v1"]) {
    const baseline = recalculateOrg(src, { profile }), hinted = recalculateOrg(option + src, { profile });
    assert.deepEqual(rows(baseline), reference["calc-precedence-hints.org"]);
    assert.deepEqual(rows(hinted), rows(baseline));
    assert.deepEqual(baseline.diagnostics, []);
    assert.deepEqual(hinted.diagnostics, [7, 10, 16].map((line) => ({ line, severity: "info", message: PRECEDENCE_HINT })));
    assert.equal(hinted.source, option + baseline.source);
    const result = renderOrg(option + src, { profile });
    assert.match(result.html, /aria-label="Formula hints"/);
    assert.equal((result.html.match(/<li>Line /g) || []).length, 3);
    assert.match(result.html, /Line 7: Calc multiplies/);
    assert.deepEqual(formulaPrecedenceHints("$1=10/4*2::$2=20/5*2;%.2f", 4), [{ line: 4, severity: "info", message: PRECEDENCE_HINT }]);
    assert.ok(!renderOrg(src, { profile }).html.includes("Formula hints"));
    assert.equal(renderOrg("#+SHEETS_HINTS: none\n" + src, { profile }).html, renderOrg(src, { profile }).html);
  }
});

test("hints do not prevent Emacs-order writes, duplicate rejection or cell-retaining errors", () => {
  const src = "| 10 | 4 | 2 | 99 |\n#+TBLFM: $4=$1/$2*$3\n";
  for (const profile of [undefined, "org-emacs-v1"]) {
    assert.equal(rows(recalculateOrg(option + src, { profile }))[0][3], "1.25");
    const failed = recalculateOrg(option + src.replace("$2*$3", "0*$3"), { profile });
    assert.equal(rows(failed)[0][3], "99");
    assert.match(failed.diagnostics[0].message, /Division by zero/);
    assert.equal(failed.diagnostics[1].severity, "info");
  }
  const duplicated = recalculateOrg(option + src.replace("$4=$1", "$4=7::$4=$1"), { profile: "org-emacs-v1" });
  assert.match(duplicated.diagnostics[0].message, /Duplicate formula target/);
  assert.equal(rows(duplicated)[0][3], "99");
});

test("hint directives obey AST ownership, last-directive precedence and normal scheduling", () => {
  const src = "| 0 |\n#+TBLFM: $1=10/4*2\n#+TBLFM: $1=20/5*2\n";
  assert.equal(recalculateOrg(option + src).formulaHints.length, 2);
  assert.equal(recalculateOrg(option + src, { profile: "org-emacs-v1" }).formulaHints.length, 1);
  const spaced = option + "| 0 |\n\n#+TBLFM: $1=10/4*2\n";
  assert.equal(recalculateOrg(spaced).formulaHints.length, 0);
  assert.equal(recalculateOrg(spaced, { profile: "org-emacs-v1" }).formulaHints.length, 1);
  for (const kind of ["SRC org", "EXAMPLE", "EXPORT html", "COMMENT"]) {
    const literal = `#+BEGIN_${kind}\n${option}${src}#+END_${kind.split(" ")[0]}\n`;
    assert.deepEqual(recalculateOrg(literal + src).diagnostics, []);
    assert.equal(recalculateOrg(option + literal).formulaHints.length, 0);
  }
  assert.equal(recalculateOrg(option + src + "#+sheets_hints: NONE\n").formulaHints.length, 0);
  assert.equal(recalculateOrg("#+SHEETS_HINTS: bad\n" + src + "#+sheets_hints: PRECEDENCE\n").formulaHints.length, 2);
  for (const value of ["wrong", "", "<script>bad()</script>"]) {
    const result = recalculateOrg(`#+SHEETS_HINTS: ${value}\n` + src);
    assert.deepEqual(result.diagnostics, [{ line: 1, severity: "warning", message: "Unsupported SHEETS_HINTS option. Use precedence or none." }]);
    assert.equal(result.formulaHints.length, 0);
  }
  assert.equal(detect(option), "org");
});

test("hints inspect formula syntax, not mode strings or substituted field expressions", () => {
  const src = option + "| 10/4*2 | 0 |\n#+TBLFM: $2=$1\n";
  assert.equal(recalculateOrg(src).formulaHints.length, 0);
  assert.deepEqual(formulaPrecedenceHints("$1=(10/4)*2;%10/4*2f", 3), []);
  assert.deepEqual(formulaPrecedenceHints("no assignment::$1=10/4**2", 3), []);
});

test("BOM/CRLF and URL/HashBin round-trips retain the source option and hint line numbers", async () => {
  const src = "\uFEFF" + (option + await fixture()).replaceAll("\n", "\r\n");
  for (const profile of [undefined, "org-emacs-v1"]) {
    const state = readURL(writeURL("https://example.com/", { src, format: "org", profile })),
      saved = HashBinDocuments.parse(HashBinDocuments.serialize({ src, type: "org", profile }));
    assert.equal(state.src, src);
    assert.equal(saved.src, src);
    assert.deepEqual(renderOrg(saved.src, { profile }), renderOrg(state.src, { profile }));
    assert.deepEqual(recalculateOrg(src, { profile }).formulaHints.map((hint) => hint.line), [7, 10, 16]);
  }
});
