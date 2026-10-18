import init, {
  Numbat,
  FormatType,
} from "../../vendor/numbat@1.24.0/numbat_wasm.js";
import { statements } from "../formats/numbat/statements.js";
import { escapeHTML, resultRows } from "../util.js";
self.onmessage = async ({ data: { src, xml } }) => {
  try {
    await init();
    const context = Numbat.new(true, true, FormatType.Html),
      rows = [],
      diagnostics = [];
    try {
      if (xml) context.set_exchange_rates(xml);
      for (const { line, source } of statements(src)) {
        if (!source.trim() || source.trim().startsWith("#")) {
          rows.push({ line, source, output: "" });
          continue;
        }
        const result = context.interpret(source);
        const output = result.output,
          failed = result.is_error;
        rows.push({ line, source, output, kind: failed ? "error" : "" });
        if (failed)
          diagnostics.push({
            line,
            message: output
              .replace(/<[^>]*>/g, "")
              .replace(/&[^;]+;/g, " ")
              .trim(),
          });
        result.free();
      }
    } finally {
      context.free();
    }
    self.postMessage({ html: resultRows(rows), diagnostics });
  } catch (error) {
    self.postMessage({ error: error.message || String(error) });
  }
};
