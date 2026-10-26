import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { parseProjectFile } from "../../src/project-state.js";
import { decode64, encode64 } from "../../src/cid.js";
import { readURL, writeURL } from "../../src/url-state.js";

const base = "http://127.0.0.1:4173/index.html";
const fixture = () => readFile(new URL("../fixtures/projects/v1.sheets.json", import.meta.url), "utf8");
const ready = (page) => expect(page.locator("#render-status")).toHaveText(/^(Ready|\d+ diagnostic)/);
const source = (page) => page.evaluate(() => ace.edit("editor").getValue());
const upload = (page, text) => page.locator("#project-file").setInputFiles({ name: "model.sheets.json", mimeType: "application/json", buffer: Buffer.from(text) });
function cidFor(text) {
  const bytes = Buffer.from(text), length = Buffer.alloc(6); length.writeUIntBE(bytes.length, 0, 6);
  return length.toString("base64url") + (bytes.length <= 64 ? bytes : createHash("sha512").update(bytes).digest()).toString("base64url");
}

test("portable project download opens exact source and mode, shares, reloads and keeps edits without dependency requests", async ({ page, context }) => {
  const document = parseProjectFile(await fixture()), payload = document.inputSnapshot.payloads[0];
  await page.route("https://256t.us/" + payload.cid, (route) => route.fulfill({ body: Buffer.from(decode64(payload.data)), contentType: "text/plain" }));
  await page.goto(writeURL(base, { ...document, inputSnapshot: undefined, format: "org" })); await ready(page);
  await expect(page.locator("#preview table:not(.org-inputs)").first()).toHaveText("11112");
  await page.locator("#download-menu summary").click();
  const pending = page.waitForEvent("download"); await page.locator("#download-project").click();
  const file = await pending, text = await readFile(await file.path(), "utf8");
  expect(file.suggestedFilename()).toBe("portable-model-日本語.sheets.json");
  expect(parseProjectFile(text)).toEqual(document);
  const fresh = await context.newPage(); let requests = 0;
  await fresh.route("https://256t.us/**", async (route) => { requests++; await route.abort(); });
  await fresh.goto(base); await ready(fresh);
  await upload(fresh, text);
  await expect(fresh.locator("#project-status")).toContainText("opened"); await ready(fresh);
  expect(await source(fresh)).toBe(document.src);
  await expect(fresh.locator("#profile")).toHaveValue("org-emacs-v1");
  await expect(fresh.locator("#format")).toBeDisabled();
  await expect(fresh.locator("#source-pane")).toBeHidden();
  await expect(fresh.locator("#project-controls")).toBeVisible();
  await expect(fresh.locator("#preview table:not(.org-inputs)").last()).toHaveText("1003.00");
  expect(readURL(fresh.url()).kind).toBe("project");
  await fresh.reload(); await ready(fresh);
  await fresh.locator("#profile").selectOption("");
  await expect(fresh.locator("#preview table:not(.org-inputs)").first()).toHaveText("1111");
  const edited = document.src.replace("| 100 |", "| 200 |");
  await fresh.evaluate((src) => ace.edit("editor").setValue(src, -1), edited);
  await expect(fresh.locator("#preview table:not(.org-inputs)").last()).toHaveText("2006.00");
  await fresh.getByRole("button", { name: "Share", exact: true }).click();
  const link = await fresh.locator("#share-url").inputValue(), shared = await context.newPage();
  await shared.route("https://256t.us/**", async (route) => { requests++; await route.abort(); });
  await shared.goto(link); await ready(shared); await shared.reload(); await ready(shared);
  expect(await source(shared)).toBe(edited);
  await expect(shared.locator("#profile")).toHaveValue("");
  await expect(shared.locator("#preview table:not(.org-inputs)").last()).toHaveText("2006.00");
  await shared.setViewportSize({ width: 390, height: 844 });
  expect(await shared.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await shared.locator("#download-menu summary").click();
  const rootFile = shared.waitForEvent("download"); await shared.locator("#download-source").click();
  expect(await readFile(await (await rootFile).path(), "utf8")).toBe(edited);
  expect(requests).toBe(0);
  await shared.close(); await fresh.close();
});

test("tampered files and unknown versions leave the current source intact; missing payloads never fetch replacements", async ({ page }) => {
  const original = "# Keep this document\n", doc = JSON.parse(await fixture()); let requests = 0;
  await page.route("https://256t.us/**", async (route) => { requests++; await route.abort(); });
  await page.goto(writeURL(base, { src: original, format: "gfm" })); await ready(page);
  const tampered = structuredClone(doc), bytes = decode64(tampered.inputSnapshot.payloads[0].data);
  bytes[bytes.length - 1] ^= 1; tampered.inputSnapshot.payloads[0].data = encode64(bytes);
  await upload(page, JSON.stringify(tampered));
  await expect(page.locator("#project-status")).toContainText("hash"); expect(await source(page)).toBe(original);
  await upload(page, JSON.stringify({ ...doc, version: 99 }));
  await expect(page.locator("#project-status")).toContainText("version"); expect(await source(page)).toBe(original);
  await upload(page, JSON.stringify({ ...doc, inputSnapshot: { version: 1, payloads: [] } }));
  await expect(page.locator("#project-status")).toContainText("opened"); await ready(page);
  await expect(page.locator("#preview .org-shared-inputs .error")).toContainText("missing");
  await expect(page.locator("#preview table:not(.org-inputs)").last()).toHaveText("1000");
  await page.locator("#download-menu summary").click(); await expect(page.locator("#download-project")).toBeDisabled();
  expect(requests).toBe(0);
  await page.goBack(); await ready(page); expect(await source(page)).toBe(original);
});

test("use-live-inputs is explicit and Back restores the bundled snapshot", async ({ page }) => {
  const document = parseProjectFile(await fixture()); let requests = 0;
  await page.route("https://256t.us/**", async (route) => { requests++; await route.fulfill({ status: 404, body: "Missing" }); });
  await page.goto(writeURL(base, { ...document, format: "org" })); await ready(page);
  expect(requests).toBe(0);
  await page.locator("#project-detach").click(); await ready(page);
  await expect(page.locator("#preview .org-shared-inputs .error")).toContainText("404");
  await expect(page.locator("#format")).toBeEnabled(); expect(requests).toBe(1);
  await page.goBack(); await ready(page);
  await expect(page.locator("#preview table:not(.org-inputs)").last()).toHaveText("1003.00");
  await expect(page.locator("#format")).toBeDisabled(); expect(requests).toBe(1);
  const replacement = cidFor("#+CONSTANTS: price=0.04\n#+COMMENT: " + "x".repeat(80)), changed = document.src.replace(document.inputSnapshot.payloads[0].cid, replacement);
  await page.evaluate((src) => ace.edit("editor").setValue(src, -1), changed);
  await expect(page.locator("#preview .org-shared-inputs .error")).toContainText("missing");
  expect(requests).toBe(1);
});

test("editing during file verification prevents the snapshot replacing newer source", async ({ page }) => {
  await page.goto(writeURL(base, { src: "# Original\n", format: "gfm" })); await ready(page);
  await page.evaluate(() => {
    const digest = crypto.subtle.digest.bind(crypto.subtle);
    globalThis.hashGate = new Promise((resolve) => { globalThis.releaseHash = resolve; });
    crypto.subtle.digest = async (...args) => { globalThis.hashStarted = true; await globalThis.hashGate; return digest(...args); };
  });
  await upload(page, await fixture());
  await expect.poll(() => page.evaluate(() => globalThis.hashStarted)).toBe(true);
  await page.evaluate(() => ace.edit("editor").setValue("# Newer edit\n", -1));
  await page.evaluate(() => globalThis.releaseHash());
  await expect(page.locator("#project-status")).toContainText("cancelled");
  expect(await source(page)).toBe("# Newer edit\n");
  await expect(page.locator("#project-controls")).toBeHidden();
});

test("version-3 saved projects load bundled dependencies without additional requests", async ({ page }) => {
  const document = parseProjectFile(await fixture()),
    payload = JSON.stringify({ format: "sheets-document", version: 3, ...document }), cid = cidFor(payload);
  let dependencies = 0;
  await page.route("https://256t.us/**", async (route) => {
    if (route.request().url() === "https://256t.us/" + cid) return route.fulfill({ body: payload, contentType: "application/json" });
    dependencies++; return route.abort();
  });
  await page.goto(base + "#" + cid); await ready(page); await page.reload(); await ready(page);
  expect(await source(page)).toBe(document.src);
  await expect(page.locator("#profile")).toHaveValue("org-emacs-v1");
  await expect(page.locator("#project-controls")).toBeVisible();
  await expect(page.locator("#preview table:not(.org-inputs)").last()).toHaveText("1003.00");
  expect(dependencies).toBe(0);
});
