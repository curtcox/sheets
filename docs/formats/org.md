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
directly after the table. The **Org calculation** selector starts in **Legacy**,
which preserves existing source-order links; choose **Emacs order** explicitly
for native target scheduling. Source remains what you typed until you choose **Copy
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
| `::` | Separate assignments; scheduling follows the selected mode |
| `;%.2f` | Format the result with two decimal places |
| `;N` | Convert referenced text to numbers; nonnumeric text becomes zero |
| `;R`, `;n3`, `;F` | Other Calc modes; see **Calc arithmetic and modes** below |

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
bindings contain decimal or scientific-notation numbers, which Calc reads
exactly. Unknown names, unsupported parameter/constant values and invalid targets
produce source-line diagnostics instead of selecting a lower-precedence value.
A `$` row may also set `%=%.2f`, a table-wide format that Org applies to formulas
with a mode suffix.

Source, example and export blocks are literal: their apparent tables/formulas and
constants do not execute. Comment blocks are omitted. Calc strings are
unsupported, so a quoted formula argument produces a diagnostic. Preview/copy
retain calculation marker rows and columns. Alignment-cookie-only rows are hidden
in the preview; recalculated source retains them. This is not the complete
native Org export layout.

## Calc arithmetic and modes

Formulas follow Emacs Calc with Org's default modes, in both calculation modes:

```text
| sin(30) | 1/3 | 2^0.5 | 10/4*2 | 2.5*2 | 2^70 |
|---------+-----+-------+--------+-------+------|
|       0 |   0 |     0 |      0 |     0 |    0 |
#+TBLFM: @2$1=sin(30)::@2$2=1/3::@2$3=2^0.5::@2$4=10/4*2::@2$5=2.5*2::@2$6=2^70
```

The results are **0.5**, **0.33333333**, **1.4142136**, **1.25**, **5.** and
**1180591620717411303424**. Angles are in degrees. Floats are calculated with 12
digits and displayed with up to 8 significant digits; very large or small floats
use Calc's scientific notation, such as `1e-3`. Integers stay exact, and a whole
float keeps Calc's trailing point. As in Calc, `*` binds more tightly than `/`,
so `10/4*2` means `10/(4*2)`. Parenthesize each intended division when adapting
spreadsheet formulas; Sheets does not currently warn about this precedence.
Use Calc function names such as `arcsin` and `ln`;
see the [complete function list](../function-comparison.md).

Cell text is read as Calc input: `2.50` is a float and `7` an integer. An empty
field is zero, and ranges skip empty fields. Nonnumeric text is symbolic in Calc;
Sheets reports it instead of writing a symbolic result, unless `N` converts it.

| Suffix | Effect |
| --- | --- |
| `;R`, `;D` | Radians or degrees |
| `;p20` | Calculate with 20 internal digits |
| `;n3`, `;f2`, `;s3`, `;e3` | Display 3 significant digits, 2 decimals, scientific or engineering notation |
| `;F` | Prefer fractions, so `6/4` displays `3:2` |
| `;N` | Convert referenced text with Emacs number parsing; nonnumbers become zero |
| `;E` | Keep empty fields; they become `nan` in calculations |
| `;%.2f` | One `%d`, `%f`, `%e` or `%g` conversion, applied to the displayed value |

Letters combine, as in `;N%.2f`. Like Org, a printf format applies to the 8-digit
display, so `1/3;%.10f` gives `0.3333333300`. Duration modes (`T`, `t`, `U`),
symbolic mode `S` and unit mode `u` are unsupported. Symbolic results (including
unknown names, `pi` and unknown functions), complex numbers, infinities, units,
dates and strings report source-line diagnostics and retain the cell, where Emacs
would write symbolic text or `#ERROR`.

**Changed results.** Earlier releases used JavaScript numbers in radians, with 12
display digits and ordinary precedence, and skipped nonnumeric range entries. All
links, in both calculation modes, now show the Emacs values. For example,
`sin(30)` changes from `-0.988031624093` to `0.5`, `1/3` from `0.333333333333`
to `0.33333333`, and `10/4*2` from `5` to `1.25`. Source text is unchanged. This
is an arithmetic correction rather than a new profile; see ORG-09.

## Conditions and comparisons

Use `if(c,a,b)` for numeric decisions. A zero condition is false; any other real
number is true. Comparisons `<`, `>`, `<=`, `>=`, `==` (also `=`) and `!=` return
integer **1** or **0**, with arithmetic evaluated first. Both Legacy and Emacs
order support these formulas:

```org
| Users | Monthly cost |
|-------+--------------|
| 50000 | 0            |
| 50001 | 0            |
#+TBLFM: $2=if($1>50000,25,0);%.2f
```

The costs are **0.00** and **25.00**. Nested `if` expressions work too. Only the
selected branch evaluates: `if(1,7,1/0)` returns **7**. Both branches must still
have supported syntax. Named inputs, table addresses and referenced field text
are resolved/parsed before branch selection; an unused invalid address or malformed
field still produces a diagnostic.

Comparisons use integer, fraction or decimal values at the selected Calc internal
precision, rather than the rounded display. As in Calc, `1<2<3` and `3>2>1` test the middle value against both
bounds, while `(3>2)>1` compares the Boolean result with 1 and gives **0**.
`1==1.0==1` tests equality; `1!=2!=1` gives **0** because the values are not all
distinct. Mixing directions or equality with inequalities in an unparenthesized
chain is invalid. Use explicit parentheses for more complex combinations; longer
inequality chains follow Calc's grouping rather than a general all-pairs test.

This is the numeric subset (ORG-10). Vector conditions/comparisons, unresolved
symbolic or `nan` conditions/comparisons, logical `&&`, `||`, `!`, and ternary
`c?a:b` syntax are not supported. Formula length, size and nesting bounds remain,
and a single evaluation permits at most 10,000 numeric comparisons. A selected
branch error reports the original formula line and retains the cell; always read
diagnostics even when the old value is numeric.

## Financial-model workflow limits

- `#+CONSTANTS:` values calculate but are hidden in the preview, as in native
  Org HTML export (ORG-13). Add an Inputs table and echo constants through
  field formulas, for example `@2$2=$price`, to show assumptions to readers.
- Inputs cannot be shared across source documents yet (ORG-02 / FILE-1).
  `remote()` reads tables in the same document only. Splitting a model means
  keeping duplicated constants synchronized manually.
- Tables keep single-token values and headings intact and scroll horizontally
  when too wide (ORG-11). Multiword labels can wrap between words. Focus the
  table region and use Left/Right arrows to scroll the preview; HTML exports keep
  the same layout. Very wide printed tables may need landscape or wider paper.
  `;%.2f` controls decimal places; `;$%.2f` can add a literal dollar prefix, but
  thousands grouping is unavailable.
- Preview cells cannot be edited, marked as inputs, or given per-cell notes.
  Put input instructions and source notes in the document. Org has no goal seek
  or what-if tool (ORG-04); Calca's scalar solver works in its own format.
- Generated long source links now use fragments to avoid the host’s request-line
  limit on reload (SHARED-05). Other apps can still truncate complete links;
  download source or save to HashBin for a separate copy. Offline app files are
  not a document backup. There is no supported file-to-link CLI or raw-source
  `?url=` loader yet (SHARED-06).

## Table headers and alignment

Rows in the first group before an internal separator render as column headers
with `<thead>` and `<th scope="col">`; subsequent groups use `<tbody>` and `<td>`.
Leading separators and a single trailing separator alone do not create headers.
Both calculation modes use this presentation (ORG-12).

Alignment applies to the whole column, including headers. The native default is
right alignment when at least half the cells look numeric; headers count in that
fraction. Blank cells following a numeric-looking cell continue its numeric run.
The preview classifies the recalculated values, so alignment can change after an
edit. This presentation rule does not validate a number or make currency text a
valid calculation input.

Use alignment cookies to override the inference, especially for currency strings
that contain a dollar sign or grouping commas:

```org
| Item    | Amount |
| <l>     | <r>    |
|---------+--------|
| Reserve | $2.50  |
| Deposit | $3.00  |
```

The Item column is left-aligned and Amount is right-aligned. A row containing
only cookies and empty cells is hidden in the preview. `<c>` centers a column;
the last alignment cookie wins. Cookie rows remain in source and count in
`@row` references. Width suffixes such as `<r10>` retain their alignment meaning,
but native width/truncation behavior is not implemented.

Header semantics and alignment survive sanitized HTML export and printing.
Calculation marker rows/columns remain visible under Sheets' established preview
policy; native Org export would omit them. Rich cell markup is still shown
literally, and captions, column groups and broader native export settings remain
outside this subset. Ragged rows retain the engine's existing padding. Wide
tables keep the scrolling/printing limits above.

## Emacs calculation order

Choose **Emacs order** in the editor, or open a link carrying
`?profile=org-emacs-v1`. Existing links and version-1 saved documents without a
profile retain **Legacy** rules. Selecting a mode keeps the exact source and
creates a new source link; sharing, version-2 saves, OAuth returns, view changes
and offline reloads retain it. Source downloads contain text alone, so select the
mode again when reusing a source file.

```org-emacs
| 1 | 0 | 0 |
#+TBLFM: $3=$2+1::$2=$1+10
```

This example opens in Emacs order and becomes **1, 11, 12**. Legacy produces
**1, 11, 1** because its first assignment reads the original second cell.
In Emacs order:

- Stored targets sort lexically, rather than by the order written. Columns run
  in that order **within each row**, then the next row runs. This is not a
  dependency solver: column 10 sorts before column 2.
- Cells targeted by field formulas are protected from column formulas. Sorted
  field formulas run after all column calculations; a column can therefore read
  the original value of a protected field. Named-field inputs still use their
  pre-pass snapshots.
- Duplicate targets, including a named field and its numeric address, reject the
  table's formula line before any writes. Boundary/numeric column collisions are
  also rejected. Targets must be single absolute columns or fields; target ranges
  and relative targets are unsupported.
- Only the **first** stored TBLFM line after a table is active; blank lines before
  it are allowed. Later formula lines remain source alternatives. Legacy retains
  its previous behavior of applying every immediately adjacent formula line.

## References between tables

Name an active table with a `#+NAME:` keyword (the older TBLNAME keyword also
works). `remote(prices,@2$2)` reads one field; a range such as
`remote(prices,@I$2..@>$2)` can feed an aggregate:

```org-emacs
#+NAME: prices
| Item | Price |
|------+-------|
| A    | 4     |
| B    | 7     |

| 0 | 0 |
#+TBLFM: $1=remote(prices,@2$2)::$2=vsum(remote(prices,@I$2..@>$2))
```

The last table becomes **4, 11**. Remote references work in both calculation
modes and resolve boundaries, hlines and column aliases in the **referenced**
table. A named numeric field can also supply a scalar. Table names are matched
case-insensitively; the first matching name wins when names repeat. Field and
column aliases remain case-sensitive. A name selects the first following active
table before the next heading. Literal blocks cannot supply table names or data;
blank-separated tables remain distinct.

Tables recalculate once in document order. References to earlier tables see their
updated values; references to later tables see their original values. Self
references see the current table's partially calculated state. Chains and cycles
never trigger recursive recalculation or automatic convergence. Put dependencies
before their consumers when one pass is sufficient.

Supported remote names are bare letters/digits/underscores/dots/hyphens, beginning
with a letter, digit or underscore. Addresses must be absolute @row$column cells
or ranges, with supported boundaries/hlines/column aliases, or a named numeric
field. Dynamic table-name indirection, relative remote addresses, A1 notation,
ID/file lookup and full Calc string/vector modes remain unsupported. Missing
names, invalid references and out-of-bounds ranges produce original-formula-line
diagnostics and retain the affected cell; unlike native error text, they do not
replace it with an error marker. Ranges are checked before traversal and limited
to 100,000 cells.

## Supported subset and limits

For ordinary unmarked tables, column formulas apply to rows after the first horizontal separator, or all rows when no separator exists. Marked tables use the row-selection rules above. Field formulas target one cell. Legacy assignments separated by `::` run in source order and can use earlier results. Emacs order follows the scheduling rules above.

Supported references include `$3`, `@2$3`, relative `@-1`, boundaries `@<`, `@>`, `$<`, `$>`, and hlines `@I`, `@II`. Ranges such as `@2$1..@>$1` become Calc vectors for helpers such as `vsum`, `vmean`, `vmedian` and `vcount`. Calc arithmetic, functions and mode suffixes follow the section above.

**Copy recalculated source** copies updated, aligned tables and the original surrounding source. Auto detects `#+TBLFM:`, Org keywords, and table hlines. Headings, simple lists, emphasis, and links are rendered through the Org AST.

Emacs Lisp formulas produce an explicit unsupported diagnostic. This is a core subset: cross-file/ID remote tables, dynamic remote indirection, target ranges, iteration modes, inherited property/external constants, expression-valued or string bindings, Calc symbolic/complex/unit/date/duration results, and exact Emacs display-width alignment are not implemented. Emacs order supplies supported column/field priority and duplicate-target checks; Legacy keeps its original source-order contract. Neither mode supplies a full dependency solver or repeated convergence. Reference checks compare supported numeric tables against `emacs --batch`; the Lisp error example is excluded from that comparison.

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
| ORG-02 | Known gap | Remaining Org target syntax, numeric modes, iteration and native layout are incomplete |
| ORG-03 | Needs detailed audit | Surrounding prose supports basic headings, lists, emphasis, and links, rather than the full Org… |
| ORG-04 | Needs detailed audit | Recalculation updates the preview |
| ORG-05 | Resolved | Numeric named bindings and marked-row selection match Emacs fixtures |
| ORG-06 | Resolved | Literal Org blocks no longer run formulas or install constants |
| ORG-07 | Resolved | Explicit Emacs order matches supported native scheduling and duplicate-target rejection |
| ORG-08 | Resolved | Same-document remote references read current pass state without recursive evaluation |
| ORG-09 | Resolved | Formulas use Emacs Calc default modes, exact integers and Calc display |
| ORG-10 | Resolved | Numeric Calc conditionals and comparisons match Emacs fixtures |
| ORG-11 | Resolved | Org table values stay intact in narrow previews and HTML exports |
| ORG-12 | Resolved | Table header groups and numeric-column alignment match native HTML fixtures |
| ORG-13 | Known gap | File constants calculate but are hidden in the preview |
<!-- compatibility:end -->
