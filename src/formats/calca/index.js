import { plugin } from "../registry.js";
import { renderMarkdown } from "../gfm/markdown.js";
import { formatValue } from "../../math.js";
import { createCalca } from "./engine.js";
import {
  CALCA_BLOCKS,
  CALCA_SCOPES,
  validateProfile,
} from "../../compatibility-profiles.js";
import { parseCalcaDocument } from "./document.js";
import { createScopedCalca } from "./scoped.js";
function renderLegacy(src) {
  const calculate = createCalca(),
    diagnostics = [],
    lines = src.split("\n");
  let fenced = false;
  const output = lines.map((line, i) => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      return line;
    }
    const arrow = line.includes("=>"),
      code = fenced || /^ {4}|^\t/.test(line);
    if (!arrow && !code) return line;
    const expression = line.split("=>")[0].trim();
    if (!expression || expression.startsWith("//")) return line;
    try {
      const value = calculate(expression.replace(/\s+in\s+/g, " to "));
      const result = formatValue(value);
      return arrow ? `${line.split("=>")[0]}=> ${result}` : line;
    } catch (error) {
      diagnostics.push({ line: i + 1, message: error.message });
      return arrow ? `${line.split("=>")[0]}=> Error: ${error.message}` : line;
    }
  });
  const result = renderMarkdown(output.join("\n"));
  return { ...result, diagnostics, recalculatedSource: output.join("\n") };
}
export function renderCalca(src, { profile } = {}) {
  validateProfile(profile, "calca");
  if (![CALCA_BLOCKS, CALCA_SCOPES].includes(profile)) return renderLegacy(src);
  const model = parseCalcaDocument(src),
    calculate = profile === CALCA_SCOPES ? createScopedCalca() : createCalca(),
    lines = src.split("\n"),
    diagnostics = [...model.diagnostics];
  let heading = 0;
  for (const { line, expression, arrow } of model.calculations) {
    while (
      heading < model.headings.length &&
      model.headings[heading].line <= line
    ) {
      calculate.heading?.(model.headings[heading].level);
      heading++;
    }
    let answer;
    try {
      answer = formatValue(
        calculate(expression.replace(/\s+in\s+/g, " to "), {
          line,
          query: arrow >= 0,
        }),
      );
    } catch (error) {
      diagnostics.push({ line, message: error.message });
      answer = `Error: ${error.message}`;
    }
    if (arrow >= 0)
      lines[line - 1] =
        `${lines[line - 1].slice(0, arrow)}=> ${answer}${lines[line - 1].endsWith("\r") ? "\r" : ""}`;
  }
  const recalculatedSource = lines.join("\n");
  return {
    ...renderMarkdown(recalculatedSource),
    diagnostics,
    recalculatedSource,
  };
}
export default plugin("calca", async (src, options) =>
  renderCalca(src, options),
);
