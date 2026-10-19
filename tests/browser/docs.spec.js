import { test, expect } from "@playwright/test";
import { catalog } from "../../src/formats/registry.js";
import { readURL } from "../../src/url-state.js";
import { readFile } from "node:fs/promises";
import { ECB_URL } from "../../src/exchange-rates.js";

test("documentation examples open their source with the required context and limitations are discoverable", async ({
  page,
}) => {
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
  for (const id of [
    "index",
    "url-format",
    "hashbin",
    "format-comparison",
    "limitations",
    ...catalog.map((f) => `formats/${f.id}`),
  ]) {
    await page.goto(`/docs.html?page=${id}`);
    await expect(page.locator("#docs-content h1")).toBeVisible();
    const blocks = await page
      .locator("#docs-content pre > code")
      .evaluateAll((codes) =>
        codes.map((code) => ({
          source: code.textContent,
          href: code.parentElement.nextElementSibling?.querySelector("a")?.href,
        })),
      );
    for (const { source, href } of blocks) {
      expect(href).toBeTruthy();
      const doc = readURL(href);
      expect(doc.format).toBe(id.startsWith("formats/") ? id.slice(8) : "text");
      if (doc.format === "calca") expect(doc.src).toContain(source.trimEnd());
      else expect(doc.src).toBe(source);
    }
    // Every syntax-reference row must have a runnable example, including rows
    // with incomplete fragments that need definitions or a containing document.
    for (const table of await page.locator("#docs-content table").all()) {
      const heading = await table.locator("th").first().innerText();
      if (!["Write", "Syntax", "Setting", "Parameter"].includes(heading))
        continue;
      for (const cell of await table.locator("tbody tr td:first-child").all()) {
        if (await cell.locator("code").count())
          await expect(
            cell.locator('a[href*="index.html"]').first(),
          ).toBeVisible();
      }
    }
    if (id.startsWith("formats/"))
      await expect(
        page
          .locator('#docs-content a[href="docs.html?page=limitations"]')
          .first(),
      ).toBeVisible();
  }

  await page.goto("/docs.html?page=formats/calca");
  await page.getByRole("link", { name: "f(5) =>", exact: true }).click();
  await expect(page.locator("#format")).toHaveValue("calca");
  await expect(page.locator("#preview")).toContainText("f(5) => 25");
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toContain(
    "f(x) = x^2",
  );

  await page.goto("/docs.html?page=formats/calca");
  await page
    .locator("#docs-content pre")
    .filter({ hasText: "2*x + 3 = 11" })
    .locator("xpath=following-sibling::p[1]")
    .getByRole("link")
    .click();
  await expect(page.locator("#preview")).toContainText("x => 4");

  await page.goto("/docs.html?page=formats/calca");
  await page
    .locator("#docs-content pre")
    .filter({ hasText: "# Calculations beside code" })
    .locator("xpath=following-sibling::p[1]")
    .getByRole("link")
    .click();
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#profile")).toHaveValue("calca-blocks-v1");
  await expect(page.locator("#preview")).toContainText(
    "price * (1 + tax) => 25.92",
  );

  await page.goto("/docs.html?page=url-format");
  await page
    .getByRole("link", { name: "?profile=calca-scopes-v1", exact: true })
    .click();
  await expect(page.locator("#profile")).toHaveValue("calca-scopes-v1");
  await expect(page.locator("#preview")).toContainText("value => 2");
  await expect(page.locator("#preview")).toContainText("value => value");

  await page.goto("/docs.html?page=formats/calca");
  await page
    .locator("#docs-content pre")
    .filter({ hasText: "# Parent" })
    .locator("xpath=following-sibling::p[1]")
    .getByRole("link")
    .click();
  await expect(page.locator("#profile")).toHaveValue("calca-scopes-v1");
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#preview")).toContainText("total => 12");
  await expect(page.locator("#preview")).toContainText("total => total");

  await page.goto("/docs.html?page=url-format");
  await page.getByRole("link", { name: "#<cid>", exact: true }).click();
  await expect(page.locator("#preview")).toContainText("2 + 2 => 4");

  await page.goto("/docs.html?page=formats/calcfile");
  await page
    .locator("#docs-content pre")
    .filter({ hasText: "Budget = 100 EUR" })
    .locator("xpath=following-sibling::p[1]")
    .getByRole("link")
    .click();
  await expect(page.locator("#format")).toHaveValue("calcfile");
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator('.result-line[data-line="2"] output')).toHaveText(
    "112.53 USD",
  );
  await page.goto("/docs.html?page=formats/hurmet");
  await page
    .locator("#docs-content pre")
    .filter({ hasText: "100 'EUR'" })
    .locator("xpath=following-sibling::p[1]")
    .getByRole("link")
    .click();
  await expect(page.locator("#format")).toHaveValue("hurmet");
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#preview")).toContainText("112.53");

  await page.goto("/docs.html?page=formats/beancount");
  await page
    .getByRole("link", { name: "0.00 ~ 0.005 USD", exact: true })
    .click();
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await expect(page.locator("#report-errors")).toContainText(
    "The ledger balances",
  );

  await page.goto("/docs.html");
  await page
    .getByRole("link", { name: "Limitations & compatibility", exact: true })
    .click();
  await expect(page.locator("#docs-content h1")).toHaveText(
    "Limitations and compatibility",
  );
  for (const name of [
    "GitHub Markdown",
    "AsciiMath",
    "Numbat",
    "CalcFile",
    "Org tables",
    "Calca",
    "Hurmet",
    "Beancount",
    "Quarto",
    "Plain text",
  ])
    await expect(
      page.locator("#docs-content").getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  await expect(page.locator("#docs-content")).toContainText("662/672");
  await expect(page.locator("#docs-content")).toContainText(
    "1e-8 transaction tolerance",
  );
});
