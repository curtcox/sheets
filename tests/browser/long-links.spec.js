import { test, expect } from "@playwright/test";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createStaticServer } from "../../scripts/serve.mjs";
import { readURL, writeURL } from "../../src/url-state.js";
import LZString from "../../vendor/lz-string.js";
import { longSource } from "../fixtures/long-source.js";

let server, base;
test.beforeAll(async () => {
  server = createStaticServer();
  const [serve] = server.listeners("request");
  server.removeAllListeners("request");
  server.on("request", (req, res) => {
    if (
      Buffer.byteLength(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`) > 8192
    ) {
      res.writeHead(414, { "Content-Type": "text/plain" });
      res.end("URI Too Long");
    } else serve(req, res);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}/index.html`;
});
test.afterAll(async () => {
  server?.closeAllConnections();
  if (server) await new Promise((resolve) => server.close(resolve));
});
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(/^Ready/);
const state = {
  src: longSource,
  format: "org",
  view: "preview",
  profile: "org-emacs-v1",
};

test("long documents reload and reopen from a shared link under a real request-line limit without browser storage", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    for (const name of ["localStorage", "sessionStorage"])
      Object.defineProperty(window, name, {
        get() { throw new Error("Storage unavailable"); },
      });
  });
  await page.goto(writeURL(base, { ...state, src: "| 1 |" }));
  await ready(page);
  await page.evaluate((src) => ace.edit("editor").setValue(src, -1), longSource);
  await expect
    .poll(() => new URL(page.url()).hash.startsWith("#src="))
    .toBe(true);
  await ready(page);
  await expect(page.locator("#preview table")).toHaveText("31314");
  await expect(page.locator("#url-notice")).toContainText("Download → Source");
  const link = page.url();

  // Recreate the old persistence strategy inside an open editor, then reload it.
  const legacy = new URL(link);
  legacy.hash = "";
  legacy.searchParams.set(
    "compressed",
    LZString.compressToEncodedURIComponent(longSource),
  );
  await page.evaluate((url) => history.replaceState(null, "", url), legacy.href);
  expect((await page.reload()).status()).toBe(414);
  await expect(page.locator("body")).toContainText("URI Too Long");

  expect((await page.goto(link)).status()).toBe(200);
  await ready(page);
  expect((await page.reload()).status()).toBe(200);
  await ready(page);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(
    longSource,
  );
  await expect(page.locator("#profile")).toHaveValue(state.profile);
  await expect(page.locator("#source-pane")).toBeHidden();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const shared = await page.locator("#share-url").inputValue();
  expect(readURL(shared)).toEqual({ ...state, kind: "source" });
  const fresh = await context.newPage();
  await fresh.goto(shared);
  await ready(fresh);
  expect(await fresh.evaluate(() => ace.edit("editor").getValue())).toBe(
    longSource,
  );
  await fresh.locator("#download-menu summary").click();
  const download = fresh.waitForEvent("download");
  await fresh.locator("#download-source").click();
  expect(await readFile(await (await download).path(), "utf8")).toBe(longSource);
  await fresh.close();
});

test("fragment source navigation and back restore documents; malformed fragments report errors", async ({
  page,
}) => {
  await page.goto(writeURL(base, { src: "first", format: "text" }));
  await ready(page);
  await page.evaluate((url) => {
    location.href = url;
  }, writeURL(base, state));
  await ready(page);
  await expect(page.locator("#profile")).toHaveValue(state.profile);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(
    longSource,
  );
  await page.goBack();
  await ready(page);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe("first");
  await page.evaluate(() => {
    location.hash = "src=invalid!";
  });
  await expect(page.locator("#render-status")).toContainText(
    "could not be decompressed",
  );
});

test("reachable legacy query links migrate; preview references preserve fragment source", async ({
  page,
}) => {
  const src = "[Jump to note](#note)\n\n<h2 id=\"note\">Note</h2>\n\n" + longSource;
  const legacy = new URL("http://127.0.0.1:4173/index.html?format=gfm");
  legacy.searchParams.set("compressed", LZString.compressToEncodedURIComponent(src));
  await page.goto(legacy.href);
  await ready(page);
  const migrated = page.url();
  expect(new URL(migrated).hash.startsWith("#src=")).toBe(true);
  await page.locator('#preview a[href="#note"]').click();
  expect(page.url()).toBe(migrated);
  await page.reload();
  await ready(page);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(src);
});
