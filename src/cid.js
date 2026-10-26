export const decode64 = (value) => Uint8Array.from(
  atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0),
);
export function encode64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
export const cidLength = (cid) => decode64(cid.slice(0, 8)).reduce((n, b) => n * 256 + b, 0);
export function isCID(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{8,94}$/.test(value)) return false;
  const length = cidLength(value);
  return value.length === 8 + (length <= 64 ? Math.ceil(length * 4 / 3) : 86) &&
    encode64(decode64(value.slice(8))) === value.slice(8);
}
export async function verifyCIDBytes(cid, bytes, signal) {
  signal?.throwIfAborted();
  if (!isCID(cid) || bytes.byteLength !== cidLength(cid))
    throw new Error("Shared input payload length does not match its CID.");
  if (bytes.byteLength <= 64) {
    const literal = decode64(cid.slice(8));
    if (!bytes.every((byte, index) => byte === literal[index])) throw new Error("Shared input content does not match its inline CID.");
  } else {
    if (!globalThis.crypto?.subtle) throw new Error("Shared-input CID verification requires HTTPS or localhost.");
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-512", bytes)), pinned = decode64(cid.slice(8));
    signal?.throwIfAborted();
    if (!digest.every((byte, index) => byte === pinned[index])) throw new Error("Shared input content does not match its CID hash.");
  }
}
