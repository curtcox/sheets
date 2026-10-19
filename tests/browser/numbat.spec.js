import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
const { cases } = JSON.parse(
  await readFile(
    new URL("../fixtures/numbat/statements.json", import.meta.url),
  ),
);
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(
    /^(?:Ready|\d+ diagnostic)/,
  );
async function open(page, source) {
  const url = writeURL("https://sheets.test/index.html", {
    src: source,
    format: "numbat",
    view: "split",
  });
  await page.goto(new URL(url).pathname + new URL(url).search);
  await ready(page);
}
const annotations = (page) =>
  page.evaluate(() => ace.edit("editor").session.getAnnotations());
const source = (page) => page.evaluate(() => ace.edit("editor").getValue());

test("Numbat parser boundaries preserve source and valid multiline grammar", async ({
  page,
}) => {
  for (const id of [
    "independent-indent",
    "multiline-interpolation",
    "escaped-backslash",
    "function-local",
    "decorator",
    "semicolon",
  ]) {
    const fixture = cases.find((item) => item.id === id);
    await open(page, fixture.source);
    await expect(page.locator("#render-status")).toContainText("Ready");
    expect(await source(page)).toBe(fixture.source);
    expect(
      (
        await page.locator("#preview .result-line > code").allTextContents()
      ).join(""),
    ).toBe(fixture.source);
    await expect(page.locator("#preview output").last()).toContainText(
      fixture.contains,
    );
    expect(await annotations(page)).toEqual([]);
  }
});

test("Numbat editor annotations use actual multiline and Unicode positions while later statements run", async ({
  page,
}) => {
  for (const id of ["multiline-error", "unicode-offset", "parse-recovery"]) {
    const fixture = cases.find((item) => item.id === id);
    await open(page, fixture.source);
    await expect(page.locator("#render-status")).toContainText("1 diagnostic");
    expect(await annotations(page)).toMatchObject(
      fixture.diagnostics.map((item) => ({
        row: item.line - 1,
        column: item.column,
        type: "error",
      })),
    );
    await expect(page.locator("#preview output").last()).toContainText("= 42");
    expect(await source(page)).toBe(fixture.source);
  }
  await open(page, "fn sheet_f(x: Length) = x\n\nlet value = sheet_f(2 s)\n42");
  expect(await annotations(page)).toMatchObject([
    {
      row: 2,
      column: 20,
      text: expect.stringContaining("incompatible dimensions"),
    },
  ]);
});

test("Numbat lexical failures use complete input and editing terminates old workers", async ({
  page,
}) => {
  for (const id of ["unterminated-string", "lexical-error"]) {
    const fixture = cases.find((item) => item.id === id);
    await open(page, fixture.source);
    await expect(page.locator("#preview .result-line")).toHaveCount(1);
    expect(await annotations(page)).toMatchObject(
      fixture.diagnostics.map((item) => ({
        row: item.line - 1,
        column: item.column,
      })),
    );
    await expect(page.locator("#preview output")).not.toContainText("= 42");
  }
  await page.evaluate(() =>
    ace
      .edit("editor")
      .setValue("let sheetvalue = 1\n".repeat(2500) + "999", -1),
  );
  await expect(page.locator("#render-status")).toContainText("Rendering");
  await page.evaluate(() => ace.edit("editor").setValue("42", -1));
  await expect(page.locator("#preview .result-line > code")).toHaveText("42");
  await ready(page);
  await expect(page.locator("#preview output")).toContainText("= 42");
  expect(await annotations(page)).toEqual([]);
});

test("Numbat documentation examples load the editor with working multiline and recovery examples", async ({
  page,
}) => {
  await page.goto("/docs.html?page=formats/numbat");
  await page
    .locator("#docs-content pre")
    .filter({ hasText: "fn sheet_average" })
    .locator("xpath=following-sibling::p[1]")
    .locator("a")
    .click();
  await ready(page);
  await expect(page.locator("#render-status")).toContainText("Ready");
  await expect(page.locator("#preview output").last()).toContainText("4 m");
  await page.goto("/docs.html?page=formats/numbat");
  await page
    .locator("#docs-content pre")
    .filter({ hasText: "missing_reading" })
    .locator("xpath=following-sibling::p[1]")
    .locator("a")
    .click();
  await ready(page);
  expect(await annotations(page)).toMatchObject([{ row: 3, column: 2 }]);
  await expect(page.locator("#preview output").last()).toContainText("= 42");
  await page.goto("/docs.html?page=limitations");
  await expect(page.locator("#docs-content")).toContainText("NUM-05");
  await expect(page.locator("#docs-content")).toContainText("NUM-01");
});
