import { plugin } from "../registry.js";
import AsciiMathParser from "../../../vendor/asciimath2tex.js";
import temml from "../../../vendor/temml.js";
import { createMarkdown } from "../gfm/markdown.js";
import { escapeHTML } from "../../util.js";
import {
  validateProfile,
  ASCIIMATH_FORMULAS,
  ASCIIMATH_PROSE,
} from "../../compatibility-profiles.js";
import { formulaWarnings } from "./diagnostics.js";
import { mapMathTokens } from "./locations.js";
const parser = new AsciiMathParser();
export function renderAsciiMath(src, { profile } = {}) {
  validateProfile(profile, "asciimath");
  const diagnostics = [],
    mermaid = [];
  const math = (source, display, location) => {
    const report = (message, severity = "error", index = 0) =>
      diagnostics.push({
        ...(location?.position(index) || { line: 1, column: 0 }),
        message,
        severity,
      });
    let tex;
    try {
      parser.input(source);
      const tree = parser.consume();
      tex = tree.tex;
      for (const warning of formulaWarnings(tree, source, parser))
        report(warning.message, warning.severity, warning.index);
    } catch (error) {
      report(`AsciiMath translation: ${error.message}`);
      return `<span class="math-error">${escapeHTML(source)}</span>`;
    }
    let output;
    try {
      output = temml.renderToString(tex, {
        displayMode: display,
        throwOnError: true,
        trust: false,
      });
    } catch (error) {
      report(`AsciiMath typesetting: ${error.message}`);
      output = `<span class="math-error" title="${escapeHTML(error.message)}">${escapeHTML(source)}</span>`;
    }
    return `<span class="asciimath-formula">${output}<details><summary>Show TeX</summary><code>${escapeHTML(tex)}</code></details></span>`;
  };
  const structured =
    profile === ASCIIMATH_PROSE ||
    (profile !== ASCIIMATH_FORMULAS &&
      /^\s*(?:#{1,6}\s|```|[-*+]\s|>\s|\|)|\$|\[[^\]]+\]\(/m.test(src));
  let html;
  if (structured) {
    const md = createMarkdown({ math, diagnostics, mermaid }),
      env = {},
      tokens = md.parse(src, env);
    mapMathTokens(tokens, src);
    html = md.renderer.render(tokens, md.options, env);
  } else {
    html = src
      .split("\n")
      .map((line, i) =>
        line.trim()
          ? `<div class="display-math">${math(line, true, { position: (index) => ({ line: i + 1, column: index }) })}</div>`
          : "",
      )
      .join("");
  }
  return { html, diagnostics, mermaid };
}
export default plugin("asciimath", async (src, options) =>
  renderAsciiMath(src, options),
);
