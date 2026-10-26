import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { parseProjectFile, serializeProjectFile, validateProjectDocument } from "../../src/project-state.js";
import { snapshotFromPayloads, validateInputSnapshot, verifyInputSnapshot, SNAPSHOT_LIMITS } from "../../src/input-snapshot.js";
import { encode64, decode64 } from "../../src/cid.js";
import { readURL, writeURL } from "../../src/url-state.js";
import { HashBinDocuments, HashBinStore } from "../../src/hashbin.js";
import { resolveDocument } from "../../src/compatibility-profiles.js";
import { renderOrgWithInputs } from "../../src/formats/org/index.js";
import { projectDownload } from "../../src/downloads.js";
import { linkFromFile } from "../../scripts/link.mjs";
import LZString from "../../vendor/lz-string.js";

const fixture = () => readFile(new URL("../fixtures/projects/v1.sheets.json", import.meta.url), "utf8");
const base = "https://curtcox.github.io/sheets/index.html";
function cidFor(bytes) {
  bytes = Buffer.from(bytes); const length = Buffer.alloc(6); length.writeUIntBE(bytes.length, 0, 6);
  return length.toString("base64url") + (bytes.length <= 64 ? bytes : createHash("sha512").update(bytes).digest()).toString("base64url");
}

test("version-1 project fixture retains exact source, bytes, mode and view and calculates without network", async () => {
  const document = parseProjectFile(await fixture()), payloads = await verifyInputSnapshot(document.inputSnapshot, document.src);
  assert.ok(document.src.startsWith("\uFEFF"));
  assert.ok(document.src.endsWith("\r\n \t"));
  assert.equal(document.profile, "org-emacs-v1"); assert.equal(document.view, "preview");
  const bytes = [...payloads.values()][0];
  assert.equal(new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes).startsWith("\uFEFF"), true);
  const result = await renderOrgWithInputs(document.src, { ...document, fetchSource: () => { throw Error("No bundled network"); } });
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, />12<\/td>/); assert.match(result.html, />3\.00<\/td>/);
  assert.match(result.html, /without network fallback/);
  assert.deepEqual([...result.inputPayloads.values()][0], bytes);
  const downloaded = projectDownload(document, result.inputPayloads);
  assert.equal(downloaded.name, "portable-model-日本語.sheets.json");
  assert.deepEqual(parseProjectFile(await downloaded.blob.text()), document);
});

test("project fragments preserve complete state, clear stale parameters and honor explicit view/profile overrides", async () => {
  const document = parseProjectFile(await fixture()), url = writeURL(base + "?example=old&code=secret&keep=yes", { ...document, format: "org" }), state = readURL(url);
  assert.ok(new URL(url).hash.startsWith("#project="));
  assert.ok(!url.includes("secret")); assert.equal(new URL(url).searchParams.get("keep"), "yes");
  assert.deepEqual(state, { src: document.src, format: "org", view: "preview", profile: document.profile, inputSnapshot: document.inputSnapshot, kind: "project" });
  const changed = new URL(url); changed.searchParams.set("view", "source"); changed.searchParams.set("compressed", LZString.compressToEncodedURIComponent("stale"));
  assert.equal(readURL(changed).src, document.src); assert.equal(readURL(changed).view, "source");
  changed.searchParams.set("format", "gfm"); assert.throws(() => readURL(changed), /org/i);
  const cid = cidFor("stored");
  assert.equal(readURL(writeURL(url, { ...document, format: "org", cid })).kind, "hashbin");
  assert.equal(readURL(writeURL(url, { src: "plain", format: "org" })).kind, "source");
  assert.throws(() => readURL(base + "#project=" + "x".repeat(1_000_001)), /too large/);
  assert.throws(() => readURL(base + "#project=invalid!"), /decompressed/);
  assert.throws(() => readURL(base + "#project=" + LZString.compressToEncodedURIComponent('{"format":"sheets-project","version":99}')), /version/);
});

test("HashBin version 3 carries snapshots; versions 1/2 and CID/profile override rules remain intact", async () => {
  const document = parseProjectFile(await fixture());
  for (const profile of [undefined, "org-emacs-v1"]) {
    const doc = { ...document, profile }, serialized = HashBinDocuments.serialize(doc);
    assert.equal(JSON.parse(serialized).version, 3);
    assert.deepEqual(HashBinDocuments.parse(serialized), validateProjectDocument(doc));
    assert.deepEqual(resolveDocument(HashBinDocuments.parse(serialized), { view: "source" }).inputSnapshot, document.inputSnapshot);
    assert.throws(() => resolveDocument(doc, { format: "gfm" }), /Org format/);
    assert.equal(JSON.parse(HashBinDocuments.serialize({ src: doc.src, type: "org", profile })).version, profile ? 2 : 1);
  }
  assert.throws(() => HashBinDocuments.parse('{"format":"sheets-document","version":3,"type":"org","src":"x"}'), /snapshot/);
  assert.throws(() => HashBinDocuments.serialize({ ...document, type: "gfm" }), /org/i);
});

test("missing or altered bundled bytes fail atomically without a network fallback", async () => {
  const doc = parseProjectFile(await fixture()); let requests = 0;
  const options = { profile: doc.profile, fetchSource: () => { requests++; throw Error("Unexpected request"); } };
  const missing = await renderOrgWithInputs(doc.src, { ...options, inputSnapshot: { version: 1, payloads: [] } });
  assert.equal(missing.inputsReady, false); assert.match(missing.diagnostics[0].message, /missing/);
  const changed = structuredClone(doc.inputSnapshot), bytes = decode64(changed.payloads[0].data);
  bytes[bytes.length - 1] ^= 1; changed.payloads[0].data = encode64(bytes);
  await assert.rejects(verifyInputSnapshot(changed, doc.src), /hash/);
  const altered = await renderOrgWithInputs(doc.src, { ...options, inputSnapshot: changed });
  assert.equal(altered.inputsReady, false); assert.match(altered.diagnostics[0].message, /hash/);
  assert.equal(requests, 0);
  const inline = "#+CONSTANTS: rate=2", cid = cidFor(inline);
  const result = await renderOrgWithInputs(`#+SHEETS_INPUT: v1 local ${cid}\n| 0 |\n#+TBLFM: $1=$local.rate*3\n`, { ...options, inputSnapshot: { version: 1, payloads: [] } });
  assert.deepEqual(result.diagnostics, []); assert.match(result.html, />6<\/td>/);
});

test("snapshot structural bounds reject duplicates, noncanonical bytes, versions, profiles and excessive resources", async () => {
  const doc = parseProjectFile(await fixture()), payload = doc.inputSnapshot.payloads[0];
  for (const state of [null, { version: 2, payloads: [] }, { version: 1, payloads: [payload, payload] }, { version: 1, payloads: [{ ...payload, data: payload.data + "=" }] }, { version: 1, payloads: [ { cid: "invalid", data: "" } ] }])
    assert.throws(() => validateInputSnapshot(state, doc.src));
  const large = new Uint8Array(SNAPSHOT_LIMITS.bytes + 1);
  assert.throws(() => snapshotFromPayloads(new Map([[cidFor(large), large]])), /64 KiB/);
  const many = new Map(Array.from({ length: 9 }, (_, i) => { const b = new Uint8Array([i]); return [cidFor(b), b]; }));
  assert.throws(() => snapshotFromPayloads(many), /8 payloads/);
  const aggregate = new Map(Array.from({ length: 5 }, (_, i) => { const b = new Uint8Array(60000).fill(i); return [cidFor(b), b]; }));
  assert.throws(() => snapshotFromPayloads(aggregate), /256 KiB/);
  assert.throws(() => validateInputSnapshot(doc.inputSnapshot, "x".repeat(SNAPSHOT_LIMITS.document)), /5 MiB/);
  assert.throws(() => serializeProjectFile({ ...doc, src: "\n".repeat(3 * 1024 * 1024) }), /JSON exceeds/);
  assert.throws(() => parseProjectFile(" ".repeat(SNAPSHOT_LIMITS.document + 1)), /5 MiB/);
  assert.throws(() => parseProjectFile("not JSON"), /valid JSON/);
  for (const change of [{ version: 9 }, { document: { ...doc, type: "gfm" } }, { document: { src: "x", type: "org", view: "grid" } }, { document: { src: "x", type: "org", profile: "calca-blocks-v1" } }]) {
    const project = JSON.parse(await fixture()); Object.assign(project, change);
    assert.throws(() => parseProjectFile(JSON.stringify(project)));
  }
});

test("portable files become CLI project links without execution, uploads or dependency fetches", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sheets-project-"));
  try {
    const filename = join(directory, "model.sheets.json"); await writeFile(filename, await fixture());
    const result = await linkFromFile(filename), state = readURL(result.url), document = parseProjectFile(await fixture());
    assert.equal(state.src, document.src); assert.equal(state.profile, document.profile); assert.deepEqual(state.inputSnapshot, document.inputSnapshot);
    assert.equal(state.kind, "project"); assert.equal(state.view, "preview");
    assert.equal(readURL((await linkFromFile(filename, { view: "source" })).url).view, "source");
    const ordinary = join(directory, "notes.md"), text = '```json\n{"format":"sheets-project"}\n```\n';
    await writeFile(ordinary, text); assert.equal(readURL((await linkFromFile(ordinary)).url).src, text);
    await writeFile(filename, '{"format":"sheets-project","version":99}');
    await assert.rejects(linkFromFile(filename), /version/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("OAuth snapshots retain project bytes on success and denial; aborted verification cannot finish", async () => {
  const doc = parseProjectFile(await fixture()), map = new Map(), storage = { getItem: (k) => map.get(k), setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) },
    store = new HashBinStore({ clientId: "public", transactionStorage: storage, loadSDK: async () => ({ HashBinClient: class {
      authorize() { return { state: "project-test", url: "https://hashbin.org/authorize" }; }
      handleCallback() {}
    } }) });
  for (const query of ["?state=project-test&code=mock", "?state=project-test&error=access_denied"]) {
    await store.connect(doc); assert.deepEqual((await store.callback(query)).snapshot, doc);
  }
  const controller = new AbortController(); controller.abort();
  await assert.rejects(verifyInputSnapshot(doc.inputSnapshot, doc.src, controller.signal), { name: "AbortError" });
});
