import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(/^(Ready|\d+ diagnostic)/);
const file = (path) =>
  readFile(new URL("../../" + path, import.meta.url), "utf8");
const url = (src) =>
  writeURL("http://127.0.0.1:4173/index.html", { format: "org", src });

test("Org named inputs survive source sharing, reload, copy and rendered exports", async ({
  page,
  context,
}) => {
  const source = await file("examples/org/edge.org"),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url(source));
  await ready(page);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(
    page.locator("#preview td").filter({ hasText: /^14\.40$/ }),
  ).toHaveCount(1);
  await expect(
    page.locator("#preview td").filter({ hasText: /^16\.80$/ }),
  ).toHaveCount(1);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          globalThis.orgCopied = text;
        },
      },
    }),
  );
  await page.getByRole("button", { name: "Copy recalculated source" }).click();
  const copied = await page.evaluate(() => globalThis.orgCopied);
  expect(copied).toContain("14.40");
  expect(copied).toContain("16.80");
  expect(copied).toContain("tax=0.20");
  expect(copied).toContain("#+TBLFM: $4=$Qty*$UnitPrice*(1+$tax);%.2f");
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  const html = await page.evaluate(async () => {
    const { htmlDownload } = await import("./src/export-document.js");
    return htmlDownload(document.getElementById("preview")).blob.text();
  });
  expect(html).toContain("14.40");
  expect(html).toContain("16.80");
  expect(html).not.toContain("<script");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const fresh = await context.newPage();
  await fresh.goto(await page.locator("#share-url").inputValue());
  await ready(fresh);
  await fresh.reload();
  await ready(fresh);
  expect(await fresh.evaluate(() => ace.edit("editor").getValue())).toBe(
    source,
  );
  await expect(fresh.locator("#preview")).toContainText("14.40");
  await fresh.locator("#download-menu summary").click();
  const download = fresh.waitForEvent("download");
  await fresh.locator("#download-source").click();
  expect(await readFile(await (await download).path(), "utf8")).toBe(source);
  expect(errors).toEqual([]);
});

test("Org named-reference DOM matches Emacs fixtures and literal blocks stay safe", async ({
  page,
}) => {
  const reference = JSON.parse(await file("tests/fixtures/org/reference.json"));
  for (const name of [
    "named-columns",
    "named-fields",
    "named-ranges",
    "constants",
    "name-precedence",
    "named-duplicates",
    "named-case",
    "named-hlines",
    "literal",
  ]) {
    const source = await file("tests/fixtures/org/" + name + ".org");
    await page.goto(url(source));
    await ready(page);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    expect(
      await page
        .locator("#preview table tr")
        .evaluateAll((rows) =>
          rows.map((row) =>
            [...row.querySelectorAll("td")].map((cell) => cell.textContent),
          ),
        ),
    ).toEqual(reference[name + ".org"]);
    expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(
      source,
    );
  }
  await expect(page.locator("#preview pre")).toContainText(
    "#+CONSTANTS: rate=999",
  );
  const source =
    "#+CONSTANTS: bad=oops\n\n| # | 2 | 0 |\n#+TBLFM: $3=$missing\n\n#+BEGIN_EXPORT html\n<script>globalThis.orgBad=1</script>\n| 9 | 0 |\n#+TBLFM: $2=100\n#+END_EXPORT\n";
  await page.goto(url(source));
  await ready(page);
  expect(
    await page.evaluate(() => ace.edit("editor").session.getAnnotations()),
  ).toMatchObject([
    { row: 0, text: expect.stringContaining("finite decimal") },
    {
      row: 3,
      text: expect.stringContaining("Undefined named reference $missing"),
    },
  ]);
  await expect(page.locator("#preview table")).toHaveCount(1);
  await expect(page.locator("#preview script")).toHaveCount(0);
  expect(await page.evaluate(() => globalThis.orgBad)).toBeUndefined();
  await expect(page.locator("#preview pre")).toContainText("<script>");
});

test("Org named-binding documentation and gallery examples open correctly on mobile", async ({
  page,
}) => {
  await page.goto("/docs.html?page=formats/org");
  const block = page
    .locator("#docs-content pre")
    .filter({ hasText: "tax=0.20" });
  await expect(block).toHaveCount(1);
  await block
    .locator("xpath=following-sibling::p[1]")
    .getByRole("link")
    .click();
  await ready(page);
  await expect(page.locator("#format")).toHaveValue("org");
  await expect(page.locator("#preview")).toContainText("14.40");
  await page.goto("/docs.html?page=formats/org");
  await page
    .getByRole("link", { name: "$Qty..$UnitPrice", exact: true })
    .click();
  await ready(page);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toContain(
    "vsum($Qty..$UnitPrice)",
  );
  await expect(
    page.locator("#preview td").filter({ hasText: /^7$/ }),
  ).toHaveCount(1);
  await page.goto("/index.html?example=org-edge");
  await ready(page);
  await expect(page.locator("#preview")).toContainText("16.80");
  await page.goto("/docs.html?page=limitations");
  await expect(page.locator("#docs-content")).toContainText("ORG-05");
  await expect(page.locator("#docs-content")).toContainText("ORG-06");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs.html?page=formats/org");
  await expect(page.locator("#docs-content h1")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Org Calc default/explicit modes and arithmetic match the Emacs reference documents in the editor", async ({
  page,
}) => {
  const reference = JSON.parse(await file("tests/fixtures/org/reference.json")),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const name of [
    "calc-modes.org",
    "calc-arithmetic.org",
    "calc-conditions.org",
    "calc-branches.org",
  ]) {
    await page.goto(url(await file(`tests/fixtures/org/${name}`)));
    await ready(page);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    const rows = await page
      .locator("#preview tr")
      .evaluateAll((trs) =>
        trs.map((tr) => [...tr.cells].map((td) => td.textContent)),
      );
    expect(rows, name).toEqual(reference[name]);
  }
  await page.goto(url("| 0 |\n#+TBLFM: @1$1=asin(0.5)\n"));
  await ready(page);
  expect(
    await page.evaluate(() => ace.edit("editor").session.getAnnotations()),
  ).toMatchObject([{ row: 1, text: expect.stringContaining("arcsin") }]);
  expect(errors).toEqual([]);
});

test("Org conditional pricing works in both modes, shares exact source, and keeps failing cells with diagnostics", async ({
  page,
  context,
}) => {
  const source = "#+CONSTANTS: limit=50000\n| Users | Cost |\n|-------+------|\n| 50001 | 0 |\n#+TBLFM: $2=if($1>$limit,25,0);%.2f\n";
  for (const profile of [undefined, "org-emacs-v1"]) {
    await page.goto(writeURL("http://127.0.0.1:4173/", {
      src: source, format: "org", profile,
    }));
    await ready(page);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    await expect(page.locator("#preview tr").last()).toHaveText("5000125.00");
    await page.locator("#share").click();
    const fresh = await context.newPage();
    await fresh.goto(await page.locator("#share-url").inputValue());
    await ready(fresh);
    expect(await fresh.evaluate(() => ace.edit("editor").getValue())).toBe(source);
    await expect(fresh.locator("#preview tr").last()).toHaveText("5000125.00");
    await fresh.close();
    await page.locator("#share-close").click();
    const changed = source.replace("50001", "50000");
    await page.evaluate((src) => ace.edit("editor").setValue(src, -1), changed);
    await expect(page.locator("#preview tr").last()).toHaveText("500000.00");
    const failed = "| 3 | 77 |\n#+TBLFM: $2=if($1>2,1/0,7)\n";
    await page.evaluate((src) => ace.edit("editor").setValue(src, -1), failed);
    await expect(page.locator("#render-status")).toContainText("1 diagnostic");
    await expect(page.locator("#preview tr")).toHaveText("377");
    expect(await page.evaluate(() => ace.edit("editor").session.getAnnotations()))
      .toMatchObject([{ row: 1, text: expect.stringContaining("Division by zero") }]);
  }
  await page.goto("/docs.html?page=formats/org");
  await page.locator("#docs-content pre")
    .filter({ hasText: "if($1>50000,25,0)" })
    .locator("xpath=following-sibling::p[1]").getByRole("link").click();
  await ready(page);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#preview tr").last()).toHaveText("5000125.00");
});
