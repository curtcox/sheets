import { parseCalc } from "../formats/org/calc.js";
import { address, checkAddress } from "../formats/org/references.js";
import { modelText } from "./model.js";
const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
export function numericCell(text) {
  const s = String(text).trim();
  return (
    numeric.test(s) &&
    Number.isFinite(Number(s)) &&
    !(Number(s) === 0 && /[1-9]/.test(s.split(/[eE]/)[0])) &&
    s.replace(/^[+-]?0*|[.eE+-]/g, "").length <= 15
  );
}
export function columnName(index) {
  let text = "";
  for (let n = index; n > 0; n = Math.floor((n - 1) / 26))
    text = String.fromCharCode(65 + ((n - 1) % 26)) + text;
  return text;
}
const cellName = (r, c) => `$${columnName(c)}$${r}`;
const sheetRef = (name) => `'${name.replaceAll("'", "''")}'!`;
const functions = {
  if: "IF",
  vsum: "SUM",
  vmean: "AVERAGE",
  vmin: "MIN",
  vmax: "MAX",
  vcount: "COUNT",
  vprod: "PRODUCT",
  abs: "ABS",
  sqrt: "SQRT",
  exp: "EXP",
  ln: "LN",
  floor: "INT",
  ceil: "INT",
  min: "MIN",
  max: "MAX",
};
function staticTables(model) {
  const tables = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.type === "table") {
        const rows = [];
        const collect = (items) => {
          for (const v of items) {
            if (v.type === "row")
              rows.push(
                (v.children || [])
                  .filter((c) => c.type === "cell")
                  .map((c) => modelText(c.children || []).trim()),
              );
            else collect(v.children || []);
          }
        };
        collect(n.children || []);
        tables.push({
          name: `Table ${tables.length + 1}`,
          rows,
          columns: Math.max(0, ...rows.map((r) => r.length)),
        });
      } else walk(n.children || []);
    }
  };
  walk(model);
  return tables;
}
export function buildWorkbook(snapshot, { valuesOnly = false } = {}) {
  if (
    !valuesOnly &&
    !snapshot.workbook &&
    ["org", "hurmet", "calca", "numbat", "calcfile", "quarto"].includes(
      snapshot.state.type,
    )
  )
    throw Error(
      `Working Excel formulas for ${snapshot.state.type} are not supported yet. Choose the explicitly labeled values-only snapshot, or use Org tables for working formulas.`,
    );
  const errors = [],
    diagnostics = [];
  if (!valuesOnly && snapshot.workbook?.diagnostics?.length)
    throw Error(
      "Resolve Org calculation diagnostics before exporting working formulas.",
    );
  const tables = structuredClone(
    snapshot.workbook?.tables || staticTables(snapshot.model),
  );
  if (!tables.length)
    throw Error(
      "This document has no tables to export. Use Word, Markdown or text for calculation-line documents.",
    );
  if (tables.reduce((n, t) => n + t.rows.length * t.columns, 0) > 100000)
    throw Error("Workbook exceeds 100,000 cells.");
  const assumptions = [],
    assumptionMap = new Map();
  const constant = (table, name, value) => {
    const key = `${table.name}:${name}`;
    if (!assumptionMap.has(key)) {
      if (!numericCell(value))
        throw Error(`Constant ${name} is outside Excel numeric precision.`);
      assumptions.push([`${table.name}: ${name}`, String(value)]);
      assumptionMap.set(key, assumptions.length + 1);
    }
    return {
      type: "reference",
      sheet: "Inputs",
      row: assumptionMap.get(key),
      col: 2,
    };
  };
  const nodes = new Map(),
    formulas = new Map();
  const key = (sheet, row, col) => `${sheet}:${row}:${col}`;
  tables.forEach((t, i) => {
    t.originalName = t.name;
    t.name = `Table ${i + 1}`;
  });
  function formulaTree(formula, table) {
    if (formula.lisp)
      throw Error("Emacs Lisp formulas cannot be translated to Excel.");
    const { modes } = formula;
    if (modes.frac || modes.keepEmpty || modes.numbers || modes.prec !== 12)
      throw Error(
        "Fraction, empty-field, numeric-coercion and custom precision modes need values-only export.",
      );
    const refs = [];
    const bind = (ref) => `\uE000${refs.push(ref) - 1}\uE001`;
    function reference(ref, owner = table) {
      const parts = ref.split("..");
      const coordinates = parts.map((part) =>
        address(part, formula.row, formula.col, owner),
      );
      if (parts.length === 2) {
        const [[r1, c1], [r2, c2]] = coordinates,
          first = Math.ceil(Math.min(r1, r2)),
          last = Math.floor(Math.max(r1, r2)),
          left = Math.min(c1, c2),
          right = Math.max(c1, c2);
        checkAddress(first, left, owner);
        checkAddress(last, right, owner);
        const items = [];
        for (let row = first; row <= last; row++)
          for (let col = left; col <= right; col++)
            items.push({ type: "reference", sheet: owner.name, row, col });
        return { type: "vector", items, skipEmpty: true };
      }
      const [row, col] = coordinates[0];
      checkAddress(row, col, owner);
      return { type: "reference", sheet: owner.name, row, col };
    }
    let expression = formula.expression.replace(
      /\bremote\s*\(([^(),]*),([^()]*)\)/g,
      (_, name, ref) => {
        const other = tables.find(
          (t) => t.originalName.toLowerCase() === name.trim().toLowerCase(),
        );
        if (!other) throw Error(`Unknown remote table ${name}.`);
        if (
          !/^@(?:\d+|[<>]|[IVX]+)\$(?:\d+|[<>])(?:\.\.@(?:\d+|[<>]|[IVX]+)\$(?:\d+|[<>]))?$/.test(
            ref.trim(),
          )
        )
          throw Error(
            "Only absolute numeric remote references translate to Excel.",
          );
        return bind(reference(ref.trim(), other));
      },
    );
    expression = expression.replace(
      /\$([A-Za-z][A-Za-z0-9_]*)(?:\.([A-Za-z][A-Za-z0-9_]*))?/g,
      (_, name, shared) => {
        if (shared) {
          const full = name + "." + shared;
          const value = table.export.shared[full];
          if (value === undefined)
            throw Error(`Missing imported input ${full}.`);
          return bind(constant(table, full, value));
        }
        const col = table.export.columns[name];
        if (col) return `$${col}`;
        const field = table.export.fields[name];
        if (field) return bind(reference(`@${field.row}$${field.col}`));
        if (!Object.hasOwn(table.export.constants, name))
          throw Error(`Unknown constant ${name}.`);
        return bind(constant(table, name, table.export.constants[name]));
      },
    );
    const refPattern = String.raw`(?:@(?:[+-]?\d+|[<>]|[IVX]+)(?:\$(?:[+-]?\d+|[<>]))?|\$(?:[+-]?\d+|[<>]))`;
    expression = expression.replace(
      new RegExp(`${refPattern}\\.\\.${refPattern}`, "g"),
      (ref) => bind(reference(ref)),
    );
    expression = expression.replace(new RegExp(refPattern, "g"), (ref) =>
      bind(reference(ref)),
    );
    const convert = (node) => {
      if (node.type === "ref") return refs[node.index];
      if (node.type === "number") {
        if (!numericCell(node.value))
          throw Error("Literal exceeds Excel numeric precision.");
        return node;
      }
      if (node.type === "call" && !functions[node.name])
        throw Error(`Calc function ${node.name} is not in the Excel subset.`);
      if (
        node.type === "binary" &&
        !["+", "-", "*", "/", "^"].includes(node.op)
      )
        throw Error(`Operator ${node.op} is not in the Excel subset.`);
      if (
        ![
          "call",
          "binary",
          "compare",
          "between",
          "neg",
          "percent",
          "vector",
        ].includes(node.type)
      )
        throw Error(`Expression ${node.type} is not in the Excel subset.`);
      return {
        ...node,
        ...(node.args ? { args: node.args.map(convert) } : {}),
        ...(node.items ? { items: node.items.map(convert) } : {}),
        ...(node.arg ? { arg: convert(node.arg) } : {}),
      };
    };
    let tree = convert(parseCalc(expression));
    let places;
    if (modes.printf) {
      const match = /^%\.(\d+)f$/.exec(modes.printf);
      if (!match)
        throw Error("Only ;%.Nf numeric formatting translates to Excel.");
      places = Number(match[1]);
    } else if (modes.float[0] === "fix") places = modes.float[1];
    if (places !== undefined) {
      if (places < 0 || places > 12)
        throw Error("Excel rounding supports 0–12 decimal places.");
      tree = { type: "round", places, arg: tree };
    }
    return tree;
  }
  const emit = (n) => {
    if (n.type === "reference")
      return `N(${sheetRef(n.sheet)}${cellName(n.row, n.col)})`;
    if (n.type === "number") return String(Number(n.value));
    if (n.type === "vector")
      return n.items
        .map((item) =>
          n.skipEmpty && item.type === "reference"
            ? sheetRef(item.sheet) + cellName(item.row, item.col)
            : emit(item),
        )
        .join(",");
    if (n.type === "neg") return `(-${emit(n.arg)})`;
    if (n.type === "percent") return `(${emit(n.arg)}/100)`;
    if (n.type === "round") return `ROUND(${emit(n.arg)},${n.places})`;
    if (n.type === "binary")
      return `(${emit(n.args[0])}${n.op}${emit(n.args[1])})`;
    if (n.type === "call") {
      const args = n.args.flatMap((arg) =>
        arg.type === "vector" ? arg.items : [arg],
      );
      if (args.length > 254)
        throw Error(
          "Excel functions accept at most 255 arguments. Use a smaller range.",
        );
      if (n.name === "ceil") return `(-INT(-(${emit(n.args[0])})))`;
      // PRODUCT with no numeric values returns zero in Excel; Calc's empty
      // product is one. The explicit identity preserves that behavior.
      const argumentsText = n.args.map(emit).join(",");
      return `${functions[n.name]}(${n.name === "vprod" ? "1" + (argumentsText ? "," : "") : ""}${argumentsText})`;
    }
    if (n.type === "compare") {
      const pairs = [];
      for (let i = 1; i < n.args.length; i++)
        for (let j = n.op === "!=" ? 0 : i - 1; j < i; j++)
          pairs.push(
            `${emit(n.args[j])}${n.op === "==" ? "=" : n.op === "!=" ? "<>" : n.op}${emit(n.args[i])}`,
          );
      return `IF(AND(${pairs.join(",")}),1,0)`;
    }
    if (n.type === "between")
      return `IF(AND(${emit(n.args[0])}${n.ops[0]}${emit(n.args[1])},${emit(n.args[1])}${n.ops[1]}${emit(n.args[2])}),1,0)`;
    throw Error("Unsupported expression.");
  };
  if (!valuesOnly)
    for (const table of tables)
      for (const f of table.export?.formulas || []) {
        try {
          const tree = formulaTree(f, table),
            id = key(table.name, f.row, f.col),
            formula = emit(tree);
          if (formula.length > 8192)
            throw Error(
              "Translated formula exceeds Excel’s 8,192 character limit.",
            );
          nodes.set(id, tree);
          formulas.set(id, { ...f, formula });
        } catch (e) {
          errors.push(`Line ${f.line}: ${e.message}`);
        }
      }
  // Validate graph and referenced cell types. Formula-like literals are always strings.
  const visiting = new Set(),
    done = new Set();
  function check(id) {
    if (done.has(id)) return;
    if (visiting.has(id))
      throw Error(
        "Cyclic or self-referencing formulas need values-only export.",
      );
    visiting.add(id);
    const n = nodes.get(id);
    if (n) walk(n);
    visiting.delete(id);
    done.add(id);
  }
  function walk(n) {
    if (n.type === "reference") {
      if (n.sheet === "Inputs") return;
      const text = tables.find((t) => t.name === n.sheet).rows[n.row - 1][
        n.col - 1
      ];
      if (String(text).trim() && !numericCell(text))
        throw Error(
          `Referenced ${n.sheet} ${cellName(n.row, n.col)} is not a plain Excel-precision number.`,
        );
      check(key(n.sheet, n.row, n.col));
    }
    for (const child of n.args || n.items || []) walk(child);
    if (n.arg) walk(n.arg);
  }
  try {
    for (const id of nodes.keys()) check(id);
  } catch (e) {
    errors.push(e.message);
  }
  if (errors.length) throw Error([...new Set(errors)].slice(0, 12).join("\n"));
  const sheets = tables.map((t) => ({
    name: t.name,
    rows: t.rows.map((row, r) =>
      row.map((value, c) => {
        const f = formulas.get(key(t.name, r + 1, c + 1));
        if (f && !numericCell(value))
          throw Error(
            `Line ${f.line}: cached formula result is not an Excel-precision number.`,
          );
        return {
          value: String(value),
          ...(f ? { formula: f.formula, line: f.line } : {}),
          numeric: numericCell(value),
        };
      }),
    ),
  }));
  if (assumptions.length)
    sheets.push({
      name: "Inputs",
      rows: [["Input", "Value"], ...assumptions].map((row) =>
        row.map((value) => ({ value, numeric: numericCell(value) })),
      ),
    });
  sheets.push({
    name: "Document",
    rows: [
      ["Title", snapshot.title],
      ["Format", snapshot.state.type],
      [
        "Formula mode",
        valuesOnly
          ? "Explicit values-only snapshot"
          : "Org arithmetic, comparisons, IF and numeric aggregates; unsupported formulas block export",
      ],
      [
        "Content (first 30,000 characters)",
        modelText(snapshot.model).slice(0, 30000),
      ],
      [
        "Source (first 30,000 characters; download source for the complete document)",
        snapshot.state.src.slice(0, 30000),
      ],
      ...tables.map((t) => [
        t.name,
        `${t.originalName}; source line ${t.line || "unknown"}`,
      ]),
    ].map((row) => row.map((value) => ({ value, numeric: false }))),
  });
  diagnostics.push(
    valuesOnly
      ? "This workbook contains fixed values, not working formulas."
      : "Excel uses binary floating-point, unlike Calc exact arithmetic. Recalculation can differ in precision and rounding. Working formulas use Excel dependency order, rather than repeating an Org procedural recalculation pass.",
  );
  return { sheets, diagnostics, formulaCount: formulas.size };
}
export async function workbookBytes(snapshot, id, options) {
  const XLSX = await import("../../vendor/xlsx.js");
  const model = buildWorkbook(snapshot, options),
    wb = XLSX.utils.book_new();
  for (const sheet of model.sheets) {
    const ws = {};
    let rows = sheet.rows.length,
      cols = 0;
    sheet.rows.forEach((row, r) => {
      cols = Math.max(cols, row.length);
      row.forEach((cell, c) => {
        ws[XLSX.utils.encode_cell({ r, c })] = {
          t: cell.numeric ? "n" : "s",
          v: cell.numeric ? Number(cell.value) : cell.value,
          ...(cell.formula ? { f: cell.formula } : {}),
          ...(cell.line
            ? {
                c: [
                  {
                    a: "Sheets",
                    t: `Source line ${cell.line}; cached value ${cell.value}`,
                  },
                ],
              }
            : {}),
        };
      });
    });
    ws["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(0, rows - 1), c: Math.max(0, cols - 1) },
    });
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  wb.Workbook = {
    CalcPr: { calcMode: "auto", fullCalcOnLoad: true, forceFullCalc: true },
  };
  let bytes = XLSX.write(wb, {
    bookType: id,
    type: "array",
    compression: true,
  });
  // SheetJS CE does not serialize CalcPr. Set the standard OOXML flag in our
  // generated package, without modifying any vendored library code.
  if (id === "xlsx") {
    const { unzipSync, zipSync, strFromU8, strToU8 } = await import(
      "../../vendor/fflate.js"
    );
    const files = unzipSync(new Uint8Array(bytes));
    files["xl/workbook.xml"] = strToU8(
      strFromU8(files["xl/workbook.xml"]).replace(
        "</workbook>",
        '<calcPr calcId="0" calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>',
      ),
    );
    bytes = zipSync(files, { level: 6 }).buffer;
  }
  return { bytes, diagnostics: model.diagnostics };
}
