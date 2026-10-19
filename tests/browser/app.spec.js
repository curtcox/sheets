import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
import { ECB_URL } from "../../src/exchange-rates.js";
const examples = JSON.parse(
  await readFile(new URL("../../examples/catalog.json", import.meta.url)),
);
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(
    /^(?:Ready|\d+ diagnostic)/,
    { timeout: 110000 },
  );
const setSource = (page, source) =>
  page.evaluate(
    (source) =>
      globalThis.ace
        ? ace.edit("editor").setValue(source, -1)
        : Object.assign(document.getElementById("source-fallback"), {
            value: source,
          }).dispatchEvent(new Event("input")),
    source,
  );
for (const format of [...new Set(examples.map((s) => s.format))])
  test(`${format}: every gallery example renders`, async ({ page }) => {
    if (format === "calcfile") {
      const xml = await readFile(
        new URL(
          "../fixtures/exchange-rates/ecb-api-2026-10-16.csv",
          import.meta.url,
        ),
        "utf8",
      );
      await page.route(ECB_URL, (route) =>
        route.fulfill({ body: xml, contentType: "text/csv" }),
      );
      await page.clock.setFixedTime(new Date("2026-10-18T12:00:00Z"));
    }
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const sample of examples.filter((s) => s.format === format)) {
      await page.goto("/index.html?example=" + sample.id);
      await ready(page);
      await expect(page.locator("#format")).toHaveValue(format);
      expect(new URL(page.url()).searchParams.has("example")).toBe(false);
      expect(new URL(page.url()).searchParams.has("compressed")).toBe(true);
      await expect(page.locator("#preview")).not.toBeEmpty();
      if (sample.kind === "error" && !["gfm", "asciimath"].includes(format))
        await expect(page.locator("#render-status")).toContainText(
          "diagnostic",
        );
      else await expect(page.locator("#render-status")).toContainText("Ready");
      if (sample.id === "gfm-typical") {
        await expect(page.locator("#preview [data-mermaid] svg")).toBeVisible();
        await expect(page.locator("#preview [data-mermaid] svg")).toContainText(
          "Question",
        );
      }
      if (sample.id === "numbat-basic")
        await expect(page.locator("#preview")).toContainText("60 km/h");
      if (sample.id === "quarto-basic")
        await expect(page.locator(".cell-output")).toHaveText("4");
      if (sample.id === "quarto-typical") {
        await expect(page.locator("#preview")).toContainText(
          "Measurements: [3, 7, 11]",
        );
        await expect(page.locator("#preview")).toContainText("7.0");
      }
      if (sample.id === "quarto-error")
        await expect(page.locator("#preview")).toContainText(
          "The next cell still runs",
        );
    }
    expect(errors).toEqual([]);
  });
test("editing updates URL, reload restores, view and manual format share across pages", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await ready(page);
  const source = "# Shared note\n\nA Unicode check: 😀 日本語.\n\n2 + 2 =>";
  await setSource(page, source);
  await page.locator("#format").selectOption("calca");
  await ready(page);
  await expect(page.locator("#preview")).toContainText("=> 4");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.locator("#source-pane")).toBeHidden();
  const link = page.url();
  expect(new URL(link).searchParams.get("view")).toBe("preview");
  await page.reload();
  await ready(page);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  const another = await context.newPage();
  await another.goto(link);
  await ready(another);
  await expect(another.locator("#format")).toHaveValue("calca");
  await expect(another.locator("#source-pane")).toBeHidden();
  await another.getByRole("button", { name: "Source", exact: true }).click();
  await expect(another.locator("#preview-pane")).toBeHidden();
  await another.keyboard.press("Control+Alt+2");
  await expect(another.locator("#preview-pane")).toBeVisible();
});
test("narrow layout stacks panes, resizes, and supports source and preview modes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await ready(page);
  const source = await page.locator("#source-pane").boundingBox(),
    preview = await page.locator("#preview-pane").boundingBox();
  expect(preview.y).toBeGreaterThan(source.y + source.height);
  await page.locator("#divider").focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#divider")).toHaveAttribute("aria-valuenow", "55");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.locator("#source-pane")).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Source", exact: true }).click();
  await expect(page.locator("#preview-pane")).toBeHidden();
});
test("unsafe HTML, MathML, SVG, and engine output stay inert", async ({
  page,
}) => {
  const source =
    '# Unsafe\n\n<script>globalThis.sheetsUnsafe=1</script>\n<img src="bad" onerror="globalThis.sheetsUnsafe=2">\n<iframe srcdoc="<script>parent.sheetsUnsafe=3</script>"></iframe>\n<svg onload="globalThis.sheetsUnsafe=4"><foreignObject>bad</foreignObject><a href="javascript:alert(1)">link</a><path style="fill:red;stroke:blue;position:fixed;background:url(https://evil.test)"></path></svg>\n<math><mi onclick="globalThis.sheetsUnsafe=5">x</mi></math>\n<div style="position:fixed">Safe text</div>';
  await page.goto(
    writeURL("http://127.0.0.1:4173/", { src: source, format: "gfm" }),
  );
  await ready(page);
  expect(await page.evaluate(() => globalThis.sheetsUnsafe)).toBeUndefined();
  const unsafe = await page
    .locator("#preview")
    .evaluate((element) =>
      [...element.querySelectorAll("*")].flatMap((n) =>
        [...n.attributes].filter(
          (a) => /^on/i.test(a.name) || /javascript:|url\s*\(/i.test(a.value),
        ),
      ),
    );
  expect(unsafe).toEqual([]);
  await expect(
    page.locator("#preview script,#preview iframe,#preview foreignObject"),
  ).toHaveCount(0);
  await expect(page.locator("#preview div[style]")).toHaveCount(0);
  const style = await page.locator("#preview path").getAttribute("style");
  expect(style).toContain("fill:red");
  expect(style).not.toContain("position");
});
test("HashBin public CID, stale load protection, and save configuration", async ({
  page,
}) => {
  const plain = "let distance = 12 m",
    bytes = Buffer.from(plain),
    cid =
      Buffer.from([0, 0, 0, 0, 0, bytes.length]).toString("base64url") +
      bytes.toString("base64url");
  await page.goto("/index.html#" + cid);
  await ready(page);
  await expect(page.locator("#format")).toHaveValue("auto");
  await expect(page.locator("#detected")).toContainText("Numbat");
  await page.getByRole("button", { name: "HashBin", exact: true }).click();
  await expect(page.locator("#hashbin-save")).toBeEnabled();
  const remoteCID =
    Buffer.from([0, 0, 0, 0, 0, 65]).toString("base64url") +
    "a".repeat(85) +
    "A";
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  let started = false;
  await page.route("https://256t.us/" + remoteCID, async (route) => {
    started = true;
    await gate;
    await route.fulfill({
      body: JSON.stringify({
        format: "sheets-document",
        version: 1,
        type: "gfm",
        src: "Old remote source",
        view: "split",
      }),
    });
  });
  await page.locator("#hashbin-cid").fill(remoteCID);
  await page.locator("#hashbin-load").click();
  await expect.poll(() => started).toBe(true);
  await setSource(page, "# New local source");
  release();
  await ready(page);
  await expect(page.locator("#preview")).toContainText("New local source");
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(
    "# New local source",
  );
});
test("gallery search and docs render through the application pipeline", async ({
  page,
}) => {
  await page.goto("/gallery.html");
  await expect(page.locator(".card")).toHaveCount(36);
  await expect(page.locator(".card-cover")).toHaveCount(36);
  await page.getByLabel("Filter by format").selectOption("org");
  await expect(page.locator(".card")).toHaveCount(4);
  await page.getByLabel("Search examples").fill("purchase");
  await expect(page.locator(".card")).toHaveCount(1);
  await expect(page.locator(".card-cover")).toHaveAttribute(
    "src",
    "examples/covers/org-typical.png",
  );
  await expect
    .poll(() =>
      page
        .locator(".card-cover")
        .evaluate((image) => image.complete && image.naturalWidth === 640),
    )
    .toBe(true);
  await page.getByRole("link", { name: "Load in editor" }).click();
  await ready(page);
  await expect(page.locator("#format")).toHaveValue("org");
  await page.goto("/docs.html?page=formats/gfm");
  await expect(page.locator("#docs-content h1")).toContainText("Markdown");
  await page.goto("/docs.html?page=../../package");
  await expect(page.locator("#docs-content h1")).toContainText("Sheets");
});
test("share dialog captures a snapshot and shows an unavailable shortening service", async ({
  page,
}) => {
  await page.goto("/?example=calcfile-basic");
  await ready(page);
  await page.getByRole("button", { name: "Share" }).click();
  const link = await page.locator("#share-url").inputValue();
  expect(new URL(link).searchParams.get("format")).toBe("calcfile");
  expect(new URL(link).searchParams.get("compressed")).toBeTruthy();
  await page.route("https://api.allorigins.win/**", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.locator("#shorten-link").click();
  await expect(page.locator("#share-status")).toContainText("HTTP 503");
  expect(await page.locator("#share-url").inputValue()).toBe(link);
});
test("Beancount reports switch without losing the document", async ({
  page,
}) => {
  await page.goto("/?example=beancount-typical");
  await ready(page);
  await page.getByRole("tab", { name: "Trial balance", exact: true }).click();
  await expect(page.locator("#report-trial")).toBeVisible();
  await expect(page.locator("#report-trial")).toContainText("2934.5");
  await expect(page.locator("#report-errors")).toBeHidden();
});
test("Python cancellation and deadline terminate worker execution", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  const error = await page.evaluate(async () => {
    const { runWorker } = await import("./src/worker-client.js");
    try {
      await runWorker(
        new URL("./src/workers/pyodide.worker.js", location.href),
        { cells: [{ source: "while True: pass" }] },
        { timeout: 5000 },
      );
      return null;
    } catch (error) {
      return error.message;
    }
  });
  expect(error).toContain("exceeded 5 seconds");
  await page.locator("#format").selectOption("quarto");
  await setSource(page, "```{python}\nwhile True: pass\n```");
  await expect(page.locator("#cancel-render")).toBeVisible();
  await page.locator("#cancel-render").click();
  await expect(page.locator("#render-status")).toContainText("Cancelled");
  await page.locator("#format").selectOption("gfm");
  await setSource(page, "# Still responsive");
  await ready(page);
  await expect(page.locator("#preview")).toContainText("Still responsive");
});
test("Python renders pandas tables and matplotlib figures", async ({
  page,
}) => {
  const source =
    '---\ntitle: Data and figures\n---\n\n```{python}\nimport pandas as pd\npd.DataFrame({"x": [1, 2], "y": [3, 4]})\n```\n\nSee @fig-demo.\n\n```{python}\n#| label: fig-demo\n#| fig-cap: A line\nimport matplotlib.pyplot as plt\nplt.plot([1, 2], [3, 4]);\n```';
  await page.goto(
    writeURL("http://127.0.0.1:4173/", { src: source, format: "quarto" }),
  );
  await ready(page);
  await expect(page.locator("#render-status")).toContainText("Ready");
  await expect(page.locator("#preview table")).toBeVisible();
  await expect(page.locator("#preview figure svg")).toBeVisible();
  await expect(page.locator("#preview figcaption")).toHaveText("A line");
  await expect(page.locator('#preview a[href="#fig-demo"]')).toHaveText(
    "Figure 1",
  );
  const styles = await page
    .locator("#preview figure path[style]")
    .evaluateAll((paths) => paths.map((p) => p.getAttribute("style")));
  expect(styles.some((style) => style.includes("stroke:"))).toBe(true);
  const documentURL = page.url();
  await page.locator('#preview a[href="#fig-demo"]').click();
  const hash = await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve(location.hash)),
        ),
      ),
  );
  expect(hash).toBe(new URL(documentURL).hash);
  expect(page.url()).toBe(documentURL);
});
test("HashBin links preserve query format and view overrides", async ({
  page,
}) => {
  const cid =
    Buffer.from([0, 0, 0, 0, 0, 65]).toString("base64url") +
    "a".repeat(85) +
    "A";
  await page.route("https://256t.us/" + cid, (route) =>
    route.fulfill({
      body: JSON.stringify({
        format: "sheets-document",
        version: 1,
        type: "text",
        view: "split",
        src: "# Saved markdown",
      }),
    }),
  );
  await page.goto("/index.html?format=gfm&view=preview#" + cid);
  await ready(page);
  await expect(page.locator("#format")).toHaveValue("gfm");
  await expect(page.locator("#source-pane")).toBeHidden();
  await expect(page.locator("#preview h1")).toHaveText("Saved markdown");
});

test("source links work when browser storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    for (const name of ["localStorage", "sessionStorage"])
      Object.defineProperty(window, name, {
        get() {
          throw new DOMException("Blocked", "SecurityError");
        },
      });
  });
  await page.goto("/?example=gfm-basic");
  await ready(page);
  await expect(page.locator("#preview h1")).toContainText(
    "A small, useful note",
  );
});

test("preview references preserve a saved document CID through reload", async ({
  page,
}) => {
  const cid =
    Buffer.from([0, 0, 0, 0, 0, 65]).toString("base64url") +
    "a".repeat(85) +
    "A";
  const source =
    '# Saved source\n\n[Jump to section](#section)\n\n<h2 id="section">A section</h2>';
  await page.route("https://256t.us/" + cid, (route) =>
    route.fulfill({
      body: JSON.stringify({
        format: "sheets-document",
        version: 1,
        type: "gfm",
        view: "split",
        src: source,
      }),
    }),
  );
  await page.goto("/index.html#" + cid);
  await ready(page);
  const savedURL = page.url();
  await page.getByRole("link", { name: "Jump to section" }).click();
  await expect(page).toHaveURL(savedURL, { timeout: 1500 });
  await page.reload();
  await ready(page);
  await expect(page.locator("#preview h1")).toHaveText("Saved source");
});

test("Calca equations recalculate, diagnose unsupported queries, and survive shared reload", async ({
  page,
  context,
}) => {
  const source =
    "# Equations\n\n```calca\ntempF=1.8*tempC+32\ntempF=212\ntempC =>\nwidth^2-5*width+6=0\nwidth =>\nunknown^3=8\nunknown =>\n2+2 =>\n```";
  await page.goto(
    writeURL("http://127.0.0.1:4173/", { src: source, format: "calca" }),
  );
  await ready(page);
  await expect(page.locator("#preview")).toContainText("tempC => 100");
  await expect(page.locator("#preview")).toContainText("width => [2, 3]");
  await expect(page.locator("#preview")).toContainText("polynomials only");
  await expect(page.locator("#preview")).toContainText("2+2 => 4");
  await expect(page.locator("#render-status")).toContainText("1 diagnostic");
  const previousURL = page.url();
  const edited = source.replace("tempF=212", "tempF=32");
  await setSource(page, edited);
  await expect(page.locator("#preview")).toContainText("tempC => 0");
  await expect.poll(() => page.url()).not.toBe(previousURL);
  // Open the source link in a fresh page, so the solver cannot reuse the old scope.
  await expect
    .poll(() => page.evaluate(() => ace.edit("editor").getValue()))
    .toBe(edited);
  const shared = await context.newPage();
  await shared.goto(page.url());
  await ready(shared);
  await expect(shared.locator("#preview")).toContainText("tempC => 0");
  await expect(shared.locator("#preview")).toContainText("width => [2, 3]");
});
