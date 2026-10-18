import { plugin } from "../registry.js";
import { renderMarkdown } from "../gfm/markdown.js";
import { formatValue } from "../../math.js";
import { createCalca } from "./engine.js";
export function renderCalca(src) {
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
export default plugin("calca", async (src) => renderCalca(src));
