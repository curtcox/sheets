import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
import { HashBinDocuments } from "../../src/hashbin.js";
import { ORG_EMACS as profile } from "../../src/compatibility-profiles.js";
const base = "http://127.0.0.1:4173/index.html",
  source = "| 1 | 0 | 0 |\n#+TBLFM: $3=$2+1::$2=$1+10\n";
const file = (name) =>
  readFile(new URL(`../fixtures/org/${name}`, import.meta.url), "utf8");
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(/^(Ready|\d+ diagnostic)/);
const url = (src, extra = {}) =>
  writeURL(base, { src, format: "org", profile, ...extra });
const rows = (page) =>
  page
    .locator("#preview table tr")
    .evaluateAll((rows) =>
      rows.map((r) => [...r.querySelectorAll("td,th")].map((c) => c.textContent)),
    );

test("Emacs mode migration preserves exact source, copy, exports, views and shared results", async ({
  page,
  context,
}) => {
  await page.goto(url(source, { profile: undefined }));
  await ready(page);
  await expect(page.locator("#profile")).toHaveValue("");
  expect(await rows(page)).toEqual([["1", "11", "1"]]);
  await page.locator("#profile").selectOption(profile);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  expect(await rows(page)).toEqual([["1", "11", "12"]]);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          globalThis.copied = text;
        },
      },
    }),
  );
  await page.getByRole("button", { name: "Copy recalculated source" }).click();
  expect(await page.evaluate(() => globalThis.copied)).toContain(
    "| 1 | 11 | 12 |",
  );
  const exported = await page.evaluate(async () => {
    const { htmlDownload } = await import("./src/export-document.js");
    return htmlDownload(document.querySelector("#preview")).blob.text();
  });
  expect(exported).toContain('<td class="org-right">12</td>');
  await page.locator("#download-menu summary").click();
  const download = page.waitForEvent("download");
  await page.locator("#download-source").click();
  expect(await readFile(await (await download).path(), "utf8")).toBe(source);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const shared = await page.locator("#share-url").inputValue();
  expect(new URL(shared).searchParams.get("profile")).toBe(profile);
  const fresh = await context.newPage();
  await fresh.goto(shared);
  await ready(fresh);
  await fresh.reload();
  await ready(fresh);
  expect(await rows(fresh)).toEqual([["1", "11", "12"]]);
  await expect(fresh.locator("#source-pane")).toBeHidden();
  expect(await fresh.evaluate(() => ace.edit("editor").getValue())).toBe(
    source,
  );
  await fresh.setViewportSize({ width: 390, height: 844 });
  expect(
    await fresh.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await fresh.locator("#format").selectOption("gfm");
  await ready(fresh);
  await expect(fresh.locator("#profile-controls")).toBeHidden();
  expect(new URL(fresh.url()).searchParams.has("profile")).toBe(false);
});

test("Emacs scheduling and remote-reference DOM match native fixtures; duplicate targets retain cells", async ({
  page,
}) => {
  const reference = JSON.parse(await file("reference.json"));
  for (const [name, expected] of Object.entries(reference).filter(([name]) =>
    /^(order-|remote-)/.test(name),
  )) {
    await page.goto(url(await file(name)));
    await ready(page);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    expect(await rows(page), name).toEqual(expected);
  }
  const rejected = JSON.parse(await file("rejections.json"));
  for (const [name, expected] of Object.entries(rejected)) {
    await page.goto(url(await file("rejected/" + name)));
    await ready(page);
    expect(await rows(page), name).toEqual(expected.rows);
    expect(
      await page.evaluate(() => ace.edit("editor").session.getAnnotations()),
    ).toMatchObject([
      { text: expect.stringContaining("Duplicate formula target") },
    ]);
  }
  await page.goto(url("| 77 |\n#+TBLFM: $1=remote(missing,@1$1)"));
  await ready(page);
  expect(await rows(page)).toEqual([["77"]]);
  expect(
    await page.evaluate(() => ace.edit("editor").session.getAnnotations()),
  ).toMatchObject([
    { row: 1, text: expect.stringContaining("Cannot find same-document") },
  ]);
});

test("Org saved documents preserve the explicit mode and migrate from version 1 without changing source", async ({
  page,
}) => {
  const cid =
    Buffer.from([0, 0, 0, 0, 0, 65]).toString("base64url") +
    "a".repeat(85) +
    "A";
  let payload = HashBinDocuments.serialize({ src: source, type: "org" });
  await page.route("https://256t.us/" + cid, (route) =>
    route.fulfill({ body: payload }),
  );
  await page.route("https://hashbin.org/sdk/hashbin.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `export class HashBinClient {
    getTokens(){return {refreshToken:"mock",expiresAt:Date.now()+100000};}
    async authorizedFetch(path,options={}){let data;
      if(path==="/api/account/settings") data={default_retention_months:1};
      else if(path==="/api/balance") data={balance_cents:100};
      else if(path==="/api/content"){globalThis.savedOrg=await options.body.get("content").text();data={cid:${JSON.stringify(cid)}};}
      else throw new Error("Unexpected mocked API request");
      return new Response(JSON.stringify(data),{headers:{"Content-Type":"application/json"}});
    }
  }`,
    }),
  );
  await page.route("https://hashbin.org/api/payments/calculate", (route) =>
    route.fulfill({ json: { cost_cents: 1 } }),
  );
  await page.goto(base + "#" + cid);
  await ready(page);
  expect(await rows(page)).toEqual([["1", "11", "1"]]);
  await page.locator("#profile").selectOption(profile);
  await ready(page);
  expect(new URL(page.url()).hash).toBe("");
  await page.getByRole("button", { name: "HashBin", exact: true }).click();
  await page.locator("#hashbin-save").click();
  await expect(page.locator("#hashbin-message")).toContainText("Cost: $0.01");
  await page.locator("#hashbin-confirm").click();
  await expect(page.locator("#hashbin-status")).toHaveText("Saved to HashBin.");
  payload = await page.evaluate(() => globalThis.savedOrg);
  expect(JSON.parse(payload)).toMatchObject({
    version: 2,
    type: "org",
    profile,
    src: source,
  });
  await page.goto(base + "#" + cid);
  await ready(page);
  await expect(page.locator("#profile")).toHaveValue(profile);
  expect(await rows(page)).toEqual([["1", "11", "12"]]);
  await page.goto(base + "?format=gfm&view=source#" + cid);
  await ready(page);
  await expect(page.locator("#profile-controls")).toBeHidden();
  expect(new URL(page.url()).searchParams.has("profile")).toBe(false);
});

test("Org mode and remote documentation examples load into the editor and gallery summary calculates", async ({
  page,
}) => {
  await page.goto("/docs.html?page=formats/org");
  const block = page
    .locator("#docs-content pre")
    .filter({ hasText: "#+NAME: prices" });
  await block
    .locator("xpath=following-sibling::p[1]")
    .getByRole("link")
    .click();
  await ready(page);
  await expect(page.locator("#profile")).toHaveValue(profile);
  expect((await rows(page)).at(-1)).toEqual(["4", "11"]);
  await page.goto("/docs.html?page=url-format");
  await page
    .getByRole("link", { name: "?profile=org-emacs-v1", exact: true })
    .click();
  await ready(page);
  await expect(page.locator("#format")).toHaveValue("org");
  expect(await rows(page)).toEqual([["1", "11", "12"]]);
  await page.goto("/index.html?example=org-edge");
  await ready(page);
  await expect(page.locator("#profile")).toHaveValue(profile);
  await expect(page.locator("#preview")).toContainText("31.20");
  await page.goto("/docs.html?page=limitations");
  await expect(page.locator("#docs-content")).toContainText("ORG-07");
  await expect(page.locator("#docs-content")).toContainText("ORG-08");
});
