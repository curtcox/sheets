import { HashBinDocuments } from "../../hashbin.js";
import { orgDocument, orgParserSource, numericBinding } from "./bindings.js";
import { INPUT_LIMITS } from "./input-declarations.js";

function interrupted(work, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve().then(() => { signal.throwIfAborted(); return work(); }).then((result) => {
      if (signal.aborted) {
        void result?.body?.cancel().catch(() => {});
        reject(signal.reason);
      } else resolve(result);
    }, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

async function payload(cid, fetchSource, signal, budget) {
  const expected = HashBinDocuments.cidLength(cid);
  let bytes;
  if (expected <= 64) bytes = HashBinDocuments.decode64(cid.slice(8));
  else {
    const response = await interrupted(() => fetchSource(`https://256t.us/${cid}`, {
      signal, credentials: "omit", redirect: "error", referrerPolicy: "no-referrer", cache: "no-store",
    }), signal);
    if (!response.ok) throw new Error(`Shared input load failed (HTTP ${response.status}).`);
    if (Number(response.headers.get("content-length")) > INPUT_LIMITS.bytes)
      throw new Error("Shared input exceeds the 64 KiB payload limit.");
    if (!response.body) throw new Error("Shared input response has no readable body.");
    const reader = response.body.getReader(), chunks = [];
    let size = 0, complete = false;
    try {
      for (;;) {
        const { done, value } = await interrupted(() => reader.read(), signal);
        if (done) break;
        size += value.byteLength;
        if (size > INPUT_LIMITS.bytes || size + budget.used > INPUT_LIMITS.aggregate)
          throw new Error("Shared inputs exceed the 64 KiB per-payload or 256 KiB aggregate limit.");
        chunks.push(value);
      }
      complete = true;
      bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    } finally {
      if (!complete) void reader.cancel().catch(() => {});
    }
  }
  if (bytes.byteLength !== expected) throw new Error("Shared input payload length does not match its CID.");
  if (expected > 64) {
    if (!globalThis.crypto?.subtle) throw new Error("Shared-input CID verification requires HTTPS or localhost.");
    const digest = new Uint8Array(await interrupted(() => crypto.subtle.digest("SHA-512", bytes), signal)),
      pinned = HashBinDocuments.decode64(cid.slice(8));
    if (!digest.every((byte, index) => byte === pinned[index]))
      throw new Error("Shared input content does not match its CID hash.");
  }
  budget.used += bytes.byteLength;
  if (budget.used > INPUT_LIMITS.aggregate || budget.root + budget.used > HashBinDocuments.MAX_BYTES)
    throw new Error("Shared inputs exceed the 256 KiB aggregate or 5 MiB source-plus-input limit.");
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function validateInputEntries(entries) {
  if (!Array.isArray(entries) || !entries.length || entries.length > INPUT_LIMITS.constants)
    throw new Error("Shared input must declare between 1 and 128 numeric file constants.");
  const seen = new Set();
  return entries.map(({ name, value, line }) => {
    if (typeof name !== "string" || !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) || seen.has(name) ||
        typeof value !== "string" || value.length > INPUT_LIMITS.valueLength ||
        !Number.isInteger(line) || line < 1 || line > INPUT_LIMITS.bytes)
      throw new Error("Shared input names must be unique ASCII names of at most 64 characters; values are limited to 1,000 characters with a valid defining line.");
    seen.add(name);
    numericBinding(value, name);
    return { name, value, line, valid: true };
  });
}

function constantsFrom(text) {
  const doc = HashBinDocuments.parse(text);
  if (doc.type && doc.type !== "org") throw new Error("Shared input must be an Org document or plain Org source.");
  const diagnostics = [], parsed = orgDocument(orgParserSource(doc.src), diagnostics);
  if (parsed.inputs.length) throw new Error("Nested shared inputs are unsupported; input documents must be self-contained.");
  if (diagnostics.some((d) => d.severity !== "warning") || parsed.constantEntries.some((c) => !c.valid))
    throw new Error("Shared input has invalid numeric constant declarations.");
  return validateInputEntries(parsed.constantEntries);
}

// One render owns all reads and data. No persistent document cache or recursion.
export async function loadOrgInputs(src, { signal, fetchSource = (...args) => fetch(...args), deadline = INPUT_LIMITS.deadline } = {}) {
  signal?.throwIfAborted();
  // Avoid another AST pass for ordinary documents, and reject oversized import
  // sources before parsing them or starting any network work.
  if (!/^\s*#\+SHEETS_INPUT:/im.test(src)) return new Map();
  const rootBytes = new TextEncoder().encode(src).byteLength;
  if (rootBytes > HashBinDocuments.MAX_BYTES) throw new Error("Source plus shared inputs exceeds 5 MiB.");
  const declarations = orgDocument(orgParserSource(src), []).inputs;
  if (!declarations.length) return new Map();
  const failed = (message) => new Map(declarations.filter((d) => d.alias).map((d) => [d.alias, { cid: d.cid, error: message }]));
  if (declarations.some((d) => d.error)) return failed("Shared input declarations are invalid; no inputs were loaded.");
  const controller = new AbortController(),
    combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal,
    timer = setTimeout(() => controller.abort(new Error("Shared inputs timed out after the render loading deadline.")), deadline),
    budget = { used: 0, root: rootBytes },
    contents = new Map(), results = new Map();
  try {
    if (budget.root > HashBinDocuments.MAX_BYTES) throw new Error("Source plus shared inputs exceeds 5 MiB.");
    for (const { alias, cid } of declarations) {
      combined.throwIfAborted();
      if (!contents.has(cid)) contents.set(cid, constantsFrom(await payload(cid, fetchSource, combined, budget)));
      results.set(alias, { cid, entries: contents.get(cid) });
    }
    combined.throwIfAborted();
    return results;
  } catch (error) {
    if (signal?.aborted) throw signal.reason;
    return failed(error.message || "Shared inputs could not be loaded.");
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
