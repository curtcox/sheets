import {
  Numbat,
  FormatType,
} from "../../../vendor/numbat@1.24.0/numbat_wasm.js";
import { resultRows } from "../../util.js";
import { statements } from "./statements.js";

// init() belongs to the caller (worker or native-WASM test harness).
export function evaluateNumbat(src, { xml } = {}) {
  const context = Numbat.new(true, true, FormatType.Html),
    rows = [],
    diagnostics = [],
    inputs = new Map(),
    decoder = new TextDecoder("utf-8", { ignoreBOM: true }),
    encoder = new TextEncoder(),
    lineStarts = [0];
  for (let i = 0; i < src.length; i++)
    if (src[i] === "\n") lineStarts.push(i + 1);
  function position(offset) {
    let lo = 0,
      hi = lineStarts.length;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >>> 1;
      if (lineStarts[mid] <= offset) lo = mid;
      else hi = mid;
    }
    return { line: lo + 1, column: offset - lineStarts[lo] };
  }
  function labelLocation(label) {
    const input = inputs.get(label.source);
    if (!input) return null; // Module/internal locations stay in the engine report.
    const start =
        input.offset +
        decoder.decode(input.bytes.subarray(0, label.start)).length,
      end =
        label.end === label.start && label.start < input.bytes.length
          ? start + (src.codePointAt(start) > 0xffff ? 2 : 1)
          : input.offset +
            decoder.decode(input.bytes.subarray(0, label.end)).length,
      first = position(start),
      last = position(end);
    return { ...first, endLine: last.line, endColumn: last.column, start, end };
  }
  try {
    if (xml) context.set_exchange_rates(xml);
    let inputIndex = 0;
    for (const { line, source, offset } of statements(src)) {
      if (source.split("\n").every((part) => /^\s*(?:#.*)?$/.test(part))) {
        rows.push({ line, source });
        continue;
      }
      const inputName = `<input:${++inputIndex}>`;
      inputs.set(inputName, { offset, bytes: encoder.encode(source) });
      const result = context.interpret(source);
      try {
        const output = result.output,
          failed = result.is_error;
        rows.push({ line, source, output, kind: failed ? "error" : "" });
        if (!failed) continue;
        const groups = new Map();
        for (const label of result.labels) {
          try {
            const location = labelLocation(label),
              key = label.diagnostic;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push({
              ...location,
              mapped: !!location,
              primary: label.primary,
              message: label.message,
              source: label.source,
            });
          } finally {
            label.free();
          }
        }
        if (!groups.size) groups.set(0, []);
        for (const labels of groups.values()) {
          const target =
            labels.find(
              (label) =>
                label.primary && label.mapped && label.source === inputName,
            ) ||
            labels.find((label) => label.primary && label.mapped) ||
            labels.find((label) => label.mapped);
          diagnostics.push({
            ...(target || { ...position(offset), start: offset, end: offset }),
            message: target
              ? [
                  target.message,
                  ...labels
                    .filter(
                      (label) => !label.primary && label.source === inputName,
                    )
                    .map((label) => label.message),
                ].join("; ")
              : output
                  .replace(/<[^>]*>/g, "")
                  .replace(/&[^;]+;/g, " ")
                  .trim(),
            related: labels.filter((label) => label !== target),
          });
        }
      } finally {
        result.free();
      }
    }
  } finally {
    context.free();
  }
  return { html: resultRows(rows), diagnostics, rows };
}
