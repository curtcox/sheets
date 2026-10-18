# Org tables

Sheets parses surrounding Org structure with [orga](https://github.com/orgapp/orgajs) 5.0.0 and recalculates tables with its own JavaScript evaluator. It targets a documented subset of [Org spreadsheet formulas](https://orgmode.org/manual/The-Spreadsheet.html).

Use Org tables for small purchase orders, numeric summaries, and calculations that
are easiest to inspect row by row. Select **Org tables**, or include `#+TBLFM:` for
Auto detection. Source downloads use `.org`.
[Open the starter example](../../index.html?example=org-basic&format=org).

## Start with a column formula

```text
| Quantity | Price | Total |
|----------+-------+-------|
| 3        | 4     | 0     |
| 2        | 7     | 0     |
#+TBLFM: $3=$1*$2
```

The preview replaces the two Total cells with **12** and **14**. Keep the formula
directly after the table. Source remains what you typed until you choose **Copy
recalculated source** and paste the updated text. A normal source download saves
the current editor text, while a rendered HTML export contains the calculated table.

## Formula reference

| Syntax | Meaning |
| --- | --- |
| `$3=$1*$2` | Fill column 3 using columns 1 and 2 of each data row |
| `@2$3=12` | Set one field: row 2, column 3, counting header rows |
| `@-1$2` | Read column 2 of the previous row |
| `@<$1`, `@>$1` | First or last row in column 1 |
| `@2$1..@>$1` | A range from row 2 to the last row |
| `vsum(...)`, `vmean(...)`, `vcount(...)` | Aggregate a range |
| `::` | Separate assignments, evaluated left to right |
| `;%.2f` | Format the result with two decimal places |
| `;N` | Treat nonnumeric referenced values as zero |

Row numbers count actual table rows, including header rows; horizontal separator
lines do not count as rows. Thus `@2` in the example is the first data row. A column
formula starts after the first separator, so include one to protect the headings.

## Supported subset and limits

Column formulas apply to rows after the first horizontal separator, or all rows when no separator exists. Field formulas target one cell. Formula assignments separated by `::` run in order and can use earlier results.

Supported references include `$3`, `@2$3`, relative `@-1`, boundaries `@<`, `@>`, `$<`, `$>`, and hlines `@I`, `@II`. Ranges such as `@2$1..@>$1` become arrays. `vsum`, `vmean`, `vmin`, `vmax`, `vcount`, `vprod`, ordinary arithmetic, and common math functions are available. `;%.2f` formats a numeric result and `;N` coerces nonnumeric values to zero. Otherwise ranges skip nonnumeric cells.

**Copy recalculated source** copies updated, aligned tables and the original surrounding source. Auto detects `#+TBLFM:`, Org keywords, and table hlines. Headings, simple lists, emphasis, and links are rendered through the Org AST.

Emacs Lisp formulas produce an explicit unsupported diagnostic. This is a core subset: named fields, remote tables, iteration modes, arbitrary Calc syntax, and exact Emacs display-width alignment are not implemented. Reference checks compare supported numeric tables against `emacs --batch`; the Lisp error example is excluded from that comparison.

The source editor highlights headings, table separators and numbers, keywords, and formula references. Source blocks remain distinct from surrounding Org prose. Highlighting is a lexical aid; rendering diagnostics report evaluation errors.

An out-of-range address produces a diagnostic instead of silently creating a cell.
If a result is unexpected, check row numbering and assignment order; this adapter
does not repeatedly iterate formulas until they converge. See the
[feature comparison and glossary](../format-comparison.md).

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.
