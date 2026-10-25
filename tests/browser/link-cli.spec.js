import { test, expect } from "@playwright/test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { longSource } from "../fixtures/long-source.js";
const run = promisify(execFile);

test("CLI-generated short and long links open exact profiled source snapshots in the editor", async ({ page }) => {
  const directory = await mkdtemp(join(tmpdir(), "sheets-cli-browser-")),
    filename = join(directory, "money $(literal) model.ORG");
  try {
    for (const source of [
      "\uFEFF#+TITLE: Local model 日本語\r\n| 3 | 0 | 0 |\r\n#+TBLFM: $3=$2+1::$2=$1+10\r\n",
      "\uFEFF" + longSource.replaceAll("\n", "\r\n") + "\r\n \t",
    ]) {
      await writeFile(filename, source);
      const { stdout, stderr } = await run(process.execPath, [
        "scripts/link.mjs", filename, "--view=preview", "--profile=org-emacs-v1",
        "--base=http://127.0.0.1:4173/index.html",
      ]);
      const url = stdout.trimEnd();
      expect(stdout.split("\n")).toHaveLength(2);
      expect(new URL(url).hash.startsWith("#src=")).toBe(source.length > 10000);
      if (source.length > 10000) expect(stderr).toContain("Warning: Long link");
      else expect(stderr).toBe("");
      // The generated URL embeds a snapshot, independently of subsequent edits.
      await writeFile(filename, "Changed after creating the link.");
      await page.goto(url);
      await expect(page.locator("#render-status")).toHaveText(/^Ready/);
      expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
      await expect(page.locator("#profile")).toHaveValue("org-emacs-v1");
      await expect(page.locator("#source-pane")).toBeHidden();
      await expect(page.locator("#preview table")).toHaveText("31314");
      await page.reload();
      await expect(page.locator("#render-status")).toHaveText(/^Ready/);
      expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
