// One-time screenshots, committed as static gallery assets. No deployment build.
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { readFile, mkdir, mkdtemp, cp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./serve.mjs";
import {
  ECB_URL,
  rateTableFromXML,
  rateXMLFromCSV,
} from "../src/exchange-rates.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const catalog = JSON.parse(
  await readFile(new URL("../examples/catalog.json", import.meta.url)),
);
const only = process.argv.find((arg) => arg.startsWith("--only="))?.slice(7);
const ratesFixture = process.argv
  .find((arg) => arg.startsWith("--rates-fixture="))
  ?.slice(16);
if (only && !catalog.some((item) => item.id === only))
  throw new Error("Unknown gallery example.");
const temporary = await mkdtemp(`${tmpdir()}/sheets-covers-`);
const server = createStaticServer(root);
let browser;
try {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 640, height: 400 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "en-US",
    timezoneId: "UTC",
  });
  const page = await context.newPage();
  if (ratesFixture) {
    const csv = await readFile(ratesFixture, "utf8"),
      table = rateTableFromXML(rateXMLFromCSV(csv));
    await page.clock.setFixedTime(new Date(table.asOf + "T12:00:00Z"));
    await page.route(ECB_URL, (route) =>
      route.fulfill({ body: csv, contentType: "text/csv" }),
    );
  }
  const hashes = only
    ? JSON.parse(await readFile(`${root}examples/covers/manifest.json`, "utf8"))
        .sources
    : {};
  for (const item of catalog.filter((item) => !only || item.id === only)) {
    if (!/^[a-z]+-(?:basic|typical|edge|error)$/.test(item.id))
      throw new Error(`Invalid example ID: ${item.id}`);
    await page.goto(
      `${base}index.html?example=${encodeURIComponent(item.id)}&view=preview`,
    );
    await page.waitForFunction(
      () =>
        /^(?:Ready|\d+ diagnostic|Error:)/.test(
          document.querySelector("#render-status")?.textContent || "",
        ),
      null,
      { timeout: 110000 },
    );
    const status = await page.locator("#render-status").textContent();
    const output = await page.locator("#preview").textContent();
    if (
      /Worker failed to start|Python could not start|R could not start|Calculation exceeded/.test(
        output,
      ) ||
      (item.id === "quarto-error" &&
        !output.includes("The next cell still runs"))
    )
      throw new Error(
        `${item.id}: execution failed before the example could render.\n${output}`,
      );
    const expectsDiagnostic =
      item.kind === "error" && !["gfm", "asciimath"].includes(item.format);
    if (!(expectsDiagnostic ? /^\d+ diagnostic/ : /^Ready/).test(status))
      throw new Error(
        `${item.id}: ${status}\n${await page.locator("#preview").textContent()}`,
      );
    if (item.format === "beancount" && item.kind !== "error")
      await page
        .getByRole("tab", { name: "Trial balance", exact: true })
        .click();
    await page.addStyleTag({
      content: `
      :root,body {background:white}
      body.editor-page {height:400px;min-height:0}
      .site-header,.toolbar,.profile-controls,.storage-panel,.statusbar,.pane-header,#preview button {display:none!important}
      #workspace {width:640px;height:400px;min-height:400px;flex:none;margin:0;border:0;border-radius:0;box-shadow:none}
      #preview {padding:24px;scrollbar-width:none}
      #preview::-webkit-scrollbar {display:none}
    `,
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.querySelectorAll("#preview img")].map((image) =>
          image.decode().catch(() => {}),
        ),
      );
    });
    await page.locator("#preview").screenshot({
      path: `${temporary}/${item.id}.png`,
      animations: "disabled",
    });
    hashes[item.id] = createHash("sha256")
      .update(await readFile(`${root}${item.path}`))
      .digest("hex");
    console.log(`Rendered ${item.id}`);
  }
  await writeFile(
    `${temporary}/manifest.json`,
    JSON.stringify({ width: 640, height: 400, sources: hashes }, null, 2) +
      "\n",
  );
  await mkdir(`${root}examples/covers`, { recursive: true });
  await cp(temporary, `${root}examples/covers`, { recursive: true });
  console.log(`Updated ${only ? 1 : catalog.length} gallery covers.`);
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await rm(temporary, { recursive: true, force: true });
}
