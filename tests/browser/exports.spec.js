import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(
    /^(?:Ready|\d+ diagnostic)/,
  );
const setSource = (page, source) =>
  page.evaluate((source) => ace.edit("editor").setValue(source, -1), source);
async function download(page, selector) {
  await page.locator("#download-menu summary").click();
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const file = await pending;
  return {
    name: file.suggestedFilename(),
    text: await readFile(await file.path(), "utf8"),
  };
}

test("source downloads stay available during rendering and after cancellation", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  const source = "```{python}\nwhile True: pass\n```\n\n日本語 😀";
  await page.locator("#format").selectOption("quarto");
  await setSource(page, source);
  await expect(page.locator("#download-html")).toBeDisabled();
  await expect(page.locator("#print-preview")).toBeDisabled();
  expect(await download(page, "#download-source")).toEqual({
    name: "sheet.qmd",
    text: source,
  });
  await expect(page.locator("#cancel-render")).toBeVisible();
  await page.locator("#cancel-render").click();
  await expect(page.locator("#render-status")).toContainText("Cancelled");
  await expect(page.locator("#download-html")).toBeDisabled();
  await page.locator("#format").selectOption("gfm");
  await setSource(page, "# Fresh result");
  await ready(page);
  await expect(page.locator("#download-html")).toBeEnabled();
  expect(await download(page, "#download-source")).toEqual({
    name: "fresh-result.md",
    text: "# Fresh result",
  });
});

test("HTML exports keep completed math and diagrams, safe links, and embedded styles", async ({
  page,
  context,
}) => {
  const source =
    '# Export & report\n\n$x^2$\n\n```mermaid\ngraph LR\n  Start --> Finish\n```\n\n[Guide](docs.html) [Footnote](#note)\n\n<p id="note">End</p>\n<script>globalThis.unsafeExport=1</script><img src="data:," onerror="globalThis.unsafeExport=2">';
  await page.goto(
    writeURL("http://127.0.0.1:4173/", { src: source, format: "gfm" }),
  );
  await ready(page);
  const exported = await download(page, "#download-html");
  expect(exported.name).toBe("export-report.html");
  expect(exported.text).toContain("<title>Export &amp; report</title>");
  const saved = await context.newPage();
  await saved.route("https://export.test/document.html", (route) =>
    route.fulfill({ body: exported.text, contentType: "text/html" }),
  );
  await saved.goto("https://export.test/document.html");
  await expect(saved.locator("math")).toBeVisible();
  await expect(saved.locator("[data-mermaid] svg")).toBeVisible();
  await expect(saved.locator("[data-mermaid] svg")).toContainText("Finish");
  await expect(saved.getByRole("link", { name: "Guide" })).toHaveAttribute(
    "href",
    "http://127.0.0.1:4173/docs.html",
  );
  await expect(saved.getByRole("link", { name: "Footnote" })).toHaveAttribute(
    "href",
    "#note",
  );
  await expect(saved.locator("script,link[rel=stylesheet],button")).toHaveCount(
    0,
  );
  expect(await saved.evaluate(() => globalThis.unsafeExport)).toBeUndefined();
  expect(
    await saved
      .locator("body")
      .evaluate((element) => getComputedStyle(element).maxWidth),
  ).toBe("900px");
  expect(await saved.locator("[onerror],[onload]").count()).toBe(0);
});

test("HTML exports include only the selected ledger report", async ({
  page,
  context,
}) => {
  await page.goto("/?example=beancount-typical");
  await ready(page);
  await page.getByRole("tab", { name: "Trial balance", exact: true }).click();
  const exported = await download(page, "#download-html");
  const saved = await context.newPage();
  await saved.setContent(exported.text);
  await expect(saved.locator("#report-trial")).toBeVisible();
  await expect(saved.locator("#report-trial")).toContainText("2934.5");
  await expect(saved.locator('[role="tabpanel"]')).toHaveCount(1);
  await expect(saved.locator('[role="tablist"],button')).toHaveCount(0);
});

test("download menu fits mobile and print shows the full preview from source view", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.print = () =>
      (globalThis.printCalls = (globalThis.printCalls || 0) + 1);
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const source =
    "# Printed sheet\n\n" +
    "A paragraph with useful results.\n\n".repeat(60) +
    "Last paragraph.";
  await page.goto(
    writeURL("http://127.0.0.1:4173/", {
      src: source,
      format: "gfm",
      view: "source",
    }),
  );
  await ready(page);
  await page.locator("#download-menu summary").click();
  const menu = await page.locator(".download-options").boundingBox();
  expect(menu.x).toBeGreaterThanOrEqual(0);
  expect(menu.x + menu.width).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");
  await expect(page.locator("#download-menu")).not.toHaveAttribute("open", "");
  await expect(page.locator("#download-menu summary")).toBeFocused();
  await page.locator("#download-menu summary").click();
  await page.locator("#print-preview").click();
  expect(await page.evaluate(() => globalThis.printCalls)).toBe(1);
  await page.emulateMedia({ media: "print" });
  for (const selector of [
    "#source-pane",
    ".toolbar",
    ".site-header",
    ".statusbar",
  ])
    await expect(page.locator(selector)).toBeHidden();
  await expect(page.locator("#preview-pane")).toBeVisible();
  await expect(page.locator("#preview")).toContainText("Last paragraph.");
  const sizing = await page.locator("#preview").evaluate((el) => ({
    height: el.clientHeight,
    full: el.scrollHeight,
    overflow: getComputedStyle(el).overflow,
  }));
  expect(sizing.overflow).toBe("visible");
  expect(sizing.height).toBeGreaterThan(844);
  expect(sizing.full).toBeLessThanOrEqual(sizing.height + 1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
