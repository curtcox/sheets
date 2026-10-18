# Org tables

Sheets parses surrounding Org structure with [orga](https://github.com/orgapp/orgajs) 5.0.0 and recalculates tables with its own JavaScript evaluator. It targets a documented subset of [Org spreadsheet formulas](https://orgmode.org/manual/The-Spreadsheet.html).

```text
| Quantity | Price | Total |
|----------+-------+-------|
| 3        | 4     | 0     |
| 2        | 7     | 0     |
#+TBLFM: $3=$1*$2
```

Column formulas apply to rows after the first horizontal separator, or all rows when no separator exists. Field formulas target one cell. Formula assignments separated by `::` run in order and can use earlier results.

Supported references include `$3`, `@2$3`, relative `@-1`, boundaries `@<`, `@>`, `$<`, `$>`, and hlines `@I`, `@II`. Ranges such as `@2$1..@>$1` become arrays. `vsum`, `vmean`, `vmin`, `vmax`, `vcount`, `vprod`, ordinary arithmetic, and common math functions are available. `;%.2f` formats a numeric result and `;N` coerces nonnumeric values to zero. Otherwise ranges skip nonnumeric cells.

**Copy recalculated source** copies updated, aligned tables and the original surrounding source. Auto detects `#+TBLFM:`, Org keywords, and table hlines. Headings, simple lists, emphasis, and links are rendered through the Org AST.

Emacs Lisp formulas produce an explicit unsupported diagnostic. This is a core subset: named fields, remote tables, iteration modes, arbitrary Calc syntax, and exact Emacs display-width alignment are not implemented. Reference checks compare supported numeric tables against `emacs --batch`; the Lisp error example is excluded from that comparison.

The source editor highlights headings, table separators and numbers, keywords, and formula references. Source blocks remain distinct from surrounding Org prose. Highlighting is a lexical aid; rendering diagnostics report evaluation errors.
