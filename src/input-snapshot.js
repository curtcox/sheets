import { cidLength, isCID, encode64, decode64, verifyCIDBytes } from "./cid.js";

export const SNAPSHOT_LIMITS = Object.freeze({ declarations: 8, bytes: 65536, aggregate: 262144, document: 5 * 1024 * 1024 });
export function validateInputSnapshot(snapshot, src = "") {
  if (!snapshot || snapshot.version !== 1 || !Array.isArray(snapshot.payloads) ||
      snapshot.payloads.length > SNAPSHOT_LIMITS.declarations || Object.keys(snapshot).some((key) => !["version", "payloads"].includes(key)))
    throw new Error("Unsupported or malformed input snapshot; expected version 1 with at most 8 payloads.");
  let total = 0;
  const seen = new Set(), payloads = snapshot.payloads.map((entry) => {
    if (!entry || Object.keys(entry).some((key) => !["cid", "data"].includes(key)) || !isCID(entry.cid) ||
        typeof entry.data !== "string" || !/^[A-Za-z0-9_-]*$/.test(entry.data))
      throw new Error("Snapshot payload needs a canonical CID and base64url data.");
    const length = cidLength(entry.cid);
    if (length > SNAPSHOT_LIMITS.bytes || entry.data.length !== Math.ceil(length * 4 / 3))
      throw new Error("Snapshot payload exceeds 64 KiB or its encoded size does not match its CID.");
    if (seen.has(entry.cid)) throw new Error("Snapshot contains a duplicate CID.");
    seen.add(entry.cid); total += length;
    if (encode64(decode64(entry.data)) !== entry.data) throw new Error("Snapshot data is not canonical base64url.");
    return { cid: entry.cid, data: entry.data };
  });
  if (total > SNAPSHOT_LIMITS.aggregate || new TextEncoder().encode(src).byteLength + total > SNAPSHOT_LIMITS.document)
    throw new Error("Snapshot exceeds 256 KiB of inputs or 5 MiB of source plus inputs.");
  return { version: 1, payloads };
}
export async function verifyInputSnapshot(snapshot, src = "", signal) {
  const checked = validateInputSnapshot(snapshot, src), result = new Map();
  for (const { cid, data } of checked.payloads) {
    signal?.throwIfAborted();
    const bytes = decode64(data);
    await verifyCIDBytes(cid, bytes, signal);
    new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    result.set(cid, bytes);
  }
  signal?.throwIfAborted();
  return result;
}
export function snapshotFromPayloads(payloads, src = "") {
  return validateInputSnapshot({ version: 1, payloads: [...payloads].map(([cid, bytes]) => ({ cid, data: encode64(bytes) })) }, src);
}
