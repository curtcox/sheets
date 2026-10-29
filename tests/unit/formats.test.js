import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  catalog,
  confidence,
  detect,
  loadFormat,
} from "../../src/formats/registry.js";
import { renderHurmet } from "../../src/formats/hurmet/engine.js";
import { renderQuarto } from "../../src/formats/quarto/index.js";
import { evaluateDocument } from "../../vendor/calcfile/core.mjs";
import {
  recalculateOrg,
  parseTable,
  recalculateTable,
} from "../../src/formats/org/engine.js";
import { evaluateBeancount } from "../../src/formats/beancount/engine.js";
import { evaluate } from "../../src/math.js";
import { evaluateNumbat } from "../../src/formats/numbat/engine.js";
import init from "../../vendor/numbat@1.24.0/numbat_wasm.js";
const examples = JSON.parse(
  await readFile(new URL("../../examples/catalog.json", import.meta.url)),
);
const read = (path) =>
  readFile(new URL("../../" + path, import.meta.url), "utf8");
await init({
  module_or_path: await readFile(
    new URL("../../vendor/numbat@1.24.0/numbat_wasm_bg.wasm", import.meta.url),
  ),
});
async function numbat(src) {
  const result = evaluateNumbat(src);
  return { ...result, html: result.html.replace(/<[^>]*>/g, "") };
}
for (const { id } of catalog.filter((f) => f.id !== "text")) {
  const fixtures = JSON.parse(await read(`tests/fixtures/${id}/expected.json`));
  for (const fixture of fixtures)
    test(`${id}: ${fixture.file}`, async () => {
      const src = await read(`tests/fixtures/${id}/${fixture.file}`);
      const result =
        id === "numbat"
          ? await numbat(src)
          : id === "hurmet"
            ? await renderHurmet(src)
            : id === "quarto"
              ? await renderQuarto(src, {
                  executePython: async (cells) => ({
                    outputs: cells.map(() => ({ text: "mocked result" })),
                  }),
                  executeR: async (cells) => ({
                    outputs: cells.map((cell) => ({
                      text: "mocked R result",
                      ...(cell.options.label?.startsWith("fig-")
                        ? { images: ["data:image/png;base64,AAAA"] }
                        : {}),
                    })),
                  }),
                })
              : await (await loadFormat(id)).render(src, {});
      assert.equal(
        result.diagnostics.length,
        fixture.diagnostics,
        JSON.stringify(result.diagnostics),
      );
      for (const text of fixture.contains)
        assert.ok(
          result.html.includes(text),
          `Expected ${JSON.stringify(text)} in ${result.html.slice(-3000)}`,
        );
    });
  test(`${id}: detection does not claim another format's gallery`, async () => {
    for (const example of examples.filter((s) => s.format !== id)) {
      const src = await read(example.path);
      assert.ok(confidence(id, src) <= 0.3, `${id} claimed ${example.id}`);
    }
  });
}
test("auto chooses format signals, falls back to GFM, and manual loads cache", async () => {
  for (const example of examples.filter(
    (s) => !["calcfile", "gfm"].includes(s.format),
  )) {
    assert.equal(detect(await read(example.path)), example.format, example.id);
  }
  assert.equal(detect("#+PLOT: ind:1\n| a | 1 |\n"), "org");
  assert.equal(detect("#+SHEETS_PLOT: kind:pie\n| a | 1 |\n"), "org");
  assert.equal(detect("Just a note."), "gfm");
  assert.equal(detect("2+2"), "gfm");
  assert.equal(await loadFormat("gfm"), await loadFormat("gfm"));
});
test("all mandatory CalcFile v0.1 conformance cases pass", async () => {
  const corpus = JSON.parse(
    await read("vendor/calcfile@b11ecb44e4a5/calcfile-v0.1.json"),
  );
  assert.ok(corpus.cases.length >= 37);
  for (const c of corpus.cases) {
    const lines = evaluateDocument(c.source, {
      locale: c.locale,
      currencyRates: c.environment.currencyRates,
    }).lines.map((line) => ({
      line: line.lineNumber,
      status: line.status,
      ...(line.value ? { value: line.value } : {}),
      ...(line.status === "error" && line.diagnostics[0]
        ? { diagnostic: line.diagnostics[0].code }
        : {}),
    }));
    assert.deepEqual(lines, c.expect.lines, c.id);
  }
});
test("Org field, column, relative, boundary, range, formatting and N modes", () => {
  const result = recalculateOrg(
    "| n | val |\n|---+---|\n| 2 | 0 |\n| 3 | 0 |\n#+TBLFM: $2=$1*2;%.2f::@3$2=@-1$2+1",
  );
  assert.equal(result.diagnostics.length, 0);
  // Emacs Calc reads the formatted "4.00" as a float, so 4. + 1 displays "5.".
  assert.deepEqual(result.tables[0].table.rows, [
    ["n", "val"],
    ["2", "4.00"],
    ["3", "5."],
  ]);
  const table = parseTable([
    "| a | n |",
    "|---+---|",
    "| x | 2 |",
    "| y | 3 |",
    "|---+---|",
    "| sum | 0 |",
  ]);
  assert.deepEqual(recalculateTable(table, "@>$>=vsum(@I$2..@II$2);N"), []);
  assert.equal(table.rows.at(-1)[1], "5");
  assert.match(
    recalculateOrg("| 1 |\n#+TBLFM: @9$1=2").diagnostics[0].message,
    /outside/,
  );
});
test("Beancount errors, costs, FIFO disposal, balance, close and unsupported directives", () => {
  const src =
    '2026-01-01 open Assets:Cash USD\n2026-01-01 open Assets:Stock HOOL\n2026-01-02 * "Buy"\n  Assets:Stock 2 HOOL {10 USD}\n  Assets:Cash -20 USD\n2026-01-03 * "Sell"\n  Assets:Stock -1 HOOL {10 USD}\n  Assets:Cash 10 USD\n2026-01-04 balance Assets:Stock 1 HOOL';
  const result = evaluateBeancount(src);
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.balances["Assets:Stock"].HOOL, "1");
  assert.equal(result.lots["Assets:Stock\0HOOL"][0].quantity, "1");
  const bad = evaluateBeancount(
    'include "secret.bean"\n2026-01-01 open Assets:Cash USD\n2026-01-02 close Assets:Cash\n2026-01-03 * "Bad"\n  Assets:Cash 3 USD\n  Expenses:Food -3 USD',
  );
  assert.ok(bad.diagnostics.some((d) => d.message.includes("unsupported")));
  assert.ok(bad.diagnostics.some((d) => d.message.includes("closed")));
  assert.ok(bad.diagnostics.some((d) => d.message.includes("not open")));
});
test("calculation syntax cannot access objects or import functions", () => {
  for (const expression of [
    'import("evil")',
    "x.constructor",
    'evaluate("2+2")',
    "range(1, 99999999)",
  ])
    assert.throws(() => evaluate(expression));
  assert.equal(evaluate("sqrt(9) + 2"), 5);
});
test("Quarto stateful cell execution, front matter, options, figures and diagnostics", async () => {
  const src =
    "---\ntitle: Demo\nexecute:\n  echo: false\n---\n\n::: {.callout-note}\nSee @fig-demo.\n:::\n\n```{python}\n#| label: fig-demo\n#| fig-cap: A figure\nx=2\n```\n\n```{python}\n#| output: false\nx+1\n```\n\n```{python}\n#| eval: false\nraise Exception()\n```\n\n```{julia}\nx\n```";
  const result = await renderQuarto(src, {
    executePython: async (cells) => {
      assert.equal(cells.length, 2);
      assert.equal(cells[0].source, "x=2");
      return {
        outputs: [
          {
            stdout: "hello",
            html: "<table><tr><td>data</td></tr></table>",
            figures: ["<svg></svg>"],
          },
          { text: "HIDDEN" },
        ],
      };
    },
  });
  assert.ok(result.html.includes("Figure 1"));
  assert.ok(result.html.includes("callout-note"));
  assert.ok(result.html.includes("A figure"));
  assert.ok(result.html.includes("<table>"));
  assert.ok(result.html.includes("not executed"));
  assert.ok(!result.html.includes("HIDDEN"));
  assert.ok(!result.html.includes("x=2"));
  assert.deepEqual(result.diagnostics, []);
  const errors = await renderQuarto("```{python}\n1/0\n```", {
    executePython: async () => ({ outputs: [{ error: "ZeroDivisionError" }] }),
  });
  assert.equal(errors.diagnostics[0].line, 2);
  assert.match(errors.html, /ZeroDivisionError/);
});
test("Org tables match committed independent reference outputs", async () => {
  const references = JSON.parse(
    await read("tests/fixtures/org/reference.json"),
  );
  for (const [file, expected] of Object.entries(references))
    assert.deepEqual(
      recalculateOrg(await read(`tests/fixtures/org/${file}`), {
        profile: "org-emacs-v1",
      }).tables.flatMap((t) => t.table.rows),
      expected,
      file,
    );
});
test("Org prose renders headings, emphasis, lists and real links", async () => {
  const { renderOrg } = await import("../../src/formats/org/index.js");
  const result = renderOrg(
    "* Heading\n\nSome *bold* and /italic/ with [[https://example.com][a link]].\n\n- First\n- Second",
  );
  assert.ok(result.html.includes("<h1>Heading</h1>"));
  assert.ok(result.html.includes("<strong>bold</strong>"));
  assert.ok(result.html.includes("<em>italic</em>"));
  assert.ok(result.html.includes('<a href="https://example.com">a link</a>'));
  assert.ok(result.html.includes("<li>First"));
});
