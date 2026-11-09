import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";

test("R gallery renders under the production host framing policy", async ({ page }) => {
  await page.route("**/src/workers/sandbox-host.html", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(),
      "content-security-policy": "object-src 'none'; frame-ancestors 'self'",
    } });
  });
  await page.goto("/?example=quarto-edge");
  await expect(page.locator("#render-status")).toHaveText("Ready · Quarto", { timeout: 100000 });
  await expect(page.locator("#fig-measurements img")).toBeVisible();
  expect(await page.locator("#fig-measurements img").evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator('a[href="#fig-measurements"]')).toHaveText("Figure 1");
});

test("the reported older gallery link calculates the mean and renders its plot", async ({ page }) => {
  const src = await readFile(new URL("../fixtures/quarto/edge.qmd", import.meta.url), "utf8");
  await page.goto(writeURL("http://127.0.0.1:4173/", { src, format: "quarto" }));
  await expect(page.locator("#render-status")).toHaveText("Ready · Quarto", { timeout: 100000 });
  await expect(page.locator(".cell-output")).toHaveText("[1] 7");
  await expect(page.locator("#fig-measurements img")).toBeVisible();
  expect(await page.locator("#fig-measurements img").evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
});

test("blocked R sandbox fails at startup instead of waiting for the calculation deadline", async ({ page }) => {
  await page.clock.install();
  await page.route("**/src/workers/sandbox-host.html", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(),
      "content-security-policy": "object-src 'none'; frame-ancestors 'none'",
    } });
  });
  await page.goto("/?example=quarto-edge");
  await expect(page.locator('iframe[title="Code sandbox host"]')).toBeAttached();
  await page.clock.runFor(16000);
  await expect(page.locator("#preview")).toContainText("R sandbox host did not become ready within 15 seconds");
  await expect(page.locator("#preview")).toContainText("security policy");
  await expect(page.locator('iframe[title="Code sandbox host"]')).toHaveCount(0);
  await expect(page.locator("#cancel-render")).toBeHidden();
});

test("slow startup shows elapsed time, time remaining, cancellation and a stage-specific timeout", async ({ page }) => {
  await page.clock.install();
  let release, requested;
  const held = new Promise((resolve) => (release = resolve));
  const seen = new Promise((resolve) => (requested = resolve));
  await page.route("**/src/workers/webr-worker.js", async (route) => {
    requested();
    await held;
    await route.abort().catch(() => {});
  });
  try {
    await page.goto("/?example=quarto-edge");
    await seen;
    await expect(page.locator("#render-status")).toContainText("R: Starting sandbox");
    await expect(page.locator("#cancel-render")).toBeVisible();
    await page.clock.runFor(60000);
    await expect(page.locator("#render-status")).toContainText("60s elapsed · 30s until timeout");
    await page.clock.runFor(31000);
    await expect(page.locator("#preview")).toContainText("Calculation exceeded 90 seconds while R: Starting sandbox");
    await expect(page.locator("#cancel-render")).toBeHidden();
    await page.clock.runFor(5000);
    await expect(page.locator("#render-status")).toContainText("diagnostic");
  } finally {
    release();
  }
});

test("cancelling while the R sandbox host loads removes it and suppresses late progress", async ({ page }) => {
  await page.clock.install();
  let release;
  const held = new Promise((resolve) => (release = resolve));
  await page.route("**/src/workers/sandbox-host.html", async (route) => {
    await held;
    await route.abort().catch(() => {});
  });
  try {
    await page.goto("/?example=quarto-edge");
    await expect(page.locator('iframe[title="Code sandbox host"]')).toBeAttached();
    await page.locator("#cancel-render").click();
    await expect(page.locator('iframe[title="Code sandbox host"]')).toHaveCount(0);
    await page.clock.runFor(95000);
    await expect(page.locator("#render-status")).toContainText("Cancelled");
    await expect(page.locator("#cancel-render")).toBeHidden();
  } finally {
    release();
  }
});
