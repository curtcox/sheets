import { createHash } from "node:crypto";

/** A real 256t CID: six-byte length, then the inline bytes (≤64) or their SHA-512. */
export function cidFor(text) {
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

// Stands in for the pinned SDK. localStorage "test-hashbin-publish" chooses approve (popup),
// cancel, redirect (a blocked popup) or redirect-cancel. Saved bytes are served from 256t.us.
const sdk = `export class HashBinClient {
 constructor(options){this.options=options;}
 publish(content,{contentType,clientState}){
  if(contentType!=="application/json")return Promise.reject(new Error("Unexpected content type"));
  const mode=localStorage.getItem("test-hashbin-publish")||"approve";
  globalThis.testHashBinUpload=content;
  if(mode==="cancel")return Promise.reject(new Error("access_denied"));
  if(mode==="redirect-cancel"){sessionStorage.setItem("test-hashbin-state",JSON.stringify(clientState));location.href=this.options.redirectUri+"#hashbin_publish=t&error=access_denied";return Promise.resolve({redirected:true});}
  return window.__hashbinSave(content).then(cid=>{
   if(mode!=="redirect")return {cid};
   sessionStorage.setItem("test-hashbin-state",JSON.stringify(clientState));
   location.href=this.options.redirectUri+"#hashbin_publish=t&cid="+cid;
   return {redirected:true};
  });
 }
 async handlePublishCallback({hash}){
  const params=new URLSearchParams(hash.slice(1)),clientState=JSON.parse(sessionStorage.getItem("test-hashbin-state")||"null");
  sessionStorage.removeItem("test-hashbin-state");
  // Like SDK v0.3.0, errors carry clientState.
  if(params.get("error"))throw Object.assign(new Error(params.get("error")),{clientState});
  return {cid:params.get("cid"),clientState};
 }
 async disconnect(){localStorage.removeItem("hashbin:tokens:"+this.options.clientId);localStorage.setItem("test-hashbin-revoked","yes");}
}`;

export async function mockHashBin(page) {
  const docs = new Map(),
    saves = [];
  const put = (text) => {
    const cid = cidFor(text);
    docs.set(cid, text);
    return cid;
  };
  await page.exposeFunction("__hashbinSave", (text) => {
    const cid = put(text);
    saves.push({ cid, payload: text });
    return cid;
  });
  await page.route("https://hashbin.org/sdk/v0.3.0/hashbin.js", (route) =>
    route.fulfill({ body: sdk, contentType: "text/javascript" }),
  );
  await page.route("https://256t.us/**", (route) => {
    const cid = new URL(route.request().url()).pathname.slice(1);
    return docs.has(cid)
      ? route.fulfill({ body: docs.get(cid), contentType: "application/json" })
      : route.fulfill({ status: 404, body: "missing" });
  });
  return {
    docs,
    saves,
    put,
    get last() {
      return saves.at(-1);
    },
    mode: (value) =>
      page.evaluate((mode) => localStorage.setItem("test-hashbin-publish", mode), value),
  };
}
