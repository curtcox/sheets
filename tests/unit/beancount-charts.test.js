import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateBeancount } from "../../src/formats/beancount/engine.js";
import { ledgerChartData, ledgerPeriods } from "../../src/formats/beancount/charts.js";
import { renderBeancount } from "../../src/formats/beancount/index.js";

const read = (name) => readFile(new URL(`../fixtures/beancount/${name}`, import.meta.url), "utf8");
const reference = JSON.parse(await read("charts.json"));

test("Chart data equals the bean-query reference for every valid fixture", async () => {
  assert.ok(Object.keys(reference).length >= 38);
  for (const [file, expected] of Object.entries(reference))
    assert.deepEqual(ledgerChartData(evaluateBeancount(await read(file))), expected, file);
});

test("Periods are daily under 62 days, Monday-to-Sunday weekly under a year, else monthly", () => {
  assert.equal(ledgerPeriods("2024-01-01", "2024-03-01").kind, "day");
  assert.equal(ledgerPeriods("2024-01-01", "2024-03-01").periods.length, 61);
  const weeks = ledgerPeriods("2024-01-03", "2024-03-04");
  assert.equal(weeks.kind, "week");
  assert.deepEqual(weeks.periods[0], { start: "2024-01-01", end: "2024-01-07", label: "2024-01-01" });
  const months = ledgerPeriods("2023-12-31", "2024-12-30");
  assert.equal(months.kind, "month");
  assert.deepEqual(months.periods.map((p) => p.label), ["2023-12", ...Array.from({ length: 12 }, (_, i) => `2024-${String(i + 1).padStart(2, "0")}`)]);
  assert.equal(months.periods[2].end, "2024-02-29");
});

test("The Charts tab draws three charts, notes left-out commodities and handles empty ledgers", async () => {
  const { html } = renderBeancount(await read("charts-monthly.bean"));
  const tabs = [...html.matchAll(/data-report="(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual(tabs, ["errors", "balance", "income", "trial", "charts", "journal"]);
  const pane = /<section id="report-charts"[^]*?<\/section>/.exec(html)[0];
  assert.equal((pane.match(/<figure class="chart">/g) || []).length, 3);
  assert.match(pane, /<desc>Bar chart of Income, Expenses with a line for Net, 14 categories/);
  assert.match(pane, /<desc>Bar chart \(horizontal\) of USD, 9 categories/);
  assert.match(pane, /Other \(2 accounts\)/);
  assert.match(pane, /Expenses:Rent: 19,600 USD/);
  assert.match(pane, /EUR postings are left out/);
  const empty = renderBeancount(await read("charts-empty.bean")).html;
  assert.match(empty, /There are no dated postings to chart yet/);
  assert.doesNotMatch(/<section id="report-charts"[^]*?<\/section>/.exec(empty)[0], /<svg/);
});

test("Net-worth lines follow every currency, and hostile account names are escaped", () => {
  const src = [
    '2025-01-01 open Assets:Cash USD',
    '2025-01-01 open Assets:Shares X',
    '2025-01-01 open Equity:Opening',
    '2025-01-01 open Expenses:A-B',
    '2025-01-02 * "<img src=x onerror=alert(1)>"',
    '  Assets:Cash 10 USD',
    '  Equity:Opening',
    '2025-01-03 * "Buy"',
    '  Assets:Shares 1 X {5 USD}',
    '  Assets:Cash',
    '2025-01-04 * "Spend"',
    '  Expenses:A-B 1 USD',
    '  Assets:Cash',
  ].join("\n");
  const result = evaluateBeancount(src), data = ledgerChartData(result);
  assert.deepEqual(data.netWorth, { USD: ["10", "5", "4"], X: ["0", "1", "1"] });
  const html = renderBeancount(src).html;
  assert.doesNotMatch(html, /<img/);
});
