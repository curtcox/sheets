import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
import { HashBinDocuments } from "../../src/hashbin.js";
import { mockHashBin } from "./hashbin-mock.js";
import {
  CALCA_BLOCKS,
  CALCA_BLOCKS as profile,
  CALCA_SCOPES,
} from "../../src/compatibility-profiles.js";

const base = "http://127.0.0.1:4173/index.html";
const source =
  '# Mixed document\n\n```python\nprint("literal => example")\n```\n\n```calca\nprice=3\nprice*4 => old\n```\n\n```mermaid\ngraph LR\n  Source --> Answer\n```\n\n<img src="data:," onerror="globalThis.unsafeProfile=1">';
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(
    /^(?:Ready|\d+ diagnostic)/,
  );

test("scoped gallery definitions, shared links and migration retain their deliberate semantics", async ({
  page,
  context,
}) => {
  await page.goto(base + "?example=calca-typical");
  await ready(page);
  await expect(page.locator("#profile")).toHaveValue(CALCA_SCOPES);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#preview")).toContainText("tempC => 100");
  await expect(page.locator("#preview")).toContainText("width => [2, 3]");
  await expect(page.locator("#preview")).toContainText("width => 2");
  await expect(page.locator("#preview")).toContainText("price => price");
  const source = await page.evaluate(() => ace.edit("editor").getValue());
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const fresh = await context.newPage();
  await fresh.goto(await page.locator("#share-url").inputValue());
  await ready(fresh);
  await expect(fresh.locator("#profile")).toHaveValue(CALCA_SCOPES);
  await expect(fresh.locator("#preview")).toContainText("price => price");
  expect(await fresh.evaluate(() => ace.edit("editor").getValue())).toBe(
    source,
  );
  await fresh.locator("#download-menu summary").click();
  const download = fresh.waitForEvent("download");
  await fresh.locator("#download-source").click();
  expect(await readFile(await (await download).path(), "utf8")).toBe(source);
  await fresh.locator("#profile").selectOption(CALCA_BLOCKS);
  await ready(fresh);
  await expect(fresh.locator("#preview")).toContainText("price => 24");
  expect(await fresh.evaluate(() => ace.edit("editor").getValue())).toBe(
    source,
  );
  const conflict =
    "# Parent\n\n```calca\nvalue=2\nvalue=3\nvalue =>\n2+2 =>\n```\n\n# Sibling\n\nvalue =>";
  await fresh.goto(
    writeURL(base, { src: conflict, format: "calca", profile: CALCA_SCOPES }),
  );
  await ready(fresh);
  await expect(fresh.locator("#render-status")).toContainText("2 diagnostic");
  await expect(fresh.locator("#preview")).toContainText(
    "Conflicting relations",
  );
  await expect(fresh.locator("#preview")).toContainText("2+2 => 4");
  await expect(fresh.locator("#preview")).toContainText("value => value");
  expect(
    await fresh.evaluate(() =>
      ace
        .edit("editor")
        .getSession()
        .getAnnotations()
        .map((a) => a.row),
    ),
  ).toEqual([4, 5]);
  await fresh.goto(
    writeURL(base, {
      src: "```calca\nvalue=2\nf(x)=(value=x)\nvalue =>\n```",
      format: "calca",
      profile: CALCA_SCOPES,
    }),
  );
  await ready(fresh);
  await expect(fresh.locator("#render-status")).toContainText("1 diagnostic");
  await expect(fresh.locator("#preview")).toContainText("value => 2");
  await fresh.close();
});

test("indirect built-in calls are rejected across Calca profiles", async ({
  page,
}) => {
  for (const profile of [undefined, CALCA_BLOCKS, CALCA_SCOPES]) {
    await page.goto(
      writeURL(base, {
        src: '```calca\ng(x)=x\nf(g)=g("2+2")\nf(evaluate) =>\n2+2 =>\n```',
        format: "calca",
        profile,
      }),
    );
    await ready(page);
    await expect(page.locator("#preview")).toContainText(
      "Reserved variable or function name",
    );
    await expect(page.locator("#preview")).toContainText("2+2 => 4");
  }
});

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

for (const profile of [CALCA_BLOCKS, CALCA_SCOPES]) {
  test(`HashBin saves ${profile} and honors legacy documents, CID precedence and explicit overrides`, async ({
    page,
  }) => {
    const hashbin = await mockHashBin(page);
    let cid = hashbin.put(
      HashBinDocuments.serialize({
        src: "```python\nlegacyValue=9\n```\nlegacyValue =>",
        type: "calca",
      }),
    );
    await page.goto(base + "?compressed=invalid!#" + cid);
    await ready(page);
    await expect(page.locator("#preview")).toContainText("legacyValue => 9");
    await expect(page.locator("#profile")).toHaveValue("");
    await page.goto(writeURL(base, { src: source, format: "calca", profile }));
    await ready(page);
    await page.getByRole("button", { name: "HashBin", exact: true }).click();
    await page.locator("#hashbin-save").click();
    await expect(page.locator("#hashbin-confirm")).toBeEnabled();
    await page.locator("#hashbin-confirm").click();
    await expect(page.locator("#hashbin-status")).toHaveText(
      "Saved to HashBin.",
    );
    cid = hashbin.last.cid;
    const payload = hashbin.last.payload;
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
    expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(
      source,
    );
    expect(JSON.parse(payload).profile).toBe(profile);
  });
}

test("redirect saves keep the Calca profile and exact source after approval or cancellation", async ({
  page,
}) => {
  const profile = CALCA_SCOPES,
    hashbin = await mockHashBin(page);
  for (const outcome of ["redirect", "redirect-cancel"]) {
    await page.goto(
      writeURL(base, { src: source, format: "calca", view: "source", profile }),
    );
    await ready(page);
    await hashbin.mode(outcome);
    await page.getByRole("button", { name: "HashBin", exact: true }).click();
    await page.locator("#hashbin-save").click();
    await expect(page.locator("#hashbin-confirm")).toBeEnabled();
    await Promise.all([
      page.waitForURL(/#hashbin_publish=/),
      page.locator("#hashbin-confirm").click(),
    ]);
    await ready(page);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    await expect(page.locator("#profile")).toHaveValue(profile);
    await expect(page.locator("#preview-pane")).toBeHidden();
    expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(
      source,
    );
    expect(new URL(page.url()).searchParams.get("profile")).toBe(profile);
    expect(page.url()).not.toContain("hashbin_publish");
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
