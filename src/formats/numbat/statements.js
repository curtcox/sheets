// Group bracketed expressions and indented continuation lines; retain source lines.
export function statements(src) {
  const lines = src.split("\n"),
    result = [];
  let source = [],
    start = 1,
    depth = 0,
    quote = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!source.length) start = i + 1;
    source.push(line);
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (quote) {
        if (c === quote && line[j - 1] !== "\\") quote = null;
        continue;
      }
      if (c === "#") break;
      if (c === '"') {
        quote = c;
        continue;
      }
      if ("([{".includes(c)) depth++;
      if (")]}".includes(c)) depth--;
    }
    const continuation =
      depth > 0 ||
      quote ||
      /[=,+*/^-]\s*(?:#.*)?$/.test(line) ||
      /^\s+\S/.test(lines[i + 1] || "");
    if (!continuation || i === lines.length - 1) {
      result.push({ line: start, source: source.join("\n") });
      source = [];
      depth = 0;
      quote = null;
    }
  }
  return result;
}
