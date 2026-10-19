import { plugin } from "../registry.js";
import { evaluateDocument } from "../../../vendor/calcfile/core.mjs";
import { escapeHTML, resultRows } from "../../util.js";
import { exchangeRates } from "../../exchange-rates.js";
export async function renderCalcFile(
  src,
  { signal, ratesProvider = exchangeRates } = {},
) {
  signal?.throwIfAborted();
  let result = evaluateDocument(src),
    notice = "";
  // Let the pinned engine identify actual external-data needs, including variables
  // and continuations. Currency labels, comments and same-currency math need no fetch.
  if (result.diagnostics.some((d) => d.code === "missing-external-data")) {
    const rates = await ratesProvider({ signal });
    signal?.throwIfAborted();
    result = evaluateDocument(src, { currencyRates: rates.table || undefined });
    notice = rates.table
      ? `ECB reference rates as of ${rates.table.asOf}. ${rates.notice || "Rates are cached for up to 24 hours."}`
      : rates.notice ||
        "ECB exchange rates are unavailable. Currency conversions may fail.";
  }
  signal?.throwIfAborted();
  const lines = src.split("\n");
  return {
    html:
      (notice
        ? `<p class="notice" data-exchange-rates>${escapeHTML(notice)}</p>`
        : "") +
      resultRows(
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
export default plugin("calcfile", renderCalcFile);
