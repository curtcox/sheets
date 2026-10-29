import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";

const base = "http://127.0.0.1:4173/index.html";
const ready = (page) => expect(page.locator("#render-status")).toHaveText(/^(Ready|\d+ diagnostic)/);
const charts = (page) => page.locator("#report-charts figure.chart");

test("the Charts tab draws the default ledger charts, sanitized and exported", async ({ page, context }) => {
  await page.goto(`${base}?example=beancount-household&view=preview`);
  await ready(page);
  await expect(page.getByRole("tab")).toHaveText(["Diagnostics", "Balance sheet", "Income statement", "Trial balance", "Charts", "Account journal"]);
  await expect(page.locator("#report-charts")).toBeHidden();
  await page.getByRole("tab", { name: "Charts", exact: true }).click();
  await expect(charts(page)).toHaveCount(3);
  await expect(charts(page).locator("figcaption .chart-title")).toHaveText(["Net worth", "Income and expenses", "Where the money went"]);
  await expect(charts(page).nth(1).locator("svg > desc")).toContainText("Bar chart of Income, Expenses with a line for Net, 13 categories");
  await expect(charts(page).nth(1).locator(".chart-overlay .chart-marker title").first()).toHaveText("Net · 2025-01: 2,035.4 USD");
  await expect(charts(page).nth(2).locator(".chart-bar title").first()).toHaveText("USD · Expenses:Housing: 21,450 USD");
  // The pane's markup is unchanged by a second sanitizer pass.
  const unchanged = await page.evaluate(async () => {
    const { sanitize } = await import("/src/sanitize.js"), pane = document.querySelector("#report-charts");
    const clean = document.createElement("template");
    clean.innerHTML = sanitize(pane.innerHTML);
    const raw = document.createElement("template");
    raw.innerHTML = pane.innerHTML;
    return raw.content.isEqualNode(clean.content);
  });
  expect(unchanged).toBe(true);
  // The selected tab is what export captures.
  await page.locator("#download-menu summary").click();
  const pending = page.waitForEvent("download");
  await page.locator("#download-html").click();
  const html = await readFile(await (await pending).path(), "utf8"), saved = await context.newPage();
  await saved.setContent(html);
  await expect(saved.locator("figure.chart svg")).toHaveCount(3);
  await expect(saved.locator("script")).toHaveCount(0);
  expect(await saved.locator(".chart-bar").first().evaluate((node) => getComputedStyle(node).fill)).toBe("rgb(31, 95, 168)");
  await saved.close();
  await page.emulateMedia({ media: "print" });
  await expect(charts(page).first()).toBeVisible();
  expect(await charts(page).first().evaluate((node) => getComputedStyle(node).breakInside)).toBe("avoid");
});

test("ledger charts fit a phone, report left-out commodities and handle an empty ledger", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const src = await readFile(new URL("../fixtures/beancount/charts-single-day.bean", import.meta.url), "utf8");
  await page.goto(writeURL(base, { src, format: "beancount", view: "preview" }));
  await ready(page);
  await page.getByRole("tab", { name: "Charts", exact: true }).click();
  await expect(charts(page)).toHaveCount(3);
  await expect(page.locator("#report-charts .chart-omitted")).toContainText("GBP only; USD postings are left out");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto(writeURL(base, { src: '2025-01-01 open Assets:Bank USD\n', format: "beancount", view: "preview" }));
  await ready(page);
  await page.getByRole("tab", { name: "Charts", exact: true }).click();
  await expect(page.locator("#report-charts")).toContainText("There are no dated postings to chart yet.");
  await expect(page.locator("#report-charts svg")).toHaveCount(0);
});
