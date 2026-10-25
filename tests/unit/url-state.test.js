import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readURL,
  writeURL,
  formats,
  views,
  SOURCE_FRAGMENT_THRESHOLD,
} from "../../src/url-state.js";
import { HashBinDocuments as doc } from "../../src/hashbin.js";
import LZString from "../../vendor/lz-string.js";
import { longSource } from "../fixtures/long-source.js";
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
test("long source moves to the fragment, preserving complete state and unrelated query parameters", () => {
  const state = {
    src: longSource,
    format: "org",
    view: "preview",
    profile: "org-emacs-v1",
  };
  const url = new URL(writeURL(base + "?campaign=keep", state));
  assert.ok(url.hash.startsWith("#src="));
  assert.equal(url.searchParams.has("compressed"), false);
  assert.equal(url.searchParams.get("campaign"), "keep");
  assert.ok(url.href.split("#")[0].length < SOURCE_FRAGMENT_THRESHOLD);
  assert.deepEqual(readURL(url), { ...state, kind: "source" });
  const short = new URL(writeURL(url, { src: "small" }));
  assert.equal(short.hash, "");
  assert.ok(short.searchParams.has("compressed"));
  assert.equal(readURL(short).src, "small");
  const cid = new URL(writeURL(url, { ...state, cid: "AAAAAAAA" }));
  assert.equal(cid.hash, "#AAAAAAAA");
  assert.equal(cid.searchParams.has("compressed"), false);
  assert.equal(readURL(cid).kind, "hashbin");
});
test("fragment source wins over a stale query source and example; CIDs still win over query source", () => {
  const url = new URL(writeURL(base, { src: "query" }));
  url.searchParams.set("example", "old");
  url.hash = "src=" + LZString.compressToEncodedURIComponent("fragment 日本語 +");
  assert.equal(readURL(url).src, "fragment 日本語 +");
  url.hash = "AAAAAAAA";
  assert.equal(readURL(url).kind, "hashbin");
});
test("fragment source keeps query decoding validation and bounds", () => {
  for (const value of ["", "invalid!", "Q===", "QAAA"]) {
    assert.throws(() => readURL(base + "#src=" + value), /decompressed/);
  }
  assert.throws(
    () => readURL(base + "#src=" + "a".repeat(1_000_001)),
    /too large/,
  );
  const oversized = LZString.compressToEncodedURIComponent(
    "x".repeat(5 * 1024 * 1024 + 1),
  );
  assert.throws(() => readURL(base + "#src=" + oversized), /exceeds 5 MiB/);
  const unicode = LZString.compressToEncodedURIComponent("語".repeat(1_800_000));
  assert.throws(() => readURL(base + "#src=" + unicode), /exceeds 5 MiB/);
});
test("legacy long query source still decodes and rewrites as a reloadable fragment", () => {
  const legacy = new URL(base);
  legacy.searchParams.set(
    "compressed",
    LZString.compressToEncodedURIComponent(longSource),
  );
  assert.equal(readURL(legacy).src, longSource);
  assert.ok(
    new URL(writeURL(legacy, readURL(legacy))).hash.startsWith("#src="),
  );
});
test("the fragment threshold counts the complete query URL", () => {
  const state = { src: "small", format: "text" };
  const length = writeURL(base + "?keep=", state).length;
  const boundary = base + "?keep=" + "x".repeat(SOURCE_FRAGMENT_THRESHOLD - length);
  const short = new URL(writeURL(boundary, state));
  assert.equal(short.href.length, SOURCE_FRAGMENT_THRESHOLD);
  assert.equal(short.hash, "");
  assert.ok(new URL(writeURL(boundary + "x", state)).hash.startsWith("#src="));
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
