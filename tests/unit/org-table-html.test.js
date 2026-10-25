import { test } from "node:test";
import assert from "node:assert/strict";
import { renderOrg } from "../../src/formats/org/index.js";

test("Org headers, row groups and column alignment do not change calculated source", () => {
  const src = "| Item | Amount |\n| <l> | <r> |\n|------+--------|\n| A | 0 |\n#+TBLFM: @3$2=2.5;%.2f\n";
  for (const profile of [undefined, "org-emacs-v1"]) {
    const result = renderOrg(src, { profile });
    assert.deepEqual(result.diagnostics, []);
    assert.match(result.html, /<thead><tr><th scope="col" class="org-left">Item<\/th><th scope="col" class="org-right">Amount<\/th><\/tr><\/thead>/);
    assert.match(result.html, /<tbody><tr><td class="org-left">A<\/td><td class="org-right">2.50<\/td>/);
    assert.ok(result.recalculatedSource.includes("<r>"));
    assert.ok(result.recalculatedSource.includes("2.50"));
    assert.ok(!result.html.includes("&lt;r&gt;"));
  }
});

test("Org alignment is presentation only and cell text remains escaped", () => {
  const { html } = renderOrg("| <l> | <r> |\n| <script>alert(1)</script> | $2.50 |\n");
  assert.match(html, /class="org-right">\$2.50<\/td>/);
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("<script>"));
});

test("Org calculation metadata remains visible under the established preview policy", () => {
  const { html } = renderOrg("| ! | Qty | Total |\n| # | 3 | 0 |\n| $ | tax=0.2 | |\n#+TBLFM: $3=$Qty*2\n");
  assert.match(html, />!<\/td>/);
  assert.match(html, />#<\/td>/);
  assert.match(html, />tax=0.2<\/td>/);
  assert.match(html, /class="org-right">6<\/td>/);
});

test("Long numeric-looking fields with invalid endings remain text", () => {
  const { html } = renderOrg(`| ${"9".repeat(50000)}Z |\n`);
  assert.match(html, /class="org-left">9+Z<\/td>/);
});
