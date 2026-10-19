import { createMarkdown } from "../gfm/markdown.js";

// Arrows in strings, inline code/math, or nested expressions are literal text.
function arrowPosition(source) {
  let quote = "",
    depth = 0;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === "\\") {
      i++;
      continue;
    }
    if (quote) {
      if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === "`") {
      const start = i;
      while (source[i + 1] === "`") i++;
      const marker = source.slice(start, i + 1);
      let end = source.indexOf(marker, i + 1);
      while (
        end !== -1 &&
        (source[end - 1] === "`" || source[end + marker.length] === "`")
      )
        end = source.indexOf(marker, end + marker.length);
      if (end !== -1) i = end + marker.length - 1;
      continue;
    }
    if (c === "$" && !/\s/.test(source[i + 1] || " ")) {
      let end = source.indexOf("$", i + 1);
      while (end !== -1 && source[end - 1] === "\\")
        end = source.indexOf("$", end + 1);
      if (
        end !== -1 &&
        !/\s/.test(source[end - 1]) &&
        !/\d/.test(source[end + 1] || "")
      ) {
        i = end;
        continue;
      }
    }
    if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) depth--;
    else if (c === "=" && source[i + 1] === ">" && depth === 0) return i;
  }
  return -1;
}

/** Parse Markdown containers before identifying executable Calca source spans. */
export function parseCalcaDocument(source) {
  const lines = source.split("\n"),
    md = createMarkdown(),
    env = {};
  // Keep every source block before the presentation pass moves or omits footnotes.
  md.core.ruler.disable("footnote_tail");
  const tokens = md.parse(source, env);
  const blocks = [],
    headings = [],
    calculations = [],
    diagnostics = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.map) continue;
    if (token.type === "heading_open")
      headings.push({
        line: token.map[0] + 1,
        level: Number(token.tag.slice(1)),
      });
    const fence = token.type === "fence",
      code = token.type === "code_block";
    const paragraph =
      token.type === "inline" && tokens[i - 1]?.type === "paragraph_open";
    if (!fence && !code && !paragraph) continue;
    const executable =
      code || (fence && token.info.trim().split(/\s/)[0] === "calca");
    blocks.push({
      kind: executable ? "calculation" : paragraph ? "prose" : "literal",
      startLine: token.map[0] + 1,
      endLine: token.map[1],
      language: fence ? token.info.trim() : null,
    });
    if (!executable && !paragraph) continue;
    if (!token.content) continue;
    let cursor = token.map[0] + (fence ? 1 : 0);
    const content = token.content.replace(/\n$/, "").split("\n");
    for (const rawText of content) {
      const text = rawText.trim();
      // Markdown removes container prefixes and indentation. Match monotonically
      // within its source map so diagnostics and replacements retain those prefixes.
      while (
        cursor < token.map[1] &&
        !lines[cursor].replace(/\r$/, "").trimEnd().endsWith(text)
      )
        cursor++;
      if (cursor >= token.map[1]) {
        diagnostics.push({
          line: token.map[0] + 1,
          message:
            "Could not locate calculation source within its Markdown block.",
        });
        break;
      }
      const line = cursor++,
        arrow = text.includes("=>") ? arrowPosition(text) : -1;
      if (!executable && arrow < 0) continue;
      const expression = (arrow < 0 ? text : text.slice(0, arrow)).trim();
      if (!expression || expression.startsWith("//")) continue;
      if (
        paragraph &&
        md
          .parseInline(arrow < 0 ? text : text.slice(0, arrow), env)[0]
          .children.some((t) =>
            [
              "code_inline",
              "sheets_math",
              "html_inline",
              "link_open",
              "image",
              "footnote_ref",
            ].includes(t.type),
          )
      )
        continue;
      calculations.push({
        line: line + 1,
        expression,
        arrow: arrow < 0 ? -1 : lines[line].lastIndexOf(text) + arrow,
      });
    }
  }
  return {
    blocks: blocks.sort((a, b) => a.startLine - b.startLine),
    headings: headings.sort((a, b) => a.line - b.line),
    calculations: calculations.sort((a, b) => a.line - b.line),
    diagnostics,
  };
}
