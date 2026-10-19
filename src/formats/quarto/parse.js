import { createMarkdown } from "../gfm/markdown.js";
import { readOptions, validateOptions } from "./options.js";
import { quartoStructure, resolveFigures } from "./structure.js";

export function parseQuarto(src) {
  const diagnostics = [],
    mermaid = [],
    lines = src.replace(/\r\n?/g, "\n").split("\n");
  let metadata = {},
    start = 0;
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((s, i) => i > 0 && s.trim() === "---");
    if (end < 0)
      diagnostics.push({
        line: 1,
        column: 0,
        message: "Unclosed YAML front matter.",
      });
    else {
      const yaml = lines.slice(1, end).join("\n");
      metadata = validateOptions(
        readOptions(
          yaml,
          lines.slice(1, end).map((_, i) => ({ line: i + 2, column: 0 })),
          diagnostics,
          "Front matter",
        ),
        diagnostics,
        "metadata",
        { line: 2, column: 0 },
      );
      start = end + 1;
    }
  }
  // Blank front matter in place, retaining original Markdown token coordinates.
  const body = lines.map((line, i) => (i < start ? "" : line)).join("\n");
  const md = createMarkdown({ diagnostics, mermaid });
  quartoStructure(md, diagnostics, lines);
  const env = {},
    tokens = md.parse(body, env),
    parts = [];
  for (const token of tokens) {
    if (token.type !== "fence") continue;
    const match = /^\{(python|r|ojs|julia)(?:\s+([^}]*))?\}$/.exec(
      token.info.trim(),
    );
    if (!match) continue;
    const first = token.map[0],
      line = first + 2;
    if (match[2]?.trim())
      diagnostics.push({
        line: first + 1,
        column: 0,
        message:
          "Unsupported executable fence settings; use initial #| YAML option lines.",
      });
    const code = token.content.replace(/\n$/, "").split("\n"),
      options = [],
      origins = [];
    let count = 0;
    for (; count < code.length; count++) {
      const option = /^(\s*#\|\s?)(.*)$/.exec(code[count]);
      if (!option) break;
      options.push(option[2]);
      origins.push({
        line: line + count,
        column:
          (lines[first + count + 1]?.indexOf("#|") ?? 0) +
          option[1].trimStart().length,
      });
    }
    const parsed = readOptions(
      options.join("\n"),
      origins,
      diagnostics,
      "Cell options",
    );
    const cell = {
      kind: "cell",
      language: match[1],
      source: code.slice(count).join("\n"),
      line,
      options: validateOptions(parsed, diagnostics, "cell", {
        line,
        column: 0,
      }),
      locations: parsed.locations,
    };
    if (
      !new RegExp(`^\\s*${token.markup[0]}{${token.markup.length},}\\s*$`).test(
        (lines[token.map[1] - 1] || "").replace(/^\s*(?:>\s*)+/, ""),
      )
    )
      diagnostics.push({
        line: first + 1,
        column: 0,
        message: "Unclosed executable cell.",
      });
    token.type = "quarto_cell";
    token.meta = cell;
    parts.push(cell);
  }
  return {
    metadata,
    parts,
    diagnostics,
    mermaid,
    md,
    env,
    tokens,
    resolveFigures: (outputs) =>
      resolveFigures(tokens, outputs, metadata, diagnostics, lines),
  };
}
