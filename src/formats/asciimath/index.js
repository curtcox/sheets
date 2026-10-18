import { plugin } from "../registry.js";
import AsciiMathParser from "../../../vendor/asciimath2tex.js";
import { renderMarkdown, renderMath } from "../gfm/markdown.js";
import { escapeHTML } from "../../util.js";
const parser = new AsciiMathParser();
export function renderAsciiMath(src) {
  const diagnostics = [];
  const math = (source, display) => {
    try {
      const tex = parser.parse(source);
      return `<span class="asciimath-formula">${renderMath(tex, display)}<details><summary>Show TeX</summary><code>${escapeHTML(tex)}</code></details></span>`;
    } catch (error) {
      diagnostics.push({ line: 1, message: error.message });
      return `<span class="math-error">${escapeHTML(source)}</span>`;
    }
  };
  const structured =
    /^\s*(?:#{1,6}\s|```|[-*+]\s|>\s|\|)|\$|\[[^\]]+\]\(/m.test(src);
  const result = structured
    ? renderMarkdown(src, { math })
    : {
        html: src
          .split("\n")
          .filter((s) => s.trim())
          .map((s) => `<div class="display-math">${math(s, true)}</div>`)
          .join(""),
      };
  return { ...result, diagnostics };
}
export default plugin("asciimath", async (src) => renderAsciiMath(src));
