// Browser DOM metrics deliberately complement, not replace, exact parser HTML.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { createStaticServer } from "./serve.mjs";
import { readExamples } from "./conformance.mjs";
export async function renderedConformance(page, examples) {
  return page.evaluate(async (examples) => {
    const { renderMarkdown } = await import("./src/formats/gfm/markdown.js");
    const { sanitize } = await import("./src/sanitize.js");
    // Inert templates never execute the reference HTML. Browser serialization
    // accounts for HTML5 void tags/attribute ordering, but keeps text and tree.
    const dom = (html) => {
      const template = document.createElement("template");
      template.innerHTML = html;
      return template.innerHTML;
    };
    const failures = [],
      policyEquivalent = [],
      changedBySanitizer = [];
    for (const example of examples) {
      const parsed = renderMarkdown(example.source).html;
      const final = dom(sanitize(parsed));
      if (final !== dom(parsed)) changedBySanitizer.push(example.id);
      if (final !== dom(example.expected)) {
        failures.push(example.id);
        if (final === dom(sanitize(example.expected)))
          policyEquivalent.push(example.id);
      }
    }
    return {
      total: examples.length,
      finalDOM: {
        passed: examples.length - failures.length,
        failed: failures.length,
        failures,
      },
      policyEquivalent,
      changedBySanitizer,
    };
  }, examples);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ serviceWorkers: "block" });
    await page.goto(`http://127.0.0.1:${server.address().port}/docs.html`);
    const report = await renderedConformance(page, await readExamples());
    const path = new URL(
      "../tests/fixtures/gfm-render-conformance.json",
      import.meta.url,
    );
    if (process.argv.includes("--record"))
      await writeFile(path, JSON.stringify(report, null, 2) + "\n");
    else if (
      JSON.stringify(report) !==
      JSON.stringify(JSON.parse(await readFile(path, "utf8")))
    )
      throw new Error("GFM final DOM changed. Review before recording.");
    console.log(JSON.stringify(report));
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
