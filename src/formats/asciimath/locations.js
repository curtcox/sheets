// Markdown tokens own formula classification. Map their logical lines back to
// original lines, including stripped quote/list prefixes and escaped table pipes.
function lineView(raw) {
  const columns = [],
    chars = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "\\" && raw[i + 1] === "|") i++;
    columns.push(i);
    chars.push(raw[i]);
  }
  columns.push(raw.length);
  return { text: chars.join(""), columns };
}
function sourceMap(content, lines, firstLine, cursor = 0, views = new Map()) {
  const starts = [0],
    mapped = [];
  for (let i = 0; i < content.length; i++)
    if (content[i] === "\n") starts.push(i + 1);
  const parts = content.split("\n");
  for (let i = 0; i < parts.length; i++) {
    const line = firstLine + i,
      raw = lines[line] || "",
      part = parts[i];
    let column = raw.indexOf(part, i ? 0 : cursor),
      view;
    if (column < 0) {
      if (!views.has(line)) views.set(line, lineView(raw));
      view = views.get(line);
      let from = 0,
        high = view.columns.length;
      while (from < high) {
        const mid = (from + high) >>> 1;
        if (view.columns[mid] < (i ? 0 : cursor)) from = mid + 1;
        else high = mid;
      }
      column = view.text.indexOf(part, from);
    }
    if (column < 0) {
      column = 0;
      view = undefined;
    }
    mapped.push({ line: line + 1, column, view });
  }
  return {
    position(index) {
      let lo = 0,
        hi = starts.length;
      while (lo + 1 < hi) {
        const mid = (lo + hi) >>> 1;
        if (starts[mid] <= index) lo = mid;
        else hi = mid;
      }
      const origin = mapped[lo],
        logical = origin.column + index - starts[lo];
      return {
        line: origin.line,
        column: origin.view
          ? (origin.view.columns[logical] ?? lines[origin.line - 1].length)
          : logical,
      };
    },
    endColumn: mapped.at(-1).view
      ? mapped.at(-1).view.columns[mapped.at(-1).column + parts.at(-1).length]
      : mapped.at(-1).column + parts.at(-1).length,
  };
}
export function mapMathTokens(tokens, src) {
  const lines = src
    .replace(/\r\n?/g, "\n")
    .replace(/\0/g, "\ufffd")
    .split("\n");
  const views = new Map();
  let row,
    cursor = 0;
  for (const token of tokens) {
    if (token.type === "tr_open") {
      row = token.map;
      cursor = 0;
    }
    if (token.type === "tr_close") row = undefined;
    if (token.type === "inline") {
      const first = (token.map || row)?.[0];
      if (first === undefined) continue;
      const location = sourceMap(
        token.content,
        lines,
        first,
        row ? cursor : 0,
        views,
      );
      if (row) cursor = location.endColumn;
      for (const child of token.children || [])
        if (child.type === "sheets_math") {
          const start = child.meta.sourceStart;
          child.meta.location = {
            position: (index) => location.position(start + index),
          };
        }
    } else if (token.type === "sheets_math_block") {
      token.meta.location = sourceMap(
        token.content,
        lines,
        token.meta.sourceLine,
        0,
        views,
      );
    } else if (
      token.type === "fence" &&
      ["math", "asciimath"].includes(token.info.trim().split(/\s/)[0])
    ) {
      const leading = token.content.length - token.content.trimStart().length,
        skipped = token.content.slice(0, leading).split("\n").length - 1;
      token.meta = {
        ...token.meta,
        location: sourceMap(
          token.content.trim(),
          lines,
          token.map[0] + 1 + skipped,
          0,
          views,
        ),
      };
    }
  }
}
