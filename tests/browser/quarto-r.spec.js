import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";

const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(
    /^(?:Ready|\d+ diagnostic)/,
    { timeout: 110000 },
  );
const sourceURL = (src) =>
  writeURL("http://127.0.0.1:4173/", { src, format: "quarto" });
const setSource = (page, source) =>
  page.evaluate((source) => ace.edit("editor").setValue(source, -1), source);

test("R cells share state, capture plots and conditions, isolate Python, and export the rendered result", async ({
  page,
}) => {
  const source = `---
title: R notebook verification
execute:
  echo: false
---

\`\`\`{r}
rValues <- c(3, 7, 11)
cat("<img src=x onerror='globalThis.rUnsafe=1'>\\n")
mean(rValues)
\`\`\`

See @fig-r.

\`\`\`{r}
#| label: fig-r
#| fig-cap: Measurements from R
plot(rValues, type="b", col="steelblue")
warning("R warning captured")
message("R message captured")
\`\`\`

\`\`\`{python}
rValues = [100]
print("Python total:", sum(rValues))
\`\`\`

\`\`\`{r}
#| output: false
hiddenValue <- 99
cat("HIDDEN OUTPUT")
\`\`\`

\`\`\`{r}
#| eval: false
stop("SKIPPED CELL")
\`\`\`

\`\`\`{r}
cat("Before R error\\n")
stop("R cell failed")
\`\`\`

\`\`\`{r}
sum(rValues)
hiddenValue
\`\`\`
`;
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(sourceURL(source));
  await ready(page);
  const preview = page.locator("#preview");
  for (const text of [
    "[1] 7",
    "[1] 21",
    "[1] 99",
    "Python total: 100",
    "warning: R warning captured",
    "message: R message captured",
    "Before R error",
    "R cell failed",
  ])
    await expect(preview).toContainText(text);
  await expect(page.locator("#render-status")).toContainText("1 diagnostic");
  await expect(preview).not.toContainText("HIDDEN OUTPUT");
  await expect(preview).not.toContainText("SKIPPED CELL");
  await expect(preview.locator("#fig-r img")).toBeVisible();
  expect(
    await preview
      .locator("#fig-r img")
      .evaluate((image) => image.complete && image.naturalWidth > 0),
  ).toBe(true);
  await expect(preview.locator("figcaption")).toHaveText("Measurements from R");
  await expect(preview.locator('a[href="#fig-r"]')).toHaveText("Figure 1");
  expect(await page.evaluate(() => globalThis.rUnsafe)).toBeUndefined();
  await expect(preview.locator("img[onerror]")).toHaveCount(0);
  await expect(preview).toContainText("<img src=x onerror=");
  await page.locator("#download-menu summary").click();
  const downloadEvent = page.waitForEvent("download");
  await page.locator("#download-html").click();
  const download = await downloadEvent,
    html = await readFile(await download.path(), "utf8");
  expect(html).toContain("data:image/png;base64,");
  expect(html).toContain("Measurements from R");
  expect(html).not.toContain("webr.worker");
  expect(html).not.toContain("<script");
  expect(errors).toEqual([]);
});

test("R renders start fresh and shared URLs restore source and results", async ({
  page,
  context,
}) => {
  await page.goto(sourceURL("```{r}\nprivateValue <- 42\nprivateValue\n```"));
  await ready(page);
  await expect(page.locator(".cell-output")).toContainText("42");
  const source =
    "---\ntitle: A fresh R session\n---\n\n```{r}\nexists('privateValue')\n2+2\n```";
  const previousURL = page.url();
  await setSource(page, source);
  await expect(page.locator(".cell-output")).toContainText("FALSE", {
    timeout: 110000,
  });
  await expect(page.locator(".cell-output")).toContainText("[1] 4");
  await expect.poll(() => page.url()).not.toBe(previousURL);
  const shared = await context.newPage();
  await shared.goto(page.url());
  await ready(shared);
  await expect(shared.locator(".cell-output")).toContainText("FALSE");
  expect(await shared.evaluate(() => ace.edit("editor").getValue())).toBe(
    source,
  );
});

test("R deadlines and cancellation close the interpreter and keep the editor responsive", async ({
  page,
  browser,
  browserName,
}) => {
  await page.goto("/");
  await ready(page);
  if (browserName === "firefox") {
    // Firefox can retain a debugger target for a terminated, loading worker.
    // Observe the native terminate() call as well, rather than that stale list.
    await page.evaluate(() => {
      const NativeWorker = Worker;
      globalThis.rActiveWorkers = new Set();
      globalThis.Worker = class extends NativeWorker {
        constructor(...args) {
          super(...args);
          globalThis.rActiveWorkers.add(this);
        }
        terminate() {
          globalThis.rActiveWorkers.delete(this);
          return super.terminate();
        }
      };
    });
  }
  const cdp =
    browserName === "chromium" ? await browser.newBrowserCDPSession() : null;
  const workers = async () =>
    cdp
      ? (await cdp.send("Target.getTargets")).targetInfos.filter(
          (t) => t.type === "worker",
        )
      : browserName === "firefox"
        ? page.evaluate(() => [...globalThis.rActiveWorkers].map(() => null))
        : page.workers();
  await expect.poll(async () => (await workers()).length).toBe(0);
  const message = await page.evaluate(async () => {
    const { runR } = await import("./src/webr-client.js");
    try {
      await runR([{ source: "repeat {}" }], { timeout: 7000 });
      return "unexpected success";
    } catch (error) {
      return error.message;
    }
  });
  expect(message).toContain("exceeded 7 seconds");
  await expect.poll(async () => (await workers()).length).toBe(0);
  await page.locator("#format").selectOption("quarto");
  let releaseBootstrap, sawBootstrap;
  const held = new Promise((resolve) => (releaseBootstrap = resolve));
  const requested = new Promise((resolve) => (sawBootstrap = resolve));
  await page.route(
    "**/src/workers/webr-worker.js",
    async (route) => {
      sawBootstrap();
      await held;
      await route.continue().catch(() => {}); // Cancellation may already abort it.
    },
    { times: 1 },
  );
  await setSource(page, "```{r}\nrepeat {}\n```");
  await requested;
  await page.locator("#cancel-render").click();
  await expect(page.locator("#render-status")).toContainText("Cancelled");
  // Release the artificial network stall before checking debugger targets.
  // Firefox retains a loading worker target while that request is held open.
  releaseBootstrap();
  await expect.poll(async () => (await workers()).length).toBe(0);
  await setSource(page, "```{r}\nrepeat {}\n# Try a fresh worker\n```");
  await expect.poll(async () => (await workers()).length).toBeGreaterThan(0);
  await page.locator("#cancel-render").click();
  await expect(page.locator("#render-status")).toContainText("Cancelled");
  await expect.poll(async () => (await workers()).length).toBe(0);
  await setSource(page, "```{r}\nmean(c(2,4,6))\n```");
  await ready(page);
  await expect(page.locator(".cell-output")).toContainText("[1] 4");
  await expect.poll(async () => (await workers()).length).toBe(0);
  await setSource(page, "```{r}\nrepeat {}\n```");
  await expect.poll(async () => (await workers()).length).toBeGreaterThan(0);
  await page.locator("#format").selectOption("gfm");
  await setSource(page, "# Still responsive");
  await ready(page);
  await expect(page.locator("#preview")).toContainText("Still responsive");
  await expect.poll(async () => (await workers()).length).toBe(0);
  await cdp?.detach();
});

test("disabled R and Python cells do not download runtimes", async ({
  page,
}) => {
  const requests = [];
  page.on("request", (r) => {
    if (/webr\.r-wasm|cdn\.jsdelivr.*pyodide/.test(r.url()))
      requests.push(r.url());
  });
  await page.goto(
    sourceURL(
      "---\nexecute: false\n---\n\n```{r}\nstop('disabled R')\n```\n\n```{python}\nraise Exception('disabled Python')\n```",
    ),
  );
  await ready(page);
  await expect(page.locator("#render-status")).toContainText("Ready");
  await expect(page.locator("#preview")).toContainText("disabled R");
  expect(requests).toEqual([]);
});
