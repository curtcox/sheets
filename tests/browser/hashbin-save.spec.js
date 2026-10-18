import { test, expect } from "@playwright/test";
import { writeURL } from "../../src/url-state.js";
const clientId = "app_8e03e133-83b4-4ee2-b3d5-39397f573879";
const ready = (page) =>
  expect(page.locator("#render-status")).toHaveText(
    /^(?:Ready|\d+ diagnostic)/,
    { timeout: 110000 },
  );
const sdk = `export class HashBinClient {
 constructor(options){this.options=options;}
 getTokens(){return JSON.parse(localStorage.getItem('test-hashbin-tokens')||'null');}
 async authorize({scopes,mode}){
  if(mode!=='manual')throw Error('Expected manual OAuth mode');
  const state=crypto.randomUUID();sessionStorage.setItem('test-hashbin-state',state);
  const url=new URL('/oauth/authorize',this.options.baseUrl);
  for(const [key,value] of Object.entries({client_id:this.options.clientId,redirect_uri:this.options.redirectUri,state,scope:scopes.join(' ')}))url.searchParams.set(key,value);
  return {state,url:url.href};
 }
 async handleCallback({search}){
  const params=new URLSearchParams(search);
  if(params.get('state')!==sessionStorage.getItem('test-hashbin-state')||params.get('code')!=='test-code')throw Error('Invalid mock transaction');
  localStorage.setItem('test-hashbin-tokens',JSON.stringify({accessToken:'test-only',refreshToken:'test-only',expiresAt:Date.now()+3600000}));
  sessionStorage.removeItem('test-hashbin-state');
 }
 async authorizedFetch(path,options={}){if(path==='/api/content')globalThis.testHashBinUpload=await options.body.get('content').text();return fetch(this.options.baseUrl+path,{...options,headers:{...options.headers,Authorization:'Bearer test-only'}});}
 clearTokens(){localStorage.removeItem('test-hashbin-tokens');}
}`;

test("HashBin connect restores the document, requotes edits, and saves a reloadable source link only after confirmation", async ({
  page,
}) => {
  const cid =
    Buffer.from([0, 0, 0, 0, 0, 65]).toString("base64url") +
    "a".repeat(85) +
    "A";
  let quotes = 0,
    saves = 0,
    savedPayload;
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("https://hashbin.org/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.pathname === "/sdk/hashbin.js")
      return route.fulfill({
        contentType: "application/javascript",
        body: sdk,
      });
    if (url.pathname === "/oauth/authorize") {
      expect(url.searchParams.get("client_id")).toBe(clientId);
      expect(url.searchParams.get("scope")).toBe("content:write balance:read");
      const callback = new URL(url.searchParams.get("redirect_uri"));
      expect(callback.pathname).toBe("/index.html");
      expect(callback.search).toBe("");
      expect(callback.hash).toBe("");
      callback.searchParams.set("code", "test-code");
      callback.searchParams.set("state", url.searchParams.get("state"));
      return route.fulfill({
        contentType: "text/html",
        body: `<script>location.replace(${JSON.stringify(callback.href)})</script>`,
      });
    }
    if (url.pathname === "/api/account/settings")
      return route.fulfill({ json: { default_retention_months: 3 } });
    if (url.pathname === "/api/balance")
      return route.fulfill({ json: { balance_cents: 100 } });
    if (url.pathname === "/api/payments/calculate") {
      quotes++;
      const quote = request.postDataJSON();
      expect(quote.retention_months).toBe(3);
      expect(quote.size_bytes).toBeGreaterThan(64);
      return route.fulfill({ json: { cost_cents: 1 } });
    }
    if (url.pathname === "/api/content") {
      saves++;
      expect(request.method()).toBe("POST");
      expect(request.headers()["content-type"]).toContain(
        "multipart/form-data",
      );
      // WebKit's request protocol omits multipart file bytes. Inspect the actual
      // FormData Blob recorded by the controlled SDK before transport instead.
      savedPayload = await page.evaluate(() => globalThis.testHashBinUpload);
      return route.fulfill({ json: { cid, url: "https://256t.us/" + cid } });
    }
    throw new Error("Unexpected HashBin request: " + url.pathname);
  });
  await page.route("https://256t.us/" + cid, (route) =>
    route.fulfill({ body: savedPayload, contentType: "application/json" }),
  );
  const original = "# OAuth source 日本語\n\n2+2 =>";
  await page.goto(
    writeURL("http://127.0.0.1:4173/", {
      src: original,
      format: "calca",
      view: "preview",
    }),
  );
  await ready(page);
  await page.locator("#hashbin-open").click();
  await expect(page.locator("#hashbin-save")).toBeEnabled();
  await page.locator("#hashbin-save").click();
  await expect(page.locator("#hashbin-confirm")).toHaveText(
    "Connect to HashBin",
  );
  expect(saves).toBe(0);
  expect(quotes).toBe(0);
  await page.locator("#hashbin-confirm").click();
  await page.waitForFunction(() =>
    Boolean(localStorage.getItem("test-hashbin-tokens")),
  );
  await ready(page);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(
    original,
  );
  await expect(page.locator("#format")).toHaveValue("calca");
  await expect(page.locator("#source-pane")).toBeHidden();
  expect(new URL(page.url()).searchParams.has("code")).toBe(false);
  expect(new URL(page.url()).searchParams.has("state")).toBe(false);
  await page.locator("#hashbin-open").click();
  await page.locator("#hashbin-save").click();
  await expect(page.locator("#hashbin-message")).toContainText(
    "Cost: $0.01 · Balance: $1.00",
  );
  expect(saves).toBe(0);
  const edited = "# Updated source 日本語\n\n3+4 =>";
  await page.evaluate(
    (source) => ace.edit("editor").setValue(source, -1),
    edited,
  );
  await ready(page);
  await page.locator("#hashbin-confirm").click();
  await expect.poll(() => quotes).toBe(2);
  expect(saves).toBe(0);
  await expect(page.locator("#hashbin-confirm")).toBeEnabled();
  await page.locator("#hashbin-confirm").click();
  await expect(page.locator("#hashbin-status")).toHaveText("Saved to HashBin.");
  expect(saves).toBe(1);
  expect(JSON.parse(savedPayload)).toEqual({
    format: "sheets-document",
    version: 1,
    type: "calca",
    src: edited,
    view: "preview",
  });
  expect(new URL(page.url()).hash).toBe("#" + cid);
  expect(new URL(page.url()).searchParams.has("compressed")).toBe(false);
  await page.reload();
  await ready(page);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(edited);
  await expect(page.locator("#format")).toHaveValue("calca");
  await expect(page.locator("#source-pane")).toBeHidden();
  await expect(page.locator("#preview")).toContainText("3+4 => 7");
  expect(saves).toBe(1);
  expect(errors).toEqual([]);
});
