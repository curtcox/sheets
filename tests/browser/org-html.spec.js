import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
const file = (name) => readFile(new URL(`../fixtures/org-html/${name}`, import.meta.url), "utf8");
const ready = (page) => expect(page.locator("#render-status")).toHaveText(/^Ready/);

async function presentation(tables) {
  return tables.evaluateAll((tables) => tables.map((table) =>
    [...table.children].filter((el) => ["THEAD", "TBODY"].includes(el.tagName)).map((group) => ({
      tag: group.tagName.toLowerCase(),
      rows: [...group.rows].map((row) => [...row.cells].map((cell) =>
        [cell.tagName.toLowerCase(), cell.getAttribute("scope") || "",
          [...cell.classList].find((c) => /^org-(left|right|center)$/.test(c))?.slice(4) || ""].join(":"))),
    })),
  ));
}

test("Org header groups, scopes and column alignment match independent native HTML exports in both modes", async ({ page }) => {
  const reference = JSON.parse(await file("reference.json"));
  for (const profile of [undefined, "org-emacs-v1"]) {
    for (const [name, expected] of Object.entries(reference)) {
      const src = await file(name);
      await page.goto(writeURL("http://127.0.0.1:4173/", { src, format: "org", profile }));
      await ready(page);
      expect(await presentation(page.locator("#preview table")), name).toEqual(expected);
      expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(src);
      for (const cell of await page.locator("#preview th,#preview td").all()) {
        const alignment = await cell.evaluate((el) => ({
          expected: [...el.classList].find((c) => /^org-(left|right|center)$/.test(c)).slice(4),
          actual: getComputedStyle(el).textAlign,
        }));
        expect(alignment.actual).toBe(alignment.expected);
      }
    }
  }
});

test("Org headers and alignment survive sanitized HTML download, mobile and print", async ({ page, context }) => {
  const src = await file("cookies.org"),
    expected = JSON.parse(await file("reference.json"))["cookies.org"];
  await page.goto(writeURL("http://127.0.0.1:4173/", { src, format: "org" }));
  await ready(page);
  await page.locator("#download-menu summary").click();
  const pending = page.waitForEvent("download");
  await page.locator("#download-html").click();
  const html = await readFile(await (await pending).path(), "utf8");
  const saved = await context.newPage();
  await saved.setContent(html);
  await saved.setViewportSize({ width: 390, height: 844 });
  expect(await presentation(saved.locator("table"))).toEqual(expected);
  for (const target of [page, saved]) {
    await target.emulateMedia({ media: "print" });
    const value = target.locator("table").first().locator("tbody tr").first().locator("td").nth(1);
    expect(await value.evaluate((el) => getComputedStyle(el).textAlign)).toBe("right");
    await expect(target.locator('table').first().locator('thead th[scope="col"]')).toHaveCount(3);
  }
  await expect(saved.locator("script,button,style+script")).toHaveCount(0);
  await saved.close();
});

test("Org alignment updates after edits and the guide's currency cookies open as a working example", async ({ page }) => {
  const src = "| Name | Value |\n|------+-------|\n| A | 3 |\n| B | 4 |\n";
  await page.goto(writeURL("http://127.0.0.1:4173/", { src, format: "org" }));
  await ready(page);
  await expect(page.locator("thead th").nth(1)).toHaveClass("org-right");
  const changed = src.replace("3", "unknown").replace("4", "missing");
  await page.evaluate((src) => ace.edit("editor").setValue(src, -1), changed);
  await expect(page.locator("thead th").nth(1)).toHaveClass("org-left");
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(changed);
  await page.goto("/docs.html?page=formats/org");
  await page.locator("#docs-content pre")
    .filter({ hasText: "| Reserve | $2.50" })
    .locator("xpath=following-sibling::p[1]").getByRole("link").click();
  await ready(page);
  await expect(page.locator("tbody td.org-right")).toHaveText(["$2.50", "$3.00"]);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toContain("<r>");
  await expect(page.locator("table tr")).toHaveCount(3);
});
