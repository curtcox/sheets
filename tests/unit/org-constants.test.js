import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderOrg } from "../../src/formats/org/index.js";
import { recalculateOrg } from "../../src/formats/org/engine.js";
import { readURL, writeURL } from "../../src/url-state.js";
import { HashBinDocuments } from "../../src/hashbin.js";
import { detect } from "../../src/formats/registry.js";

const fixture = () => readFile(new URL("../fixtures/org/constants-display.org", import.meta.url), "utf8");
const rows = (result) => result.tables.flatMap(({ table }) => table.rows);

test("optional constants display uses effective bindings and preserves independent native calculations", async () => {
  const src = await fixture(),
    reference = JSON.parse(await readFile(new URL("../fixtures/org/reference.json", import.meta.url), "utf8"));
  for (const profile of [undefined, "org-emacs-v1"]) {
    const result = recalculateOrg(src, { profile }),
      displayed = renderOrg(src, { profile });
    assert.deepEqual(result.diagnostics, []);
    assert.deepEqual(rows(result), reference["constants-display.org"]);
    assert.deepEqual(result.fileConstants, [
      { name: "rate", value: "2.5", line: 3, valid: true },
      { name: "shift", value: "1e1", line: 3, valid: true },
      { name: "dup", value: "5", line: 13, valid: true },
    ]);
    assert.match(displayed.html, /<caption>File constants<\/caption>/);
    assert.match(displayed.html, /scope="row"[^>]*><code>\$dup<\/code><\/th><td class="org-right">5<\/td><td class="org-left">Line 13/);
    assert.ok(displayed.html.indexOf("<h1>") < displayed.html.indexOf('class="org-constants"'));
    assert.ok(displayed.html.indexOf('class="org-constants"') < displayed.html.indexOf('aria-label="Org table"'));
    assert.match(displayed.html, /Table parameters and named fields can override/);
    assert.match(displayed.html, />27\.00<\/td>/);
    assert.match(displayed.html, />15\.00<\/td>/);
    assert.ok(displayed.recalculatedSource.includes("#+SHEETS_CONSTANTS: table"));
    assert.equal((displayed.html.match(/class="org-constants"/g) || []).length, 1);
  }
});

test("constants stay hidden by default and none restores identical native-style HTML", async () => {
  const src = (await fixture()).replace("#+SHEETS_CONSTANTS: table\n", "");
  for (const profile of [undefined, "org-emacs-v1"]) {
    const hidden = renderOrg(src, { profile });
    assert.ok(!hidden.html.includes('class="org-constants"'));
    assert.equal(renderOrg("#+SHEETS_CONSTANTS: none\n" + src, { profile }).html, hidden.html);
    const withoutLiteral = renderOrg("#+CONSTANTS: rate=2.5\n| 4 | 0 |\n#+TBLFM: $2=$1*$rate\n", { profile });
    assert.ok(!withoutLiteral.html.includes("CONSTANTS"));
    assert.ok(!withoutLiteral.html.includes("$rate"));
  }
});

test("display directives obey AST ownership, source order and original diagnostic lines", () => {
  for (const kind of ["SRC org", "EXAMPLE", "EXPORT html", "COMMENT"]) {
    const src = `#+BEGIN_${kind}\n#+SHEETS_CONSTANTS: table\n#+CONSTANTS: hidden=9\n#+END_${kind.split(" ")[0]}\n#+CONSTANTS: live=3\n`;
    const result = recalculateOrg(src);
    assert.equal(result.showConstants, false, kind);
    assert.deepEqual(result.fileConstants, [{ name: "live", value: "3", line: 5, valid: true }]);
  }
  const src = "#+sheets_constants: invalid\n#+CONSTANTS: rate=2\n#+ShEeTs_CoNsTaNtS: TABLE\n";
  const result = renderOrg(src);
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, /<caption>File constants/);
  assert.ok(!renderOrg(src + "#+SHEETS_CONSTANTS: none\n").html.includes('class="org-constants"'));
  for (const option of ["oops", "", "<script>bad()</script>"]) {
    const invalid = renderOrg(`#+CONSTANTS: live=3\n#+SHEETS_CONSTANTS: ${option}\n`);
    assert.deepEqual(invalid.diagnostics, [{ line: 2, severity: "warning", message: "Unsupported SHEETS_CONSTANTS option. Use table or none." }]);
    assert.ok(!invalid.html.includes('class="org-constants"'));
  }
});

test("unsupported values remain visible and escaped without changing calculation errors or fallback", () => {
  const src = "#+SHEETS_CONSTANTS: table\n#+CONSTANTS: amount=3 amount=oops huge=1e1000001 attack=<img/src=x/onerror=bad()> broken\n| 0 |\n#+TBLFM: $1=$amount\n";
  const shown = renderOrg(src), hidden = renderOrg(src.replace(": table", ": none"));
  assert.deepEqual(shown.diagnostics, hidden.diagnostics);
  assert.deepEqual(rows(recalculateOrg(src)), [["0"]]);
  assert.match(shown.html, /Unsupported: oops/);
  assert.match(shown.html, /Unsupported: 1e1000001/);
  assert.match(shown.html, /Unsupported: &lt;img\/src=x\/onerror=bad\(\)&gt;/);
  assert.ok(!shown.html.includes("<img"));
  assert.equal((shown.html.match(/<code>\$amount<\/code>/g) || []).length, 1);
  assert.deepEqual(recalculateOrg(src).fileConstants.map((c) => c.valid), [false, false, false]);
});

test("constants without calculation tables render once; empty declarations and exact numeric text are explicit", () => {
  assert.equal(detect("#+SHEETS_CONSTANTS: table\n#+CONSTANTS: rate=3\n"), "org");
  assert.equal(detect("#+CONSTANTS: rate=3\n"), "org");
  const src = "\uFEFF#+TITLE: Assumptions\r\n#+SHEETS_CONSTANTS: table\r\n#+CONSTANTS: precise=123456789012345678901234567890 negative=-0.0000100 exp=1E+10\r\n";
  const result = renderOrg(src);
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, />123456789012345678901234567890<\/td>/);
  assert.match(result.html, />-0\.0000100<\/td>/);
  assert.match(result.html, />1E\+10<\/td>/);
  assert.match(result.html, /Line 3/);
  const empty = renderOrg("#+SHEETS_CONSTANTS: table\nText\n");
  assert.ok(!empty.html.includes("<table"));
  assert.match(empty.html, /No file constants declared/);
});

test("source option travels unchanged through URL and both HashBin envelope versions", async () => {
  const src = await fixture();
  for (const profile of [undefined, "org-emacs-v1"]) {
    const settings = { src, format: "org", view: "preview", profile },
      state = readURL(writeURL("https://example.com/", settings)),
      saved = HashBinDocuments.parse(HashBinDocuments.serialize({ src, type: "org", view: "preview", profile }));
    assert.equal(state.src, src);
    assert.equal(saved.src, src);
    assert.equal(saved.profile, profile);
    assert.equal(renderOrg(saved.src, { profile: saved.profile }).html, renderOrg(state.src, { profile }).html);
  }
});
