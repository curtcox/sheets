import { test } from "node:test";
import assert from "node:assert/strict";
import { ShareClient, buildShareLink } from "../../src/share-links.js";
import { readURL } from "../../src/url-state.js";
import { conformance } from "../../scripts/conformance.mjs";
import { readFile } from "node:fs/promises";
test("GFM conformance baseline is reproducible", async () =>
  assert.deepEqual(
    await conformance(),
    JSON.parse(
      await readFile(
        new URL("../fixtures/gfm-conformance.json", import.meta.url),
        "utf8",
      ),
    ),
  ));
test("share link includes complete source, manual format and view", () =>
  assert.equal(
    readURL(
      buildShareLink("https://example.com/", {
        src: "hello",
        format: "org",
        view: "source",
      }),
    ).format,
    "org",
  ));
test("shortener validates links and falls back for errors, timeout, offline, cancellation", async () => {
  const links = {
    long: "https://example.com/?source=hi",
    fallback: "https://example.com/?compressed=hi",
  };
  let client = new ShareClient({
    fetchLink: async () =>
      new Response(JSON.stringify({ contents: "https://is.gd/Abc123" })),
  });
  assert.equal((await client.shorten(links)).shortened, true);
  for (const contents of [
    "https://evil.test/link",
    "javascript:alert(1)",
    "https://is.gd/link?bad=1",
    "Error: Rate limit exceeded",
  ]) {
    client = new ShareClient({
      fetchLink: async () => new Response(JSON.stringify({ contents })),
    });
    const result = await client.shorten(links);
    assert.equal(result.shortened, false);
    assert.equal(result.url, links.fallback);
    assert.ok(result.error);
  }
  client = new ShareClient({ isOnline: () => false });
  assert.equal((await client.shorten(links)).error.code, "offline");
  client = new ShareClient({
    fetchLink: () => new Promise(() => {}),
    timeout: 5,
  });
  assert.equal((await client.shorten(links)).error.code, "timeout");
  client = new ShareClient({
    fetchLink: () => new Promise(() => {}),
    timeout: 100,
  });
  const pending = client.shorten(links);
  client.cancel();
  assert.equal(await pending, null);
});
