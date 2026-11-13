import { encode64, decode64, isCID, cidLength, verifyCIDBytes } from './cid.js';
import { computeCID, cid } from '../vendor/fragment-kit-v0.4.3/src/core/cid.js';
import { readResponse } from '../vendor/fragment-kit-v0.4.3/src/core/bytes.js';
export const ATTACHMENT_LIMITS = Object.freeze({ count: 8, bytes: 256 * 1024, total: 512 * 1024, pixels: 16_000_000 });
export function imageMime(bytes) {
  if (bytes[0] === 137 && String.fromCharCode(...bytes.slice(1,8)) === 'PNG\r\n\x1a\n') return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP') return 'image/webp';
  throw Error('Choose a PNG, JPEG or WebP image. Saved Sheets documents and SVG are not image payloads.');
}
export function checkImageDimensions(bytes) {
  const mime = imageMime(bytes), view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width, height;
  if (mime === 'image/png' && bytes.length >= 24) { width = view.getUint32(16); height = view.getUint32(20); }
  if (mime === 'image/webp' && bytes.length >= 25) {
    const kind = String.fromCharCode(...bytes.slice(12,16));
    if (kind === 'VP8L' && bytes[20] === 0x2f) { width = 1 + bytes[21] + ((bytes[22] & 63) << 8); height = 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 15) << 10); }
    if (kind === 'VP8X' && bytes.length >= 30) { width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16); height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16); }
    if (kind === 'VP8 ' && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 1 && bytes[25] === 0x2a) { width = view.getUint16(26,true) & 0x3fff; height = view.getUint16(28,true) & 0x3fff; }
  }
  if (mime === 'image/jpeg') {
    for (let i = 2; i + 4 <= bytes.length;) {
      if (bytes[i++] !== 255) break;
      while (bytes[i] === 255) i++;
      const marker = bytes[i++];
      if (marker === 0xd9 || marker === 0xda || i + 2 > bytes.length) break;
      if (marker === 1 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = view.getUint16(i);
      if (length < 2 || i + length > bytes.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && length >= 7) { height = view.getUint16(i+3); width = view.getUint16(i+5); break; }
      i += length;
    }
  }
  if (!width || !height || width * height > ATTACHMENT_LIMITS.pixels) throw Error('Invalid image dimensions or picture exceeds 16 million pixels.');
  return { width, height };
}
export function validateAttachments(value) {
  if (!Array.isArray(value) || value.length > ATTACHMENT_LIMITS.count) throw Error('A document can include at most 8 pictures.');
  let total = 0; const ids = new Set();
  return value.map(entry => {
    if (!entry || Object.keys(entry).some(key => !['id','mime','data'].includes(key)) || !isCID(entry.id) || typeof entry.data !== 'string' || !/^[\w-]+$/.test(entry.data)) throw Error('Malformed picture attachment.');
    const size = cidLength(entry.id);
    if (size > ATTACHMENT_LIMITS.bytes || entry.data.length !== Math.ceil(size * 4 / 3)) throw Error('Included pictures must be at most 256 KiB each. Resize this picture or keep it linked.');
    total += size;
    if (total > ATTACHMENT_LIMITS.total || ids.has(entry.id)) throw Error('Duplicate picture or more than 512 KiB of pictures.');
    ids.add(entry.id);
    const bytes = decode64(entry.data);
    checkImageDimensions(bytes);
    if (encode64(bytes) !== entry.data || imageMime(bytes) !== entry.mime) throw Error('Picture bytes do not match their declared type.');
    return { id: entry.id, mime: entry.mime, data: entry.data };
  });
}
export async function verifyAttachments(value = [], signal) {
  const entries = validateAttachments(value);
  for (const entry of entries) await verifyCIDBytes(entry.id, decode64(entry.data), signal);
  return entries;
}
export async function makeAttachment(bytes, signal) {
  signal?.throwIfAborted();
  const entry = { id: await computeCID(bytes), mime: imageMime(bytes), data: encode64(bytes) };
  signal?.throwIfAborted();
  return validateAttachments([entry])[0];
}
export function pictureURL(input) {
  const value = input.trim(), id = cid(value);
  if (id) return `https://256t.us/${id}`;
  let url; try { url = new URL(value); } catch { throw Error('Enter an HTTPS picture URL, HashBin/256t link or CID.'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw Error('Pictures require HTTPS links without credentials.');
  return url.href;
}
export async function fetchPicture(input, { signal, fetchSource = fetch } = {}) {
  const url = pictureURL(input), id = cid(url);
  if (id && cidLength(id) > ATTACHMENT_LIMITS.bytes) throw Error('Picture exceeds 256 KiB. Resize it before including it.');
  const combined = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(15000)]);
  const bytes = id && cidLength(id) <= 64 ? decode64(id.slice(8)) : await (async () => {
    const response = await fetchSource(url, { signal: combined, credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw Error(`Picture could not be loaded (HTTP ${response.status}).`);
    return readResponse(response, ATTACHMENT_LIMITS.bytes);
  })();
  if (id) await verifyCIDBytes(id, bytes, combined);
  combined.throwIfAborted(); checkImageDimensions(bytes); return bytes;
}
export function imageDataURL(entry) {
  // Standard base64 is a character substitution of the canonical base64url bytes.
  const data = entry.data.replace(/-/g, '+').replace(/_/g, '/');
  return `data:${entry.mime};base64,${data.padEnd(Math.ceil(data.length / 4) * 4, '=')}`;
}
