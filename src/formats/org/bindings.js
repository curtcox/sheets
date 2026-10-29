import * as orga from "../../../vendor/orga.js";
import { inputDeclarations } from "./input-declarations.js";
const namePattern = /^[A-Za-z][A-Za-z0-9_]*$/;
const numericPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
// Normalize parser input only; the editor and shared source retain original bytes.
export function orgParserSource(src) {
  return src.replace(/^\uFEFF/, "").replaceAll("\r\n", "\n");
}
export function numericBinding(value, name) {
  if (!numericPattern.test(value.trim()))
    throw new Error(
      `Named value $${name} must be a finite decimal number; Calc expressions, strings and property constants are unsupported.`,
    );
  if (Math.abs(Number(value.trim().split(/[eE]/)[1] || 0)) > 1000000)
    throw new Error(`Named value $${name} exceeds Calc's exponent range.`);
}
export function orgDocument(src, diagnostics) {
  const starts = [],
    constants = new Map(),
    constantEntries = new Map(),
    keywords = [],
    displayKeywords = [],
    hintKeywords = [],
    inputKeywords = [],
    controlKeywords = [],
    names = [],
    headings = [],
    stack = [orga.parse(src)];
  while (stack.length) {
    const node = stack.pop();
    if (
      node.type === "block" &&
      ["SRC", "EXAMPLE", "EXPORT", "COMMENT"].includes(node.name?.toUpperCase())
    )
      continue;
    if (node.type === "table") {
      // orga can merge table rows across blank lines. Org treats each
      // contiguous run as its own table; keep AST ownership of literal blocks.
      let previous = -2;
      for (const row of node.children || []) {
        const line = row.position.start.line - 1;
        if (line > previous + 1) starts.push(line);
        previous = line;
      }
      continue;
    }
    if (node.type === "keyword" && node.key?.toUpperCase() === "CONSTANTS")
      keywords.push(node);
    if (node.type === "keyword" && node.key?.toUpperCase() === "SHEETS_CONSTANTS")
      displayKeywords.push(node);
    if (node.type === "keyword" && node.key?.toUpperCase() === "SHEETS_HINTS")
      hintKeywords.push(node);
    if (node.type === "keyword" && node.key?.toUpperCase() === "SHEETS_INPUT")
      inputKeywords.push(node);
    if (node.type === "keyword" && node.key?.toUpperCase() === "SHEETS_CONTROL")
      controlKeywords.push(node);
    if (node.type === "keyword" && /^(?:NAME|TBLNAME)$/i.test(node.key))
      names.push(node);
    if (node.type === "headline") headings.push(node.position.start.line - 1);
    stack.push(...(node.children || []));
  }
  for (const node of keywords.sort(
    (a, b) => a.position.start.line - b.position.start.line,
  )) {
    for (const token of (node.value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)) {
      const match = /^([A-Za-z][A-Za-z0-9_]*)=(.*)$/.exec(token),
        line = node.position.start.line;
      if (!match) {
        diagnostics.push({
          line,
          message: `Unsupported constant declaration: ${token}. Use name=number.`,
        });
        continue;
      }
      constants.set(match[1], match[2]);
      const entry = { name: match[1], value: match[2], line, valid: true };
      constantEntries.set(match[1], entry);
      try {
        numericBinding(match[2], match[1]);
      } catch (error) {
        entry.valid = false;
        diagnostics.push({ line, message: error.message });
      }
    }
  }
  starts.sort((a, b) => a - b);
  headings.sort((a, b) => a - b);
  const namedTables = new Map();
  let tableIndex = 0,
    headingIndex = 0;
  for (const node of names.sort(
    (a, b) => a.position.start.line - b.position.start.line,
  )) {
    const line = node.position.start.line - 1,
      name = node.value.trim().toLowerCase();
    while (starts[tableIndex] <= line) tableIndex++;
    while (headings[headingIndex] <= line) headingIndex++;
    const start = starts[tableIndex];
    if (!namedTables.has(name))
      namedTables.set(name, headings[headingIndex] < start ? undefined : start);
  }
  function option(nodes, key, values) {
    const last = nodes.sort((a, b) => a.position.start.line - b.position.start.line).at(-1),
      value = (last?.value || "").trim().toLowerCase();
    if (last && !values.includes(value))
      diagnostics.push({
        line: last.position.start.line,
        severity: "warning",
        message: `Unsupported ${key} option. Use ${values.join(" or ")}.`,
      });
    return value;
  }
  return {
    starts, constants, namedTables,
    constantEntries: [...constantEntries.values()],
    showConstants: option(displayKeywords, "SHEETS_CONSTANTS", ["table", "none"]) === "table",
    precedenceHints: option(hintKeywords, "SHEETS_HINTS", ["precedence", "none"]) === "precedence",
    inputs: inputDeclarations(inputKeywords),
    controlKeywords,
  };
}
export function tableBindings(
  table,
  { line = 1, constants = new Map(), diagnostics = [] } = {},
) {
  const columns = new Map(),
    fields = new Map(),
    parameters = new Map();
  const namedRow = table.rows.find((row) => row[0] === "!");
  if (namedRow)
    namedRow.forEach((name, col) => {
      if (col && namePattern.test(name) && !columns.has(name))
        columns.set(name, col + 1);
    });
  for (const [i, rowIndex] of table.layout.entries()) {
    if (rowIndex === null) continue;
    const row = table.rows[rowIndex];
    if (row[0] === "$")
      for (const value of row.slice(1)) {
        if (!value) continue;
        const match = /^([A-Za-z][A-Za-z0-9_]*|%)\s*=\s*(.*)$/.exec(value);
        if (!match) {
          diagnostics.push({
            line: line + i,
            message: `Unsupported table parameter: ${value}. Use name=number.`,
          });
          continue;
        }
        parameters.set(match[1], match[2]);
        // `%` is Org's table-wide format prefix for formulas with a mode suffix.
        if (match[1] === "%") continue;
        try {
          numericBinding(match[2], match[1]);
        } catch (error) {
          diagnostics.push({ line: line + i, message: error.message });
        }
      }
  }
  // Org snapshots named-field values before the recalculation pass. They take
  // precedence over parameters; named columns are resolved before either one.
  for (const [i, rowIndex] of table.layout.entries()) {
    if (rowIndex === null) continue;
    const row = table.rows[rowIndex],
      direction = row[0] === "^" ? -1 : row[0] === "_" ? 1 : 0;
    if (!direction) continue;
    const adjacent = table.layout[i + direction];
    if (adjacent === undefined || adjacent === null) continue;
    row.forEach((name, col) => {
      if (col && namePattern.test(name))
        fields.set(name, {
          row: adjacent + 1,
          col: col + 1,
          value: table.rows[adjacent][col],
        });
    });
  }
  return {
    fields,
    format: parameters.get("%"),
    marked: table.rows.some((row) => /^[!$^_#*]$/.test(row[0])),
    column: (name) => columns.get(name),
    // Returns validated numeric source text; Calc reads it exactly.
    value(name) {
      const value =
        fields.get(name)?.value ?? parameters.get(name) ?? constants.get(name);
      if (value === undefined)
        throw new Error(
          `Undefined named reference $${name}. Names are case-sensitive; inherited property and external constants are unsupported.`,
        );
      numericBinding(value, name);
      return value.trim();
    },
  };
}
