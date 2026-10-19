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
export function sourceMap(
  content,
  lines,
  firstLine,
  cursor = 0,
  views = new Map(),
) {
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
