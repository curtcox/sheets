import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateDocument } from "../../vendor/calcfile/core.mjs";
import { renderCalcFile } from "../../src/formats/calcfile/index.js";
import { rateTableFromXML } from "../../src/exchange-rates.js";
const xml = readFileSync(
  new URL("../fixtures/exchange-rates/ecb-2026-10-16.xml", import.meta.url),
  "utf8",
);
const table = rateTableFromXML(xml);

test("CalcFile's adapter matches the pinned reference with a decimal-string ECB environment", async () => {
  for (const source of [
    "$100 in EUR",
    "€100 in USD",
    "100 eur IN usd",
    "100 EUR in USD",
    "100 USD in EUR",
    "100 EUR in GBP",
    "100 EUR in JPY",
    "Budget=100 EUR\nBudget in USD\nans in EUR",
    "100 USD in GBP",
  ]) {
    let calls = 0;
    const result = await renderCalcFile(source, {
      ratesProvider: async () => {
        calls++;
        return { table };
      },
    });
    assert.equal(calls, 1);
    assert.deepEqual(
      result.result,
      evaluateDocument(source, { currencyRates: table }),
    );
    assert.match(result.html, /ECB reference rates as of 2026-10-16/);
  }
  const precise = rateTableFromXML(
    xml.replace("1.1253", "1.123456789012345678901234567890123456789"),
  );
  const result = await renderCalcFile("100000000000000000000 EUR in USD", {
    ratesProvider: async () => ({ table: precise }),
  });
  assert.equal(
    result.result.lines[0].value.value,
    "112345678901234567890.1234567890123456789",
  );
});
test("comments, headers, text, units and same-currency expressions require no rate request", async () => {
  for (const source of [
    "100 EUR+20 EUR",
    "100 EUR in EUR",
    "10 km in m",
    "// 100 EUR in USD",
    "# 100 EUR in USD",
    "Rates for USD",
    "100 CAD in USD",
  ]) {
    await renderCalcFile(source, { ratesProvider: () => assert.fail(source) });
  }
});
test("unavailable and missing pair rates keep source-line diagnostics and later results", async () => {
  for (const rates of [
    { table: null, notice: "ECB rates unavailable." },
    { table: { ...table, rates: { USD: table.rates.USD } } },
  ]) {
    const result = await renderCalcFile("# Trip\n100 EUR in GBP\n2+2", {
      ratesProvider: async () => rates,
    });
    assert.equal(result.diagnostics.length, 1);
    assert.equal(result.diagnostics[0].line, 2);
    assert.equal(result.result.lines[2].value.value, "4");
  }
  const stale = await renderCalcFile("100 EUR in USD", {
    ratesProvider: async () => ({
      table,
      notice: "Using cached ECB rates; <script>bad</script>",
    }),
  });
  assert.match(stale.html, /Using cached ECB/);
  assert.ok(!stale.html.includes("<script>"));
  assert.equal(stale.diagnostics.length, 0);
});
test("CalcFile propagates cancellation and never renders a late rate response", async () => {
  const controller = new AbortController();
  let release;
  const pending = renderCalcFile("100 EUR in USD", {
    signal: controller.signal,
    ratesProvider: ({ signal }) => {
      assert.equal(signal, controller.signal);
      return new Promise((resolve) => (release = resolve));
    },
  });
  controller.abort();
  release({ table });
  await assert.rejects(pending, { name: "AbortError" });
  await assert.rejects(renderCalcFile("2+2", { signal: controller.signal }), {
    name: "AbortError",
  });
});
