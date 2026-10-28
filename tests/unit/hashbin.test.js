import { test } from "node:test";
import assert from "node:assert/strict";
import { HashBinDocuments as doc, HashBinStore } from "../../src/hashbin.js";
import { formats } from "../../src/url-state.js";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
function fullCID(text) {
  const data = Buffer.from(text),
    size = Buffer.alloc(6);
  size.writeUIntBE(data.length, 0, 6);
  return (
    size.toString("base64url") +
    (data.length <= 64
      ? data
      : createHash("sha512").update(data).digest()
    ).toString("base64url")
  );
}
function memory() {
  const data = new Map();
  return {
    data,
    setItem: (k, v) => data.set(k, v),
    getItem: (k) => data.get(k) ?? null,
    removeItem: (k) => data.delete(k),
  };
}
function inlineCID(text) {
  const data = Buffer.from(text);
  return (
    Buffer.from([0, 0, 0, 0, 0, data.length]).toString("base64url") +
    data.toString("base64url")
  );
}
for (const type of formats)
  test(`HashBin preserves ${type}`, () => {
    const payload = doc.serialize({ src: "a\n😀", type, view: "preview" });
    assert.deepEqual(doc.parse(payload), {
      src: "a\n😀",
      type,
      view: "preview",
    });
  });
test("plain text stays plain, including unrelated JSON", () => {
  for (const text of ["2+2", '{"src":"unrelated"}'])
    assert.deepEqual(doc.parse(text), { src: text, type: null, view: "split" });
});
test("document version and size validation", () => {
  assert.throws(
    () => doc.parse('{"format":"sheets-document","version":2,"src":"hi"}'),
    /version/,
  );
  assert.throws(() => doc.serialize({ src: "x", type: "auto" }), /format/);
  assert.throws(() => doc.parse("x".repeat(doc.MAX_BYTES + 1)), /5 MiB/);
});
test("accepted CID hosts and protocols", () => {
  const cid = inlineCID("hello");
  for (const host of ["hashbin.org", "256t.us", "curtcox.github.io"])
    assert.equal(doc.cid(`https://${host}/sheets/#${cid}`), cid);
  for (const url of [
    `http://hashbin.org/#${cid}`,
    `https://evil.test/#${cid}`,
    "bad",
    "../../etc",
  ])
    assert.equal(doc.cid(url), null);
});
test("CID rejects noncanonical and incorrect length", () => {
  assert.equal(doc.isCID(inlineCID("x")), true);
  assert.equal(doc.isCID("AAAAAAABeB"), false);
  assert.equal(doc.isCID("123"), false);
});
test("inline CIDs load without network or OAuth", async () => {
  const store = new HashBinStore({
    fetchSource: () => {
      throw Error("No fetch expected");
    },
  });
  assert.equal((await store.load(inlineCID("hello"))).src, "hello");
});
test("hosted CID loads verify bytes, report 404, and respect timeouts", async () => {
  const payload = doc.serialize({ src: "test ".repeat(20), type: "org" }),
    cid = fullCID(payload);
  assert.equal(doc.isCID(cid), true);
  const store = new HashBinStore({
    fetchSource: async () => new Response(payload),
  });
  assert.equal((await store.load(cid)).type, "org");
  await assert.rejects(
    new HashBinStore({
      fetchSource: async () => new Response(payload.replace("test", "fake")),
    }).load(cid),
    /does not match its CID/,
  );
  await assert.rejects(
    new HashBinStore({
      fetchSource: async () => new Response("", { status: 404 }),
    }).load(cid),
    /not found/,
  );
  await assert.rejects(
    new HashBinStore({
      fetchSource: () => new Promise(() => {}),
      timeout: 5,
    }).load(cid),
    /timed out/,
  );
});
test("SDK initialization can retry after failure", async () => {
  let attempt = 0;
  const store = new HashBinStore({
    clientId: "public",
    loadSDK: async () => {
      if (++attempt === 1) throw Error("offline");
      return { HashBinClient: class {} };
    },
  });
  await assert.rejects(store.init(), /offline/);
  assert.ok(await store.init());
  assert.equal(attempt, 2);
});
test("saves go through HashBin Publish with the pinned SDK and verify the CID", async () => {
  const snapshot = { src: "2+2", type: "calcfile" },
    payload = doc.serialize(snapshot);
  let options;
  const store = new HashBinStore({
    clientId: "public",
    loadSDK: async () => ({
      HashBinClient: class {
        publish(content, opts) {
          assert.equal(content, payload);
          options = opts;
          return Promise.resolve({ cid: fullCID(payload) });
        }
      },
    }),
  });
  await assert.rejects(store.publish(payload, snapshot), /still loading/);
  await store.init();
  assert.equal((await store.publish(payload, snapshot)).cid, fullCID(payload));
  assert.deepEqual(options, {
    contentType: "application/json",
    clientState: { snapshot },
    fileName: "sheet.json",
  });
  store.client.publish = async () => ({ cid: fullCID(payload + " ") });
  await assert.rejects(store.publish(payload, snapshot), /does not match its CID/);
  store.client.publish = async () => ({ cid: "not-valid" });
  await assert.rejects(store.publish(payload, snapshot), /invalid CID/);
  await assert.rejects(new HashBinStore().init(), /registered client ID/);
  assert.match(
    readFileSync(new URL("../../src/hashbin.js", import.meta.url), "utf8"),
    /hashbin\.org\/sdk\/v0\.3\.0\/hashbin\.js/,
  );
});
test("redirect saves restore the document after approval or cancellation", async () => {
  const transactionStorage = memory(),
    snapshot = { src: "unsaved", type: "calca", view: "split" },
    payload = doc.serialize(snapshot);
  let outcome = "approve";
  const store = new HashBinStore({
    clientId: "public",
    transactionStorage,
    loadSDK: async () => ({
      HashBinClient: class {
        publish() {
          return Promise.resolve({ redirected: true });
        }
        async handlePublishCallback() {
          if (outcome !== "approve")
            throw Object.assign(new Error("access_denied"), {
              clientState: { snapshot },
            });
          return { cid: fullCID(payload), clientState: { snapshot } };
        }
      },
    }),
  });
  await store.init();
  assert.equal(await store.published("#src=abc"), null);
  await store.publish(payload, snapshot);
  assert.deepEqual(await store.published("#hashbin_publish=s&cid=x"), {
    cid: fullCID(payload),
    snapshot,
  });
  await store.publish(payload, snapshot);
  outcome = "cancel";
  assert.deepEqual(
    await store.published("#hashbin_publish=s&error=access_denied"),
    { error: "The save was cancelled on HashBin.", snapshot },
  );
  assert.equal(transactionStorage.data.size, 0);
});
test("tokens left by the earlier OAuth flow are revoked server-side", async () => {
  const storage = memory();
  let loaded = 0,
    revoked = 0;
  const store = new HashBinStore({
    clientId: "public",
    storage,
    loadSDK: async () => {
      loaded++;
      return {
        HashBinClient: class {
          async disconnect() {
            revoked++;
            storage.data.clear();
          }
        },
      };
    },
  });
  assert.equal(await store.retireLegacyTokens(), false);
  assert.equal(loaded, 0);
  storage.setItem("hashbin:tokens:public", '{"refreshToken":"old"}');
  assert.equal(await store.retireLegacyTokens(), true);
  assert.equal(revoked, 1);
});
