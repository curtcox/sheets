import { escapeHTML } from "../../util.js";

const cookie = /^<[lrc]?\d*>$/;
// The first digit divides the decimal prefix from its suffix. Keeping digits
// out of the prefix avoids quadratic backtracking on long invalid field text.
export const numberLike =
  /^(?:[<>]?[-+^.]*[0-9][-+^.0-9eEdDx()%:]*|[<>]?[-+]?0[xX][0-9a-fA-F.]+|[<>]?[-+]?[0-9]+#[0-9a-zA-Z.]+|nan|[-+u]?inf)$/;
const marker = new Set(["", "/", "#", "!", "$", "*", "_", "^"]);

function alignments(table, cookieRows) {
  const marked =
    table.rows.every((row) => marker.has(row[0])) &&
    table.rows.some((row) => row[0] !== "");
  return Array.from({ length: table.columns }, (_, column) => {
    let count = 0,
      numbers = 0,
      previous = false,
      override;
    for (let row = 0; row < table.rows.length; row++) {
      const cells = table.rows[row],
        value = cells[column];
      if (
        cookieRows.has(row) ||
        cells[0] === "/" ||
        (marked && ["!", "$", "_", "^"].includes(cells[0]))
      ) {
        const match = /^<([lrc])\d*>$/.exec(value);
        if (match) override = { l: "left", r: "right", c: "center" }[match[1]];
      } else if (!override) {
        count++;
        // Native HTML export tests the exported cell text. Escaped < and >
        // and superscript markup therefore do not look numeric to its regexp.
        const exported = escapeHTML(value);
        previous =
          (numberLike.test(exported) &&
            !/\S\^(?:[+-]?[A-Za-z0-9.,\\]*[A-Za-z0-9]|\()/.test(value)) ||
          (value === "" && previous);
        if (previous) numbers++;
      }
    }
    return override || (count > 0 && numbers * 2 >= count ? "right" : "left");
  });
}

function cellHTML(cell, header, alignment) {
  const tag = header ? "th" : "td",
    scope = header ? ' scope="col"' : "",
    wrap = /\s/.test(cell) ? " org-table-wrap" : "";
  return `<${tag}${scope} class="org-${alignment}${wrap}">${escapeHTML(cell)}</${tag}>`;
}

export function renderOrgTable(table) {
  const cookieRows = new Set();
  table.rows.forEach((row, index) => {
    if (
      row.some((cell) => cookie.test(cell)) &&
      row.every((cell) => cell === "" || cookie.test(cell))
    )
      cookieRows.add(index);
  });
  const alignment = alignments(table, cookieRows),
    layout = table.layout.filter((row) => row === null || !cookieRows.has(row)),
    groups = [];
  let current = [],
    seenRow = false,
    header = false;
  for (const [position, row] of layout.entries()) {
    if (row === null) {
      // A single trailing rule does not create a header. Native export does
      // consider another following rule sufficient, even without body rows.
      if (seenRow && position < layout.length - 1) header = true;
      if (current.length) groups.push(current);
      current = [];
    } else {
      seenRow = true;
      current.push(row);
    }
  }
  if (current.length) groups.push(current);
  const html = groups
    .map((rows, group) => {
      const isHeader = header && group === 0,
        tag = isHeader ? "thead" : "tbody";
      const content = rows.map((row) => {
        const cells = table.rows[row]
          .map((cell, column) => cellHTML(cell, isHeader, alignment[column]))
          .join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      return `<${tag}>${content}</${tag}>`;
    })
    .join("");
  return `<div class="org-table-scroll" role="region" aria-label="Org table" tabindex="0"><table>${html}</table></div>`;
}
