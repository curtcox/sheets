import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
import { HashBinDocuments } from "../../src/hashbin.js";
import { PRECEDENCE_HINT } from "../../src/formats/org/precedence-hints.js";
import { cidFor } from "./hashbin-mock.js";

const base = "http://127.0.0.1:4173/index.html";
const ready = (page) => expect(page.locator("#render-status")).toHaveText(/^(Ready|\d+ diagnostic)/);
const original = "#+TITLE: Formula grouping\n#+SHEETS_HINTS: precedence\n| 0 | 0 | 0 |\n#+TBLFM: $1=10/4*2::$2=(10/4)*2::$3=10/(4*2)\n";
const source = (page) => page.evaluate(() => ace.edit("editor").getValue());
const setSource = (page, src) => page.evaluate((src) => ace.edit("editor").setValue(src, -1), src);

test("precedence hints preserve arithmetic, source, modes, sharing, reload and exported explanations", async ({ page, context }) => {
  for (const profile of [undefined, "org-emacs-v1"]) {
    const src = profile ? "\uFEFF" + original.replaceAll("\n", "\r\n") : original;
    await page.goto(writeURL(base, { src, format: "org", profile, view: "preview" }));
    await ready(page);
    await expect(page.locator("#preview td")).toHaveText(["1.25", "5.", "1.25"]);
    await expect(page.locator('#preview aside[aria-label="Formula hints"] li')).toHaveText("Line 4: " + PRECEDENCE_HINT);
    expect(await page.evaluate(() => ace.edit("editor").session.getAnnotations())).toMatchObject([{ row: 3, type: "info", text: PRECEDENCE_HINT }]);
    expect(await source(page)).toBe(src);
    await page.getByRole("button", { name: "Share", exact: true }).click();
    const fresh = await context.newPage();
    await fresh.goto(await page.locator("#share-url").inputValue());
    await ready(fresh);
    await fresh.reload();
    await ready(fresh);
    expect(await source(fresh)).toBe(src);
    await expect(fresh.locator("#profile")).toHaveValue(profile || "");
    await expect(fresh.locator('#preview aside li')).toHaveText("Line 4: " + PRECEDENCE_HINT);
    await fresh.setViewportSize({ width: 390, height: 844 });
    expect(await fresh.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await fresh.locator("#download-menu summary").click();
    let pending = fresh.waitForEvent("download");
    await fresh.locator("#download-source").click();
    expect(await readFile(await (await pending).path(), "utf8")).toBe(src);
    await fresh.locator("#download-menu summary").click();
    pending = fresh.waitForEvent("download");
    await fresh.locator("#download-html").click();
    const html = await readFile(await (await pending).path(), "utf8"), saved = await context.newPage();
    await saved.setContent(html);
    await saved.emulateMedia({ media: "print" });
    await expect(saved.locator('aside[aria-label="Formula hints"]')).toContainText(PRECEDENCE_HINT);
    await expect(saved.locator("td")).toHaveText(["1.25", "5.", "1.25"]);
    await expect(saved.locator("script,button")).toHaveCount(0);
    await saved.close();
    await fresh.close();
    await page.locator("#share-close").click();
    await setSource(page, src.replace("10/4*2", "(10/4)*2"));
    await expect(page.locator('#preview aside[aria-label="Formula hints"]')).toHaveCount(0);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    await expect(page.locator("#preview td")).toHaveText(["5.", "5.", "1.25"]);
    await setSource(page, src.replace("SHEETS_HINTS: precedence", "SHEETS_HINTS: none"));
    await expect(page.locator("#preview td")).toHaveText(["1.25", "5.", "1.25"]);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    expect(await page.evaluate(() => ace.edit("editor").session.getAnnotations())).toEqual([]);
  }
});

test("both saved envelope versions retain opt-in hints, and errors coexist with informational annotations", async ({ page }) => {
  for (const [index, profile] of [undefined, "org-emacs-v1"].entries()) {
    const body = HashBinDocuments.serialize({ src: original, type: "org", view: "preview", profile }), cid = cidFor(body);
    await page.route("https://256t.us/" + cid, (route) => route.fulfill({
      body,
      contentType: "application/json",
    }));
    await page.goto(base + "#" + cid);
    await ready(page);
    await expect(page.locator("#preview aside li")).toContainText(PRECEDENCE_HINT);
    expect(await source(page)).toBe(original);
    await page.reload();
    await ready(page);
    await expect(page.locator("#profile")).toHaveValue(profile || "");
    expect(new URL(page.url()).hash).toBe("#" + cid);
    await setSource(page, "#+SHEETS_HINTS: precedence\n| 77 |\n#+TBLFM: $1=10/0*2\n");
    await expect(page.locator("#render-status")).toHaveText(/^2 diagnostics/);
    await expect(page.locator("#preview td")).toHaveText("77");
    const annotations = await page.evaluate(() => ace.edit("editor").session.getAnnotations());
    expect(annotations).toMatchObject([{ row: 2, type: "error", text: expect.stringContaining("Division by zero") }, { row: 2, type: "info", text: PRECEDENCE_HINT }]);
    await expect.poll(() => new URL(page.url()).hash).not.toBe("#" + cid);
  }
});

test("guide examples demonstrate opt-in grouping hints while literal blocks and invalid options stay inert", async ({ page }) => {
  await page.goto("/docs.html?page=formats/org");
  await page.locator("#docs-content pre").filter({ hasText: "#+SHEETS_HINTS: precedence" })
    .locator("xpath=following-sibling::p[1]").getByRole("link").click();
  await ready(page);
  await expect(page.locator("#preview aside li")).toContainText(PRECEDENCE_HINT);
  await expect(page.locator("#preview td")).toHaveText(["1.25", "5.", "1.25"]);
  await page.goto(writeURL(base, { src: "#+BEGIN_SRC org\n" + original + "#+END_SRC\n| 0 |\n#+TBLFM: $1=10/4*2\n", format: "org" }));
  await ready(page);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#preview aside")).toHaveCount(0);
  await expect(page.locator("#preview pre")).toContainText("#+SHEETS_HINTS: precedence");
  await setSource(page, "#+SHEETS_HINTS: <script>bad()</script>\n| 0 |\n#+TBLFM: $1=10/4*2\n");
  await expect(page.locator("#render-status")).toHaveText(/^1 diagnostic/);
  expect(await page.evaluate(() => ace.edit("editor").session.getAnnotations())).toMatchObject([{ row: 0, type: "warning", text: expect.stringContaining("Unsupported SHEETS_HINTS") }]);
  await expect(page.locator("#preview script,#preview aside")).toHaveCount(0);
});
