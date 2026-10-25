import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { catalog } from "../../src/formats/registry.js";
import { readURL, SOURCE_FRAGMENT_THRESHOLD } from "../../src/url-state.js";
import { linkFromFile } from "../../scripts/link.mjs";
import { longSource } from "../fixtures/long-source.js";

const script = fileURLToPath(new URL("../../scripts/link.mjs", import.meta.url));
let directory;
before(async () => { directory = await mkdtemp(join(tmpdir(), "sheets link-")); });
after(async () => { await rm(directory, { recursive: true, force: true }); });
async function file(name, data) {
  const path = join(directory, name);
  await writeFile(path, data);
  return path;
}
const run = (args, options = {}) => spawnSync(process.execPath, [script, ...args], {
  encoding: "utf8", maxBuffer: 4 * 1024 * 1024, ...options,
});
function emitted(result) {
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.split("\n").length, 2);
  return result.stdout.trimEnd();
}

test("link CLI preserves UTF-8 BOM, CRLF, whitespace and settings without changing the file", async () => {
  const src = "\uFEFF#+TITLE: Model 日本語 😀\r\n| 3 | 0 |\r\n\t  ",
    path = await file("private $(literal) name.ORG", src),
    result = run([path, "--view", "source", "--profile=org-emacs-v1"]),
    url = emitted(result);
  assert.deepEqual(readURL(url), {
    src, format: "org", view: "source", profile: "org-emacs-v1", kind: "source",
  });
  assert.equal(result.stderr, "");
  assert.equal(new URL(url).origin, "https://curtcox.github.io");
  assert.equal(new URL(url).pathname, "/sheets/index.html");
  assert.equal(await readFile(path, "utf8"), src);
  assert.ok(!url.includes("private"));
});

test("link CLI infers registered extensions and permits explicit format/profile overrides", async () => {
  for (const { id, extensions } of catalog) {
    const path = await file("input" + extensions[0], "2+2"),
      state = readURL(emitted(run([path])));
    assert.equal(state.format, id);
    assert.equal(state.src, "2+2");
  }
  const path = await file("input.unknown", "2+2");
  assert.equal(readURL(emitted(run([path]))).format, "auto");
  const state = readURL(emitted(run([path, "--format=auto", "--profile=calca-scopes-v1", "--view=preview"])));
  assert.equal(state.profile, "calca-scopes-v1");
  assert.equal(state.format, "auto");
  assert.equal(state.view, "preview");
  assert.equal(readURL(emitted(run([path, "--format=text"]))).format, "text");
});

test("long CLI links use the shared fragment fallback and warn only on stderr", async () => {
  const path = await file("long.org", longSource),
    base = "https://example.com/editor/?campaign=keep&example=old&code=secret&state=old#AAAAAAAA",
    result = run(["--base", base, "--view=preview", "--profile=org-emacs-v1", path]),
    url = emitted(result);
  assert.ok(new URL(url).hash.startsWith("#src="));
  assert.ok(url.split("#")[0].length < SOURCE_FRAGMENT_THRESHOLD);
  assert.equal(new URL(url).searchParams.get("campaign"), "keep");
  assert.ok(!url.includes("secret"));
  assert.deepEqual(readURL(url), {
    src: longSource, format: "org", view: "preview", profile: "org-emacs-v1", kind: "source",
  });
  assert.match(result.stderr, /Warning: Long link/);
  assert.match(result.stderr, /truncate/);
  const longBase = run([path, "--base=https://example.com/?keep=" + "x".repeat(7200)]);
  emitted(longBase);
  assert.match(longBase.stderr, /non-source address is still long/);
});

test("CLI rejects invalid or ambiguous options without emitting a link", async () => {
  const path = await file("plain.md", "hello");
  for (const [args, pattern] of [
    [[], /exactly one source file/],
    [[path, path], /exactly one source file/],
    [[path, "--unknown"], /Unknown option/],
    [[path, "--format=bogus"], /Unknown format/],
    [[path, "--view=grid"], /Unknown view/],
    [[path, "--profile=bogus"], /Unknown profile/],
    [[path, "--profile=org-emacs-v1"], /requires org/],
    [[path, "--view"], /requires a value/],
    [[path, "--profile="], /requires a value/],
    [[path, "--format=text", "--format=gfm"], /Duplicate/],
    [[path, "--base=javascript:alert(1)"], /absolute HTTP/],
    [[path, "--base=relative/path"], /absolute HTTP/],
    [[path, "--base=https://user:password@example.com/"], /without credentials/],
  ]) {
    const result = run(args);
    assert.equal(result.status, 1, JSON.stringify(args));
    assert.equal(result.stdout, "");
    assert.match(result.stderr, pattern);
  }
});

test("CLI handles help, dash-prefixed filenames, empty files and source that must not execute", async () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: node scripts\/link.mjs/);
  assert.equal(result.stderr, "");
  await file("-money.org", "");
  assert.equal(readURL(emitted(run(["--", "-money.org"], { cwd: directory }))).src, "");
  const src = "throw new Error('must not execute');\n",
    path = await file("source.js", src);
  assert.equal(readURL(emitted(run([path]))).src, src);
});

test("CLI rejects unreadable paths, non-files and invalid UTF-8 without replacing source bytes", async () => {
  for (const [path, pattern] of [
    [join(directory, "missing.org"), /ENOENT/],
    [directory, /regular file/],
    [await file("invalid.org", Buffer.from([0xff, 0xfe])), /not valid UTF-8/],
  ]) {
    const result = run([path]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, pattern);
  }
});

test("file and generated-link bounds match the reader's decoded and encoded limits", async () => {
  const limit = 5 * 1024 * 1024,
    exact = await file("exact.txt", Buffer.alloc(limit, 120)),
    link = await linkFromFile(exact);
  assert.equal(readURL(link.url).src.length, limit);
  const tooBig = await file("too-big.txt", Buffer.alloc(limit + 1, 120)),
    rejected = run([tooBig]);
  assert.equal(rejected.status, 1);
  assert.equal(rejected.stdout, "");
  assert.match(rejected.stderr, /5 MiB/);
  const varied = Buffer.alloc(2_000_000);
  let seed = 1;
  for (let i = 0; i < varied.length; i++) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    varied[i] = 33 + ((seed >>> 0) % 90);
  }
  const encoded = run([await file("encoded.txt", varied)]);
  assert.equal(encoded.status, 1);
  assert.equal(encoded.stdout, "");
  assert.match(encoded.stderr, /Generated link cannot be opened: Shared source is too large/);
});
