import { test, expect } from "@playwright/test";
import { once } from "node:events";
import { createHash } from "node:crypto";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { stage } from "../../scripts/stage.mjs";
import { createStaticServer } from "../../scripts/serve.mjs";
import { writeURL } from "../../src/url-state.js";
import { parseProjectFile } from "../../src/project-state.js";
import { longSource } from "../fixtures/long-source.js";
import {
  CALCA_SCOPES,
  ASCIIMATH_FORMULAS,
  ASCIIMATH_PROSE,
  ORG_EMACS,
} from "../../src/compatibility-profiles.js";

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
// Installation and restoring evicted files both activate a controller and reload.
// Await that navigation, not the old page's briefly updated Ready/installed UI.
async function downloadFiles(page) {
  const reloaded = page.waitForEvent("domcontentloaded", { timeout: 60000 });
  await page.locator("#offline-enable").click();
  await reloaded;
  await ready(page);
  await expect(page.locator("#offline-open")).toHaveText("Offline access ✓", {
    timeout: 60000,
  });
}
async function install(page) {
  await page.goto(base);
  await ready(page);
  await settings(page);
  await downloadFiles(page);
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
  await downloadFiles(page);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  // Simulate eviction while the registration remains active, then restore the files.
  await page.evaluate(async () =>
    Promise.all(
      (await caches.keys())
        .filter((name) => name.startsWith("sheets-offline:"))
        .map((name) => caches.delete(name)),
    ),
  );
  await settings(page);
  await expect(page.locator("#offline-enable")).toHaveText(
    "Download offline files",
  );
  await downloadFiles(page);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  const ratesXML = await readFile(
    new URL("../fixtures/exchange-rates/ecb-2026-10-16.xml", import.meta.url),
    "utf8",
  );
  // Seed a previously obtained snapshot, then exercise a real offline refresh
  // failure. Online cache population is tested without a service worker separately.
  await page.evaluate((xml) => {
    localStorage.setItem(
      "sheets:ecb-rates:v1",
      JSON.stringify({ xml, time: Date.now() - 2 * 86400000 }),
    );
  }, ratesXML);
  await context.setOffline(true);
  await page.goto(
    writeURL(base, { src: "200 EUR in USD", format: "calcfile" }),
  );
  await ready(page);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#preview output")).toHaveText("225.06 USD");
  await expect(page.locator("[data-exchange-rates]")).toContainText(
    "Using cached ECB rates",
  );
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
  // Charts are drawn by an app module, so they work from offline files too.
  await page.goto(base + "?example=org-what-if&view=preview");
  await ready(page);
  await expect(page.locator("#preview figure.chart svg .chart-bar")).toHaveCount(3);
  for (const profile of [ASCIIMATH_FORMULAS, ASCIIMATH_PROSE]) {
    await page.goto(
      writeURL(base, { src: "sqrt(9)", format: "asciimath", profile }),
    );
    await ready(page);
    await page.reload();
    await ready(page);
    await expect(page.locator("#profile")).toHaveValue(profile);
    await expect(page.locator("#preview math")).toHaveCount(
      profile === ASCIIMATH_FORMULAS ? 1 : 0,
    );
  }
  await page.goto(
    writeURL(base, {
      src: "# Parent\n\n```calca\nvalue=3\n```\n\n## Child\n\nvalue =>\n\n# Sibling\n\nvalue =>\n2+2 =>",
      format: "calca",
      profile: CALCA_SCOPES,
    }),
  );
  await ready(page);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#preview")).toContainText("2+2 => 4");
  await page.reload();
  await ready(page);
  await expect(page.locator("#profile")).toHaveValue(CALCA_SCOPES);
  await expect(page.locator("#preview")).toContainText("value => 3");
  await expect(page.locator("#preview")).toContainText("value => value");
  await page.goto(
    writeURL(base, {
      src: "#+SHEETS_INPUT: v1 prices AAAAAAAXIytDT05TVEFOVFM6IHByaWNlPTAuMDM\n#+SHEETS_HINTS: precedence\n#+SHEETS_CONSTANTS: table\n#+CONSTANTS: price=0.03\n#+NAME: data\n| 1 | 0 | 0 |\n#+TBLFM: $3=$2+1::$2=$1+10\n\n| 0 |\n#+TBLFM: $1=remote(data,@1$3)*($prices.price==0.03)/1*1\n",
      format: "org",
      profile: ORG_EMACS,
    }),
  );
  await ready(page);
  await page.reload();
  await ready(page);
  await expect(page.locator("#profile")).toHaveValue(ORG_EMACS);
  await expect(page.locator("#render-status")).toHaveText(/^1 diagnostic/);
  await expect(page.locator("#preview table").last()).toHaveText("12");
  await expect(page.locator("#preview .org-constants")).toContainText("0.03");
  await expect(page.locator('#preview aside[aria-label="Formula hints"]')).toContainText("Calc multiplies before dividing");
  await expect(page.locator("#preview .org-inputs")).toContainText("0.03");
  const dependency = "#+CONSTANTS: price=0.03\n#+COMMENT: " + "x".repeat(80),
    bytes = Buffer.from(dependency), length = Buffer.alloc(6);
  length.writeUIntBE(bytes.length, 0, 6);
  const cid = length.toString("base64url") + createHash("sha512").update(bytes).digest("base64url");
  await page.goto(writeURL(base, { src: `#+SHEETS_INPUT: v1 prices ${cid}\n| 99 |\n#+TBLFM: $1=$prices.price\n`, format: "org" }));
  await ready(page);
  await expect(page.locator("#render-status")).toHaveText(/^2 diagnostics/);
  await expect(page.locator("#preview table:not(.org-inputs)")).toHaveText("99");
  await expect(page.locator("#preview .org-shared-inputs .error")).toBeVisible();
  const project = parseProjectFile(await readFile(new URL("../fixtures/projects/v1.sheets.json", import.meta.url), "utf8"));
  await page.goto(writeURL(base, { ...project, format: "org" })); await ready(page);
  await page.reload(); await ready(page);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#profile")).toHaveValue("org-emacs-v1");
  await expect(page.locator("#project-controls")).toBeVisible();
  await expect(page.locator("#preview table:not(.org-inputs)").last()).toHaveText("1003.00");
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
  await expect(page.locator(".card-cover")).toHaveCount(39);
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
  const source = "# Keep my latest edit\n\n" + longSource;
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
  await expect.poll(() => page.evaluate(() => caches.keys())).toEqual(previous);
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
  expect(new URL(page.url()).hash.startsWith("#src=")).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(latest);
  const current = await page.evaluate(() => caches.keys());
  expect(current).toHaveLength(1);
  expect(current).not.toEqual(previous);
});
