import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";

const base = "http://127.0.0.1:4173/index.html";
const ready = (page) => expect(page.locator("#render-status")).toHaveText(/^(Ready|\d+ diagnostic)/);
const fixture = (name) => readFile(new URL(`../fixtures/org-plot/${name}`, import.meta.url), "utf8");
const bars = (page) => page.locator("#preview figure.chart rect.chart-bar");

test("charts survive sanitizing unchanged and pass through standalone export", async ({ page, context }) => {
  await page.goto(writeURL(base, { src: await fixture("explicit.org"), format: "org", view: "preview" }));
  await ready(page);
  await expect(page.locator("#preview figure.chart")).toHaveCount(12);
  await expect(page.locator("#preview figure.chart svg[role=img] > title").first()).toHaveText("Revenue by quarter");
  await expect(page.locator("#preview figure.chart svg > desc").first()).toContainText("Bar chart of North, South, Total");
  await expect(bars(page).first().locator("title")).toHaveText("North · Q1: 120");
  // A sanitizer round trip leaves the generated markup structurally identical.
  const unchanged = await page.evaluate(async () => {
    const { chartSVG, chartFigure } = await import("/src/charts.js"), { sanitize } = await import("/src/sanitize.js");
    const specs = [
      { kind: "bar", title: "T", x: { values: ["a", "b"] }, series: [{ label: "s", values: [1, -2] }, { label: "u", values: [3, 4] }] },
      { kind: "linespoints", x: { type: "time", values: [Date.UTC(2024, 0, 1), Date.UTC(2024, 3, 1)] }, series: Array.from({ length: 10 }, (_, i) => ({ label: `s${i}`, values: [i, i + 1] })) },
      { kind: "steps", y: { log: true }, x: { type: "linear", values: [1, 2, 3] }, series: [{ label: "s", values: [1, 10, 100] }] },
    ];
    return specs.every((spec) => {
      const { svg } = chartSVG(spec), html = chartFigure({ svg, title: "x", note: "y" });
      const raw = document.createElement("template"), clean = document.createElement("template");
      raw.innerHTML = html;
      clean.innerHTML = sanitize(html);
      return raw.content.isEqualNode(clean.content);
    });
  });
  expect(unchanged).toBe(true);
  // Marks take their color from the stylesheet, not inline styles.
  const fill = await bars(page).first().evaluate((node) => getComputedStyle(node).fill);
  expect(fill).toBe("rgb(31, 95, 168)");
  await page.locator("#download-menu summary").click();
  const pending = page.waitForEvent("download");
  await page.locator("#download-html").click();
  const html = await readFile(await (await pending).path(), "utf8"), saved = await context.newPage();
  await saved.setContent(html);
  await expect(saved.locator("figure.chart svg")).toHaveCount(12);
  await expect(saved.locator("script")).toHaveCount(0);
  expect(await saved.locator(".chart-bar").first().evaluate((node) => getComputedStyle(node).fill)).toBe("rgb(31, 95, 168)");
  await saved.close();
});

test("preview controls redraw a chart in place, and reload keeps it", async ({ page }) => {
  await page.goto(`${base}?example=org-what-if&view=split`);
  await ready(page);
  await expect(bars(page)).toHaveCount(3);
  const figure = await page.locator("#preview figure.chart").elementHandle(),
    before = await bars(page).nth(1).getAttribute("height");
  await expect(bars(page).nth(1).locator("title")).toHaveText(/Annual, paid up front: 100000\.00/);
  const price = page.locator('#preview input[data-control="org-constant:price"]');
  await price.focus();
  await page.keyboard.press("ArrowRight");
  await expect(bars(page).nth(1).locator("title")).toHaveText(/Annual, paid up front: 120000\.00/);
  expect(await bars(page).nth(1).getAttribute("height")).not.toBe(before);
  // The figure node is morphed, not replaced, so dragging stays smooth.
  expect(await figure.evaluate((node) => node.isConnected)).toBe(true);
  await expect(price).toBeFocused();
  await page.reload();
  await ready(page);
  await expect(bars(page).nth(1).locator("title")).toHaveText(/120000\.00/);
});

test("charts scroll inside their own region on a phone and fit an 800 px split", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}?example=org-mortgage&view=preview`);
  await ready(page);
  const region = page.locator("#preview .chart-scroll").first();
  await expect(region).toHaveAttribute("role", "region");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await region.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  await region.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => region.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto(`${base}?example=org-mortgage&view=split`);
  await ready(page);
  // The pane is narrower than the 480 px minimum, so only the chart region scrolls.
  const pane = await page.locator("#preview").evaluate((node) => ({ scroll: node.scrollWidth, client: node.clientWidth }));
  expect(pane.scroll).toBeLessThanOrEqual(pane.client + 1);
  expect(await page.locator("#preview .chart-svg").first().evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThanOrEqual(480);
  // Printing releases the scroll area and keeps each figure together.
  await page.emulateMedia({ media: "print" });
  expect(await page.locator("#preview .chart-scroll").first().evaluate((node) => getComputedStyle(node).overflowX)).toBe("visible");
  expect(await page.locator("#preview figure.chart").first().evaluate((node) => getComputedStyle(node).breakInside)).toBe("avoid");
});

test("inference is reported in the caption and as an editor annotation", async ({ page }) => {
  await page.goto(writeURL(base, { src: await fixture("inferred.org"), format: "org", view: "split" }));
  await ready(page);
  await expect(page.locator("#preview figure.chart figcaption .chart-note").first()).toHaveText("Inferred: ind:1 deps:(2 3 4) with:histograms; summary row @4 excluded.");
  const annotation = await page.evaluate(() => ace.edit("editor").session.getAnnotations().find((a) => a.row === 3 && /Inferred/.test(a.text)));
  expect(annotation).toMatchObject({ type: "info", text: "Inferred plot options: ind:1 deps:(2 3 4) with:histograms. Add them to #+PLOT: so Emacs plots the same data." });
});
