// Inspect the pinned translator's tree. Warnings describe synthesized empty
// operands, not a second grammar. One-sided/mixed delimiters remain valid.
export function formulaWarnings(tree, source, parser) {
  const warnings = [],
    seen = new WeakSet(),
    pending = [tree],
    keys = new Set();
  const add = (index, message) => {
    index = Math.max(0, Math.min(index, source.length));
    const key = `${index}:${message}`;
    if (!keys.has(key)) {
      keys.add(key);
      warnings.push({ index, message, severity: "warning" });
    }
  };
  const unaries = new Set(
      parser.unary_symbols
        .filter((symbol) => !symbol.func)
        .map((symbol) => symbol.asciimath),
    ),
    left = new Set(parser.left_brackets.map((symbol) => symbol.asciimath));
  while (pending.length) {
    const node = pending.pop();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    if (node.ttype === "fraction" && node.denominator === null)
      add(
        node.end - 1,
        "Missing fraction denominator; the translator inserted an empty denominator.",
      );
    if (node.ttype === "subsup") {
      const base = parser.strip_space(node.pos),
        raw = source.slice(base, node.end);
      if (
        raw.startsWith("_") &&
        !node.sub &&
        !/^[+-]/.test(raw.slice(1).trimStart())
      )
        add(
          base,
          "Missing subscript expression; the translator inserted an empty subscript.",
        );
      if (
        raw.includes("^") &&
        !node.sup &&
        !/^[+-]/.test(source.slice(base + raw.lastIndexOf("^") + 1).trimStart())
      )
        add(
          base + raw.lastIndexOf("^"),
          "Missing superscript expression; the translator inserted an empty superscript.",
        );
    }
    if (
      node.ttype === "binary" &&
      node.op &&
      source.trim() !== node.op.asciimath &&
      (!node.arg1 || !node.arg2)
    )
      add(
        parser.strip_space(node.pos),
        `Missing argument to ${node.op.asciimath}; the translator inserted an empty argument.`,
      );
    if (node.ttype === "unary" && unaries.has(node.op.token)) {
      if (!node.arg && source.trim() !== node.op.token)
        add(
          node.op.pos,
          `Missing argument to ${node.op.token}; the translator inserted an empty argument.`,
        );
      else if (
        node.arg &&
        left.has(source.slice(node.arg.pos, node.arg.end).trim())
      )
        add(
          node.arg.pos,
          `Missing expression after the opening delimiter in ${node.op.token}.`,
        );
    }
    if (node.ttype === "text") {
      const raw = source.slice(node.pos, node.end).trimStart(),
        open = /^(?:text|mbox)\s*([({\[])/.exec(raw);
      if (open && raw.at(-1) !== { "(": ")", "{": "}", "[": "]" }[open[1]])
        add(
          parser.strip_space(node.pos),
          "Unfinished text argument; the translator may truncate its final character.",
        );
    }
    for (const value of Object.values(node))
      if (value && typeof value === "object") {
        if (Array.isArray(value)) {
          for (const child of value) pending.push(child);
        } else pending.push(value);
      }
  }
  return warnings.sort((a, b) => a.index - b.index);
}
