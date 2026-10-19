import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { readExamples } from "../../scripts/conformance.mjs";
import { renderedConformance } from "../../scripts/gfm-render-conformance.mjs";
import { writeURL } from "../../src/url-state.js";

test("all 672 GFM examples retain their audited final browser DOM", async ({
  page,
}) => {
  await page.goto("/docs.html");
  const actual = await renderedConformance(page, await readExamples());
  const expected = JSON.parse(
    await readFile(
      new URL("../fixtures/gfm-render-conformance.json", import.meta.url),
      "utf8",
    ),
  );
  expect(actual).toEqual(expected);
  const audit = JSON.parse(
    await readFile(
      new URL("../fixtures/gfm-audit.json", import.meta.url),
      "utf8",
    ),
  );
  const classified = new Set(audit.groups.flatMap((group) => group.examples));
  for (const id of actual.finalDOM.failures)
    expect(classified.has(id) || actual.policyEquivalent.includes(id)).toBe(
      true,
    );
});

const source = `# Aligned notes

| Left | Center | Right |
| :--- | :---: | ---: |
| one | two | three |

Visit www.commonmark.org/help.

www.google.com/search?q=(business))+ok

https://example.com/search?q=word&hl;

www._foo.bar.baz

www.foo._bar.baz

hello@mail+xyz.example and hello+xyz@mail.example.

a@b.c_d and a@b.c+suffix.

\`a@b.c_d\` stays literal.

<a href="https://example.com/existing">a@b.c_d</a>

****Bold**** and $x^2$.

- [x] Reviewed

<title>Visible tag text</title>

<img src="data:," onerror="globalThis.unsafeGFM=1">
`;
for (const format of ["gfm", "asciimath", "calca", "quarto"])
  test(`${format}: shared Markdown preserves alignment, links, text and safety`, async ({
    page,
  }) => {
    await page.goto(
      writeURL("http://127.0.0.1:4173/", { src: source, format }),
    );
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    const table = page.locator("#preview table").first();
    for (const [column, alignment] of [
      [1, "left"],
      [2, "center"],
      [3, "right"],
    ]) {
      for (const cell of await table
        .locator(`tr > :nth-child(${column})`)
        .all())
        expect(await cell.evaluate((e) => getComputedStyle(e).textAlign)).toBe(
          alignment,
        );
    }
    await expect(page.locator("#preview")).toContainText(
      "<title>Visible tag text</title>",
    );
    await expect(
      page.locator('#preview a[href="http://www.commonmark.org/help"]'),
    ).toHaveText("www.commonmark.org/help");
    await expect(
      page.locator(
        '#preview a[href="http://www.google.com/search?q=(business))+ok"]',
      ),
    ).toHaveText("www.google.com/search?q=(business))+ok");
    await expect(
      page.locator('#preview a[href="https://example.com/search?q=word"]'),
    ).toHaveText("https://example.com/search?q=word");
    await expect(
      page.locator('#preview a[href="mailto:hello@mail+xyz.example"]'),
    ).toHaveCount(0);
    await expect(
      page.locator('#preview a[href="mailto:hello+xyz@mail.example"]'),
    ).toBeVisible();
    await expect(
      page.locator('#preview a[href="http://www._foo.bar.baz"]'),
    ).toBeVisible();
    await expect(
      page.locator('#preview a[href="http://www.foo._bar.baz"]'),
    ).toHaveCount(0);
    await expect(page.locator('#preview a[href="mailto:a@b.c_d"]')).toHaveCount(
      1,
    );
    await expect(page.locator('#preview a[href="mailto:a@b.c"]')).toHaveText(
      "a@b.c",
    );
    await expect(
      page.locator("#preview code").filter({ hasText: "a@b.c_d" }).locator("a"),
    ).toHaveCount(0);
    await expect(
      page.locator('#preview a[href="https://example.com/existing"]'),
    ).toHaveText("a@b.c_d");
    await expect(page.locator("#preview a a")).toHaveCount(0);
    await expect(page.locator("#preview math")).toBeVisible();
    await expect(
      page.locator("#preview strong strong,#preview title,#preview [onerror]"),
    ).toHaveCount(0);
    expect(await page.evaluate(() => globalThis.unsafeGFM)).toBeUndefined();
    expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(
      source,
    );
  });

test("GFM alignment and filtered text survive rendered HTML export", async ({
  page,
  context,
}) => {
  await page.goto(
    writeURL("http://127.0.0.1:4173/", { src: source, format: "gfm" }),
  );
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await page.locator("#download-menu summary").click();
  const pending = page.waitForEvent("download");
  await page.locator("#download-html").click();
  const downloaded = await pending;
  const saved = await context.newPage();
  await saved.setContent(await readFile(await downloaded.path(), "utf8"));
  expect(
    await saved
      .locator('th[align="right"]')
      .evaluate((e) => getComputedStyle(e).textAlign),
  ).toBe("right");
  expect(
    await saved
      .locator('td[align="center"]')
      .evaluate((e) => getComputedStyle(e).textAlign),
  ).toBe("center");
  await expect(
    saved.locator('a[href="http://www.google.com/search?q=(business))+ok"]'),
  ).toHaveText("www.google.com/search?q=(business))+ok");
  await expect(
    saved.locator('a[href="mailto:hello@mail+xyz.example"]'),
  ).toHaveCount(0);
  await expect(saved.locator('a[href="mailto:a@b.c_d"]')).toHaveCount(1);
  await expect(saved.locator('a[href="mailto:a@b.c"]')).toHaveText("a@b.c");
  await expect(
    saved.locator('a[href="https://example.com/existing"]'),
  ).toHaveText("a@b.c_d");
  await expect(saved.locator("a a")).toHaveCount(0);
  await expect(saved.locator("body")).toContainText(
    "<title>Visible tag text</title>",
  );
  await expect(
    saved.locator("script,title:not(head title),[onerror]"),
  ).toHaveCount(0);
});
