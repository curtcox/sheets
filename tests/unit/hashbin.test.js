import { test } from "node:test";
import assert from "node:assert/strict";
import { HashBinDocuments as doc, HashBinStore } from "../../src/hashbin.js";
import { formats } from "../../src/url-state.js";
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
test("hosted CID loads, reports 404, and respects timeouts", async () => {
  const cid =
    Buffer.from([0, 0, 0, 0, 0, 65]).toString("base64url") +
    "a".repeat(85) +
    "A";
  assert.equal(doc.isCID(cid), true);
  const store = new HashBinStore({
    fetchSource: async () =>
      new Response(doc.serialize({ src: "test", type: "org" })),
  });
  assert.equal((await store.load(cid)).type, "org");
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
test("OAuth returns source and validates transaction state", async () => {
  const data = new Map(),
    storage = {
      setItem: (k, v) => data.set(k, v),
      getItem: (k) => data.get(k),
      removeItem: (k) => data.delete(k),
    };
  const sdk = {
    HashBinClient: class {
      authorize() {
        return { state: "nonce", url: "https://hashbin.org/authorize" };
      }
      handleCallback() {
        this.connected = true;
      }
    },
  };
  const store = new HashBinStore({
    clientId: "public",
    transactionStorage: storage,
    loadSDK: async () => sdk,
  });
  assert.equal(
    await store.connect({ src: "unsaved", type: "calca" }),
    "https://hashbin.org/authorize",
  );
  const callback = await store.callback("?state=nonce&code=one-time");
  assert.equal(callback.snapshot.src, "unsaved");
  assert.equal(callback.connected, true);
  assert.match(
    (await store.callback("?state=nonce&code=replay")).error,
    /could not be restored/,
  );
});
test("saves validate returned CID and preserve sheets payload", async () => {
  let submitted;
  const store = new HashBinStore({});
  store.oauth = {
    getTokens: () => ({ refreshToken: "test", expiresAt: Date.now() + 100000 }),
    authorizedFetch: async (path, options) => {
      submitted = await options.body.get("content").text();
      return new Response(JSON.stringify({ cid: inlineCID("saved") }));
    },
  };
  await store.save(doc.serialize({ src: "2+2", type: "calcfile" }));
  assert.equal(JSON.parse(submitted).format, "sheets-document");
  store.oauth.authorizedFetch = async () => new Response('{"cid":"not-valid"}');
  await assert.rejects(store.save("{}"), /invalid CID/);
});
test("refresh retry and quote failure are surfaced", async () => {
  let count = 0,
    refresh = 0;
  const store = new HashBinStore({});
  store.oauth = {
    getTokens: () => ({ refreshToken: "t", expiresAt: Date.now() + 100000 }),
    refreshAccessToken: () => refresh++,
    authorizedFetch: async () =>
      new Response("", { status: ++count === 1 ? 401 : 200 }),
  };
  assert.equal((await store.authed("/api/content")).status, 200);
  assert.equal(refresh, 1);
  store.oauth.authorizedFetch = async () =>
    new Response('{"default_retention_months":-1,"balance_cents":10}');
  await assert.rejects(store.quote("x"), /invalid price/);
});
