import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { writeURL } from "../../src/url-state.js";

const fixture = () => readFile(new URL("../fixtures/org/controls.org", import.meta.url), "utf8");
const base = "http://127.0.0.1:4173/index.html";
const ready = (page) => expect(page.locator("#render-status")).toHaveText(/^(Ready|\d+ diagnostic)/);
const source = (page) => page.evaluate(() => ace.edit("editor").getValue());
const constants = async (page) => (await source(page)).split(/\r?\n/)[1].replace(/^﻿/, "");
const results = (page) => page.locator("#preview .org-table-scroll tbody tr:last-child td:not(:first-child)");
const control = (page, name) => page.locator(`#preview input[data-control="org-constant:${name}"]`);

test("controls recalculate live, write exact source, undo per gesture and survive reload", async ({ page, context }) => {
  for (const variant of ["plain", "bom-crlf"]) {
    const original = await fixture(),
      src = variant === "plain" ? original : "﻿" + original.replaceAll("\n", "\r\n");
    await page.goto(writeURL(base, { src, format: "org", view: "split" }));
    await ready(page);
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    await expect(results(page)).toHaveText(["36000", "1260.00"]);
    await expect(page.getByLabel("Monthly price ($)")).toHaveValue("25");
    await expect(page.getByLabel("Bill annually")).toBeChecked();

    // Keyboard steps keep focus on the slider across renders.
    const price = control(page, "price");
    await price.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(results(page)).toHaveText(["50400", "1764.00"]);
    await expect(price).toBeFocused();
    await expect(page.locator('#preview output[data-control-output="org-constant:price"]')).toHaveText("35");
    expect(await constants(page)).toBe("#+CONSTANTS: price=35 annual=1 users=120 rate=0.035");

    // A pointer drag is one gesture: many renders, one undo step.
    const box = await price.boundingBox();
    await page.mouse.move(box.x + box.width * 0.33, box.y + box.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++)
      await page.mouse.move(box.x + box.width * (0.33 + i * 0.07), box.y + box.height / 2);
    await page.mouse.up();
    await expect(page.locator("#render-status")).toHaveText(/^Ready/);
    const dragged = await price.inputValue();
    expect(Number(dragged)).toBeGreaterThan(60);
    expect(await constants(page)).toBe(`#+CONSTANTS: price=${dragged} annual=1 users=120 rate=0.035`);
    await expect(results(page).first()).toHaveText(String(Number(dragged) * 120 * 12));
    await page.evaluate(() => ace.edit("editor").undo());
    await expect(price).toHaveValue("35");
    expect(await constants(page)).toBe("#+CONSTANTS: price=35 annual=1 users=120 rate=0.035");

    await page.getByLabel("Bill annually").click();
    await expect(results(page)).toHaveText(["4200", "147.00"]);
    const users = control(page, "users");
    await users.fill("12 000");
    await users.press("Enter");
    await expect(users).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator('#preview [data-control-error="org-constant:users"]')).toHaveText(/decimal number/);
    expect(await constants(page)).toBe("#+CONSTANTS: price=35 annual=0 users=120 rate=0.035");
    await users.fill("1000");
    await users.press("Enter");
    await expect(users).not.toHaveAttribute("aria-invalid");
    await expect(results(page)).toHaveText(["35000", "1225.00"]);
    const expected = src.replace("price=25 annual=1 users=120", "price=35 annual=0 users=1000");
    expect(await source(page)).toBe(expected);

    // Typing in the editor still drives the controls.
    await page.evaluate(() => {
      const editor = ace.edit("editor");
      editor.setValue(editor.getValue().replace("rate=0.035", "rate=0.08"), -1);
    });
    await expect(control(page, "rate")).toHaveValue("0.08");
    await expect(results(page).last()).toHaveText("2800.00");

    await page.reload();
    await ready(page);
    expect(await source(page)).toBe(expected.replace("rate=0.035", "rate=0.08"));
    await expect(price).toHaveValue("35");
    await expect(page.getByLabel("Bill annually")).not.toBeChecked();

    await page.locator("#download-menu summary").click();
    const pending = page.waitForEvent("download");
    await page.locator("#download-html").click();
    const html = await readFile(await (await pending).path(), "utf8"), saved = await context.newPage();
    await saved.setContent(html);
    await expect(saved.locator("input[data-control]")).toHaveCount(4);
    for (const input of await saved.locator("input[data-control]").all()) await expect(input).toBeDisabled();
    await expect(saved.locator("script")).toHaveCount(0);
    await saved.close();
  }
});

test("controls fit phone width and spoofed control markup cannot write source", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(writeURL(base, { src: await fixture(), format: "org", view: "preview" }));
  await ready(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await control(page, "price").focus();
  await page.keyboard.press("End");
  await expect(results(page)).toHaveText(["144000", "5040.00"]);

  // Markdown raw HTML cannot borrow a control id: there is no descriptor behind it.
  const markdown = '<input type="range" data-control="org-constant:price" min="0" max="9">\n<input type="password" data-control="x">\n';
  await page.goto(writeURL(base, { src: markdown, format: "gfm", view: "split" }));
  await ready(page);
  await expect(page.locator("#preview input[type=password]")).not.toHaveAttribute("data-control");
  await page.locator("#preview input[type=range]").focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(500);
  expect(await source(page)).toBe(markdown);
});
