import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
import { HashBinDocuments } from "../../src/hashbin.js";

const fixture = () => readFile(new URL("../fixtures/org/constants-display.org", import.meta.url), "utf8");
const base = "http://127.0.0.1:4173/index.html";
const ready = (page) => expect(page.locator("#render-status")).toHaveText(/^(Ready|\d+ diagnostic)/);
const source = (page) => page.evaluate(() => ace.edit("editor").getValue());
const setSource = (page, src) => page.evaluate((value) => ace.edit("editor").setValue(value, -1), src);

test("constants summary shares exact source and survives reload, recalculated copy, source and HTML exports", async ({ page, context }) => {
  for (const profile of [undefined, "org-emacs-v1"]) {
    const original = await fixture(),
      src = profile ? "\uFEFF" + original.replaceAll("\n", "\r\n") : original;
    await page.goto(writeURL(base, { src, format: "org", profile, view: "preview" }));
    await ready(page);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    const table = page.locator("#preview .org-constants");
    await expect(table.locator("caption")).toHaveText("File constants");
    await expect(table.locator("tbody th[scope=row]")).toHaveText(["$rate", "$shift", "$dup"]);
    await expect(table.locator("tbody td.org-right")).toHaveText(["2.5", "1e1", "5"]);
    await expect(table.locator("tbody td.org-left")).toHaveText(["Line 3", "Line 3", "Line 13"]);
    await expect(page.locator("#preview table:not(.org-constants)").first()).toContainText("27.00");
    await expect(page.locator("#preview table:not(.org-constants)").last()).toHaveText("415.00");
    expect(await source(page)).toBe(src);
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", {
      configurable: true, value: { writeText: async (text) => { globalThis.orgCopied = text; } },
    }));
    await page.getByRole("button", { name: "Copy recalculated source" }).click();
    const copied = await page.evaluate(() => globalThis.orgCopied);
    expect(copied).toContain("#+SHEETS_CONSTANTS: table");
    expect(copied).toContain("27.00");
    expect(await source(page)).toBe(src);
    await page.locator("#download-menu summary").click();
    let pending = page.waitForEvent("download");
    await page.locator("#download-source").click();
    expect(await readFile(await (await pending).path(), "utf8")).toBe(src);
    await page.locator("#download-menu summary").click();
    pending = page.waitForEvent("download");
    await page.locator("#download-html").click();
    const html = await readFile(await (await pending).path(), "utf8"), saved = await context.newPage();
    await saved.setContent(html);
    await saved.setViewportSize({ width: 390, height: 844 });
    await expect(saved.locator(".org-constants caption")).toHaveText("File constants");
    await expect(saved.locator(".org-constants tbody td.org-right")).toHaveText(["2.5", "1e1", "5"]);
    await expect(saved.locator("script,button")).toHaveCount(0);
    for (const target of [page, saved]) {
      await target.setViewportSize({ width: 390, height: 844 });
      expect(await target.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await target.emulateMedia({ media: "print" });
      expect(await target.locator(".org-constants").evaluate((el) => getComputedStyle(el.parentElement).overflowX)).toBe("visible");
      expect(await target.locator(".org-constants td.org-right").first().evaluate((el) => getComputedStyle(el).textAlign)).toBe("right");
    }
    await saved.close();
    await page.emulateMedia({ media: "screen" });
    await page.getByRole("button", { name: "Share", exact: true }).click();
    const fresh = await context.newPage();
    await fresh.goto(await page.locator("#share-url").inputValue());
    await ready(fresh);
    await fresh.reload();
    await ready(fresh);
    expect(await source(fresh)).toBe(src);
    await expect(fresh.locator("#profile")).toHaveValue(profile || "");
    await expect(fresh.locator("#preview .org-constants")).toHaveCount(1);
    await fresh.close();
  }
});

test("source edits toggle the display and unsupported constants stay escaped with original diagnostics", async ({ page }) => {
  const src = "#+TITLE: Inputs\n#+CONSTANTS: price=0.03\n| 0 |\n#+TBLFM: $1=$price*100;%.2f\n";
  await page.goto(writeURL(base, { src, format: "org" }));
  await ready(page);
  await expect(page.locator("#preview .org-constants")).toHaveCount(0);
  await setSource(page, "#+SHEETS_CONSTANTS: table\n" + src);
  await expect(page.locator("#preview .org-constants")).toContainText("0.03");
  await expect(page.locator("#preview table:not(.org-constants)")).toHaveText("3.00");
  await setSource(page, "#+SHEETS_CONSTANTS: table\n" + src.replace("0.03", "0.04"));
  await expect(page.locator("#preview .org-constants")).toContainText("0.04");
  await expect(page.locator("#preview table:not(.org-constants)")).toHaveText("4.00");
  await setSource(page, "#+SHEETS_CONSTANTS: none\n" + src);
  await expect(page.locator("#preview .org-constants")).toHaveCount(0);
  await setSource(page, "#+SHEETS_CONSTANTS: table\n#+CONSTANTS: bad=<img/src=x/onerror=globalThis.orgBad=1>\n| 77 |\n#+TBLFM: $1=$bad\n");
  await expect(page.locator("#preview .org-constants .error")).toHaveText("Unsupported: <img/src=x/onerror=globalThis.orgBad=1>");
  await expect(page.locator("#preview table:not(.org-constants)")).toHaveText("77");
  const annotations = await page.evaluate(() => ace.edit("editor").session.getAnnotations());
  expect(annotations.map((a) => a.row)).toEqual([1, 3]);
  await expect(page.locator("#preview img,#preview script")).toHaveCount(0);
  expect(await page.evaluate(() => globalThis.orgBad)).toBeUndefined();
  await page.goto(writeURL(base, { src: "#+SHEETS_CONSTANTS: table\n#+CONSTANTS: rate=3\n" }));
  await ready(page);
  await expect(page.locator("#format")).toHaveValue("auto");
  await expect(page.locator("#detected")).toContainText("Org tables");
  await expect(page.locator("#preview .org-constants tbody th")).toHaveText(["$rate"]);
});

test("HashBin versions retain the source option and editing a loaded option clears the saved CID", async ({ page }) => {
  const src = await fixture();
  for (const [index, profile] of [undefined, "org-emacs-v1"].entries()) {
    const cid = Buffer.from([0, 0, 0, 0, 0, 65]).toString("base64url") + Buffer.alloc(64, index + 1).toString("base64url");
    await page.route("https://256t.us/" + cid, (route) => route.fulfill({
      body: HashBinDocuments.serialize({ src, type: "org", view: "preview", profile }),
      contentType: "application/json",
    }));
    await page.goto(base + "#" + cid);
    await ready(page);
    await expect(page.locator("#preview .org-constants")).toContainText("Line 13");
    await expect(page.locator("#profile")).toHaveValue(profile || "");
    expect(await source(page)).toBe(src);
    expect(new URL(page.url()).hash).toBe("#" + cid);
    await page.reload();
    await ready(page);
    await expect(page.locator("#preview .org-constants")).toHaveCount(1);
    await setSource(page, src.replace("SHEETS_CONSTANTS: table", "SHEETS_CONSTANTS: none"));
    await expect(page.locator("#preview .org-constants")).toHaveCount(0);
    await expect.poll(() => new URL(page.url()).hash).not.toBe("#" + cid);
  }
});

test("the constants guide example and gallery make assumptions visible on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs.html?page=formats/org");
  await page.locator("#docs-content pre").filter({ hasText: "#+CONSTANTS: price=0.03 users=100" })
    .locator("xpath=following-sibling::p[1]").getByRole("link").click();
  await ready(page);
  await expect(page.locator("#preview .org-constants tbody th")).toHaveText(["$price", "$users"]);
  await expect(page.locator("#preview table:not(.org-constants)")).toContainText("3.00");
  await page.goto("/index.html?example=org-edge");
  await ready(page);
  await expect(page.locator("#preview .org-constants")).toContainText("0.10");
  await expect(page.locator("#preview")).toContainText("31.20");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
