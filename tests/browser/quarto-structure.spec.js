import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(/^(Ready|\d+ diagnostic)/);
const source = await readFile(
  new URL("../fixtures/quarto/structure.qmd", import.meta.url),
  "utf8",
);

test("Quarto nested callouts and forward figures survive sharing, reload and exports", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    writeURL("http://127.0.0.1:4173/index.html", {
      format: "quarto",
      src: source,
    }),
  );
  await ready(page);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(
    page.locator("#preview .callout-note > .callout-tip pre"),
  ).toContainText("Read without running");
  await expect(page.locator('#preview a[href="#fig-icon"]')).toHaveText(
    "Figure 1",
  );
  await expect(page.locator('#preview a[href="#fig-panel"]')).toHaveText(
    "Figure 2",
  );
  await expect(page.locator("#preview #fig-panel > figcaption")).toHaveText(
    "A panel caption.",
  );
  await expect(page.locator("#preview #fig-icon img")).toBeVisible();
  await expect(page.locator("#preview aside")).toHaveCount(2);
  await expect(page.locator("#preview pre").last()).toContainText(
    "@fig-code {#fig-code}",
  );
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const fresh = await context.newPage();
  await fresh.goto(await page.locator("#share-url").inputValue());
  await ready(fresh);
  await fresh.reload();
  await ready(fresh);
  await expect(fresh.locator("#preview .callout-tip")).toContainText(
    "Read without running",
  );
  const html = await fresh.evaluate(async () => {
    const { htmlDownload } = await import("./src/export-document.js");
    return htmlDownload(document.getElementById("preview")).blob.text();
  });
  expect(html).toContain('id="fig-icon"');
  expect(html).toContain('href="#fig-panel"');
  expect(html).toContain("<figcaption>A panel caption.</figcaption>");
  await fresh.locator("#download-menu summary").click();
  const download = fresh.waitForEvent("download");
  await fresh.locator("#download-source").click();
  expect(await readFile(await (await download).path(), "utf8")).toBe(source);
  expect(errors).toEqual([]);
});

test("Quarto diagnostic annotations retain source locations and figure targets stay unique and sanitized", async ({
  page,
}) => {
  const src =
    '---\nexecute: false\ntoc: true\n---\nSee @fig-absent.\n\n![First](src/icon.svg){#fig-same}\n\n![Second](src/icon.svg){#fig-same}\n\n::: {.callout-note collapse=true}\n<script>globalThis.quartoUnsafe=1</script>\n<img src="data:," onerror="globalThis.quartoUnsafe=1">\n\n:::\n';
  await page.goto(
    writeURL("http://127.0.0.1:4173/", { format: "quarto", src }),
  );
  await ready(page);
  expect(
    await page.evaluate(() => ace.edit("editor").session.getAnnotations()),
  ).toMatchObject([
    { row: 2, column: 0, text: "Unsupported metadata: toc." },
    { row: 4, column: 4, text: "Unresolved figure reference: fig-absent." },
    {
      row: 8,
      column: 23,
      text: "Duplicate figure label fig-same; first declared on line 7.",
    },
    { row: 10, column: 0, text: "Unsupported attribute: collapse." },
  ]);
  await expect(page.locator("#preview #fig-same")).toHaveCount(1);
  await expect(page.locator("#preview script,#preview [onerror]")).toHaveCount(
    0,
  );
  expect(await page.evaluate(() => globalThis.quartoUnsafe)).toBeUndefined();
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(src);
});

test("Quarto documentation opens complete nested and diagnostic examples in the editor", async ({
  page,
  context,
}) => {
  await page.goto("/docs.html?page=formats/quarto");
  const example = page.locator("pre").filter({ hasText: "A nested notebook" });
  await expect(example).toHaveCount(1);
  const link = example.locator("xpath=following-sibling::p[1]/a");
  const fresh = await context.newPage();
  await fresh.goto(await link.getAttribute("href"));
  await ready(fresh);
  await expect(fresh.locator("#format")).toHaveValue("quarto");
  await expect(
    fresh.locator("#preview .callout-note .callout-tip"),
  ).toBeVisible();
  await expect(fresh.locator('#preview a[href="#fig-icon"]')).toHaveText(
    "Figure 1",
  );
  await expect(fresh.locator("#render-status")).toHaveText(/^Ready/);
  const diagnosticExample = page
    .locator("pre")
    .filter({
      hasText:
        "Execution stays disabled while the unsupported settings are reported",
    });
  const diagnosticLink = diagnosticExample.locator(
    "xpath=following-sibling::p[1]/a",
  );
  await fresh.goto(await diagnosticLink.getAttribute("href"));
  await ready(fresh);
  await expect(fresh.locator("#render-status")).toContainText("3 diagnostics");
  expect(
    await fresh.evaluate(() => ace.edit("editor").session.getAnnotations()),
  ).toMatchObject([
    { row: 2, text: "Unsupported metadata: toc." },
    { row: 6, text: "echo must be a YAML boolean (true or false)." },
    { row: 7, text: "Unsupported cell option: warning." },
  ]);
  await page.goto("/docs.html?page=limitations");
  await expect(page.locator("#docs-content")).toContainText("QT-09");
  await expect(page.locator("#docs-content")).toContainText("QT-10");
});
