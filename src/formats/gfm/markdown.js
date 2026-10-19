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
  presentation = true,
  extensions = ["table", "strikethrough", "autolink", "tagfilter", "tasklist"],
} = {}) {
  const md = new MarkdownIt({
    html: true,
    linkify: extensions.includes("autolink"),
    breaks: false,
    // The corpus uses XHTML spelling. Production keeps HTML5 serialization.
    xhtmlOut: !presentation,
    highlight(code, lang) {
      return presentation && lang && highlight.getLanguage(lang)
        ? highlight.highlight(code, { language: lang, ignoreIllegals: true })
            .value
        : escapeHTML(code);
    },
  });
  for (const name of ["table", "strikethrough"])
    if (!extensions.includes(name)) md.disable(name);
  if (extensions.includes("tasklist")) md.use(taskLists);
  if (presentation) md.use(footnotes).use(alerts);
  // linkify-it 6 disables fuzzy URLs by default. Add just the GFM www prefix,
  // delegating URL validation and punctuation to its bounded HTTP matcher.
  // Do not turn on fuzzyLink: that also links bare domains outside GFM syntax.
  md.linkify.add("www.", {
    validate(text, pos, self) {
      const match = self.matchAtStart("http://" + text.slice(pos - 4));
      return match && match.lastIndex > 11 ? match.lastIndex - 11 : 0;
    },
    normalize(match) {
      match.url = "http://" + match.url;
    },
  });
  // Markdown-it emits alignment as style, which the final sanitizer correctly
  // removes from HTML. Use GFM's constrained align attribute instead.
  for (const type of ["th_open", "td_open"])
    md.renderer.rules[type] = (tokens, i, options, env, self) => {
      const token = tokens[i];
      const alignment = /^text-align:(left|center|right)$/.exec(
        token.attrGet("style") || "",
      );
      if (alignment) {
        token.attrs = token.attrs.filter(([name]) => name !== "style");
        token.attrSet("align", alignment[1]);
      }
      return self.renderToken(tokens, i, options);
    };
  // GFM tagfilter escapes the opening '<', preserving readable tag text before
  // the browser interprets raw-text elements. This is separate from DOMPurify.
  if (extensions.includes("tagfilter"))
    for (const type of ["html_inline", "html_block"])
      md.renderer.rules[type] = (tokens, i) =>
        tokens[i].content.replace(
          /<(?=\/?(?:title|textarea|style|xmp|iframe|noembed|noframes|script|plaintext)(?=[\t\n\f />]))/gi,
          "&lt;",
        );
  // The pinned cmark renderer collapses strong-inside-strong. Preserve the
  // parser's tokens/maps for Calca, hiding only redundant rendering delimiters.
  md.core.ruler.push("gfm_strong", (state) => {
    for (const block of state.tokens) {
      const parents = [];
      for (const token of block.children || []) {
        if (token.type === "strong_open")
          token.hidden = parents.at(-1)?.type === "strong_open";
        if (token.nesting === 1) parents.push(token);
        if (token.nesting === -1) {
          const open = parents.pop();
          if (token.type === "strong_close")
            token.hidden = open?.hidden || false;
        }
      }
    }
  });
  md.renderer.rules.s_open = () => "<del>";
  md.renderer.rules.s_close = () => "</del>";
  if (!presentation) return md;
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
