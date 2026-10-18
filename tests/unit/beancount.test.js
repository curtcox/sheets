import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateBeancount } from "../../src/formats/beancount/engine.js";
import { renderBeancount } from "../../src/formats/beancount/index.js";
const read = (file) =>
  readFile(new URL(`../fixtures/beancount/${file}`, import.meta.url), "utf8");
const references = JSON.parse(await read("reference.json"));
for (const [file, expected] of Object.entries(references))
  test(`Beancount exact reference: ${file}`, async () => {
    const result = evaluateBeancount(await read(file));
    assert.equal(
      result.diagnostics.length === 0,
      expected.valid,
      JSON.stringify(result.diagnostics),
    );
    assert.deepEqual(result.balances, expected.balances);
    for (const balances of Object.values(expected.balances))
      for (const value of Object.values(balances))
        assert.equal(
          typeof value,
          "string",
          "The oracle must never round through a binary number.",
        );
  });
test("Beancount reports and journal preserve large quantities and tiny digits", async () => {
  const result = renderBeancount(await read("precision.bean"));
  assert.deepEqual(result.diagnostics, []);
  assert.ok(result.html.includes("9007199254740993.0000000002"));
  assert.ok(result.html.includes("0.0000000001"));
  assert.equal(result.result.journal[2].balance, "9007199254740993.0000000002");
  assert.equal(
    JSON.parse(JSON.stringify(result.result)).balances["Assets:Bank"].USD,
    "9007199254740993.0000000002",
  );
});
test("Beancount fractional lots remain exact on acquisition and disposal", async () => {
  const result = evaluateBeancount(await read("precision-lots.bean"));
  assert.equal(result.lots["Assets:Stock\0STOCK"][0].quantity, "0.2");
  assert.equal(result.balances["Assets:Bank"].USD, "-0.02");
});
test("Beancount rejects oversized numeric literals and unsupported rounding settings visibly", () => {
  const prefix =
    '2026-01-01 open Assets:Bank USD\n2026-01-01 open Equity:Opening USD\n2026-01-02 * "Input"\n';
  const huge = evaluateBeancount(
    prefix + "  Assets:Bank " + "9".repeat(257) + " USD\n  Equity:Opening",
  );
  assert.ok(huge.diagnostics.some((d) => d.message.includes("256 digits")));
  for (const option of [
    'option "tolerance_multiplier" "-1"',
    'option "inferred_tolerance_default" "USD:no"',
    'option "account_rounding" "Rounding"',
  ]) {
    assert.ok(
      evaluateBeancount(option).diagnostics.some((d) =>
        d.message.startsWith("Invalid"),
      ),
    );
  }
});
test("Beancount omits an unnecessary inferred zero posting like the reference", () => {
  const result = evaluateBeancount(
    '2026-01-01 open Assets:Bank USD\n2026-01-01 open Equity:Opening USD\n2026-01-02 * "Zero"\n  Assets:Bank 0 USD\n  Equity:Opening',
  );
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.balances["Equity:Opening"], undefined);
});
