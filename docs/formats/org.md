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

## Named inputs and marked rows

The first column can hold Org calculation markers. The first `!` row names
columns; use those names on the right side of a formula and keep its column target
numeric. File constants apply throughout the document, including tables above the
keyword. A `$` row supplies parameters for just that table and overrides matching
file constants:

```text
#+CONSTANTS: tax=0.10
| ! | Qty | UnitPrice | Total |
| # |   3 |         4 |     0 |
| * |   2 |         7 |     0 |
| $ | tax=0.20 |      |       |
#+TBLFM: $4=$Qty*$UnitPrice*(1+$tax);%.2f
```

The Total values are **14.40** and **16.80**. In a table containing calculation
marks, column formulas run only on `#` or `*` rows; unmarked rows and metadata
rows stay unchanged. Explicit field formulas can still update an unmarked row.
Without calculation marks, the ordinary header/separator rule below applies.

| Marker or syntax | Meaning |
| --- | --- |
| `!` | Name columns in this row; the first name row is used |
| `^` | Name fields in the immediately preceding data line |
| `_` | Name fields in the immediately following data line |
| `$` | Supply table parameters as name=number fields |
| `#`, `*` | Select a row for column-formula recalculation |
| `$Qty..$UnitPrice` | Use column aliases as range endpoints |
| `#+CONSTANTS: tax=0.10` | Define a file-wide numeric constant |

Named fields are also valid assignment targets. For example, the two names here
refer to the row between the marker lines:

```text
| _ | base | result |
|   |    3 |      0 |
| ^ | input | answer |
#+TBLFM: $answer=$base*2
```

The result is **6**. Field names do not cross horizontal separator lines. Named
field values are captured **before** the recalculation pass, so reading a name
does not see a value written earlier in that pass. Use an explicit numeric cell
reference when you need the current cell value.

Names start with an ASCII letter and contain letters, digits or underscores;
lookup is case-sensitive. Column aliases take precedence over named fields,
then table parameters, then file constants. The first duplicate column alias
wins; later duplicate field names, parameters and file constants win. Supported
bindings contain finite decimal or scientific-notation numbers representable
by the existing JavaScript/mathjs number type; nonzero underflow is diagnosed.
This does not add arbitrary-precision Calc arithmetic. Unknown names,
unsupported parameter/constant values and invalid targets produce source-line
diagnostics instead of selecting a lower-precedence value.

Source, example and export blocks are literal: their apparent tables/formulas and
constants do not execute. Comment blocks are omitted. Formula references inside
quoted string arguments are not substituted. Preview/copy retain metadata rows;
this is not the complete native Org export layout.

## Supported subset and limits

For ordinary unmarked tables, column formulas apply to rows after the first horizontal separator, or all rows when no separator exists. Marked tables use the row-selection rules above. Field formulas target one cell. Formula assignments separated by `::` run in order and can use earlier results.

Supported references include `$3`, `@2$3`, relative `@-1`, boundaries `@<`, `@>`, `$<`, `$>`, and hlines `@I`, `@II`. Ranges such as `@2$1..@>$1` become arrays. `vsum`, `vmean`, `vmin`, `vmax`, `vcount`, `vprod`, ordinary arithmetic, and common math functions are available. `;%.2f` formats a numeric result and `;N` coerces nonnumeric values to zero. Otherwise ranges skip nonnumeric cells.

**Copy recalculated source** copies updated, aligned tables and the original surrounding source. Auto detects `#+TBLFM:`, Org keywords, and table hlines. Headings, simple lists, emphasis, and links are rendered through the Org AST.

Emacs Lisp formulas produce an explicit unsupported diagnostic. This is a core subset: remote tables, iteration modes, inherited property/external constants, expression-valued or string bindings, global format parameters, arbitrary Calc syntax, and exact Emacs display-width alignment are not implemented. Formula assignments retain their documented source order; native column/field priority and duplicate-target behavior remain a separate compatibility gap. Reference checks compare supported numeric tables against `emacs --batch`; the Lisp error example is excluded from that comparison.

The source editor highlights headings, table separators and numbers, keywords, and formula references. Source blocks remain distinct from surrounding Org prose. Highlighting is a lexical aid; rendering diagnostics report evaluation errors.

An out-of-range address produces a diagnostic instead of silently creating a cell.
If a result is unexpected, check row numbering and assignment order; this adapter
does not repeatedly iterate formulas until they converge. See the
[feature comparison and glossary](../format-comparison.md).

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.

Compare the available libraries and definition syntax in
[built-in and custom functions](../function-comparison.md).

<!-- compatibility:start -->
## Tracked compatibility status

These entries share the [central limitations ledger](../limitations.md). “Needs detailed audit” means the disclosure is recorded, while its complete upstream case coverage is still being developed.

| ID | Status | Area |
| --- | --- | --- |
| ORG-01 | Needs detailed audit | This is a JavaScript spreadsheet subset, not Emacs Org, Babel, or the complete Emacs Calc language |
| ORG-02 | Known gap | Remote tables, evaluation order, remaining Calc modes and native layout remain incomplete |
| ORG-03 | Needs detailed audit | Surrounding prose supports basic headings, lists, emphasis, and links, rather than the full Org… |
| ORG-04 | Needs detailed audit | Recalculation updates the preview |
| ORG-05 | Resolved | Numeric named bindings and marked-row selection match Emacs fixtures |
| ORG-06 | Resolved | Literal Org blocks no longer run formulas or install constants |
<!-- compatibility:end -->
