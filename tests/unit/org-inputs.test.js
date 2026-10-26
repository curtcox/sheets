import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadOrgInputs } from "../../src/formats/org/inputs.js";
import { INPUT_LIMITS } from "../../src/formats/org/input-declarations.js";
import { recalculateOrg } from "../../src/formats/org/engine.js";
import { renderOrg, renderOrgWithInputs } from "../../src/formats/org/index.js";
import { orgDocument } from "../../src/formats/org/bindings.js";
import { HashBinDocuments } from "../../src/hashbin.js";
import { readURL, writeURL } from "../../src/url-state.js";
import { detect } from "../../src/formats/registry.js";
import { createHash } from "node:crypto";

function cidFor(text) {
  const bytes = Buffer.from(text), length = Buffer.alloc(6);
  length.writeUIntBE(bytes.length, 0, 6);
  return length.toString("base64url") + (bytes.length <= 64 ? bytes : createHash("sha512").update(bytes).digest()).toString("base64url");
}
const declaration = (alias, cid) => `#+SHEETS_INPUT: v1 ${alias} ${cid}\n`;
const fixture = () => readFile(new URL("../fixtures/org-inputs/assumptions.org", import.meta.url), "utf8");
const failed = (inputs) => [...inputs.values()].map((value) => value.error).join(" ");

test("pinned numeric inputs match the independent local Emacs equivalent in both modes without running dependency formulas", async () => {
  const text = await fixture(), cid = cidFor(text),
    local = await readFile(new URL("../fixtures/org/shared-inputs-equivalent.org", import.meta.url), "utf8"),
    reference = JSON.parse(await readFile(new URL("../fixtures/org/reference.json", import.meta.url), "utf8"));
  let requests = 0;
  const src = declaration("prices", cid) + local.replace(/^#\+CONSTANTS:.*\n/m, "").replaceAll(/\$(price|users|tax|exact|duplicate)\b/g, "$prices.$1");
  for (const profile of [undefined, "org-emacs-v1"]) {
    const inputs = await loadOrgInputs(src, { fetchSource: async (url, options) => {
      requests++;
      assert.equal(url, "https://256t.us/" + cid);
      assert.equal(options.credentials, "omit");
      assert.equal(options.referrerPolicy, "no-referrer");
      assert.equal(options.redirect, "error");
      return new Response(text);
    } });
    assert.equal(failed(inputs), "");
    assert.equal(inputs.get("prices").entries.find((e) => e.name === "price").value, "0.03");
    assert.equal(inputs.get("prices").entries.find((e) => e.name === "duplicate").line, 3);
    assert.ok(!inputs.get("prices").entries.some((e) => e.name === "hidden"));
    const result = recalculateOrg(src, { inputs, profile });
    assert.deepEqual(result.diagnostics, []);
    assert.deepEqual(result.tables.flatMap((t) => t.table.rows), reference["shared-inputs-equivalent.org"]);
    assert.ok(result.source.includes("$prices.price"));
    const rendered = renderOrg(src, { inputs, profile });
    assert.match(rendered.html, /Shared inputs/);
    assert.match(rendered.html, /123456789012345678901234567890/);
    assert.match(rendered.html, /Dependency formulas are not executed/);
  }
  assert.equal(requests, 2);
});

test("inline CIDs work without network; saved versions parse and duplicate CIDs load once per render", async () => {
  const plain = "#+CONSTANTS: price=0.03", cid = cidFor(plain);
  assert.equal(detect(declaration("prices", cid)), "org");
  const result = await renderOrgWithInputs(declaration("prices", cid) + "| 100 | 0 |\n#+TBLFM: $2=$1*$prices.price;%.2f\n", {
    fetchSource: () => { throw new Error("No inline network"); },
  });
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, />3\.00<\/td>/);
  for (const profile of [undefined, "org-emacs-v1"]) {
    const payload = HashBinDocuments.serialize({ src: plain, type: "org", profile }), savedCID = cidFor(payload);
    let requests = 0;
    const source = declaration("a", savedCID) + declaration("b", savedCID);
    const loaded = await loadOrgInputs(source, { fetchSource: async () => { requests++; return new Response(payload); } });
    assert.equal(requests, 1);
    assert.equal(loaded.get("a").entries[0].value, "0.03");
    assert.equal(loaded.get("b").entries[0].value, "0.03");
  }
});

test("namespace references do not fall back to local bindings or accept imported ranges", async () => {
  const cid = cidFor("#+CONSTANTS: price=0.03"), header = declaration("prices", cid),
    inputs = await loadOrgInputs(header),
    src = header + "#+CONSTANTS: prices=7 price=9\n| 99 | 88 | 77 | 66 |\n#+TBLFM: $1=$prices.price*100::$2=$price::$3=$prices.missing::$4=$Prices.price\n";
  for (const profile of [undefined, "org-emacs-v1"]) {
    const result = recalculateOrg(src, { inputs, profile });
    assert.deepEqual(result.tables[0].table.rows[0], ["3.", "9", "77", "66"]);
    assert.match(result.diagnostics[0].message, /no constant missing/);
    assert.match(result.diagnostics[1].message, /Prices is unavailable/);
    const wrongCID = new Map([["prices", { cid: cidFor("#+CONSTANTS: price=4"), entries: inputs.get("prices").entries }]]);
    assert.match(recalculateOrg(src, { inputs: wrongCID, profile }).diagnostics[0].message, /this CID/);
    const range = recalculateOrg(header + "| 99 |\n#+TBLFM: $1=vsum($prices.price..$prices.price)\n", { inputs, profile });
    assert.equal(range.tables[0].table.rows[0][0], "99");
    assert.match(range.diagnostics[0].message, /scalar/);
  }
});

test("invalid declarations, duplicate aliases and nested imports cause no recursive or arbitrary requests", async () => {
  const cid = cidFor("#+CONSTANTS: price=1");
  for (const src of [
    `#+SHEETS_INPUT: v2 prices ${cid}\n`, `#+SHEETS_INPUT: v1 prices https://evil.test/x\n`,
    declaration("prices", cid) + declaration("prices", cid),
    Array.from({ length: 9 }, (_, i) => declaration("a" + i, cid)).join(""),
    declaration("a", cidFor("x".repeat(INPUT_LIMITS.bytes + 1))),
  ]) {
    let requests = 0;
    await loadOrgInputs(src, { fetchSource: () => { requests++; throw new Error("Must not fetch invalid declarations"); } });
    assert.equal(requests, 0);
    assert.ok(recalculateOrg(src).diagnostics.length);
  }
  for (const kind of ["SRC org", "EXAMPLE", "EXPORT html", "COMMENT"]) {
    const literal = `#+BEGIN_${kind}\n${declaration("prices", cid)}#+END_${kind.split(" ")[0]}\n`;
    assert.equal((await loadOrgInputs(literal)).size, 0);
  }
  const text = declaration("child", cid) + "#+CONSTANTS: price=1\n", root = declaration("prices", cidFor(text));
  let requests = 0;
  assert.match(failed(await loadOrgInputs(root, { fetchSource: async () => { requests++; return new Response(text); } })), /Nested/);
  assert.equal(requests, 1);
});

test("invalid payloads reject all imported values and preserve ordinary local calculation", async () => {
  const valid = "#+CONSTANTS: price=1", goodCID = cidFor(valid);
  for (const text of [
    "#+CONSTANTS: price=oops", "#+CONSTANTS: price=1 broken", "#+CONSTANTS: price=1e1000001",
    "#+CONSTANTS: price=" + "1".repeat(1001), "No constants here",
    "#+CONSTANTS: " + Array.from({ length: 129 }, (_, i) => `a${i}=1`).join(" "),
    HashBinDocuments.serialize({ src: "#+CONSTANTS: price=1", type: "gfm" }),
    '{"format":"sheets-document","version":99,"src":"x"}',
  ]) {
    const cid = cidFor(text), src = declaration("good", goodCID) + declaration("bad", cid) + "| 99 | 0 |\n#+TBLFM: $1=$good.price::$2=3+4\n",
      inputs = await loadOrgInputs(src, { fetchSource: async () => new Response(text) });
    assert.ok(failed(inputs), text.slice(0, 70));
    const result = recalculateOrg(src, { inputs });
    assert.deepEqual(result.tables[0].table.rows, [["99", "7"]]);
    assert.equal(result.sharedInputs.some((e) => e.entries), false);
  }
});

test("stream bounds, declared lengths, invalid UTF-8 and aggregate payload size fail closed", async () => {
  const root = declaration("prices", cidFor("x".repeat(70)));
  let cancelled = false;
  const oversized = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(INPUT_LIMITS.bytes + 1)); }, cancel() { cancelled = true; } });
  assert.match(failed(await loadOrgInputs(root, { fetchSource: async () => new Response(oversized) })), /limit/);
  assert.equal(cancelled, true);
  assert.match(failed(await loadOrgInputs(root, { fetchSource: async () => new Response("short") })), /length/);
  assert.match(failed(await loadOrgInputs(root, { fetchSource: async () => new Response("y".repeat(70)) })), /hash/);
  assert.match(failed(await loadOrgInputs(declaration("prices", cidFor("x")), { fetchSource: () => { throw Error("inline"); } })), /constants/);
  const invalid = new Uint8Array(70).fill(255);
  assert.ok(failed(await loadOrgInputs(declaration("prices", cidFor(invalid)), { fetchSource: async () => new Response(invalid) })));
  for (const status of [404, 503])
    assert.match(failed(await loadOrgInputs(root, { fetchSource: async () => new Response("", { status }) })), new RegExp(String(status)));
  const large = "#+CONSTANTS: price=1\n#+COMMENT: " + "x".repeat(55000),
    payloads = new Map(Array.from({ length: 5 }, (_, i) => [cidFor(large + i), large + i])),
    source = [...payloads.keys()].map((cid, i) => declaration("a" + i, cid)).join("");
  assert.match(failed(await loadOrgInputs(source, { fetchSource: async (url) => new Response(payloads.get(url.split("/").at(-1))) })), /aggregate/);
  const hugeRoot = root + "x".repeat(HashBinDocuments.MAX_BYTES);
  await assert.rejects(loadOrgInputs(hugeRoot, { fetchSource: () => { throw Error("no request"); } }), /5 MiB/);
});

test("cancellation and a single loading deadline abort fetches and stalled streams without later applying values", async () => {
  const root = declaration("prices", cidFor("x".repeat(70))), controller = new AbortController();
  let requestSignal, release;
  const pending = loadOrgInputs(root, { signal: controller.signal, fetchSource: (_url, options) => { requestSignal = options.signal; return new Promise((resolve) => { release = resolve; }); } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(requestSignal.aborted, true);
  release(new Response("#+CONSTANTS: price=4"));
  const timed = await loadOrgInputs(root, { deadline: 5, fetchSource: () => new Promise(() => {}) });
  assert.match(failed(timed), /timed out/);
  let cancelled = false;
  const stalled = new ReadableStream({ cancel() { cancelled = true; } });
  assert.match(failed(await loadOrgInputs(root, { deadline: 5, fetchSource: async () => new Response(stalled) })), /timed out/);
  assert.equal(cancelled, true);
  const early = new AbortController(); early.abort();
  await assert.rejects(loadOrgInputs(root, { signal: early.signal, fetchSource: () => { throw Error("no late request"); } }), { name: "AbortError" });
});

test("versioned input declarations remain exact in shared and saved source, including literal ownership and BOM/CRLF", async () => {
  const cid = cidFor("#+CONSTANTS: price=0.03"), src = "\uFEFF" + (declaration("prices", cid) + "| 0 |\n#+TBLFM: $1=$prices.price*100\n").replaceAll("\n", "\r\n");
  for (const profile of [undefined, "org-emacs-v1"]) {
    const state = readURL(writeURL("https://example.com/", { src, format: "org", profile })),
      saved = HashBinDocuments.parse(HashBinDocuments.serialize({ src, type: "org", profile }));
    assert.equal(state.src, src); assert.equal(saved.src, src);
    const result = await renderOrgWithInputs(saved.src, { profile });
    assert.deepEqual(result.diagnostics, []);
    assert.match(result.html, /Defined on/);
    assert.ok(result.recalculatedSource.includes("SHEETS_INPUT: v1 prices " + cid));
  }
  assert.equal(orgDocument("#+SHEETS_INPUT: v1 prices https://evil.test/", []).inputs[0].error.includes("bare"), true);
});
