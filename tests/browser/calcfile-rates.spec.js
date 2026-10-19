import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
import { ECB_URL } from "../../src/exchange-rates.js";
const base = "http://127.0.0.1:4173/index.html",
  key = "sheets:ecb-rates:v1";
const xml = await readFile(
  new URL("../fixtures/exchange-rates/ecb-2026-10-16.xml", import.meta.url),
  "utf8",
);
const csv = await readFile(
  new URL("../fixtures/exchange-rates/ecb-api-2026-10-16.csv", import.meta.url),
  "utf8",
);
const now = Date.parse("2026-10-18T12:00:00Z");
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(
    /^(?:Ready|\d+ diagnostic)/,
  );
const source = (page, src) =>
  page.evaluate((src) => ace.edit("editor").setValue(src, -1), src);
test.beforeEach(async ({ page }) => page.clock.setFixedTime(new Date(now)));

test("CalcFile fetches only for conversions, preserves source/sharing and reuses the fresh rate cache", async ({
  page,
  context,
}) => {
  let requests = 0;
  await context.route(ECB_URL, (route) => {
    requests++;
    return route.fulfill({ body: csv, contentType: "text/csv" });
  });
  await page.goto(
    writeURL(base, {
      format: "calcfile",
      src: "100 EUR+20 EUR\n100 EUR in EUR\n// 100 EUR in USD",
    }),
  );
  await ready(page);
  expect(requests).toBe(0);
  const input =
    "Budget=100 EUR\nBudget in USD\nans in EUR\n100 EUR in GBP\n100 EUR in JPY";
  await source(page, input);
  await expect(page.locator('.result-line[data-line="2"] output')).toHaveText(
    "112.53 USD",
  );
  await expect(page.locator('.result-line[data-line="3"] output')).toHaveText(
    "100 EUR",
  );
  await expect(page.locator('.result-line[data-line="4"] output')).toHaveText(
    "84.385 GBP",
  );
  await expect(page.locator("[data-exchange-rates]")).toContainText(
    "2026-10-16",
  );
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(input);
  expect(requests).toBe(1);
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const fresh = await context.newPage();
  await fresh.clock.setFixedTime(new Date(now));
  await fresh.goto(await page.locator("#share-url").inputValue());
  await ready(fresh);
  await expect(fresh.locator('.result-line[data-line="2"] output')).toHaveText(
    "112.53 USD",
  );
  expect(requests).toBe(1);
  await fresh.setViewportSize({ width: 390, height: 844 });
  expect(
    await fresh.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await fresh.close();
});

test("stale fallback, unavailable rates and corrupt cache entries are disclosed with source-line diagnostics", async ({
  page,
}) => {
  await page.route(ECB_URL, (route) =>
    route.fulfill({ body: "<html>not rates</html>", contentType: "text/html" }),
  );
  for (const cached of [
    { xml, time: now - 2 * 86400000 },
    { xml: "invalid", time: now },
    null,
  ]) {
    await page.addInitScript(
      ({ key, cached }) => {
        if (cached) localStorage.setItem(key, JSON.stringify(cached));
        else localStorage.removeItem(key);
      },
      { key, cached },
    );
    await page.goto(
      writeURL(base, {
        format: "calcfile",
        src: "# Trip\n100 EUR in USD\n2+2",
      }),
    );
    await ready(page);
    if (cached?.xml === xml) {
      await expect(page.locator("#render-status")).toHaveText(/^Ready/);
      await expect(page.locator("[data-exchange-rates]")).toContainText(
        "Using cached ECB rates",
      );
      await expect(page.locator("[data-exchange-rates]")).toContainText(
        "2026-10-16",
      );
      await expect(
        page.locator('.result-line[data-line="2"] output'),
      ).toHaveText("112.53 USD");
    } else {
      await expect(page.locator("#render-status")).toContainText(
        "1 diagnostic",
      );
      await expect(page.locator("[data-exchange-rates]")).toContainText(
        "unavailable",
      );
      expect(
        await page.evaluate(
          () => ace.edit("editor").getSession().getAnnotations()[0].row,
        ),
      ).toBe(1);
    }
    await expect(page.locator('.result-line[data-line="3"] output')).toHaveText(
      "4",
    );
  }
});

test("cancelling or editing during a rate request prevents late output and cache writes", async ({
  page,
}) => {
  const releases = [];
  await page.route(ECB_URL, async (route) => {
    await new Promise((resolve) => releases.push(resolve));
    await route.fulfill({ body: csv, contentType: "text/csv" }).catch(() => {});
  });
  await page.goto(
    writeURL(base, { format: "calcfile", src: "100 EUR in USD" }),
  );
  await expect.poll(() => releases.length).toBe(1);
  await page.locator("#cancel-render").click();
  await expect(page.locator("#render-status")).toContainText("Cancelled");
  releases[0]();
  await source(page, "100 EUR in USD\n3+3");
  await expect.poll(() => releases.length).toBe(2);
  await source(page, "2+2");
  releases[1]();
  await ready(page);
  await expect(page.locator("#preview output")).toHaveText("4");
  await expect(page.locator("[data-exchange-rates]")).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull();
});

test("the pinned engine reports unsupported non-EUR pairs and unsupported currencies deliberately", async ({
  page,
}) => {
  let requests = 0;
  await page.route(ECB_URL, (route) => {
    requests++;
    return route.fulfill({ body: csv, contentType: "text/csv" });
  });
  await page.goto(
    writeURL(base, {
      format: "calcfile",
      src: "100 USD in GBP\n100 EUR in CHF\n2+2",
    }),
  );
  await ready(page);
  await expect(page.locator("#render-status")).toContainText("2 diagnostic");
  await expect(
    page.locator('.result-line[data-line="1"] output'),
  ).toContainText("No supplied exchange rate");
  await expect(
    page.locator('.result-line[data-line="2"] output'),
  ).toContainText("target is unknown");
  await expect(page.locator('.result-line[data-line="3"] output')).toHaveText(
    "4",
  );
  expect(requests).toBe(1);
});

test("the shared ECB cache still feeds the Numbat XML and Hurmet decimal-string worker interfaces", async ({
  page,
  context,
}) => {
  let requests = 0;
  await context.route(ECB_URL, (route) => {
    requests++;
    return route.fulfill({ body: csv, contentType: "text/csv" });
  });
  for (const [format, src] of [
    ["calcfile", "100 EUR in USD"],
    ["numbat", "100 EUR -> USD"],
    ["hurmet", "¢`100 'EUR' = ?? USD`"],
  ]) {
    await page.goto(writeURL(base, { format, src }));
    await ready(page);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    await expect(page.locator("#preview")).toContainText("112.53");
  }
  expect(requests).toBe(1);
});
