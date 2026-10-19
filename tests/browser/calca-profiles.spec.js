import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
import { HashBinDocuments } from "../../src/hashbin.js";
import { CALCA_BLOCKS as profile } from "../../src/compatibility-profiles.js";

const base = "http://127.0.0.1:4173/index.html";
const source =
  '# Mixed document\n\n```python\nprint("literal => example")\n```\n\n```calca\nprice=3\nprice*4 => old\n```\n\n```mermaid\ngraph LR\n  Source --> Answer\n```\n\n<img src="data:," onerror="globalThis.unsafeProfile=1">';
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(
    /^(?:Ready|\d+ diagnostic)/,
  );
const cid =
  Buffer.from([0, 0, 0, 0, 0, 65]).toString("base64url") + "a".repeat(85) + "A";
const sdk = `export class HashBinClient {
  getTokens() { return {refreshToken:"mock",expiresAt:Date.now()+100000}; }
  async handleCallback() {}
  async authorizedFetch(path, options = {}) {
    let data;
    if (path === "/api/account/settings") data={default_retention_months:1};
    else if (path === "/api/balance") data={balance_cents:100};
    else if (path === "/api/content") { globalThis.savedProfilePayload=await options.body.get("content").text(); data={cid:${JSON.stringify(cid)}}; }
    else throw new Error("Unexpected mocked API request");
    return new Response(JSON.stringify(data), {headers:{"Content-Type":"application/json"}});
  }
}`;

test("Calca profile migration preserves source, sharing, exports, view and format changes", async ({
  page,
  context,
}) => {
  await page.goto(writeURL(base, { src: source, format: "calca" }));
  await ready(page);
  await expect(page.locator("#profile")).toHaveValue("");
  await expect(page.locator("#render-status")).toContainText("diagnostic");
  await page.locator("#profile").selectOption(profile);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#preview")).toContainText("price*4 => 12");
  await expect(page.locator("#preview")).toContainText(
    'print("literal => example")',
  );
  await expect(page.locator("[data-mermaid] svg")).toContainText("Answer");
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  expect(await page.evaluate(() => globalThis.unsafeProfile)).toBeUndefined();
  await expect(page.locator("#preview [onerror]")).toHaveCount(0);
  await page.locator("#download-menu summary").click();
  const download = page.waitForEvent("download");
  await page.locator("#download-source").click();
  expect(await readFile(await (await download).path(), "utf8")).toBe(source);
  await expect(page.locator("#profile-help")).toContainText(
    "Source files contain text only",
  );
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const shared = await page.locator("#share-url").inputValue();
  expect(new URL(shared).searchParams.get("profile")).toBe(profile);
  const fresh = await context.newPage();
  await fresh.goto(shared);
  await ready(fresh);
  await expect(fresh.locator("#profile")).toHaveValue(profile);
  await expect(fresh.locator("#source-pane")).toBeHidden();
  await expect(fresh.locator("#preview")).toContainText("price*4 => 12");
  await fresh.setViewportSize({ width: 390, height: 844 });
  expect(
    await fresh.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await fresh.emulateMedia({ media: "print" });
  await expect(fresh.locator("#profile-controls")).toBeHidden();
  await fresh.emulateMedia({ media: "screen" });
  await fresh.locator("#format").selectOption("gfm");
  await ready(fresh);
  await expect(fresh.locator("#profile-controls")).toBeHidden();
  expect(new URL(fresh.url()).searchParams.has("profile")).toBe(false);
  await fresh.locator("#format").selectOption("calca");
  await ready(fresh);
  await expect(fresh.locator("#profile")).toHaveValue("");
});

test("HashBin saves profiles and honors legacy documents, CID precedence and explicit overrides", async ({
  page,
}) => {
  await page.route("https://hashbin.org/sdk/hashbin.js", (route) =>
    route.fulfill({ body: sdk, contentType: "text/javascript" }),
  );
  await page.route("https://hashbin.org/api/payments/calculate", (route) =>
    route.fulfill({ json: { cost_cents: 1 } }),
  );
  let payload = HashBinDocuments.serialize({
    src: "```python\nlegacyValue=9\n```\nlegacyValue =>",
    type: "calca",
  });
  await page.route("https://256t.us/" + cid, (route) =>
    route.fulfill({ body: payload }),
  );
  await page.goto(base + "?compressed=invalid!#" + cid);
  await ready(page);
  await expect(page.locator("#preview")).toContainText("legacyValue => 9");
  await expect(page.locator("#profile")).toHaveValue("");
  await page.goto(writeURL(base, { src: source, format: "calca", profile }));
  await ready(page);
  await page.getByRole("button", { name: "HashBin", exact: true }).click();
  await page.locator("#hashbin-save").click();
  await expect(page.locator("#hashbin-message")).toContainText("Cost: $0.01");
  await page.locator("#hashbin-confirm").click();
  await expect(page.locator("#hashbin-status")).toHaveText("Saved to HashBin.");
  payload = await page.evaluate(() => globalThis.savedProfilePayload);
  expect(JSON.parse(payload)).toMatchObject({
    version: 2,
    profile,
    type: "calca",
    src: source,
  });
  await page.goto(base + "#" + cid);
  await ready(page);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#profile")).toHaveValue(profile);
  expect(new URL(page.url()).hash).toBe("#" + cid);
  await page.goto(base + "?format=gfm&view=source#" + cid);
  await ready(page);
  await expect(page.locator("#format")).toHaveValue("gfm");
  await expect(page.locator("#preview-pane")).toBeHidden();
  expect(new URL(page.url()).searchParams.has("profile")).toBe(false);
  await page.goto(base);
  await ready(page);
  await page.getByRole("button", { name: "HashBin", exact: true }).click();
  await page
    .locator("#hashbin-cid")
    .fill(
      "  https://curtcox.github.io/sheets/index.html?format=calca&view=source&profile=" +
        profile +
        "#" +
        cid +
        "  ",
    );
  await page.locator("#hashbin-load").click();
  await expect(page.locator("#hashbin-status")).toHaveText(
    "Loaded from HashBin.",
  );
  await ready(page);
  await expect(page.locator("#profile")).toHaveValue(profile);
  await expect(page.locator("#preview-pane")).toBeHidden();
  await page.locator("#profile").selectOption("");
  await ready(page);
  expect(new URL(page.url()).hash).toBe("");
  expect(new URL(page.url()).searchParams.has("profile")).toBe(false);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  expect(JSON.parse(payload).profile).toBe(profile);
});

test("OAuth restoration keeps the Calca profile and exact source on success or denial", async ({
  page,
}) => {
  await page.route("https://hashbin.org/sdk/hashbin.js", (route) =>
    route.fulfill({ body: sdk, contentType: "text/javascript" }),
  );
  await page.addInitScript(
    ({ source, profile }) => {
      sessionStorage.setItem(
        "sheets:hashbin:return:profile-test",
        JSON.stringify({
          createdAt: Date.now(),
          snapshot: {
            src: source,
            type: "calca",
            format: "calca",
            view: "source",
            profile,
          },
        }),
      );
    },
    { source, profile },
  );
  for (const outcome of ["code=mock", "error=access_denied"]) {
    await page.goto(base + "?state=profile-test&" + outcome);
    await ready(page);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    await expect(page.locator("#profile")).toHaveValue(profile);
    await expect(page.locator("#preview-pane")).toBeHidden();
    expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(
      source,
    );
    expect(new URL(page.url()).searchParams.get("profile")).toBe(profile);
    expect(new URL(page.url()).searchParams.has("state")).toBe(false);
  }
});

test("unknown profiles and incompatible explicit format/profile pairs report errors", async ({
  page,
}) => {
  for (const params of [
    "format=calca&profile=future-calca",
    "format=gfm&profile=" + profile,
  ]) {
    await page.goto(base + "?" + params);
    await expect(page.locator("#render-status")).toHaveText(
      /Unsupported compatibility profile|requires calca/,
    );
    expect(new URL(page.url()).searchParams.has("profile")).toBe(true);
  }
  await page.goto(writeURL(base, { src: "~~~calca\n2+2 =>\n~~~", profile }));
  await ready(page);
  await expect(page.locator("#preview")).toContainText("2+2 => 4");
  await page.goto(writeURL(base, { src: "~~~calca\nprice=3\n~~~", profile }));
  await ready(page);
  await expect(page.locator("#format")).toHaveValue("auto");
  await expect(page.locator("#detected")).toHaveText("→ Calca");
  await page.goto(base + "?example=calca-edge&format=gfm");
  await ready(page);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#format")).toHaveValue("gfm");
  await expect(page.locator("#profile-controls")).toBeHidden();
  expect(new URL(page.url()).searchParams.has("profile")).toBe(false);
  await page.goto(base + "?example=gfm-basic&profile=" + profile);
  await ready(page);
  await expect(page.locator("#detected")).toHaveText("→ Calca");
  await expect(page.locator("#profile")).toHaveValue(profile);
});
