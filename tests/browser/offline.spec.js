import { test, expect } from "@playwright/test";
import { once } from "node:events";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { stage } from "../../scripts/stage.mjs";
import { createStaticServer } from "../../scripts/serve.mjs";
import { writeURL } from "../../src/url-state.js";

test.describe.configure({ mode: "serial" });
let directory, server, base;
test.beforeAll(async () => {
  directory = await mkdtemp(`${tmpdir()}/sheets-offline-`);
  await stage(`${directory}/sheets`, "offline1");
  server = createStaticServer(directory);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}/sheets/`;
});
test.afterAll(async () => {
  server?.closeAllConnections();
  if (server) await new Promise((resolve) => server.close(resolve));
  if (directory) await rm(directory, { recursive: true, force: true });
});
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(
    /^(?:Ready|\d+ diagnostic)/,
    { timeout: 110000 },
  );
async function settings(page) {
  await page.locator("#download-menu summary").click();
  await page.locator("#offline-open").click();
}
async function install(page) {
  await page.goto(base);
  await ready(page);
  await settings(page);
  await page.locator("#offline-enable").click();
  await expect(page.locator("#offline-open")).toHaveText("Offline access ✓", {
    timeout: 60000,
  });
  await ready(page);
}

test("opt-in offline files support new source links, vendored workers, docs and gallery", async ({
  page,
  context,
}) => {
  await page.goto(base);
  await ready(page);
  expect(
    await page.evaluate(() =>
      navigator.serviceWorker
        .getRegistration(location.href)
        .then((reg) => Boolean(reg)),
    ),
  ).toBe(false);
  await page.evaluate(() => caches.open("another-app"));
  const source = "# Private note\n\nUnicode 日本語 😀";
  await page.evaluate(
    (source) => ace.edit("editor").setValue(source, -1),
    source,
  );
  await ready(page);
  await settings(page);
  await page.locator("#offline-enable").click();
  await expect(page.locator("#offline-open")).toHaveText("Offline access ✓", {
    timeout: 60000,
  });
  await ready(page);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  await context.setOffline(true);
  await page.goto(
    writeURL(base, {
      src: source + "\n\nA fresh offline URL.",
      format: "gfm",
      view: "preview",
    }),
  );
  await ready(page);
  await expect(page.locator("#preview")).toContainText("A fresh offline URL.");
  await expect(page.locator("#source-pane")).toBeHidden();
  for (const format of [
    "gfm",
    "asciimath",
    "numbat",
    "calcfile",
    "org",
    "calca",
    "hurmet",
    "beancount",
  ]) {
    await page.goto(
      base + `?example=${format}-${format === "gfm" ? "typical" : "basic"}`,
    );
    await ready(page);
    await expect(page.locator("#render-status")).toContainText("Ready");
    if (format === "gfm")
      await expect(page.locator("[data-mermaid] svg")).toBeVisible();
  }
  const requests = await page.evaluate(async () => {
    const names = (await caches.keys()).filter((name) =>
      name.startsWith(
        `sheets-offline:${new URL(".", location.href).pathname}:`,
      ),
    );
    return (
      await Promise.all(
        names.map(async (name) =>
          (await (await caches.open(name)).keys()).map(
            (request) => request.url,
          ),
        ),
      )
    ).flat();
  });
  expect(requests.length).toBeGreaterThan(100);
  expect(
    requests.every((url) => !new URL(url).search && !new URL(url).hash),
  ).toBe(true);
  expect(
    requests.some((url) =>
      /compressed|Private|256t\.us|cdn\.jsdelivr\.net/.test(url),
    ),
  ).toBe(false);
  await page.goto(base + "docs.html?page=formats/numbat");
  await expect(page.locator("#docs-content h1")).toHaveText("Numbat");
  await page.goto(base + "gallery.html");
  await expect(page.locator(".card-cover")).toHaveCount(36);
  await page
    .locator(".card-cover")
    .first()
    .evaluate((image) => image.decode());
  await context.setOffline(false);
  await page.goto(base);
  await ready(page);
  await settings(page);
  await page.locator("#offline-remove").click();
  await expect(page.locator("#offline-status")).toHaveText(
    "Offline files removed from this browser.",
  );
  expect(await page.evaluate(() => caches.keys())).toEqual(["another-app"]);
  expect(
    await page.evaluate(() =>
      navigator.serviceWorker
        .getRegistration(location.href)
        .then((reg) => Boolean(reg)),
    ),
  ).toBe(false);
});

test("failed installs leave no partial cache and can be retried", async ({
  page,
}) => {
  await page.goto(base);
  await ready(page);
  // Corrupt an integrity entry in the staged manifest; worker fetches bypass page routes.
  const path = `${directory}/sheets/offline-assets.json`,
    original = await readFile(path, "utf8"),
    manifest = JSON.parse(original);
  manifest.assets[0].integrity = "sha256-" + "A".repeat(43) + "=";
  await writeFile(path, JSON.stringify(manifest));
  try {
    await settings(page);
    await page.locator("#offline-enable").click();
    await expect(page.locator("#offline-status")).toContainText(
      "Offline download failed",
      { timeout: 60000 },
    );
    expect(await page.evaluate(() => caches.keys())).toEqual([]);
  } finally {
    await writeFile(path, original);
  }
  await page.reload();
  await ready(page);
  await settings(page);
  await page.locator("#offline-enable").click();
  await expect(page.locator("#offline-open")).toHaveText("Offline access ✓", {
    timeout: 60000,
  });
});

test("updates wait for activation, preserve source, and replace the old release cache", async ({
  page,
  context,
}) => {
  await install(page);
  const previous = await page.evaluate(() => caches.keys());
  const source = "# Keep my latest edit";
  await page.evaluate(
    (source) => ace.edit("editor").setValue(source, -1),
    source,
  );
  await stage(`${directory}/sheets`, "offline2");
  const manifestPath = `${directory}/sheets/offline-assets.json`;
  const original = await readFile(manifestPath, "utf8"),
    broken = JSON.parse(original);
  broken.assets[0].integrity = "sha256-" + "A".repeat(43) + "=";
  await writeFile(manifestPath, JSON.stringify(broken));
  await settings(page);
  await page.locator("#offline-enable").click();
  await expect(page.locator("#offline-status")).toContainText(
    "Offline download failed",
    { timeout: 60000 },
  );
  expect(await page.evaluate(() => caches.keys())).toEqual(previous);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(page.locator("#commit")).toHaveText("offline1");
  await context.setOffline(false);
  await writeFile(manifestPath, original);
  await settings(page);
  await page.locator("#offline-enable").click();
  await expect(page.locator("#offline-update")).toBeVisible({ timeout: 60000 });
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  const latest = source + "\nEdited immediately before applying the update.";
  await page.evaluate(
    (source) => ace.edit("editor").setValue(source, -1),
    latest,
  );
  await page.locator("#offline-update").click();
  await expect(page.locator("#commit")).toHaveText("offline2");
  await ready(page);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(latest);
  const current = await page.evaluate(() => caches.keys());
  expect(current).toHaveLength(1);
  expect(current).not.toEqual(previous);
});
