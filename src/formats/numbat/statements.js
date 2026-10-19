import { statement_ranges } from "../../../vendor/numbat@1.24.0/numbat_wasm.js";

// The pinned parser owns strings, interpolation, decorators, continuations and
// error recovery. Offsets from Rust are UTF-8 bytes, not JavaScript indices.
export function statements(src) {
  const bytes = new TextEncoder().encode(src),
    decoder = new TextDecoder("utf-8", { ignoreBOM: true }),
    ranges = statement_ranges(src),
    result = [];
  let cursor = 0,
    offset = 0,
    line = 1;
  function append(end) {
    const length = decoder.decode(bytes.subarray(cursor, end)).length,
      source = src.slice(offset, offset + length);
    if (!source) return;
    result.push({ line, offset, source });
    offset += source.length;
    line += source.split("\n").length - 1;
    cursor = end;
  }
  for (let i = 1; i < ranges.length; i += 2) {
    let end = ranges[i];
    // Keep separators with the preceding row. Every source character is retained.
    if (bytes[end] === 10 || bytes[end] === 59) end++;
    append(end);
  }
  // Tokenization failures intentionally use one complete interpreter input.
  // Guessing inside a broken string could execute its contents as code.
  append(bytes.length);
  return result;
}
