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
export function address(ref, row, col, table) {
  const match = reference.exec(ref);
  if (!match || (!match[1] && !match[2]))
    throw new Error(`Invalid reference ${ref}`);
  return [
    index(match[1], row, table.rows.length, table.hlines, true),
    index(match[2], col, table.columns, [], false),
  ];
}
export function checkAddress(row, col, table) {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    row < 1 ||
    row > table.rows.length ||
    col < 1 ||
    col > table.columns
  )
    throw new Error(`Reference @${row}$${col} is outside the table.`);
}
export function cell(table, r, c, numeric) {
  checkAddress(r, c, table);
  const text = table.rows[r - 1][c - 1],
    value = Number(text);
  return text !== "" && Number.isFinite(value) ? value : numeric ? 0 : text;
}
export function range(table, a, b, row, col, numeric) {
  const [r1, c1] = address(a, row, col, table),
    [r2, c2] = address(b, row, col, table),
    values = [],
    first = Math.ceil(Math.min(r1, r2)),
    last = Math.floor(Math.max(r1, r2)),
    left = Math.min(c1, c2),
    right = Math.max(c1, c2);
  // Validate before traversing; huge invalid ranges must not run huge loops.
  checkAddress(first, left, table);
  checkAddress(last, right, table);
  if ((last - first + 1) * (right - left + 1) > 100000)
    throw new Error("Org range exceeds 100,000 cells.");
  for (let r = first; r <= last; r++)
    for (let c = left; c <= right; c++) {
      const value = cell(table, r, c, numeric);
      if (typeof value === "number" || numeric) values.push(value);
    }
  return values;
}

export function remoteValue(
  name,
  descriptor,
  tables,
  document,
  numeric,
  bindingsFor,
) {
  name = name.trim();
  if (!/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(name))
    throw new Error(
      "Remote table names must be literal names; ID/file lookup and name indirection are unsupported.",
    );
  const start = document.namedTables.get(name.toLowerCase()),
    table = tables.get(start);
  if (!table)
    throw new Error(
      `Cannot find same-document remote table ${name}. ID/file lookup is unsupported.`,
    );
  const bindings = bindingsFor(table);
  const field = /^\$([A-Za-z][A-Za-z0-9_]*)$/.exec(descriptor.trim());
  if (field && !bindings.column(field[1])) return bindings.value(field[1]);
  const ref = descriptor
    .trim()
    .replace(/\$([A-Za-z][A-Za-z0-9_]*)/g, (_, name) => {
      const col = bindings.column(name);
      if (!col) throw new Error(`Undefined remote column $${name}.`);
      return `$${col}`;
    });
  const absolute = /^@(?:\d+|[<>]|[IVX]+)\$(?:\d+|[<>])$/,
    parts = ref.split("..");
  if (parts.length > 2 || !parts.every((part) => absolute.test(part.trim())))
    throw new Error(
      "Remote references require absolute @row$column cells or ranges; relative and dynamic references are unsupported.",
    );
  if (parts.length === 2)
    return range(table, parts[0].trim(), parts[1].trim(), 1, 1, numeric);
  const [row, col] = address(ref, 1, 1, table);
  return cell(table, row, col, numeric);
}
