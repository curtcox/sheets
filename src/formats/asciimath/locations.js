import { sourceMap } from "../gfm/locations.js";

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
