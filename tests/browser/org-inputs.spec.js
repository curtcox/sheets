import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
import { HashBinDocuments } from "../../src/hashbin.js";

const base = "http://127.0.0.1:4173/index.html";
const ready = (page) => expect(page.locator("#render-status")).toHaveText(/^(Ready|\d+ diagnostic)/);
const value = (page) => page.evaluate(() => ace.edit("editor").getValue());
function cidFor(text) {
  const bytes = Buffer.from(text), length = Buffer.alloc(6);
  length.writeUIntBE(bytes.length, 0, 6);
  return length.toString("base64url") + (bytes.length <= 64 ? bytes : createHash("sha512").update(bytes).digest()).toString("base64url");
}
const header = (cid) => `#+SHEETS_INPUT: v1 rates ${cid}\n`;
const model = (cid) => "#+TITLE: Shared model\n" + header(cid) + "| 100 | 99 |\n#+TBLFM: $2=$1*$rates.price;%.2f\n";

test("verified CID constants work in both modes, with visible provenance, sharing, source and HTML exports", async ({ page, context }) => {
  const assumptions = await readFile(new URL("../fixtures/org-inputs/assumptions.org", import.meta.url), "utf8");
  for (const profile of [undefined, "org-emacs-v1"]) {
    const payload = HashBinDocuments.serialize({ src: assumptions, type: "org", profile }), cid = cidFor(payload),
      source = profile ? "\uFEFF" + model(cid).replaceAll("\n", "\r\n") : model(cid);
    await page.route("https://256t.us/" + cid, async (route) => {
      expect(route.request().headers()["referer"]).toBeUndefined();
      expect(route.request().headers()["authorization"]).toBeUndefined();
      return route.fulfill({ body: payload, contentType: "application/json" });
    });
    await page.goto(writeURL(base, { src: source, format: "org", profile, view: "preview" }));
    await ready(page);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    await expect(page.locator("#preview table:not(.org-inputs) td")).toHaveText(["100", "3.00"]);
    await expect(page.locator("#preview .org-inputs tbody th")).toContainText(["$rates.price", "$rates.users", "$rates.tax", "$rates.exact", "$rates.duplicate"]);
    await expect(page.locator("#preview .org-shared-inputs a")).toHaveAttribute("href", "https://256t.us/" + cid);
    await expect(page.locator("#preview .org-shared-inputs")).toContainText("123456789012345678901234567890");
    expect(await value(page)).toBe(source);
    const tokens = await page.evaluate(() => ace.edit("editor").session.getTokens(3).filter((t) => t.type === "variable").map((t) => t.value));
    expect(tokens).toContain("$rates.price");
    await page.getByRole("button", { name: "Share", exact: true }).click();
    const fresh = await context.newPage();
    await fresh.route("https://256t.us/" + cid, (route) => route.fulfill({ body: payload, contentType: "application/json" }));
    await fresh.goto(await page.locator("#share-url").inputValue());
    await ready(fresh); await fresh.reload(); await ready(fresh);
    expect(await value(fresh)).toBe(source);
    await expect(fresh.locator("#profile")).toHaveValue(profile || "");
    await expect(fresh.locator("#preview table:not(.org-inputs)")).toHaveText("1003.00");
    await fresh.setViewportSize({ width: 390, height: 844 });
    expect(await fresh.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await fresh.locator("#download-menu summary").click();
    let pending = fresh.waitForEvent("download"); await fresh.locator("#download-source").click();
    expect(await readFile(await (await pending).path(), "utf8")).toBe(source);
    await fresh.locator("#download-menu summary").click();
    pending = fresh.waitForEvent("download"); await fresh.locator("#download-html").click();
    const html = await readFile(await (await pending).path(), "utf8"), saved = await context.newPage();
    await saved.setContent(html); await saved.emulateMedia({ media: "print" });
    await expect(saved.locator(".org-shared-inputs")).toContainText(cid);
    await expect(saved.locator("table:not(.org-inputs)")).toHaveText("1003.00");
    await expect(saved.locator("script,button")).toHaveCount(0);
    await saved.close(); await fresh.close(); await page.locator("#share-close").click();
  }
});

test("CID verification, missing content and malformed inputs retain cells and show declaration/formula diagnostics", async ({ page }) => {
  const original = "#+CONSTANTS: price=0.03\n#+COMMENT: " + "x".repeat(80), cid = cidFor(original);
  for (const [body, status, error] of [[original.replace("0.03", "0.04"), 200, "hash"], ["", 404, "404"]]) {
    await page.route("https://256t.us/" + cid, (route) => route.fulfill({ body, status, contentType: "text/plain" }));
    await page.goto(writeURL(base, { src: model(cid), format: "org", profile: "org-emacs-v1" }));
    await ready(page);
    await expect(page.locator("#render-status")).toHaveText(/^2 diagnostics/);
    await expect(page.locator("#preview table:not(.org-inputs) td")).toHaveText(["100", "99"]);
    await expect(page.locator("#preview .org-shared-inputs .error")).toContainText(error);
    expect(await page.evaluate(() => ace.edit("editor").session.getAnnotations())).toMatchObject([{ row: 1 }, { row: 3 }]);
  }
  const bad = "#+CONSTANTS: price=<img/src=x/onerror=globalThis.orgBad=1>", badCID = cidFor(bad);
  await page.route("https://256t.us/" + badCID, (route) => route.fulfill({ body: bad, contentType: "text/plain" }));
  await page.goto(writeURL(base, { src: model(badCID), format: "org" }));
  await ready(page);
  await expect(page.locator("#preview .org-shared-inputs .error")).toContainText("invalid numeric");
  await expect(page.locator("#preview img,#preview script")).toHaveCount(0);
  expect(await page.evaluate(() => globalThis.orgBad)).toBeUndefined();
});

test("editing or cancelling an in-flight input fetch cannot install a stale result", async ({ page }) => {
  const payload = "#+CONSTANTS: price=0.03\n#+COMMENT: " + "x".repeat(80), cid = cidFor(payload);
  let release, started = false;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route("https://256t.us/" + cid, async (route) => {
    started = true; await gate;
    await route.fulfill({ body: payload, contentType: "text/plain" }).catch(() => {});
  });
  await page.goto(writeURL(base, { src: "#+TITLE: Before load\n| 2 | 0 |\n#+TBLFM: $2=$1*3\n", format: "org" }));
  await ready(page);
  await expect(page.getByRole("button", { name: "Copy recalculated source" })).toBeEnabled();
  await page.evaluate((src) => ace.edit("editor").setValue(src, -1), model(cid));
  await expect.poll(() => started).toBe(true);
  await expect(page.getByRole("button", { name: "Copy recalculated source" })).toBeDisabled();
  await page.evaluate(() => ace.edit("editor").setValue("#+TITLE: New source\n| 2 | 0 |\n#+TBLFM: $2=$1*4\n", -1));
  release(); await ready(page);
  await expect(page.locator("#preview table")).toHaveText("28");
  await expect(page.locator("#preview .org-shared-inputs")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy recalculated source" })).toBeEnabled();
  expect(await value(page)).toContain("New source");
  started = false;
  let releaseCancel;
  const cancelGate = new Promise((resolve) => { releaseCancel = resolve; });
  await page.route("https://256t.us/" + cid, async (route) => {
    started = true; await cancelGate;
    await route.fulfill({ body: payload, contentType: "text/plain" }).catch(() => {});
  });
  await page.goto(writeURL(base, { src: model(cid), format: "org" }));
  await expect.poll(() => started).toBe(true);
  await page.locator("#cancel-render").click();
  releaseCancel();
  await expect(page.locator("#render-status")).toHaveText(/^Cancelled/);
  expect(await value(page)).toBe(model(cid));
  await expect(page.locator("#preview .org-shared-inputs")).toHaveCount(0);
});

test("root HashBin envelopes preserve dependency declarations, and the guide's inline CID example needs no network", async ({ page }) => {
  const src = await readFile(new URL("../fixtures/org-inputs/model.org", import.meta.url), "utf8");
  for (const profile of [undefined, "org-emacs-v1"]) {
    const payload = HashBinDocuments.serialize({ src, type: "org", profile }), rootCID = cidFor(payload);
    await page.route("https://256t.us/" + rootCID, (route) => route.fulfill({ body: payload, contentType: "application/json" }));
    await page.goto(base + "#" + rootCID); await ready(page); await page.reload(); await ready(page);
    await expect(page.locator("#profile")).toHaveValue(profile || "");
    await expect(page.locator("#preview table:not(.org-inputs) tbody td")).toHaveText(["100", "3.00"]);
    expect(await value(page)).toBe(src);
  }
  await page.route("https://256t.us/**", () => { throw Error("Inline CID example must not fetch"); });
  await page.goto("/docs.html?page=formats/org");
  await page.locator("#docs-content pre").filter({ hasText: "AAAAAAAXIytDT05TVEFOVFM6IHByaWNlPTAuMDM" })
    .locator("xpath=following-sibling::p[1]").getByRole("link").click();
  await ready(page);
  await expect(page.locator("#preview table:not(.org-inputs) tbody td")).toHaveText(["100", "3.00"]);
});
