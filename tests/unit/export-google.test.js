import { test } from "node:test";
import assert from "node:assert/strict";
import {
  uploadGoogleDoc,
  GOOGLE_SCOPE,
} from "../../src/exports/google-docs.js";
test("Drive conversion uses multipart/related with native document metadata and original binary bytes", async () => {
  let calls = 0;
  const href = await uploadGoogleDoc(
    new Blob(["PK example binary"]),
    "Report",
    "private-token",
    {
      fetchSource: async (url, request) => {
        calls++;
        assert.match(url, /uploadType=multipart/);
        assert.equal(request.headers.Authorization, "Bearer private-token");
        assert.match(
          request.headers["Content-Type"],
          /^multipart\/related; boundary=sheets-/,
        );
        const data = await request.body.text();
        assert.match(
          data,
          /"mimeType":"application\/vnd.google-apps.document"/,
        );
        assert.match(data, /PK example binary/);
        assert.match(data, /"name":"Report"/);
        return { ok: true, json: async () => ({ id: "verified-doc" }) };
      },
    },
  );
  assert.equal(calls, 1);
  assert.equal(href, "https://docs.google.com/document/d/verified-doc/edit");
  assert.match(GOOGLE_SCOPE, /drive.file$/);
});
test("Drive upload fails without automatic duplicate-producing retries", async () => {
  let calls = 0;
  await assert.rejects(
    uploadGoogleDoc(new Blob(["doc"]), "Report", "token", {
      fetchSource: async () => {
        calls++;
        return { ok: false, status: 503 };
      },
    }),
    /Check Drive before retrying/,
  );
  assert.equal(calls, 1);
});
