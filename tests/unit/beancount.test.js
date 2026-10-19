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
    // Compare as unordered positions; exact residuals distinguish booking methods.
    const normalizeLots = (lots) =>
      Object.fromEntries(
        Object.entries(lots).map(([key, rows]) => [
          key,
          rows
            .slice()
            .sort((a, b) =>
              JSON.stringify([
                a.currency,
                a.date,
                a.label,
                a.number,
                a.quantity,
              ]).localeCompare(
                JSON.stringify([
                  b.currency,
                  b.date,
                  b.label,
                  b.number,
                  b.quantity,
                ]),
              ),
            ),
        ]),
      );
    assert.deepEqual(normalizeLots(result.lots), normalizeLots(expected.lots));
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

test("malformed or unsupported lot annotations are diagnosed without booking a different amount", () => {
  const prefix =
    '2026-01-01 open Assets:Stock STOCK\n2026-01-01 open Assets:Cash USD\n2026-01-02 * "Bad annotation"\n';
  for (const annotation of [
    "{{20 USD}",
    "{10 # 2 USD}",
    "{10 USD, *}",
    "{10 USD} garbage",
    "{10 USD, 2026-02-30}",
    "{-10 USD}",
    "{10 USD, 11 USD}",
    "{10 USD} @ nope",
  ]) {
    const result = evaluateBeancount(
      prefix + `  Assets:Stock 2 STOCK ${annotation}\n  Assets:Cash`,
    );
    assert.ok(
      result.diagnostics.some((d) => d.line === 4),
      annotation,
    );
    assert.deepEqual(result.balances, {}, annotation);
    assert.deepEqual(result.lots, {}, annotation);
  }
  const zero = evaluateBeancount(
    prefix + "  Assets:Stock 0 STOCK {{20 USD}}\n  Assets:Cash",
  );
  assert.match(zero.diagnostics[0].message, /nonzero quantity/);
});
test("unsupported booking and incomplete acquisition costs stay visible", () => {
  assert.match(
    evaluateBeancount('option "booking_method" "AVERAGE"').diagnostics[0]
      .message,
    /Unsupported booking/,
  );
  for (const method of ["UNKNOWN", "fifo", "AVERAGE"])
    assert.match(
      evaluateBeancount(`2026-01-01 open Assets:Stock STOCK "${method}"`)
        .diagnostics[0].message,
      /Unsupported booking/,
    );
  const incomplete = evaluateBeancount(
    '2026-01-01 open Assets:Stock STOCK\n2026-01-01 open Assets:Cash USD\n2026-01-02 * "Missing cost"\n  Assets:Stock 2 STOCK {USD}\n  Assets:Cash',
  );
  assert.match(incomplete.diagnostics[0].message, /complete cost/);
  assert.deepEqual(incomplete.balances, {});
});
