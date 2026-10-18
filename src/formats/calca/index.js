import { plugin } from "../registry.js";
import { renderMarkdown } from "../gfm/markdown.js";
import { evaluate, formatValue } from "../../math.js";
import { escapeHTML } from "../../util.js";
export function renderCalca(src) {
  const scope = new Map(),
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
      const value = evaluate(expression.replace(/\s+in\s+/g, " to "), scope, {
        assign: true,
      });
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
export default plugin("calca", async (src) => renderCalca(src));
