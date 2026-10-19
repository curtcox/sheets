import { test } from "node:test";
import assert from "node:assert/strict";
import { renderCalca } from "../../src/formats/calca/index.js";
import { CALCA_BLOCKS } from "../../src/compatibility-profiles.js";
const render = (source) => renderCalca(source, { profile: CALCA_BLOCKS });

test("structured Calca isolates language, unlabelled, math and Mermaid fences", () => {
  const source = [
    "```python",
    "leaked = 91",
    'print("=>")',
    "```",
    "```",
    "unlabelled = 7 =>",
    "```",
    "```math",
    "x => missing",
    "```",
    "```mermaid",
    "graph LR",
    "  A --> B",
    "```",
    "```calca",
    "price = 3",
    "count = 4",
    "price*count => old",
    "```",
    "price+count =>",
    "leaked =>",
  ].join("\n");
  const result = render(source);
  assert.match(result.recalculatedSource, /unlabelled = 7 =>\n/);
  assert.match(result.recalculatedSource, /price\*count => 12/);
  assert.match(result.recalculatedSource, /price\+count => 7/);
  assert.deepEqual(result.mermaid, ["graph LR\n  A --> B\n"]);
  assert.deepEqual(result.diagnostics, [
    { line: 21, message: "Undefined symbol leaked" },
  ]);
});
test("structured Calca handles tilde fences, long delimiters, and unterminated blocks", () => {
  for (const marker of ["~~~", "````", "~~~~~"]) {
    const result = render(
      `${marker}calca\nrate=3\nrate*2 =>\n${marker}\nrate+1 =>`,
    );
    assert.deepEqual(result.diagnostics, []);
    assert.match(result.recalculatedSource, /rate\*2 => 6/);
    assert.match(result.recalculatedSource, /rate\+1 => 4/);
  }
  const literal = render("````text\n```calca\nleaked=7 =>\n```\n````\n2+2 =>");
  assert.deepEqual(literal.diagnostics, []);
  assert.match(literal.recalculatedSource, /leaked=7 =>\n/);
  assert.match(literal.recalculatedSource, /2\+2 => 4/);
  assert.deepEqual(render("```calca").diagnostics, []);
  assert.match(render("~~~calca\n2+2 =>").recalculatedSource, /2\+2 => 4/);
  assert.deepEqual(render("~~~python\nnot a calculation =>").diagnostics, []);
});
test("structured Calca retains container prefixes and original diagnostic lines", () => {
  const source =
    "# Note\n\n> ```calca\n> rate=3\n> missingRate =>\n> rate*2 =>\n> ```\n\n- A calculation\n\n      count=4\n      count*rate =>\n\n\tcount+1 =>\n";
  const result = render(source);
  assert.deepEqual(result.diagnostics, [
    { line: 5, message: "Undefined symbol missingRate" },
  ]);
  assert.match(result.recalculatedSource, /> rate\*2 => 6/);
  assert.match(result.recalculatedSource, /      count\*rate => 12/);
  assert.match(result.recalculatedSource, /\tcount\+1 => 5/);
  const crlf = render(source.replaceAll("\n", "\r\n"));
  assert.deepEqual(crlf.diagnostics, result.diagnostics);
  assert.match(crlf.recalculatedSource, /> rate\*2 => 6\r\n/);
});
test("structured Calca preserves inline code, TeX, links, HTML and quoted arrows", () => {
  const literal =
    "A literal `x =>` stays prose.\n\n$z => w$\n\n$$\nx => y\n$$\n\n[example](https://example.org/?x=>y)\n\n<!-- x => -->\n\n# x => heading\n\n`2+2` => example\n\n<span>2+2 =></span>\n";
  const result = render(literal + '\n"a=>b" => old\n2+2 => `old`\n');
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.recalculatedSource.startsWith(literal));
  assert.match(result.recalculatedSource, /"a=>b" => a=>b/);
  assert.match(result.recalculatedSource, /2\+2 => 4/);
});
test("structured Calca still applies expression guards, continuation and fresh state", () => {
  const result = render('~~~calca\nx=import("bad")\n2+2 =>\n~~~');
  assert.equal(result.diagnostics[0].line, 2);
  assert.match(result.recalculatedSource, /2\+2 => 4/);
  assert.deepEqual(render("    value=4\n    value =>").diagnostics, []);
  assert.match(render("value =>").diagnostics[0].message, /Undefined symbol/);
});
test("Markdown footnote relocation does not change Calca source evaluation order", () => {
  const result = render(
    "[^calc]:\n    ```calca\n    rate=4\n    ```\n\nrate*2 =>\n\nA footnote[^calc].\n\nrate[^calc] => a literal reference",
  );
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.recalculatedSource, /rate\*2 => 8/);
  assert.match(
    result.recalculatedSource,
    /rate\[\^calc\] => a literal reference/,
  );
  const hidden = render(
    "[^calc]:\n    ```calca\n    rate=4\n    ```\n\nrate*2 =>",
  );
  assert.deepEqual(hidden.diagnostics, []);
  assert.match(hidden.recalculatedSource, /rate\*2 => 8/);
});
test("partial tab indentation keeps the original source prefix", () => {
  for (const source of [
    " \t2+2 =>",
    ">  \t2+2 =>",
    "- A list\n\n   \t2+2 =>",
  ]) {
    const result = render(source);
    assert.deepEqual(result.diagnostics, []);
    assert.equal(result.recalculatedSource, source + " 4");
  }
});
test("unprofiled Calca retains legacy fence evaluation for existing documents", () => {
  const source = "```python\nlegacyValue=9\n```\nlegacyValue =>";
  assert.match(renderCalca(source).recalculatedSource, /legacyValue => 9/);
  assert.match(
    render(source).diagnostics[0].message,
    /Undefined symbol legacyValue/,
  );
  assert.throws(
    () => renderCalca(source, { profile: "calca-future" }),
    /Unsupported compatibility profile/,
  );
});
