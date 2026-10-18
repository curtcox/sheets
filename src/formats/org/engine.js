import { evaluate, formatValue, math } from "../../math.js";
const isHline = (line) => /^\s*\|[-+:]+\|?\s*$/.test(line);
export function parseTable(lines) {
  const rows = [],
    hlines = [],
    layout = [];
  for (const line of lines) {
    if (isHline(line)) {
      hlines.push(rows.length);
      layout.push(null);
    } else {
      rows.push(
        line
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((s) => s.trim()),
      );
      layout.push(rows.length - 1);
    }
  }
  const columns = Math.max(0, ...rows.map((r) => r.length));
  rows.forEach((r) => {
    while (r.length < columns) r.push("");
  });
  return { rows, hlines, layout, columns };
}
function index(token, current, last, hlines, isRow) {
  if (!token) return current;
  if (token === "<") return 1;
  if (token === ">") return last;
  if (/^[+-]/.test(token)) return current + Number(token);
  if (/^[IVX]+$/.test(token) && isRow) {
    const roman = {
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
      VII: 7,
      VIII: 8,
      IX: 9,
      X: 10,
    }[token];
    if (!roman || hlines[roman - 1] === undefined)
      throw new Error(`No hline @${token}.`);
    return hlines[roman - 1] + 0.5;
  }
  return Number(token);
}
const reference = /^(?:@([+-]?\d+|[<>]|[IVX]+))?(?:\$([+-]?\d+|[<>]))?$/;
function address(ref, row, col, table) {
  const match = reference.exec(ref);
  if (!match || (!match[1] && !match[2]))
    throw new Error(`Invalid reference ${ref}`);
  return [
    index(match[1], row, table.rows.length, table.hlines, true),
    index(match[2], col, table.columns, [], false),
  ];
}
export function recalculateTable(table, formula, { line = 1 } = {}) {
  const diagnostics = [];
  function cell(r, c, numeric) {
    if (
      !Number.isInteger(r) ||
      r < 1 ||
      r > table.rows.length ||
      c < 1 ||
      c > table.columns
    )
      throw new Error(`Reference @${r}$${c} is outside the table.`);
    const text = table.rows[r - 1][c - 1],
      value = Number(text);
    if (text !== "" && Number.isFinite(value)) return value;
    return numeric ? 0 : text;
  }
  function calculate(expression, row, col, numeric) {
    const scope = new Map();
    let slot = 0;
    const bind = (value) => {
      const name = `ref${slot++}`;
      scope.set(name, value);
      return name;
    };
    expression = expression.replace(
      /(@(?:[+-]?\d+|[<>]|[IVX]+)(?:\$(?:[+-]?\d+|[<>]))?|\$(?:[+-]?\d+|[<>]))\.\.(@(?:[+-]?\d+|[<>]|[IVX]+)(?:\$(?:[+-]?\d+|[<>]))?|\$(?:[+-]?\d+|[<>]))/g,
      (_, a, b) => {
        const [r1, c1] = address(a, row, col, table),
          [r2, c2] = address(b, row, col, table),
          values = [];
        for (
          let r = Math.ceil(Math.min(r1, r2));
          r <= Math.floor(Math.max(r1, r2));
          r++
        )
          for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
            const value = cell(r, c, numeric);
            if (typeof value === "number" || numeric) values.push(value);
          }
        return bind(values);
      },
    );
    expression = expression.replace(
      /@(?:[+-]?\d+|[<>]|[IVX]+)(?:\$(?:[+-]?\d+|[<>]))?|\$(?:[+-]?\d+|[<>])/g,
      (ref) => {
        const [r, c] = address(ref, row, col, table);
        return bind(cell(r, c, numeric));
      },
    );
    for (const [name, fn] of Object.entries({
      vsum: (a) => math.sum(a),
      vmean: (a) => math.mean(a),
      vmin: (a) => math.min(a),
      vmax: (a) => math.max(a),
      vcount: (a) => a.length,
      vprod: (a) => math.prod(a),
    }))
      scope.set(name, fn);
    return evaluate(expression, scope);
  }
  for (const part of formula.split("::")) {
    const match = /^\s*([^=]+)=(.*)$/.exec(part);
    if (!match) {
      diagnostics.push({ line, message: "Invalid TBLFM assignment." });
      continue;
    }
    const [expression, ...options] = match[2].split(";");
    if (/^\s*'/.test(expression)) {
      diagnostics.push({
        line,
        message: "Emacs Lisp formulas are unsupported.",
      });
      continue;
    }
    const numeric = options.some((s) => s.includes("N")),
      precision = /%.(\d+)f/.exec(options.join(";"));
    const target = match[1].trim(),
      field = target.startsWith("@");
    const targets = [];
    try {
      if (field) targets.push(address(target, 1, 1, table));
      else {
        const first = table.hlines.length ? table.hlines[0] + 1 : 1;
        for (let row = first; row <= table.rows.length; row++)
          targets.push(address(target, row, 1, table));
      }
      for (const [row, col] of targets) {
        try {
          if (
            !Number.isInteger(row) ||
            !Number.isInteger(col) ||
            row < 1 ||
            row > table.rows.length ||
            col < 1 ||
            col > table.columns
          )
            throw new Error("Formula target is outside the table.");
          const value = calculate(expression.trim(), row, col, numeric);
          table.rows[row - 1][col - 1] =
            precision && typeof value === "number"
              ? value.toFixed(Math.min(20, Number(precision[1])))
              : formatValue(value);
        } catch (error) {
          diagnostics.push({
            line,
            message: `${target}, row ${row}: ${error.message}`,
          });
        }
      }
    } catch (error) {
      diagnostics.push({ line, message: error.message });
    }
  }
  return diagnostics;
}
export function tableSource(table) {
  const widths = Array.from({ length: table.columns }, (_, c) =>
    Math.max(1, ...table.rows.map((r) => r[c].length)),
  );
  return table.layout.map((index) =>
    index === null
      ? `|${widths.map((w) => "-".repeat(w + 2)).join("+")}|`
      : `| ${table.rows[index].map((cell, c) => (/^[-+]?\d+(?:\.\d+)?$/.test(cell) ? cell.padStart(widths[c]) : cell.padEnd(widths[c]))).join(" | ")} |`,
  );
}
export function recalculateOrg(src) {
  const lines = src.split("\n"),
    tables = [],
    diagnostics = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*\|/.test(lines[i])) continue;
    const start = i,
      tableLines = [];
    while (i < lines.length && /^\s*\|/.test(lines[i]))
      tableLines.push(lines[i++]);
    const table = parseTable(tableLines);
    let formulaIndex = i;
    while (
      formulaIndex < lines.length &&
      /^\s*#\+TBLFM:/i.test(lines[formulaIndex])
    ) {
      diagnostics.push(
        ...recalculateTable(
          table,
          lines[formulaIndex].replace(/^\s*#\+TBLFM:\s*/i, ""),
          { line: formulaIndex + 1 },
        ),
      );
      formulaIndex++;
    }
    tables.push({ start, end: i, table });
    i = formulaIndex - 1;
  }
  const output = lines.slice();
  for (const { start, end, table } of tables.slice().reverse())
    output.splice(start, end - start, ...tableSource(table));
  return { tables, diagnostics, source: output.join("\n") };
}
