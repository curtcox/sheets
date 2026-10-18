import { test } from "node:test";
import assert from "node:assert/strict";
import { readURL, writeURL, formats, views } from "../../src/url-state.js";
import { HashBinDocuments as doc } from "../../src/hashbin.js";
const base = "https://curtcox.github.io/sheets/index.html";
for (const src of [
  "",
  "hello\nworld",
  "😀 café 日本語 $x$ <script>",
  "a".repeat(10000),
])
  test(`URL source round-trip (${src.length} characters)`, () => {
    const url = writeURL(base, { src, format: "numbat", view: "preview" });
    assert.deepEqual(readURL(url), {
      src,
      format: "numbat",
      view: "preview",
      kind: "source",
    });
  });
for (const format of formats)
  for (const view of views)
    test(`URL ${format}/${view}`, () => {
      const state = readURL(writeURL(base, { src: "2+2", format, view }));
      assert.equal(state.format, format);
      assert.equal(state.view, view);
    });
test("source takes precedence over example; CID takes precedence over source", () => {
  const url = new URL(writeURL(base, { src: "source" }));
  url.searchParams.set("example", "old");
  assert.equal(readURL(url).src, "source");
  url.hash = "AAAAAAAA";
  assert.equal(readURL(url).kind, "hashbin");
});
test("old document and OAuth parameters are removed", () => {
  const url = new URL(
    writeURL(
      base +
        "?format=numbat&view=preview&example=old&code=secret&state=old&raw=x&url=x#error",
      { src: "new" },
    ),
  );
  assert.deepEqual([...url.searchParams.keys()], ["compressed"]);
  assert.equal(url.hash, "");
});
test("default and invalid format/view resolve safely", () => {
  assert.deepEqual(readURL(base + "?format=../../bad&view=bad"), {
    format: "auto",
    view: "split",
    kind: "empty",
  });
  assert.equal(readURL(base + "?example=x").example, "x");
});
test("malformed compressed source is an error", () =>
  assert.throws(() => readURL(base + "?compressed=invalid!"), /decompressed/));
test("a CID link drops embedded source", () => {
  const url = writeURL(writeURL(base, { src: "old" }), {
    cid: "AAAAAAAA",
    format: "gfm",
    view: "source",
  });
  assert.equal(new URL(url).searchParams.has("compressed"), false);
  assert.equal(readURL(url).cid, "AAAAAAAA");
});
test("decompression stops at the size bound", async () => {
  const { default: LZ } = await import("../../vendor/lz-string.js");
  const { decompressSource } = await import("../../src/compression.js");
  assert.throws(
    () =>
      decompressSource(LZ.compressToEncodedURIComponent("x".repeat(1000)), 100),
    /exceeds/,
  );
  for (const source of ["", "x", "日本語", "hello\n".repeat(1000)])
    assert.equal(
      decompressSource(LZ.compressToEncodedURIComponent(source)),
      source,
    );
});
