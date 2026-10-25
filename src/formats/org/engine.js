import { orgDocument, tableBindings, orgParserSource } from "./bindings.js";
import { evaluateCalc, formatCalc, parseModes } from "./calc.js";
import {
  address,
  cell,
  range,
  checkAddress,
  remoteValue,
} from "./references.js";
import { ORG_EMACS, validateProfile } from "../../compatibility-profiles.js";
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
export function recalculateTable(
  table,
  formula,
  { line = 1, bindings, profile, remote } = {},
) {
  validateProfile(profile, "org");
  const diagnostics = [];
  bindings ||= tableBindings(table, { diagnostics });
  // References become placeholders bound to their field text, as Org's
  // org-table-make-reference substitutes text before calling Calc.
  function calculate(expression, row, col, modes) {
    const refs = [];
    const bind = (ref) => `\uE000${refs.push(ref) - 1}\uE001`;
    expression = expression.replace(
      /\bremote\s*\(([^(),]*),([^()]*)\)/g,
      (_, name, ref) => {
        if (!remote)
          throw new Error(
            "Remote references need a same-document named table.",
          );
        return bind(remote(name, ref));
      },
    );
    expression = expression.replace(/\$([A-Za-z][A-Za-z0-9_]*)/g, (_, name) => {
      const column = bindings.column(name);
      return column ? `$${column}` : bind({ constant: bindings.value(name) });
    });
    expression = expression.replace(
      /(@(?:[+-]?\d+|[<>]|[IVX]+)(?:\$(?:[+-]?\d+|[<>]))?|\$(?:[+-]?\d+|[<>]))\.\.(@(?:[+-]?\d+|[<>]|[IVX]+)(?:\$(?:[+-]?\d+|[<>]))?|\$(?:[+-]?\d+|[<>]))/g,
      (_, a, b) => bind({ range: range(table, a, b, row, col) }),
    );
    expression = expression.replace(
      /@(?:[+-]?\d+|[<>]|[IVX]+)(?:\$(?:[+-]?\d+|[<>]))?|\$(?:[+-]?\d+|[<>])/g,
      (ref) => {
        const [r, c] = address(ref, row, col, table);
        return bind({ field: cell(table, r, c) });
      },
    );
    return evaluateCalc(expression, refs, modes);
  }
  const assignments = [];
  for (const part of formula.split("::")) {
    const match = /^\s*([^=]+)=(.*)$/.exec(part);
    if (!match) {
      diagnostics.push({ line, message: "Invalid TBLFM assignment." });
      continue;
    }
    // Org splits the mode suffix at the last semicolon.
    const split = match[2].lastIndexOf(";"),
      expression = split < 0 ? match[2] : match[2].slice(0, split),
      modeText = split < 0 ? null : match[2].slice(split + 1);
    const target = match[1].trim(),
      named = /^\$([A-Za-z][A-Za-z0-9_]*)$/.exec(target),
      namedField = named && bindings.fields.get(named[1]),
      field = target.startsWith("@") || !!namedField,
      targets = [];
    try {
      if (/^\s*'/.test(expression))
        throw new Error("Emacs Lisp formulas are unsupported.");
      const modes = parseModes(modeText, bindings.format);
      if (named && !namedField)
        throw new Error(
          `Unknown named field target ${target}; use a numeric column target for a named column.`,
        );
      if (namedField) targets.push([namedField.row, namedField.col]);
      else if (field) {
        if (
          profile === ORG_EMACS &&
          !/^@(?:\d+|[<>])\$(?:\d+|[<>])$/.test(target)
        )
          throw new Error(
            "Emacs-order field targets require absolute @row$column addresses; target ranges are unsupported.",
          );
        targets.push(address(target, 1, 1, table));
      } else {
        if (profile === ORG_EMACS && !/^\$(?:\d+|[<>])$/.test(target))
          throw new Error(
            "Emacs-order column targets must be absolute numeric columns or boundaries; target ranges are unsupported.",
          );
        const first = bindings.marked
          ? 1
          : table.hlines.length
            ? table.hlines[0] + 1
            : 1;
        for (let row = first; row <= table.rows.length; row++) {
          const marker = table.rows[row - 1][0];
          if (
            /^[!$^_\/]$/.test(marker) ||
            (bindings.marked && !/^[#*]$/.test(marker))
          )
            continue;
          targets.push(address(target, row, 1, table));
        }
      }
      for (const [row, col] of targets) checkAddress(row, col, table);
      assignments.push({
        target,
        key: named ? named[1] : target,
        field,
        targets,
        expression: expression.trim(),
        modes,
      });
    } catch (error) {
      diagnostics.push({ line, message: error.message });
    }
  }
  const apply = (assignment, row, col) => {
    const { target, expression, modes } = assignment;
    try {
      table.rows[row - 1][col - 1] = formatCalc(
        calculate(expression, row, col, modes),
        modes,
      );
    } catch (error) {
      diagnostics.push({
        line,
        message: `${target}, row ${row}: ${error.message}`,
      });
    }
  };
  if (profile === ORG_EMACS) {
    // Org sorts stored targets lexically, applies columns within each row,
    // protects every field target, then evaluates the sorted field formulas.
    const fields = new Set(),
      columns = new Set(),
      raw = new Set();
    for (const assignment of assignments) {
      const { key, target, field, targets } = assignment;
      const identity = field
        ? targets.map(([r, c]) => `${r},${c}`)
        : [String(address(target, 1, 1, table)[1])];
      const seen = field ? fields : columns;
      if (raw.has(key) || identity.some((id) => seen.has(id)))
        diagnostics.push({
          line,
          message: `Duplicate formula target ${target}; several formulas cannot set the same field or column in Emacs order.`,
        });
      raw.add(key);
      identity.forEach((id) => seen.add(id));
    }
    if (diagnostics.length) return diagnostics;
    assignments.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    const columnAssignments = assignments.filter((a) => !a.field);
    for (const assignment of columnAssignments)
      assignment.byRow = new Map(
        assignment.targets.map((target) => [target[0], target]),
      );
    for (let row = 1; row <= table.rows.length; row++) {
      for (const assignment of columnAssignments) {
        const target = assignment.byRow.get(row);
        if (target && !fields.has(`${target[0]},${target[1]}`))
          apply(assignment, ...target);
      }
    }
    for (const assignment of assignments.filter((a) => a.field))
      for (const target of assignment.targets) apply(assignment, ...target);
  } else {
    for (const assignment of assignments)
      for (const target of assignment.targets) apply(assignment, ...target);
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
export function recalculateOrg(src, { profile } = {}) {
  validateProfile(profile, "org");
  src = orgParserSource(src);
  const lines = src.split("\n"),
    diagnostics = [],
    document = orgDocument(src, diagnostics);
  const tables = document.starts.map((start) => {
    let end = start;
    const tableLines = [];
    while (end < lines.length && /^\s*\|/.test(lines[end]))
      tableLines.push(lines[end++]);
    return { start, end, table: parseTable(tableLines) };
  });
  const byStart = new Map(tables.map(({ start, table }) => [start, table]));
  // References read the current pass state. They never recursively recalculate
  // another table, so forward links, self references and cycles stay bounded.
  const remote = (name, ref) =>
    remoteValue(name, ref, byStart, document, (table) =>
      tableBindings(table, { constants: document.constants }),
    );
  for (const { start, end, table } of tables) {
    const bindings = tableBindings(table, {
      line: start + 1,
      constants: document.constants,
      diagnostics,
    });
    let formulaIndex = end;
    if (profile === ORG_EMACS)
      while (formulaIndex < lines.length && !lines[formulaIndex].trim())
        formulaIndex++;
    while (
      formulaIndex < lines.length &&
      /^\s*#\+TBLFM:/i.test(lines[formulaIndex])
    ) {
      diagnostics.push(
        ...recalculateTable(
          table,
          lines[formulaIndex].replace(/^\s*#\+TBLFM:\s*/i, ""),
          { line: formulaIndex + 1, bindings, profile, remote },
        ),
      );
      formulaIndex++;
      if (profile === ORG_EMACS) break; // Only the first stored formula line is active.
    }
  }
  const output = lines.slice();
  for (const { start, end, table } of tables.slice().reverse())
    output.splice(start, end - start, ...tableSource(table));
  return { tables, diagnostics, source: output.join("\n") };
}
