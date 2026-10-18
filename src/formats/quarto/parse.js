import * as yaml from "../../../vendor/js-yaml.js";
export function parseQuarto(src) {
  const diagnostics = [],
    lines = src.split("\n");
  let metadata = {},
    start = 0;
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((s, i) => i > 0 && s.trim() === "---");
    if (end > 0) {
      try {
        metadata =
          yaml.load(lines.slice(1, end).join("\n"), {
            schema: yaml.JSON_SCHEMA,
          }) || {};
        if (typeof metadata !== "object" || Array.isArray(metadata))
          throw new Error("Front matter must be a mapping.");
      } catch (error) {
        diagnostics.push({ line: 2, message: error.message });
        metadata = {};
      }
      start = end + 1;
    }
  }
  const parts = [];
  let prose = [];
  const flush = () => {
    if (prose.length) parts.push({ kind: "prose", source: prose.join("\n") });
    prose = [];
  };
  for (let i = start; i < lines.length; i++) {
    const match =
      /^\s*(`{3,}|~{3,})\{(python|r|ojs|julia)(?:\s+[^}]*)?\}\s*$/.exec(
        lines[i],
      );
    if (!match) {
      prose.push(lines[i]);
      continue;
    }
    flush();
    const line = i + 2,
      code = [],
      options = [];
    let closed = false;
    const close = new RegExp(`^\\s*${match[1][0]}{${match[1].length},}\\s*$`);
    for (i++; i < lines.length; i++) {
      if (close.test(lines[i])) {
        closed = true;
        break;
      }
      if (/^\s*#\|\s?/.test(lines[i]))
        options.push(lines[i].replace(/^\s*#\|\s?/, ""));
      else code.push(lines[i]);
    }
    if (!closed)
      diagnostics.push({
        line: line - 1,
        message: "Unclosed executable cell.",
      });
    let cellOptions = {};
    try {
      cellOptions = options.length
        ? yaml.load(options.join("\n"), { schema: yaml.JSON_SCHEMA }) || {}
        : {};
      if (typeof cellOptions !== "object" || Array.isArray(cellOptions))
        throw new Error("Cell options must be a mapping.");
    } catch (error) {
      diagnostics.push({ line, message: error.message });
      cellOptions = {};
    }
    parts.push({
      kind: "cell",
      language: match[2],
      source: code.join("\n"),
      line,
      options: cellOptions,
    });
  }
  flush();
  return { metadata, parts, diagnostics };
}
