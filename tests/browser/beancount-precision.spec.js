import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { readURL, writeURL } from "../../src/url-state.js";

test("decimal ledger quantities survive reports, exports and shared links; tiny imbalances remain visible", async ({
  page,
  context,
}) => {
  const source = await readFile(
    new URL("../fixtures/beancount/precision.bean", import.meta.url),
    "utf8",
  );
  await page.goto(
    writeURL("http://127.0.0.1:4173/", { src: source, format: "beancount" }),
  );
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await page.getByRole("tab", { name: "Trial balance", exact: true }).click();
  await expect(page.locator("#report-trial")).toContainText(
    "9007199254740993.0000000002",
  );
  await page.locator("#download-menu summary").click();
  const pending = page.waitForEvent("download");
  await page.locator("#download-html").click();
  const exported = await pending;
  const saved = await context.newPage();
  await saved.setContent(await readFile(await exported.path(), "utf8"));
  await expect(saved.locator("#report-trial")).toContainText(
    "9007199254740993.0000000002",
  );
  await saved.close();
  await page.getByRole("tab", { name: "Account journal", exact: true }).click();
  await expect(page.locator("#report-journal")).toContainText(
    "0.0000000001 USD",
  );
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const shared = await page.locator("#share-url").inputValue();
  expect(readURL(shared)).toMatchObject({ src: source, format: "beancount" });
  await page.goto(shared);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  await page.getByRole("tab", { name: "Trial balance", exact: true }).click();
  await expect(page.locator("#report-trial")).toContainText(
    "9007199254740993.0000000002",
  );

  const unbalanced = await readFile(
    new URL("../fixtures/beancount/tiny-unbalanced.bean", import.meta.url),
    "utf8",
  );
  await page.goto(
    writeURL("http://127.0.0.1:4173/", {
      src: unbalanced,
      format: "beancount",
    }),
  );
  await expect(page.locator("#render-status")).toHaveText(/diagnostic/);
  await expect(page.locator("#report-errors")).toContainText(
    "Unbalanced transaction: -0.0000000001 USD.",
  );
});
