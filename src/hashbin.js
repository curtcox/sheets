/** Sheets document persistence and HashBin Publish saves. */
import { validateProfile } from "./compatibility-profiles.js";
import { decode64, cidLength, isCID, verifyCIDBytes } from "./cid.js";
import { validateProjectDocument } from "./project-state.js";
const HashBinDocuments = {
  MAX_BYTES: 5 * 1024 * 1024,
  bytes(value) {
    return new TextEncoder().encode(value);
  },
  decode64,
  cidLength,
  isCID,
  cid(input) {
    const text = input.trim().replace(/^#/, "");
    if (this.isCID(text)) return text;
    try {
      const url = new URL(text);
      if (
        url.protocol !== "https:" ||
        !["hashbin.org", "256t.us", "curtcox.github.io"].includes(url.hostname)
      )
        return null;
      const candidate = url.hash.slice(1) || url.pathname.split("/").pop();
      return this.isCID(candidate) ? candidate : null;
    } catch (_) {
      return null;
    }
  },
  serialize({ src, type, view = "split", profile, inputSnapshot }) {
    if (
      typeof src !== "string" ||
      ![
        "gfm",
        "asciimath",
        "numbat",
        "calcfile",
        "org",
        "calca",
        "hurmet",
        "beancount",
        "quarto",
        "text",
      ].includes(type)
    )
      throw new Error("Choose a format before saving.");
    validateProfile(profile, type);
    const project = inputSnapshot === undefined ? undefined : validateProjectDocument({ src, type, view, profile, inputSnapshot });
    const payload = JSON.stringify({
      format: "sheets-document",
      version: project ? 3 : profile ? 2 : 1,
      type,
      src,
      view,
      ...(profile ? { profile } : {}),
      ...(project ? { inputSnapshot: project.inputSnapshot } : {}),
    });
    if (this.bytes(payload).length > this.MAX_BYTES)
      throw new Error("Source exceeds the 5 MiB HashBin limit.");
    return payload;
  },
  parse(text) {
    if (this.bytes(text).length > this.MAX_BYTES)
      throw new Error("Saved source exceeds the 5 MiB limit.");
    let doc;
    try {
      doc = JSON.parse(text);
    } catch {
      /* Plain source. */
    }
    if (doc?.format !== "sheets-document")
      return { src: text, type: null, view: "split" };
    if (![1, 2, 3].includes(doc.version))
      throw new Error("Unsupported saved document version.");
    if (typeof doc.src !== "string")
      throw new Error("Saved document has no source.");
    if (doc.version === 3) return validateProjectDocument(doc);
    const type = [
      "gfm",
      "asciimath",
      "numbat",
      "calcfile",
      "org",
      "calca",
      "hurmet",
      "beancount",
      "quarto",
      "text",
    ].includes(doc.type)
      ? doc.type
      : null;
    if (doc.version === 2 && (!type || typeof doc.profile !== "string"))
      throw new Error(
        "Saved document version 2 needs a format and compatibility profile.",
      );
    const profile =
      doc.version === 2 ? validateProfile(doc.profile, type) : undefined;
    return {
      src: doc.src,
      type,
      view: ["split", "source", "preview"].includes(doc.view)
        ? doc.view
        : "split",
      ...(profile ? { profile } : {}),
    };
  },
  link(url, cid) {
    if (!this.isCID(cid)) throw new Error("HashBin returned an invalid CID.");
    const link = new URL(url);
    for (const key of [
      "example",
      "raw",
      "compressed",
      "url",
      "modlpos",
      "code",
      "state",
      "error",
      "error_description",
    ])
      link.searchParams.delete(key);
    link.hash = cid;
    return link.href;
  },
};

/** Content servers cannot substitute documents: bytes must match the CID. */
async function verifyCID(cid, bytes) {
  try {
    await verifyCIDBytes(cid, bytes);
  } catch {
    throw new Error("HashBin content does not match its CID.");
  }
}
/** Pinned so a later SDK change cannot reach this app; upgrade deliberately. */
const HASHBIN_SDK_URL = "https://hashbin.org/sdk/v0.2.0/hashbin.js";

/** Saves go through HashBin Publish, so this origin never holds a HashBin credential. */
class HashBinStore {
  constructor({
    clientId,
    redirectUri,
    storage,
    transactionStorage,
    fetchSource = (...args) => fetch(...args),
    loadSDK = () => import(HASHBIN_SDK_URL),
    timeout = 20000,
    timers = globalThis,
  } = {}) {
    Object.assign(this, {
      clientId,
      redirectUri,
      storage,
      transactionStorage,
      fetchSource,
      loadSDK,
      timeout,
      timers,
    });
  }
  async bounded(work) {
    const controller = new AbortController();
    let timer;
    try {
      return await Promise.race([
        Promise.resolve().then(() => work(controller.signal)),
        new Promise((_, reject) => {
          timer = this.timers.setTimeout(() => {
            controller.abort();
            reject(new Error("HashBin request timed out. Try again."));
          }, this.timeout);
        }),
      ]);
    } finally {
      this.timers.clearTimeout(timer);
    }
  }
  async load(cid) {
    if (!HashBinDocuments.isCID(cid))
      throw new Error("Enter a valid HashBin CID or saved link.");
    if (HashBinDocuments.cidLength(cid) > HashBinDocuments.MAX_BYTES)
      throw new Error("Saved source exceeds the 5 MiB limit.");
    return this.bounded(async (signal) => {
      if (HashBinDocuments.cidLength(cid) <= 64)
        return HashBinDocuments.parse(
          new TextDecoder("utf-8", { fatal: true }).decode(
            HashBinDocuments.decode64(cid.slice(8)),
          ),
        );
      const response = await this.fetchSource(`https://256t.us/${cid}`, {
        signal,
      });
      if (!response.ok)
        throw new Error(
          response.status === 404
            ? "Saved source was not found. It may have expired or been deleted."
            : `HashBin load failed (HTTP ${response.status}).`,
        );
      const bytes = new Uint8Array(await response.arrayBuffer());
      await verifyCID(cid, bytes);
      return HashBinDocuments.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      );
    });
  }
  async init() {
    if (this.client) return this.client;
    if (!this.clientId)
      throw new Error("HashBin saving needs a registered client ID.");
    if (!this.initializing)
      this.initializing = this.bounded(async () => {
        const { HashBinClient } = await this.loadSDK();
        this.client = new HashBinClient({
          clientId: this.clientId,
          redirectUri: this.redirectUri,
          baseUrl: "https://hashbin.org",
          contentBaseUrl: "https://256t.us",
          storage: this.storage,
          transactionStorage: this.transactionStorage,
          fetch: this.fetchSource,
        });
        return this.client;
      }).finally(() => {
        this.initializing = null;
      });
    return this.initializing;
  }
  /** Call synchronously from a click after init(), so the approval popup is allowed. A blocked popup redirects. */
  publish(payload, snapshot) {
    if (!this.client)
      return Promise.reject(new Error("HashBin is still loading. Try again."));
    // A redirect cancelled on HashBin comes back without the SDK's clientState; keep a copy to restore.
    const pending = `hashbin:pending-publish:${this.clientId}`;
    if (HashBinDocuments.bytes(payload).length <= 512 * 1024)
      try {
        this.transactionStorage?.setItem(pending, JSON.stringify(snapshot));
      } catch {
        /* Popup saves still work. */
      }
    return this.client
      .publish(payload, {
        contentType: "application/json",
        clientState: { snapshot },
      })
      .then(
        async (result) => {
          if (result.redirected) return result;
          this.transactionStorage?.removeItem(pending);
          if (!HashBinDocuments.isCID(result.cid))
            throw new Error("HashBin returned an invalid CID.");
          await verifyCID(result.cid, HashBinDocuments.bytes(payload));
          return result;
        },
        (error) => {
          this.transactionStorage?.removeItem(pending);
          throw new Error(this.message(error));
        },
      );
  }
  message(error) {
    if (error.message === "access_denied")
      return "The save was cancelled on HashBin.";
    if (error.message === "Publish window closed.")
      return "The HashBin window was closed before the save was approved.";
    return error.message;
  }
  /** Completes a redirect save; the SDK verifies the CID against the stored bytes. Failures return the pending snapshot. */
  async published(hash) {
    if (!new URLSearchParams(hash.replace(/^#/, "")).has("hashbin_publish"))
      return null;
    const key = `hashbin:pending-publish:${this.clientId}`;
    let pending = null;
    try {
      pending = JSON.parse(this.transactionStorage?.getItem(key) || "null");
      this.transactionStorage?.removeItem(key);
    } catch {
      /* Nothing to restore. */
    }
    try {
      const { cid, clientState } = await (
        await this.init()
      ).handlePublishCallback({ hash });
      return { cid, snapshot: clientState?.snapshot };
    } catch (error) {
      return { error: this.message(error), snapshot: pending };
    }
  }
  /** Earlier versions kept OAuth tokens on this shared origin. Revoke them server-side; clearing alone leaves copies valid. */
  async retireLegacyTokens() {
    if (
      !this.clientId ||
      !this.storage?.getItem(`hashbin:tokens:${this.clientId}`)
    )
      return false;
    await this.bounded(async () => (await this.init()).disconnect());
    return true;
  }
}
export { HashBinDocuments, HashBinStore };
