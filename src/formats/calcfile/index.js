import { plugin } from "../registry.js";
import { evaluateDocument } from "../../../vendor/calcfile/core.mjs";
import { escapeHTML, resultRows } from "../../util.js";
export function renderCalcFile(src) {
  const result = evaluateDocument(src),
    lines = src.split("\n");
  return {
    html: resultRows(
      result.lines.map((row) => ({
        line: row.lineNumber,
        source: lines[row.lineNumber - 1],
        output: escapeHTML(
          row.display || row.diagnostics.map((d) => d.message).join(" "),
        ),
        kind: row.status,
      })),
    ),
    diagnostics: result.lines.flatMap((row) =>
      row.diagnostics.map((d) => ({
        line: row.lineNumber,
        message: d.message,
      })),
    ),
    result,
  };
}
export default plugin("calcfile", async (src) => renderCalcFile(src));
