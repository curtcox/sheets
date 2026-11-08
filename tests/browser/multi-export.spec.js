import { test, expect } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";
import { openMore } from "./ui.js";
import * as XLSX from "../../vendor/xlsx.js";
const source =
  "#+TITLE: Export model\n#+CONSTANTS: rate=2\n\nEditable report.\n\n| Item | Qty | Price | Total |\n|---+---+---+---|\n| A | 3 | 4 | 0 |\n| B | 5 | 6 | 0 |\n#+TBLFM: $4=$2*$3*$rate\n";
async function open(page, src = source, format = "org") {
  await page.goto(writeURL("http://127.0.0.1:4173/", { src, format }));
  await expect(page.locator("#render-status")).toHaveText(
    /^(Ready|\d+ diagnostic)/,
  );
  await openMore(page);
  await page.locator("#download-menu summary").click();
  await page.locator("#export-open").click();
  await expect(
    page.getByRole("dialog", { name: "Export document" }),
  ).toBeVisible();
}
async function download(page, id) {
  await page.locator("#export-target").selectOption(id);
  const pending = page.waitForEvent("download");
  await page.locator("#export-go").click();
  const file = await pending;
  return {
    bytes: await readFile(await file.path()),
    name: file.suggestedFilename(),
  };
}
test("exports evaluated text, Markdown, real Word and formula-preserving XLSX/ODS", async ({
  page,
}, info) => {
  await open(page);
  for (const id of ["txt", "md", "docx", "xlsx", "ods", "rtf"]) {
    const file = await download(page, id);
    expect(file.name).toBe("export-model." + id);
    if (["txt", "md", "rtf"].includes(id))
      expect(file.bytes.toString()).toContain("24");
    else expect(file.bytes.subarray(0, 2).toString()).toBe("PK");
    if (id === "xlsx" || id === "ods") {
      const wb = XLSX.read(file.bytes, { type: "buffer" });
      expect(wb.Sheets["Table 1"].D2.v).toBe(24);
      expect(wb.Sheets["Table 1"].D2.f).toContain("$B$2");
    }
    if (
      process.env.SHEETS_EXPORT_ARTIFACTS &&
      info.project.name === "chromium"
    ) {
      await mkdir(process.env.SHEETS_EXPORT_ARTIFACTS, { recursive: true });
      await writeFile(
        `${process.env.SHEETS_EXPORT_ARTIFACTS}/${file.name}`,
        file.bytes,
      );
    }
  }
  const html = await download(page, "html");
  expect(html.bytes.toString()).toContain("24");
});
test("unsupported formulas require an explicit values-only choice", async ({
  page,
}) => {
  await open(page, "| 30 | 0 |\n#+TBLFM: $2=sin($1)");
  await page.locator("#export-target").selectOption("xlsx");
  await page.locator("#export-go").click();
  await expect(page.locator("#export-status")).toContainText(
    "not in the Excel subset",
  );
  await page.locator("#export-values").check();
  const file = await download(page, "xlsx");
  const wb = XLSX.read(file.bytes);
  expect(wb.Sheets["Table 1"].B1.f).toBeUndefined();
});
test("exports sanitized media, editable Word content, selected report and a valid Pages handoff", async ({
  page,
  context,
}) => {
  await open(
    page,
    "# Rich report\n\n**Bold** [Guide](https://example.com)\n\n$x^2$\n\n```mermaid\ngraph LR\n A --> B\n```\n<script>alert(1)</script>",
    "gfm",
  );
  const file = await download(page, "docx");
  expect(file.bytes.length).toBeGreaterThan(5000);
  await page.locator("#export-target").selectOption("pages");
  await page.locator("#export-go").click();
  await expect(page.locator("#export-result a")).toHaveAttribute(
    "href",
    /^https:\/\/pages.hashbin.page\/\?run=0/,
  );
  const href = await page.locator("#export-result a").getAttribute("href");
  expect(href).not.toContain("<script>");
});
test("Google upload converts DOCX and returns a document link without persisting tokens", async ({
  page,
}) => {
  await page.route("https://accounts.google.com/gsi/client", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: 'window.google={accounts:{oauth2:{initTokenClient:o=>(window.testOAuthConfig={clientId:o.client_id,scope:o.scope,includeGrantedScopes:o.include_granted_scopes},{requestAccessToken:()=>o.callback({access_token:"export-test-token"})})}}}',
    }),
  );
  await page.route(
    "https://www.googleapis.com/upload/drive/v3/files**",
    async (route) => {
      expect(route.request().headers().authorization).toBe(
        "Bearer export-test-token",
      );
      expect(route.request().headers()["content-type"]).toContain(
        "multipart/related",
      );
      await route.fulfill({ json: { id: "export-doc" } });
    },
  );
  await open(page);
  await page.locator("#export-target").selectOption("google");
  await expect(page.locator("#export-google-settings")).toBeHidden();
  await page.locator("#export-go").click();
  await expect(page.locator("#export-result a")).toHaveAttribute(
    "href",
    "https://docs.google.com/document/d/export-doc/edit",
  );
  expect(await page.evaluate(() => window.testOAuthConfig)).toEqual({
    clientId: await page.locator('meta[name="google-client-id"]').getAttribute("content"),
    scope: "https://www.googleapis.com/auth/drive.file",
    includeGrantedScopes: false,
  });
  expect(page.url()).not.toContain("export-test-token");
});
test("mobile export dialog fits and cancellation discards conversions after an edit", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const box = await page.locator(".export-dialog").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.route("**/vendor/docx@*/index.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.locator("#export-target").selectOption("docx");
  await page.locator("#export-go").click();
  await page.evaluate(() => ace.edit("editor").setValue("# Fresh results", -1));
  await expect(page.locator("#export-status")).toContainText("cancelled");
});

test('evaluated document exports cover every calculation format',async({page})=>{
 const cases=[
  ['gfm','# Report\n\n| Input | Result |\n|---|---|\n| 3 | 12 |'],
  ['asciimath','x^2 + 3'],
  ['numbat','let x = 3\nx * 4'],
  ['calcfile','3 + 4'],
  ['org',source],
  ['calca','3 * 4 =>'],
  ['hurmet','¢` x = 3 `\n\n¢` x^2 = ? `'],
  ['beancount','option "title" "Export ledger"\n2024-01-01 open Assets:Cash USD\n2024-01-01 open Equity:Opening USD\n2024-01-02 * "Opening"\n  Assets:Cash  12 USD\n  Equity:Opening -12 USD'],
  ['quarto','# Report\n\nNotebook prose.\n\n| Input | Result |\n|---|---|\n| 3 | 12 |'],
 ];
 for(const [format,src]of cases){await open(page,src,format);const text=await download(page,'txt');expect(text.bytes.length,format).toBeGreaterThan(1);const doc=await download(page,'docx');expect(doc.bytes.subarray(0,2).toString(),format).toBe('PK');}
});
