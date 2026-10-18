import test from "node:test";
import assert from "node:assert/strict";
import { sourceTitle, fileName, sourceDownload } from "../../src/downloads.js";

test("download names use document headings and metadata safely", () => {
  assert.equal(
    sourceTitle("#+TITLE: Quarterly forecast\n* Results"),
    "Quarterly forecast",
  );
  assert.equal(sourceTitle('---\ntitle: "Field notes"\n---\n'), "Field notes");
  assert.equal(
    sourceTitle('option "title" "Household ledger"'),
    "Household ledger",
  );
  assert.equal(
    fileName("../../Résumé 日本語 / Notes!?", ".md"),
    "résumé-日本語-notes.md",
  );
  assert.equal(fileName("<>?", ".txt"), "sheet.txt");
  assert.ok(fileName("x".repeat(500), ".qmd").length <= 104);
});

test("source downloads preserve exact text and use each format's extension", async () => {
  const source = "# My sheet\r\n\r\n日本語 😀\r\n  trailing spaces  \n";
  for (const [format, extension] of Object.entries({
    gfm: ".md",
    asciimath: ".am",
    numbat: ".nbt",
    calcfile: ".calc",
    org: ".org",
    calca: ".calca",
    hurmet: ".hurmet",
    beancount: ".bean",
    quarto: ".qmd",
    text: ".txt",
    unknown: ".txt",
  })) {
    const download = sourceDownload(source, format);
    assert.equal(download.name, "my-sheet" + extension);
    assert.equal(await download.blob.text(), source);
    assert.equal(download.blob.type, "text/plain;charset=utf-8");
  }
});
