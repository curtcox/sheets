import { test, expect } from "@playwright/test";
import { writeURL } from "../../src/url-state.js";
import { longSource } from "../fixtures/long-source.js";
import { readFile } from "node:fs/promises";
import { parseProjectFile } from "../../src/project-state.js";
import { mockHashBin } from "./hashbin-mock.js";
const clientId = "app_8e03e133-83b4-4ee2-b3d5-39397f573879";
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(
    /^(?:Ready|\d+ diagnostic)/,
    { timeout: 110000 },
  );

test("portable projects are approved as version 3 and reload with bundled inputs", async ({ page }) => {
  const document = parseProjectFile(await readFile(new URL("../fixtures/projects/v1.sheets.json", import.meta.url), "utf8")),
    hashbin = await mockHashBin(page);
  await page.goto(writeURL("http://127.0.0.1:4173/", { ...document, format: "org" })); await ready(page);
  await page.locator("#hashbin-open").click(); await page.locator("#hashbin-save").click();
  await expect(page.locator("#hashbin-confirm")).toBeEnabled();
  await expect(page.locator("#hashbin-message")).toContainText("approve the save on hashbin.org"); expect(hashbin.saves.length).toBe(0);
  await page.locator("#hashbin-confirm").click(); await expect(page.locator("#hashbin-status")).toHaveText("Saved to HashBin.");
  const saved = JSON.parse(hashbin.last.payload);
  expect(saved.version).toBe(3); expect(saved.inputSnapshot).toEqual(document.inputSnapshot); expect(saved.src).toBe(document.src);
  expect(hashbin.saves.length).toBe(1);
  await page.reload(); await ready(page);
  await expect(page.locator("#profile")).toHaveValue("org-emacs-v1");
  await expect(page.locator("#project-controls")).toBeVisible();
  await expect(page.locator("#preview table:not(.org-inputs)").last()).toHaveText("1003.00");
});

test("HashBin Publish saves only after approval, re-prepares after edits, revokes legacy tokens and saves a reloadable link", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const hashbin = await mockHashBin(page);
  const original = "# Publish source 日本語\n\n2+2 =>\n\n" + longSource;
  const url = writeURL("http://127.0.0.1:4173/", {
    src: original,
    format: "calca",
    view: "preview",
  });
  await page.goto(url);
  await ready(page);
  // Tokens from the earlier OAuth flow are revoked server-side on the next load.
  await page.evaluate((id) => localStorage.setItem("hashbin:tokens:" + id, '{"refreshToken":"old"}'), clientId);
  await page.reload();
  await ready(page);
  await page.waitForFunction((id) => localStorage.getItem("test-hashbin-revoked") === "yes" && !localStorage.getItem("hashbin:tokens:" + id), clientId);
  await page.locator("#hashbin-open").click();
  await expect(page.locator("#hashbin-save")).toBeEnabled();
  await page.locator("#hashbin-save").click();
  await expect(page.locator("#hashbin-confirm")).toHaveText("Review on HashBin");
  await expect(page.locator("#hashbin-confirm")).toBeEnabled();
  expect(hashbin.saves.length).toBe(0);
  const edited = "# Updated source 日本語\n\n3+4 =>";
  await page.evaluate(
    (source) => ace.edit("editor").setValue(source, -1),
    edited,
  );
  await ready(page);
  // Edits made while the dialog was open are prepared again before anything is sent.
  await page.locator("#hashbin-confirm").click();
  expect(hashbin.saves.length).toBe(0);
  await expect(page.locator("#hashbin-confirm")).toBeEnabled();
  await page.locator("#hashbin-confirm").click();
  await expect(page.locator("#hashbin-status")).toHaveText("Saved to HashBin.");
  expect(hashbin.saves.length).toBe(1);
  expect(JSON.parse(hashbin.last.payload)).toEqual({
    format: "sheets-document",
    version: 1,
    type: "calca",
    src: edited,
    view: "preview",
  });
  expect(new URL(page.url()).hash).toBe("#" + hashbin.last.cid);
  expect(new URL(page.url()).searchParams.has("compressed")).toBe(false);
  await page.reload();
  await ready(page);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(edited);
  await expect(page.locator("#format")).toHaveValue("calca");
  await expect(page.locator("#source-pane")).toBeHidden();
  await expect(page.locator("#preview")).toContainText("3+4 => 7");
  // A popup closed or cancelled on HashBin saves nothing and keeps the dialog usable.
  await hashbin.mode("cancel");
  await page.locator("#hashbin-open").click();
  await page.locator("#hashbin-save").click();
  await expect(page.locator("#hashbin-confirm")).toBeEnabled();
  await page.locator("#hashbin-confirm").click();
  await expect(page.locator("#hashbin-message")).toHaveText("The save was cancelled on HashBin.");
  await expect(page.locator("#hashbin-confirm")).toBeEnabled();
  expect(hashbin.saves.length).toBe(1);
  expect(errors).toEqual([]);
});
