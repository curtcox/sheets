import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const examples = JSON.parse(
  readFileSync(new URL("../../examples/catalog.json", import.meta.url), "utf8"),
);

// Collects Content-Security-Policy violations; the policy must not block the app itself.
async function watch(page) {
  const violations = [];
  await page.exposeFunction("__cspViolation", (text) => violations.push(text));
  await page.addInitScript(() =>
    addEventListener("securitypolicyviolation", (event) =>
      globalThis.__cspViolation?.(
        `${event.violatedDirective} ${event.blockedURI} ${location.pathname} ${event.sourceFile}`,
      ),
    ),
  );
  return violations;
}

test("the Content-Security-Policy blocks unlisted script hosts", async ({ page }) => {
  const violations = await watch(page);
  await page.goto("/index.html");
  await expect(page.locator("#render-status")).toHaveText(/^(?:Ready|\d+ diagnostic)/);
  await page.evaluate(() => {
    const script = document.createElement("script");
    script.src = "https://example.invalid/injected.js";
    document.head.append(script);
  });
  await expect.poll(() => violations.some((v) => v.includes("example.invalid"))).toBe(true);
});

test("the gallery, docs and every gallery example run without policy violations", async ({ page }) => {
  test.setTimeout(600_000);
  const violations = await watch(page);
  await page.goto("/gallery.html");
  await expect(page.locator("#gallery-status")).not.toHaveText(/Loading/);
  await page.goto("/docs.html");
  await page.waitForLoadState("networkidle");
  for (const example of examples) {
    await page.goto("/index.html?example=" + encodeURIComponent(example.id));
    await expect(page.locator("#render-status")).toHaveText(/^(?:Ready|\d+ diagnostic)/, { timeout: 110_000 });
  }
  // DOMPurify parses untrusted examples (gfm-error has <img onerror>) in an inert document;
  // the policy reports the handler it would refuse, though nothing there could run anyway.
  expect(
    violations.filter((v) => !(v.startsWith("script-src-attr inline") && v.includes("/vendor/dompurify@"))),
  ).toEqual([]);
});
