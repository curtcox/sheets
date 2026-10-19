import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
const file = (name) =>
  readFile(new URL(`../fixtures/quarto/${name}`, import.meta.url), "utf8");
const url = (src) =>
  writeURL("http://127.0.0.1:4173/index.html", { src, format: "quarto" });
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(/^(Ready|\d+ diagnostic)/, {
    timeout: 110000,
  });

for (const language of ["python", "r"]) {
  test(`${language} notebook controls match the native Quarto contract and plots preserve size/alt through exports`, async ({
    page,
  }) => {
    const reference = JSON.parse(await file("controls-reference.json"))[
        language
      ],
      source = await file(`controls-${language}.qmd`),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url(source));
    await ready(page);
    const text = (await page.locator("#preview").innerText()).replace(
      /\s+/g,
      " ",
    );
    for (const marker of reference.visible) expect(text).toContain(marker);
    for (const marker of reference.hidden) expect(text).not.toContain(marker);
    await expect(page.locator("#render-status")).toContainText(
      language === "r" ? "1 diagnostic" : "2 diagnostics",
    );
    const plot = page.locator(
      `#fig-${language === "python" ? "python" : "r"}-controls`,
    );
    if (language === "python") {
      await expect(plot.locator("svg")).toHaveAttribute(
        "aria-label",
        reference.alt,
      );
      await expect(plot.locator("svg")).toHaveAttribute("role", "img");
      await expect(plot.locator("svg")).toHaveAttribute("width", "288pt");
      await expect(plot.locator("svg")).toHaveAttribute("height", "216pt");
    } else {
      await expect(plot.locator("img")).toHaveAttribute("alt", reference.alt);
      await expect(plot.locator("img")).toHaveAttribute("width", "384");
      await expect(plot.locator("img")).toHaveAttribute("height", "288");
      expect(
        await plot
          .locator("img")
          .evaluate(
            (img) =>
              img.complete &&
              img.naturalWidth === 576 &&
              img.naturalHeight === 432,
          ),
      ).toBe(true);
    }
    expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(
      source,
    );
    const html = await page.evaluate(async () => {
      const { htmlDownload } = await import("./src/export-document.js");
      return htmlDownload(document.querySelector("#preview")).blob.text();
    });
    expect(html).toContain(reference.alt);
    expect(html).not.toContain("<script");
    for (const marker of reference.hidden) expect(html).not.toContain(marker);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    await page.goto(url(await file(`defaults-${language}.qmd`)));
    await ready(page);
    const defaultsText = (await page.locator("#preview").innerText()).replace(
      /\s+/g,
      " ",
    );
    for (const marker of reference.defaults.visible)
      expect(defaultsText).toContain(marker);
    for (const marker of reference.defaults.hidden)
      expect(defaultsText).not.toContain(marker);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  });
}

test("explicit notebook errors halt only the affected session, hidden setup still runs, and rerenders start fresh", async ({
  page,
}) => {
  const source =
    (await file("halt-python.qmd")) +
    "\n```{r}\ncat('INDEPENDENT_R_SESSION')\n```\n";
  await page.goto(url(source));
  await ready(page);
  await expect(page.locator("#preview")).toContainText("PY_HALT_HERE");
  await expect(page.locator("#preview")).not.toContainText(
    "PY_AFTER_FORBIDDEN_ERROR",
  );
  await expect(page.locator("#preview")).toContainText("INDEPENDENT_R_SESSION");
  await expect(page.locator(".notice")).toContainText("stopped this session");
  await page.goto(url(await file("halt-r.qmd")));
  await ready(page);
  await expect(page.locator("#preview")).toContainText("R_HALT_HERE");
  await expect(page.locator("#preview")).not.toContainText(
    "R_AFTER_FORBIDDEN_ERROR",
  );
  await page.goto(url(await file("halt-hidden-r.qmd")));
  await ready(page);
  await expect(page.locator("#preview")).not.toContainText(
    "R_AFTER_HIDDEN_ERROR",
  );
  await expect(page.locator("#preview")).not.toContainText("R_HIDDEN_ERROR");
  await expect(page.locator("#render-status")).toContainText("1 diagnostic");
  await page.goto(
    url("```{python}\nprint('FRESH_SESSION', 'setup_value' in globals())\n```"),
  );
  await ready(page);
  await expect(page.locator("#preview")).toContainText("FRESH_SESSION False");
});

test("both real notebook backends stop before a later infinite cell when error:false", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/");
  await ready(page);
  const outputs = await page.evaluate(async () => {
    const [{ runWorker }, { runR }] = await Promise.all([
      import("./src/worker-client.js"),
      import("./src/webr-client.js"),
    ]);
    return Promise.all([
      runWorker(
        new URL("./src/workers/pyodide.worker.js", location.href),
        {
          cells: [
            {
              source: 'raise ValueError("EXPECTED_STOP")',
              execution: { error: false },
            },
            { source: "while True: pass" },
          ],
        },
        { timeout: 75000 },
      ),
      runR(
        [
          { source: 'stop("EXPECTED_STOP")', execution: { error: false } },
          { source: "repeat {}" },
        ],
        { timeout: 75000 },
      ),
    ]);
  });
  const hidden = await page.evaluate(async () => {
    const { runR } = await import("./src/webr-client.js");
    return runR(
      [
        {
          source: 'stop("HIDDEN_STOP")',
          execution: { include: false, error: true },
        },
        { source: "repeat {}" },
      ],
      { timeout: 75000 },
    );
  });
  expect(hidden.outputs).toHaveLength(1);
  expect(hidden.outputs[0].error).toContain("HIDDEN_STOP");
  for (const result of outputs) {
    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0].error).toContain("EXPECTED_STOP");
  }
});

test("Quarto control and figure documentation opens complete examples and preserves them through sharing", async ({
  page,
  context,
}) => {
  await page.goto("/docs.html?page=formats/quarto");
  const setup = page
    .locator("#docs-content pre")
    .filter({ hasText: "Visible result:" });
  await setup
    .locator("xpath=following-sibling::p[1]")
    .getByRole("link")
    .click();
  await ready(page);
  await expect(page.locator("#preview")).toContainText("Visible result: 7");
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  const source = await page.evaluate(() => ace.edit("editor").getValue());
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const fresh = await context.newPage();
  await fresh.goto(await page.locator("#share-url").inputValue());
  await ready(fresh);
  expect(await fresh.evaluate(() => ace.edit("editor").getValue())).toBe(
    source,
  );
  await expect(fresh.locator("#preview")).toContainText("Visible result: 7");
  await page.goto("/docs.html?page=formats/quarto");
  const plot = page
    .locator("#docs-content pre")
    .filter({ hasText: "A small line chart" });
  await plot.locator("xpath=following-sibling::p[1]").getByRole("link").click();
  await ready(page);
  await expect(page.locator("#fig-sized svg")).toHaveAttribute(
    "aria-label",
    "A line rising from one to three",
  );
  await expect(page.locator("#fig-sized svg")).toHaveAttribute(
    "width",
    "288pt",
  );
  await expect(page.locator('#preview a[href="#fig-sized"]')).toHaveText(
    "Figure 1",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
