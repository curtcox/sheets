import MarkdownIt from "../../../vendor/markdown-it.js";
import taskLists from "../../../vendor/markdown-it-task-lists.js";
import footnotes from "../../../vendor/markdown-it-footnote.js";
import alerts from "../../../vendor/markdown-it-github-alerts.js";
import highlight from "../../../vendor/highlight.js";
import temml from "../../../vendor/temml.js";
import { escapeHTML } from "../../util.js";
import { inlineSVGStyles } from "../../svg.js";
export function renderMath(source, display = false) {
  try {
    return temml.renderToString(source, {
      displayMode: display,
      throwOnError: true,
      trust: false,
    });
  } catch (error) {
    return `<span class="math-error" title="${escapeHTML(error.message)}">${escapeHTML(source)}</span>`;
  }
}
export function createMarkdown({
  math = renderMath,
  diagnostics = [],
  mermaid = [],
} = {}) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: false,
    highlight(code, lang) {
      return lang && highlight.getLanguage(lang)
        ? highlight.highlight(code, { language: lang, ignoreIllegals: true })
            .value
        : escapeHTML(code);
    },
  })
    .use(taskLists)
    .use(footnotes)
    .use(alerts);
  md.renderer.rules.s_open = () => "<del>";
  md.renderer.rules.s_close = () => "</del>";
  md.inline.ruler.before("escape", "sheets_math", (state, silent) => {
    if (
      !math ||
      state.src[state.pos] !== "$" ||
      state.src[state.pos + 1] === "$" ||
      /\s/.test(state.src[state.pos + 1] || " ")
    )
      return false;
    let end = state.pos + 1;
    while (
      (end = state.src.indexOf("$", end)) !== -1 &&
      state.src[end - 1] === "\\"
    )
      end++;
    if (
      end < 0 ||
      /\s/.test(state.src[end - 1]) ||
      /\d/.test(state.src[end + 1] || "")
    )
      return false;
    if (!silent) {
      const t = state.push("sheets_math", "math", 0);
      t.content = state.src.slice(state.pos + 1, end);
    }
    state.pos = end + 1;
    return true;
  });
  md.renderer.rules.sheets_math = (tokens, i) => math(tokens[i].content, false);
  md.block.ruler.before(
    "fence",
    "sheets_math_block",
    (state, start, end, silent) => {
      const first = state.src.slice(
        state.bMarks[start] + state.tShift[start],
        state.eMarks[start],
      );
      if (!math || !first.startsWith("$$")) return false;
      if (silent) return true;
      const parts = [];
      let line = start;
      if (first.length > 3 && first.endsWith("$$"))
        parts.push(first.slice(2, -2));
      else {
        if (first.slice(2).trim()) parts.push(first.slice(2));
        for (line = start + 1; line < end; line++) {
          const text = state.src.slice(state.bMarks[line], state.eMarks[line]);
          const close = text.indexOf("$$");
          if (close >= 0) {
            parts.push(text.slice(0, close));
            break;
          }
          parts.push(text);
        }
      }
      const token = state.push("sheets_math_block", "math", 0);
      token.content = parts.join("\n");
      token.map = [start, line + 1];
      state.line = Math.min(line + 1, end);
      return true;
    },
  );
  md.renderer.rules.sheets_math_block = (tokens, i) =>
    `<div class="display-math">${math(tokens[i].content, true)}</div>\n`;
  const fence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, i, options, env, self) => {
    const token = tokens[i],
      language = token.info.trim().split(/\s/)[0];
    if (["math", "asciimath"].includes(language) && math)
      return `<div class="display-math">${math(token.content.trim(), true)}</div>\n`;
    if (language === "mermaid") {
      const id = mermaid.length;
      mermaid.push(token.content);
      return `<div data-mermaid="${id}"><pre>${escapeHTML(token.content)}</pre></div>\n`;
    }
    return fence(tokens, i, options, env, self);
  };
  return md;
}
export function renderMarkdown(src, options = {}) {
  const diagnostics = [],
    mermaid = [];
  const md = createMarkdown({ ...options, diagnostics, mermaid });
  return { html: md.render(src), diagnostics, mermaid };
}
// Mermaid is a browser-only post-pass. Final SVG always returns through DOMPurify.
export async function renderDiagrams(element, sources, { signal, sanitize }) {
  if (!sources?.length) return;
  const { default: mermaid } = await import("../../../vendor/mermaid.js");
  signal?.throwIfAborted();
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "neutral",
    htmlLabels: false,
    flowchart: { htmlLabels: false },
    maxTextSize: 50_000,
    suppressErrorRendering: true,
  });
  for (const [i, source] of sources.entries()) {
    signal?.throwIfAborted();
    const target = element.querySelector(`[data-mermaid="${i}"]`);
    if (!target) continue;
    try {
      const { svg } = await mermaid.render(
        `diagram-${crypto.randomUUID()}`,
        source,
      );
      signal?.throwIfAborted();
      target.innerHTML = sanitize(inlineSVGStyles(svg));
    } catch (error) {
      if (error.name === "AbortError") throw error;
      target.textContent = `Mermaid: ${error.message}`;
    }
  }
}
