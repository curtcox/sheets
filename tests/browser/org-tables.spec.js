import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";

const source = `#+TITLE: Readable money tables

| Metric | Value | Cost | Change | Rate | Fraction | Reserve |
|--------+-------+------+--------+------+----------+---------|
| Storage assumptions with a long descriptive label | 0 | $2,877.12 | -1234.56 | 1.25e-12 | 2:3 | 12345678901234567890.12 |
#+TBLFM: @2$2=0.03;%.2f

Surrounding prose stays inside the available page width.
`;
const expected = [
  ["Metric", "Value", "Cost", "Change", "Rate", "Fraction", "Reserve"],
  [
    "Storage assumptions with a long descriptive label", "0.03", "$2,877.12",
    "-1234.56", "1.25e-12", "2:3", "12345678901234567890.12",
  ],
];

// Count actual text line positions. A CSS-property assertion alone would miss
// numbers split by browser line-breaking rules or descendant styles.
async function textLines(cell) {
  return cell.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return new Set(
      [...range.getClientRects()].map((rect) => Math.round(rect.top)),
    ).size;
  });
}

async function readable(page, root) {
  expect(await root.locator("tr").evaluateAll((rows) =>
    rows.map((row) => [...row.cells].map((cell) => cell.textContent)),
  )).toEqual(expected);
  for (const cell of await root.locator("tr").last().locator("td").all()) {
    if (await cell.textContent() !== expected[1][0])
      expect(await textLines(cell), await cell.textContent()).toBe(1);
  }
  expect(await textLines(root.locator("tr").first().locator("td,th").nth(1))).toBe(1);
  // Long labels may wrap between words, but never through the middle of a word.
  expect(await root.locator("tr").last().locator("td").first().evaluate((cell) => {
    const text = cell.firstChild;
    for (const match of text.textContent.matchAll(/\S+/g)) {
      const range = document.createRange();
      range.setStart(text, match.index);
      range.setEnd(text, match.index + match[0].length);
      if (new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size !== 1)
        return false;
    }
    return true;
  })).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("Org money values stay on one line at 800 px Split and mobile; wide tables scroll locally", async ({
  page,
}) => {
  for (const profile of [undefined, "org-emacs-v1"]) {
    await page.setViewportSize({ width: 800, height: 800 });
    await page.goto(writeURL("http://127.0.0.1:4173/", { src: source, format: "org", profile }));
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    const table = page.locator("#preview table");
    await readable(page, table);
    for (const width of [800, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await readable(page, table);
      const scroll = page.locator("#preview .org-table-scroll");
      expect(await scroll.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
      await scroll.evaluate((el) => { el.scrollLeft = 0; });
      await scroll.focus();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => scroll.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
      expect(await scroll.evaluate((el) => { el.scrollLeft = el.scrollWidth; return el.scrollLeft; })).toBeGreaterThan(0);
      await expect(table.locator("tr").last().locator("td").last()).toBeInViewport();
    }
    expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  }
  await page.emulateMedia({ media: "print" });
  expect(await page.locator(".org-table-scroll").evaluate((el) =>
    getComputedStyle(el).overflowX,
  )).toBe("visible");
});

test("exported Org money tables retain readable values and local scrolling without scripts", async ({
  page,
  context,
}) => {
  await page.goto(writeURL("http://127.0.0.1:4173/", { src: source, format: "org" }));
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await page.locator("#download-menu summary").click();
  const download = page.waitForEvent("download");
  await page.locator("#download-html").click();
  const html = await readFile(await (await download).path(), "utf8");
  const saved = await context.newPage();
  await saved.setContent(html);
  for (const width of [800, 390]) {
    await saved.setViewportSize({ width, height: 800 });
    await readable(saved, saved.locator("table"));
    const scroll = saved.locator(".org-table-scroll");
    if (width === 390)
      expect(await scroll.evaluate((el) => { el.scrollLeft = el.scrollWidth; return el.scrollLeft; })).toBeGreaterThan(0);
  }
  await saved.emulateMedia({ media: "print" });
  expect(await saved.locator(".org-table-scroll").evaluate((el) =>
    getComputedStyle(el).overflowX,
  )).toBe("visible");
  await expect(saved.locator("script,button")).toHaveCount(0);
  await saved.close();
});
