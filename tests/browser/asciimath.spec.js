import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
import { HashBinDocuments } from "../../src/hashbin.js";
import {
  ASCIIMATH_FORMULAS as formulas,
  ASCIIMATH_PROSE as prose,
} from "../../src/compatibility-profiles.js";
const base = "http://127.0.0.1:4173/index.html",
  source = "sqrt(9)\n- x\n\nAn explanation.";
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(
    /^(?:Ready|\d+ diagnostic)/,
  );
const text = (page) => page.evaluate(() => ace.edit("editor").getValue());
const annotations = (page) =>
  page.evaluate(() => ace.edit("editor").session.getAnnotations());
const cid =
  Buffer.from([0, 0, 0, 0, 0, 65]).toString("base64url") + "a".repeat(85) + "A";
const sdk = `export class HashBinClient {
 getTokens(){return {refreshToken:"mock",expiresAt:Date.now()+100000};}
 async handleCallback(){}
 async authorizedFetch(path,options={}){
 let data;
 if(path==="/api/account/settings")data={default_retention_months:1};
 else if(path==="/api/balance")data={balance_cents:100};
 else if(path==="/api/content"){globalThis.savedAsciiPayload=await options.body.get("content").text();data={cid:${JSON.stringify(cid)}};}
 else throw new Error("Unexpected mock API path");
 return new Response(JSON.stringify(data),{headers:{"Content-Type":"application/json"}});
 }
}`;

test("AsciiMath explicit modes survive edits, sharing, exports, reloads and format changes", async ({
  page,
  context,
}) => {
  await page.goto(
    writeURL(base, { src: source, format: "asciimath", profile: formulas }),
  );
  await ready(page);
  await expect(page.locator("#profile-label")).toHaveText("AsciiMath mode");
  await expect(page.locator("#preview math")).toHaveCount(3);
  await page.evaluate(() =>
    ace.edit("editor").setValue(ace.edit("editor").getValue() + "\n|x|", -1),
  );
  await expect(page.locator("#preview math")).toHaveCount(4);
  await expect(page.locator("#profile")).toHaveValue(formulas);
  const exact = await text(page);
  await page.locator("#download-menu summary").click();
  const download = page.waitForEvent("download");
  await page.locator("#download-source").click();
  expect(await readFile(await (await download).path(), "utf8")).toBe(exact);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const shared = await page.locator("#share-url").inputValue();
  const fresh = await context.newPage();
  await fresh.goto(shared);
  await ready(fresh);
  await expect(fresh.locator("#profile")).toHaveValue(formulas);
  await expect(fresh.locator("#source-pane")).toBeHidden();
  await expect(fresh.locator("#preview math")).toHaveCount(4);
  expect(await text(fresh)).toBe(exact);
  const exported = await fresh.evaluate(async () => {
    const { htmlDownload } = await import("./src/export-document.js");
    return htmlDownload(document.getElementById("preview")).blob.text();
  });
  expect(exported).toContain("<math");
  expect(exported).toContain("Show TeX");
  await fresh.locator("#profile").selectOption(prose);
  await expect(fresh.locator("#preview math")).toHaveCount(0);
  await ready(fresh);
  expect(await text(fresh)).toBe(exact);
  await fresh.reload();
  await ready(fresh);
  await expect(fresh.locator("#profile")).toHaveValue(prose);
  await fresh.locator("#profile").selectOption("");
  await ready(fresh);
  expect(new URL(fresh.url()).searchParams.has("profile")).toBe(false);
  await fresh.locator("#format").selectOption("gfm");
  await ready(fresh);
  await expect(fresh.locator("#profile-controls")).toBeHidden();
  await fresh.locator("#format").selectOption("calca");
  await ready(fresh);
  await expect(fresh.locator("#profile")).toHaveValue("");
  await expect(fresh.locator("#profile-label")).toHaveText("Calca blocks");
});

test("AsciiMath mixed mode maps warnings and errors while preserving safe math and Mermaid output", async ({
  page,
}) => {
  const src =
    '# H\n\n😀 `$x^$` then $x^$\n\n> $x/$\n\n| A | B |\n|-|-|\n| $x^$ | $x^$ |\n\n```asciimath\n\n  root(3)\n```\n\n$twoheadrightarrowtail$\n\n$sqrt(9)$\n\n```mermaid\ngraph LR\n  Math --> Notes\n```\n\n<img src="data:," onerror="globalThis.badAscii=1">';
  await page.goto(writeURL(base, { src, profile: prose }));
  await ready(page);
  await expect(page.locator("#profile")).toHaveValue(prose);
  expect(await annotations(page)).toMatchObject([
    { row: 2, column: 17, type: "warning" },
    { row: 4, column: 4, type: "warning" },
    { row: 8, column: 4, type: "warning" },
    { row: 8, column: 11, type: "warning" },
    { row: 12, column: 2, type: "warning" },
    { row: 15, column: 1, type: "error" },
  ]);
  await expect(page.locator("#preview msqrt")).toHaveCount(1);
  await expect(page.locator("#preview [data-mermaid] svg")).toContainText(
    "Notes",
  );
  await expect(page.locator("#preview [onerror],#preview script")).toHaveCount(
    0,
  );
  expect(await page.evaluate(() => globalThis.badAscii)).toBeUndefined();
  expect(await text(page)).toBe(src);
  await page.goto(
    writeURL(base, {
      src: "[0,1)\nlim_(x rarr 2^-) f(x)\n{: x :}\nsqrt",
      format: "asciimath",
      profile: formulas,
    }),
  );
  await ready(page);
  expect(await annotations(page)).toEqual([]);
  await page.goto(base + "?format=asciimath&profile=future-asciimath");
  await expect(page.locator("#render-status")).toContainText(
    "Unsupported compatibility profile",
  );
});

test("AsciiMath modes round-trip through mocked saves and CID overrides while legacy content stays Auto", async ({
  page,
}) => {
  await page.route("https://hashbin.org/sdk/hashbin.js", (r) =>
    r.fulfill({ body: sdk, contentType: "text/javascript" }),
  );
  await page.route("https://hashbin.org/api/payments/calculate", (r) =>
    r.fulfill({ json: { cost_cents: 1 } }),
  );
  let payload = HashBinDocuments.serialize({ src: source, type: "asciimath" });
  await page.route("https://256t.us/" + cid, (r) =>
    r.fulfill({ body: payload }),
  );
  await page.goto(base + "?compressed=invalid!#" + cid);
  await ready(page);
  await expect(page.locator("#profile")).toHaveValue("");
  await expect(page.locator("#preview math")).toHaveCount(0);
  for (const profile of [formulas, prose]) {
    await page.goto(
      writeURL(base, { src: source, format: "asciimath", profile }),
    );
    await ready(page);
    await page.getByRole("button", { name: "HashBin", exact: true }).click();
    await page.locator("#hashbin-save").click();
    await expect(page.locator("#hashbin-message")).toContainText("Cost: $0.01");
    await page.locator("#hashbin-confirm").click();
    await expect(page.locator("#hashbin-status")).toHaveText(
      "Saved to HashBin.",
    );
    payload = await page.evaluate(() => globalThis.savedAsciiPayload);
    expect(JSON.parse(payload)).toMatchObject({
      version: 2,
      type: "asciimath",
      profile,
      src: source,
    });
    await page.goto(base + "#" + cid);
    await ready(page);
    await expect(page.locator("#profile")).toHaveValue(profile);
    await expect(page.locator("#preview math")).toHaveCount(
      profile === formulas ? 3 : 0,
    );
    await page.goto(
      base +
        "?format=asciimath&profile=" +
        (profile === formulas ? prose : formulas) +
        "#" +
        cid,
    );
    await ready(page);
    await expect(page.locator("#profile")).toHaveValue(
      profile === formulas ? prose : formulas,
    );
    await page.goto(base + "?format=gfm#" + cid);
    await ready(page);
    await expect(page.locator("#profile-controls")).toBeHidden();
    expect(new URL(page.url()).searchParams.has("profile")).toBe(false);
  }
});

test("AsciiMath OAuth restoration retains modes and exact source on success and denial", async ({
  page,
}) => {
  await page.route("https://hashbin.org/sdk/hashbin.js", (r) =>
    r.fulfill({ body: sdk, contentType: "text/javascript" }),
  );
  await page.goto(base);
  await ready(page);
  for (const profile of [formulas, prose])
    for (const outcome of ["code=mock", "error=access_denied"]) {
      await page.evaluate(
        ({ source, profile }) =>
          sessionStorage.setItem(
            "sheets:hashbin:return:ascii",
            JSON.stringify({
              createdAt: Date.now(),
              snapshot: {
                src: source,
                type: "asciimath",
                format: "asciimath",
                view: "source",
                profile,
              },
            }),
          ),
        { source, profile },
      );
      await page.goto(base + "?state=ascii&" + outcome);
      await ready(page);
      await expect(page.locator("#profile")).toHaveValue(profile);
      expect(await text(page)).toBe(source);
      await expect(page.locator("#preview-pane")).toBeHidden();
      expect(new URL(page.url()).searchParams.get("profile")).toBe(profile);
      expect(new URL(page.url()).searchParams.has("state")).toBe(false);
    }
});

test("AsciiMath documentation examples pin modes and mode controls fit mobile", async ({
  page,
}) => {
  for (const [snippet, profile, count] of [
    ["sqrt(9) = 3", formulas, 2],
    ["# A sequence", prose, 2],
    ["sqrt(\nx/", formulas, 4],
  ]) {
    await page.goto(
      base.replace("index.html", "docs.html?page=formats/asciimath"),
    );
    await page.locator("#docs-content h1").waitFor();
    await page
      .locator("#docs-content pre")
      .filter({ hasText: snippet })
      .locator("xpath=following-sibling::p[1]")
      .getByRole("link")
      .click();
    await ready(page);
    await expect(page.locator("#profile")).toHaveValue(profile);
    await expect(page.locator("#preview details")).toHaveCount(count);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#profile-controls")).toBeHidden();
});
