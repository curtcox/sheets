import { test } from "node:test";
import assert from "node:assert/strict";
import { readURL, writeURL, readOverrides } from "../../src/url-state.js";
import { HashBinDocuments as doc, HashBinStore } from "../../src/hashbin.js";
import {
  CALCA_BLOCKS as profile,
  resolveDocument,
} from "../../src/compatibility-profiles.js";
import { buildShareLink } from "../../src/share-links.js";
const base = "https://curtcox.github.io/sheets/index.html",
  src = "```python\nx=4\n```\nx =>";
test("known profiles round-trip in shared URLs, views, Auto and CID overrides", () => {
  for (const format of ["auto", "calca"])
    for (const view of ["source", "split", "preview"]) {
      const link = writeURL(base + "?unrelated=keep", {
        src,
        format,
        view,
        profile,
      });
      assert.deepEqual(readURL(link), {
        src,
        format,
        view,
        profile,
        kind: "source",
      });
      assert.equal(
        new URL(
          buildShareLink(link, { src, format, view, profile }),
        ).searchParams.get("profile"),
        profile,
      );
      assert.equal(new URL(link).searchParams.get("unrelated"), "keep");
    }
  const cidLink = writeURL(base, {
    src,
    format: "calca",
    profile,
    cid: "AAAAAAAA",
  });
  assert.equal(readURL(cidLink).kind, "hashbin");
  assert.deepEqual(readOverrides(cidLink), { format: "calca", profile });
  const old = writeURL(cidLink, { src, format: "calca" });
  assert.ok(!new URL(old).searchParams.has("profile"));
  assert.equal(readURL(old).profile, undefined);
});
test("unknown, empty and mismatched profiles fail explicitly", () => {
  for (const value of ["unknown", "", "calca-reference-v1"]) {
    assert.throws(
      () => readURL(base + "?format=calca&profile=" + value),
      /Unsupported compatibility profile/,
    );
    assert.throws(
      () => writeURL(base, { src, format: "calca", profile: value }),
      /Unsupported compatibility profile/,
    );
  }
  assert.throws(
    () => readURL(base + "?format=gfm&profile=" + profile),
    /requires calca/,
  );
  assert.throws(
    () => doc.serialize({ src, type: "gfm", profile }),
    /requires calca/,
  );
});
test("version-1 saved documents remain legacy; version 2 requires a known matching profile", () => {
  const legacy = doc.serialize({ src, type: "calca", view: "source" });
  assert.equal(JSON.parse(legacy).version, 1);
  assert.equal(doc.parse(legacy).profile, undefined);
  assert.equal(
    doc.parse(JSON.stringify({ ...JSON.parse(legacy), profile })).profile,
    undefined,
  );
  const payload = doc.serialize({
    src,
    type: "calca",
    view: "preview",
    profile,
  });
  assert.equal(JSON.parse(payload).version, 2);
  assert.deepEqual(doc.parse(payload), {
    src,
    type: "calca",
    view: "preview",
    profile,
  });
  for (const extra of [
    { profile: "unknown" },
    { type: "org" },
    { profile: null },
    { version: 3 },
  ])
    assert.throws(
      () => doc.parse(JSON.stringify({ ...JSON.parse(payload), ...extra })),
      /profile|version|requires/,
    );
});
test("saved profiles and explicit format/profile/view overrides have deliberate precedence", () => {
  const saved = { src, type: "calca", view: "preview", profile };
  assert.deepEqual(resolveDocument(saved), {
    src,
    format: "calca",
    view: "preview",
    profile,
  });
  assert.equal(resolveDocument(saved, { format: "calca" }).profile, profile);
  assert.deepEqual(resolveDocument(saved, { format: "gfm", view: "source" }), {
    src,
    format: "gfm",
    view: "source",
  });
  assert.equal(
    resolveDocument({ ...saved, profile: undefined }, { profile }).profile,
    profile,
  );
  assert.throws(
    () => resolveDocument(saved, { format: "gfm", profile }),
    /requires calca/,
  );
});
test("OAuth snapshots retain profiles on successful and declined callbacks", async () => {
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
          return { state: "nonce", url: "https://hashbin.org/authorize" };
        }
        handleCallback() {}
      },
    }),
  });
  const snapshot = {
    src,
    type: "calca",
    format: "calca",
    view: "source",
    profile,
  };
  for (const search of [
    "?state=nonce&code=one-time",
    "?state=nonce&error=access_denied",
  ]) {
    await store.connect(snapshot);
    assert.deepEqual((await store.callback(search)).snapshot, snapshot);
  }
});
