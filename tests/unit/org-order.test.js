import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { recalculateOrg } from "../../src/formats/org/engine.js";
import { renderOrg } from "../../src/formats/org/index.js";
import {
  ORG_EMACS as profile,
  resolveDocument,
} from "../../src/compatibility-profiles.js";
import { readURL, writeURL } from "../../src/url-state.js";
import { HashBinDocuments, HashBinStore } from "../../src/hashbin.js";
import { buildShareLink } from "../../src/share-links.js";
const file = (name) =>
  readFile(new URL(`../fixtures/org/${name}`, import.meta.url), "utf8");
const rows = (result) => result.tables.flatMap((t) => t.table.rows);
const options = { profile };

test("Emacs-order calculations and document-order remote reads match native reference documents", async () => {
  const reference = JSON.parse(await file("reference.json"));
  for (const [name, expected] of Object.entries(reference)) {
    const result = recalculateOrg(await file(name), options);
    assert.deepEqual(result.diagnostics, [], name);
    assert.deepEqual(rows(result), expected, name);
    if (!/^(order-|remote-)/.test(name))
      assert.deepEqual(
        rows(recalculateOrg(await file(name))),
        expected,
        `Legacy ${name}`,
      );
  }
});

test("Duplicate column, cell, boundary and named-field targets are rejected before writes, matching Emacs", async () => {
  const rejected = JSON.parse(await file("rejections.json"));
  for (const [name, expected] of Object.entries(rejected)) {
    assert.equal(expected.type, "user-error");
    const result = recalculateOrg(await file("rejected/" + name), options);
    assert.equal(result.diagnostics.length, 1, name);
    assert.match(
      result.diagnostics[0].message,
      /Duplicate formula target/,
      name,
    );
    assert.deepEqual(rows(result), expected.rows, name);
  }
});

test("Legacy source order and multiple formula lines remain stable; migration is explicit", () => {
  const source = "| 1 | 0 | 0 |\n#+TBLFM: $3=$2+1::$2=$1+10\n";
  assert.deepEqual(rows(recalculateOrg(source)), [["1", "11", "1"]]);
  assert.deepEqual(rows(recalculateOrg(source, options)), [["1", "11", "12"]]);
  const multiple = "| 1 | 0 |\n#+TBLFM: $2=3\n#+TBLFM: $2=8\n";
  assert.deepEqual(rows(recalculateOrg(multiple)), [["1", "8"]]);
  assert.deepEqual(rows(recalculateOrg(multiple, options)), [["1", "3"]]);
  assert.ok(renderOrg(source, options).html.includes("<td>12</td>"));
});

test("Remote names and current table state are isolated between renders, including cycles and literal blocks", () => {
  const cycle =
    "#+NAME: a\n| 1 |\n#+TBLFM: $1=remote(b,@1$1)+1\n\n#+NAME: b\n| 2 |\n#+TBLFM: $1=remote(a,@1$1)+1\n";
  assert.deepEqual(rows(recalculateOrg(cycle, options)), [["3"], ["4"]]);
  assert.deepEqual(rows(recalculateOrg(cycle, options)), [["3"], ["4"]]);
  const literal =
    "#+BEGIN_SRC org\n#+NAME: hidden\n| 99 |\n#+END_SRC\n\n| 7 |\n#+TBLFM: $1=remote(hidden,@1$1)\n";
  const result = recalculateOrg(literal, options);
  assert.equal(result.diagnostics[0].line, 7);
  assert.match(
    result.diagnostics[0].message,
    /Cannot find same-document remote table hidden/,
  );
  assert.deepEqual(rows(result), [["7"]]);
  const heading = recalculateOrg(
    "#+NAME: lost\n* Section\n| 7 |\n#+TBLFM: $1=remote(lost,@1$1)",
    options,
  );
  assert.match(heading.diagnostics[0].message, /Cannot find/);
  const duplicate = recalculateOrg(
    "#+NAME: lost\n* Section\n#+NAME: lost\n| 7 |\n#+TBLFM: $1=remote(lost,@1$1)",
    options,
  );
  assert.match(duplicate.diagnostics[0].message, /Cannot find/);
});

test("Missing, relative, dynamic and oversized remote references retain cells and report original formula lines", () => {
  for (const expression of [
    "remote(missing,@1$1)",
    "remote(data,@-1$1)",
    "remote($1,@1$1)",
    "vsum(remote(data,@1$1..@999999999$1))",
    "remote(data,@1$missing)",
  ]) {
    const result = recalculateOrg(
      `#+NAME: data\n| 3 |\n\n| 77 |\n#+TBLFM: $1=${expression}\n`,
      options,
    );
    assert.equal(result.diagnostics.length, 1, expression);
    assert.equal(result.diagnostics[0].line, 5, expression);
    assert.equal(result.tables[1].table.rows[0][0], "77", expression);
  }
  // Org substitutes remote references before Calc sees quotes; strings are
  // not Calc numbers, so the cell is retained with a diagnostic.
  const quotes = recalculateOrg(
    '| 0 |\n#+TBLFM: $1="remote(missing,@1$1)"',
    options,
  );
  assert.equal(quotes.diagnostics.length, 1);
  assert.equal(rows(quotes)[0][0], "0");
});

test("Emacs mode and exact source persist through URL/share/HashBin overrides and OAuth snapshots", async () => {
  const src = "| 1 | 0 | 0 |\n#+TBLFM: $3=$2+1::$2=$1+10\n",
    base = "https://curtcox.github.io/sheets/index.html";
  for (const format of ["auto", "org"])
    for (const view of ["source", "split", "preview"]) {
      const state = { src, format, view, profile },
        url = writeURL(base, state);
      assert.deepEqual(readURL(url), { ...state, kind: "source" });
      assert.equal(
        new URL(buildShareLink(url, state)).searchParams.get("profile"),
        profile,
      );
    }
  const saved = HashBinDocuments.parse(
    HashBinDocuments.serialize({ src, type: "org", profile }),
  );
  assert.equal(saved.profile, profile);
  assert.equal(resolveDocument(saved).profile, profile);
  assert.equal(resolveDocument(saved, { format: "gfm" }).profile, undefined);
  assert.equal(
    resolveDocument(saved, { profile: undefined }).profile,
    undefined,
  );
  assert.equal(
    HashBinDocuments.parse(HashBinDocuments.serialize({ src, type: "org" }))
      .profile,
    undefined,
  );
  assert.throws(
    () => writeURL(base, { src, format: "calca", profile }),
    /requires org/,
  );
  const data = new Map(),
    storage = {
      setItem: (k, v) => data.set(k, v),
      getItem: (k) => data.get(k),
      removeItem: (k) => data.delete(k),
    };
  const store = new HashBinStore({
    clientId: "public",
    transactionStorage: storage,
    loadSDK: async () => ({
      HashBinClient: class {
        authorize() {
          return { state: "org-test", url: "https://hashbin.org/authorize" };
        }
        handleCallback() {}
      },
    }),
  });
  const snapshot = { src, type: "org", format: "org", view: "source", profile };
  for (const query of [
    "?state=org-test&code=mock",
    "?state=org-test&error=access_denied",
  ]) {
    await store.connect(snapshot);
    assert.deepEqual((await store.callback(query)).snapshot, snapshot);
  }
});
