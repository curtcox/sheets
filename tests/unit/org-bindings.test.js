import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { recalculateOrg } from "../../src/formats/org/engine.js";
import { renderOrg } from "../../src/formats/org/index.js";
const fixture = (name) =>
  readFile(new URL(`../fixtures/org/${name}.org`, import.meta.url), "utf8");

test("Org names, constants, marker selection, duplicate precedence and snapshots match independent Emacs fixtures", async () => {
  const reference = JSON.parse(
    await readFile(
      new URL("../fixtures/org/reference.json", import.meta.url),
      "utf8",
    ),
  );
  for (const name of [
    "named-columns",
    "named-fields",
    "named-ranges",
    "constants",
    "name-precedence",
    "named-duplicates",
    "named-case",
    "named-hlines",
    "literal",
  ]) {
    const result = recalculateOrg(await fixture(name));
    assert.deepEqual(result.diagnostics, [], name);
    assert.deepEqual(
      result.tables.flatMap((t) => t.table.rows),
      reference[name + ".org"],
      name,
    );
  }
});

test("Org unmarked special tables keep column formulas out of metadata and data without recalculation marks", () => {
  const result = recalculateOrg(
    "| ! | value | result |\n|   | 2 | 77 |\n| $ | fee=3 | |\n#+TBLFM: $3=$value+$fee::@2$2=5\n",
  );
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.tables[0].table.rows, [
    ["!", "value", "result"],
    ["", "5", "77"],
    ["$", "fee=3", ""],
  ]);
});

test("Org unsupported numeric bindings and unknown/property names have original-line diagnostics without fallback", () => {
  const src =
    "#+CONSTANTS: rate=3 text=hello\n\n| $ | rate=2+3 | |\n| # | 1 | 0 |\n#+TBLFM: $3=$rate::@2$2=$PROP_rate\n";
  const result = recalculateOrg(src);
  assert.deepEqual(
    result.diagnostics.map((d) => d.line),
    [1, 3, 5, 5],
  );
  assert.match(result.diagnostics[0].message, /finite decimal/);
  assert.match(result.diagnostics[2].message, /\$rate/);
  assert.match(
    result.diagnostics[3].message,
    /Undefined named reference \$PROP_rate/,
  );
  assert.equal(result.tables[0].table.rows[1][2], "0");
  assert.equal(result.tables[0].table.rows[1][1], "1");
});

test("Org column aliases are RHS references, while only named fields can be assignment targets", () => {
  const result = recalculateOrg(
    "| ! | value | result |\n| # | 2 | 0 |\n#+TBLFM: $result=4::$3=$Value\n",
  );
  assert.deepEqual(
    result.diagnostics.map((d) => d.line),
    [3, 3],
  );
  assert.match(result.diagnostics[0].message, /Unknown named field target/);
  assert.match(
    result.diagnostics[1].message,
    /Undefined named reference \$Value/,
  );
  assert.equal(result.tables[0].table.rows[1][2], "0");
});

test("Org quoted Calc strings and unknown functions are diagnosed without changing the cell", () => {
  for (const formula of [
    '@1$1=simplify("$missing + 1")',
    '@1$1="text"',
    "@1$1=asin(0.5)",
  ]) {
    const result = recalculateOrg(`| 0 |\n#+TBLFM: ${formula}\n`);
    assert.equal(result.diagnostics.length, 1, formula);
    assert.equal(result.diagnostics[0].line, 2, formula);
    assert.equal(result.tables[0].table.rows[0][0], "0", formula);
  }
  assert.match(
    recalculateOrg("| 0 |\n#+TBLFM: @1$1=asin(0.5)\n").diagnostics[0].message,
    /Use arcsin\(\)/,
  );
});

test("Org named fields require immediately adjacent data rows, not a row across an hline", () => {
  const result = recalculateOrg(
    "| ^ | outside |\n|---+---|\n| # | 2 |\n#+TBLFM: $2=$outside\n",
  );
  assert.equal(result.diagnostics.length, 1);
  assert.match(result.diagnostics[0].message, /Undefined named reference/);
});

test("Org literal blocks preserve their source and do not install constants or render executable markup", async () => {
  const source = await fixture("literal");
  const result = renderOrg(source);
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.recalculatedSource.includes("| 2 | 0 |"));
  assert.ok(result.html.includes("<pre><code>#+CONSTANTS: rate=999"));
  assert.ok(result.html.includes("<td>6</td>"));
  const malicious = renderOrg(
    "#+BEGIN_EXPORT html\n<script>bad()</script>\n| 2 | 0 |\n#+TBLFM: $2=2\n#+END_EXPORT\n",
  );
  assert.ok(malicious.html.includes("&lt;script&gt;"));
  assert.ok(!malicious.html.includes("<script>"));
  assert.equal(
    malicious.recalculatedSource,
    "#+BEGIN_EXPORT html\n<script>bad()</script>\n| 2 | 0 |\n#+TBLFM: $2=2\n#+END_EXPORT\n",
  );
});

test("Org numeric bindings beyond JavaScript numbers are read exactly as Calc floats, matching Emacs", () => {
  for (const [value, expected] of [
    ["1e309", "1e309"],
    ["1e-400", "1e-400"],
    ["0e-400", "0."],
  ]) {
    const result = recalculateOrg(
      `#+CONSTANTS: value=${value}\n| 99 |\n#+TBLFM: @1$1=$value\n`,
    );
    assert.deepEqual(result.diagnostics, [], value);
    assert.equal(result.tables[0].table.rows[0][0], expected, value);
  }
  const outside = recalculateOrg(
    "#+CONSTANTS: value=1e9999999\n| 99 |\n#+TBLFM: @1$1=$value\n",
  );
  assert.deepEqual(
    outside.diagnostics.map((d) => d.line),
    [1, 3],
  );
  assert.equal(outside.tables[0].table.rows[0][0], "99");
});
