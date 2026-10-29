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
| `#+SHEETS_CONSTANTS: table` | Show effective file constants in a preview summary (Sheets extension) |
| `#+SHEETS_CONTROL: price slider 0..100` | Edit a file constant from a preview control (Sheets extension) |

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
spreadsheet formulas. Use `#+SHEETS_HINTS: precedence` for optional source-line
hints about an unparenthesized divisor product.
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

## Optional precedence hints

Enable informational hints with a source keyword:

```org
#+SHEETS_HINTS: precedence
| 0 | 0 | 0 |
#+TBLFM: $1=10/4*2::$2=(10/4)*2::$3=10/(4*2)
```

The results remain **1.25**, **5.** and **1.25**. The formula line gets one
informational ACE annotation and a **Formula hints** explanation in the preview:
Calc multiplies before dividing, so `a/b*c` means `a/(b*c)`. Group either the
division or the denominator product explicitly to make your intent clear.
`(a/b)*c` and `a/(b*c)` produce no hint. Parentheses around just one factor,
as in `a/(b)*c`, or the entire expression `(a/b*c)` do not clarify that choice
and still get a hint. Powers such as `a/b**c` are not multiplication hints.

Omit the keyword or select `#+SHEETS_HINTS: none` to disable these hints. The last
real directive wins, names/values are case-insensitive, and literal source,
example, export and comment blocks cannot enable hints or supply active formulas.
An invalid option gives a warning and disables hints. Both calculation modes
support the option; it travels in source through links, HashBin and downloads.
HTML exports and printing include the preview explanation.

This is a bounded syntax advisory, not a change to Calc arithmetic (ORG-09).
It checks each active stored formula line once and emits at most one hint per
line, even for many target cells. Named inputs, ranges and remote references are
treated as atomic references. It does not inspect substituted cell expressions,
mode/printf strings, or products using only implicit multiplication. A mixed
product containing an explicit `*` may get a hint. Malformed expressions and
expressions beyond the existing 4,000-character/parser bounds receive no hint;
normal calculation errors still apply. A supported expression in an unused
`if` branch can get a hint because the check inspects syntax, not runtime values.
Hints never block writes or replace errors, including duplicate-target errors.

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

## Show file constants

Add `#+SHEETS_CONSTANTS: table` to expose a model's file-level assumptions:

```org
#+SHEETS_CONSTANTS: table
#+CONSTANTS: price=0.03 users=100
| Monthly revenue | 0 |
#+TBLFM: @1$2=$price*$users;%.2f
```

The preview shows **File constants**, with names, original numeric text and source
line numbers, followed by monthly revenue **3.00**. The summary appears after the
opening prose, before the first calculation table; without calculation tables it
appears after the prose. It is a read-only Sheets extension (ORG-13), available in
Legacy and Emacs order. Native Org HTML export hides these keywords by default.

Omit the option or use `#+SHEETS_CONSTANTS: none` to keep constants hidden. Option
names and values are case-insensitive; the last real directive wins. Directives
inside literal source/example/export/comment blocks do not take effect. An invalid
option produces a warning and keeps the summary hidden.

The summary uses the same file bindings as formulas. Duplicate names show their
last declared value and defining line, in first-declaration order. Values preserve
their source spelling and precision. Unsupported values remain visibly marked
**Unsupported** and retain calculation diagnostics; malformed declarations are
diagnosed and omitted. With no named declarations the preview says there are no
file constants. Table parameters and named fields can override file values, so
this summary does not claim to show every table's effective inputs.

The option lives in the source, so sharing, HashBin saves, source downloads,
recalculated source and file-to-link commands preserve it without a new profile.
HTML export and printing include the visible summary. To change file constants
from the preview, add [preview controls](#preview-controls). Editing table cells,
input styling and cell notes remain UI-1 work.

## Preview controls

`#+SHEETS_CONTROL:` puts a checkbox, slider or text field in the preview for one
file constant. Changing the control rewrites that constant in the source and
recalculates every table, so you can try "what if?" values directly:

```org
#+TITLE: Pricing what-if
#+CONSTANTS: price=25 annual=1 users=120
#+SHEETS_CONTROL: price slider 5..100 step 5 label "Monthly price ($)"
#+SHEETS_CONTROL: annual checkbox label "Bill annually"
#+SHEETS_CONTROL: users text label "Users"

| Revenue | 0 |
#+TBLFM: @1$2=$price*$users*if($annual,12,1)
```

The preview shows revenue **36000**. Moving the slider to 40 changes the source to
`price=40` and revenue to **57600**. The syntax is
`#+SHEETS_CONTROL: <constant> <kind> [min..max] [step n] [label "text"]`:

| Kind | Control | Writes |
| --- | --- | --- |
| `checkbox` | Checkbox; the constant must be `0` or `1` | `1` when checked, `0` when clear. `if($annual,…)` treats them as true and false. |
| `slider` | Range slider; needs `min..max`, `step` defaults to `1` | The nearest step from the minimum, with as many decimals as the minimum or step (`0..0.1 step 0.005` writes `0.035`) |
| `text` | Text field | A decimal number, such as `12.5` or `1e3`. Other text is refused with a message and nothing is written. |

Without a label, a control is labelled with its constant, such as `$users`.
Controls appear where their keywords are, in document order. Keywords and kinds
are case-insensitive; directives inside literal source, example, export or comment
blocks do not take effect. A document can have 64 controls.

**The source is the state.** A control edits only its value in the source, so
share links, reloads, HashBin saves, downloads and Emacs all see the current
values. Each change is one editor undo step; a whole slider drag is a single
step. Editing the source by hand updates the controls. Emacs ignores
`#+SHEETS_CONTROL:` lines, so the document calculates identically there; an
independent Emacs fixture checks this.

Each control edits the effective declaration: with duplicate names, that is the
last one, as in formulas. Table parameters (`$` rows) and named fields still
override a file constant inside their table, so a control may not affect those
tables. A control on an undefined, unsupported or shared (`$alias.name`)
constant, a second control for the same constant, a slider without a range or
with invalid bounds, and unknown options are diagnosed at the control line and
show no control. A value outside the slider range gives a warning.

Three gallery models use every control kind to answer a question:
[Monthly or annual billing?](../../index.html?example=org-what-if&format=org)
finds the churn rate at which a discounted annual plan wins,
[How much house can I afford?](../../index.html?example=org-mortgage&format=org)
combines controls with fixed assumptions shown by `#+SHEETS_CONSTANTS: table`
and a rate-change table, and
[Hire or contract?](../../index.html?example=org-hire&format=org) puts local
controls beside read-only [pinned shared inputs](#pinned-shared-inputs). In both
Sheets calculation modes, their tables matched Emacs 31.1 with Org 9.8.7 when
written; the last was checked with its shared values substituted as file constants,
because Emacs has no `$finance.load`.

HTML exports show controls disabled at their current values; exported files run
no script. Printing shows the current values. This is a Sheets extension, not
native Org behavior. Date pickers, controls for table cells, scenarios, sweeps
and goal seek are planned; see the [design](https://github.com/curtcox/sheets/blob/main/design/what-if-controls.md).

## Charts

Put Org's own `#+PLOT:` line (org-plot) directly above a table and Sheets draws
a chart under it:

```org
#+PLOT: title:"Revenue by quarter"
| Quarter | North | South |
|---------+-------+-------|
| Q1      |   120 |    90 |
| Q2      |   140 |   110 |
```

The preview shows grouped bars for North and South by quarter. Charts are
redrawn from the recalculated table every time it changes, so formulas, source
edits and [preview controls](#preview-controls) move them too. Each bar and
point has a tooltip with its table text. Charts are static SVG: they print,
appear in HTML exports and work offline, and they have no hover crosshair or
legend toggling.

### What org-plot options mean

Options you write mean what they mean in Emacs. Sheets reads them the way
org-plot (Org 9.8.7) does, including its quirks:

- Every contiguous `#+` line directly above the table is scanned, so several
  `#+PLOT:` lines merge and `#+NAME:` or `#+CAPTION:` lines can sit between
  them. For a repeated key, the topmost line wins. `#+PLOT:` needs a space after
  the colon; Emacs ignores `#+PLOT:ind:1`, and so does Sheets, with a warning.
- Keys are matched as substrings in org-plot's own order. `xmin:0` therefore
  also sets `ymin`, and `timeind:t` is read as `ind:t`, which Emacs rejects.
- A header row (a rule after the first row) supplies series names. `labels:`
  overrides them. `transpose:yes` swaps rows and columns first.
- When every value in the `ind` column is an Org timestamp such as
  `<2024-01-15 Mon>`, the x axis is time. When any value is not a number, it is
  categories. Plain dates such as `2024-01-15` are therefore categories, as
  they are in Emacs.

| Option | Sheets draws |
| --- | --- |
| `ind:N` | Column N on the x axis. `ind:0` uses row numbers. |
| `deps:(N …)` | Those columns as series, in column order. |
| `with:lines`, `points`, `linespoints`, `steps` | Lines, a scatter chart, lines with markers, or steps. |
| `with:histograms`, `boxes`, `impulses` | Bars. `histograms` always uses categories. |
| `title:"…"`, `labels:("…" …)` | The chart title and series names. |

`type:3d`, `type:radar`, `type:grid`, `script:`, `line:`, `map:` and `timefmt:`
are diagnosed and draw nothing. `set:`, axis bounds (`min:`, `max:`, `xmin:`,
`xmax:`) and `ticks:` are read but not applied yet. Sheets does not run gnuplot,
and its charts are not meant to match gnuplot's pixels: ticks, colors, legends,
sizes and number formatting are Sheets' own.

### Options Sheets infers

org-plot's defaults (`ind:0`, `with:lines` and every column) rarely suit a
labelled table. When `ind`, `deps` or `with` is missing, Sheets infers it from
the data instead:

1. **Rows.** Rules, the header, alignment-cookie rows and, in marked tables, the
   marker column and `!`, `^`, `_`, `$` and `/` rows are not data. A final
   single row after a rule whose first value is text such as *Total*, or text
   under a column of numbers, is a summary row and is left out.
2. **`ind`.** Column 1 (2 in a marked table) when it is all text, all timestamps
   or strictly increasing numbers; otherwise row numbers (`ind:0`).
3. **`deps`.** The right-aligned columns: those where at least half the
   non-empty cells are numbers. The first eight are plotted.
4. **`with`.** Bars for categories, lines for numbers and time, and points for
   a single row.

The caption names what was inferred, such as *Inferred: ind:1 deps:(2 3)
with:histograms; summary row @4 excluded.* The `#+PLOT:` line also gets an
informational editor annotation with the same options. Paste them into
`#+PLOT:` and Emacs plots the same data; an Emacs batch harness checks this for
every fixture. Text in a plotted column is drawn as a gap and reported with its
row.

### Known differences from Emacs

- In marked tables, org-plot's data file drops the marker column and special
  rows, but its column numbers and x-type check still count them, so Emacs
  reads the wrong columns. Sheets uses Org column numbers (the same ones as
  `$N` in formulas) and checks only data rows. Alignment-cookie rows likewise
  make org-plot treat a numeric x column as text; Sheets ignores them.
- Summary rows are left out of the chart. Emacs plots them.
- Headerless tables with rules make org-plot stop with an error when `ind` is
  set; Sheets skips the rules.

Limits: 32 charts per document, 8 inferred or 12 listed series, and 2,000
points per chart. Beyond a limit the chart is truncated or skipped with a
diagnostic.

## Pinned shared inputs

Use `#+SHEETS_INPUT: v1 prices <cid>` to read numeric file constants from another
saved Org document. Reference them with a namespace, such as `$prices.price`:

```org
#+SHEETS_INPUT: v1 prices AAAAAAAXIytDT05TVEFOVFM6IHByaWNlPTAuMDM
| Users | Monthly cost |
|-------+--------------|
| 100   | 0            |
#+TBLFM: $2=$1*$prices.price;%.2f
```

The inline CID above contains `#+CONSTANTS: price=0.03`, so this example needs no
network and calculates **3.00**. For a larger assumptions document, create an Org
file with numeric `#+CONSTANTS:`, choose Org, and save it through the app's normal
HashBin confirmation flow. Paste that bare CID into each consuming model. Versions
1 and 2 of saved Org documents and plain Org source are accepted. Both root
calculation modes work, and the source keyword preserves the choice in links,
saved documents, CLI links and source downloads.

The **Shared inputs** preview always shows imported values, their namespace,
defining lines and CID provenance. Original numeric text and exact integers are
preserved. Duplicate constants use their last declaration; literal blocks supply
no values. Dependency tables/formulas never execute. This is a read-only Sheets
extension (ORG-14), distinct from native cross-file `remote()` tables. References
are scalar; imported ranges and assignments to imported values are unsupported.
Namespaces/names are case-sensitive ASCII names of at most 64 characters and do
not fall back to local bindings when an import or name is missing.

Only bare canonical CIDs are accepted. Duplicate aliases, nested imports and
cycles are rejected. Larger payloads load anonymously from `https://256t.us/`
with no credentials or referrer; redirects are rejected. Byte length and SHA-512
must match the CID before strict UTF-8 parsing. Hash verification needs HTTPS or
localhost. Limits are **8 declarations**, **64 KiB per payload**, **256 KiB across
distinct payloads**, **5 MiB root source plus payloads**, **128 constants per input**,
**1,000 characters per numeric value**, and one **10-second loading deadline**.
Repeated CIDs load once per render. Invalid numeric declarations reject the input.

The imported set loads atomically: if any input fails, no imported values apply.
The declaration and affected formulas get diagnostics, cells retain their old
values, and ordinary local formulas can still calculate. Read diagnostics before
trusting retained numeric cells. Edits, navigation and Cancel discard in-flight
loads. No HashBin write, account authorization or charge occurs while reading.

CIDs pin content rather than guarantee its retention. Updating assumptions means
saving a new CID and explicitly updating consumers. Source downloads and links
keep the references; they do not bundle dependency bytes. Offline app files do
not cache these payloads, so hashed inputs still need a connection and available
content on reload. Inline CIDs work offline. HTML exports/printing include the
visible values and provenance as a separate static copy. Arbitrary raw `?url=`
loading remains FILE-1 work (SHARED-07). [Portable Org snapshots](../url-format.md#portable-project-snapshots)
now bundle verified bytes with source, calculation mode and view. Opened snapshots
share and save those bytes and never fetch a missing replacement.

## Financial-model workflow limits

- `#+CONSTANTS:` values stay hidden by default, as in native Org HTML export.
  Use `#+SHEETS_CONSTANTS: table` for a file constants summary (ORG-13), or echo
  constants through field formulas in a custom Inputs table.
- `#+SHEETS_INPUT: v1 alias <cid>` shares pinned numeric constants (ORG-14).
  `remote()` still reads tables in the same document only; general cross-file
  tables and recursive imports remain ORG-02 / FILE-1. Portable Org snapshots
  preserve the supported numeric inputs.
- Tables keep single-token values and headings intact and scroll horizontally
  when too wide (ORG-11). Multiword labels can wrap between words. Focus the
  table region and use Left/Right arrows to scroll the preview; HTML exports keep
  the same layout. Very wide printed tables may need landscape or wider paper.
  `;%.2f` controls decimal places; `;$%.2f` can add a literal dollar prefix, but
  thousands grouping is unavailable.
- [Preview controls](#preview-controls) edit file constants, but preview table
  cells cannot be edited, marked as inputs, or given per-cell notes. Put input
  instructions and source notes in the document. Org has no goal seek (ORG-04);
  Calca's scalar solver works in its own format.
- Generated long source links now use fragments to avoid the host’s request-line
  limit on reload (SHARED-05). Other apps can still truncate complete links;
  download source or save to HashBin for a separate copy. Offline app files are
  not a document backup. The [file-to-link CLI](../url-format.md#links-from-source-files)
  embeds a local file snapshot (SHARED-06); a raw-source `?url=` loader remains
  unsupported (SHARED-07).

Org parsing accepts a UTF-8 BOM and Windows CRLF line endings. Shared links and
the editor preserve original source; **Copy recalculated source** uses normalized
LF text without the BOM.

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
| ORG-13 | Resolved | File constants have an optional preview summary |
| ORG-14 | Resolved | Pinned numeric Org inputs load through versioned CID declarations |
| ORG-15 | Resolved | #+PLOT: tables draw sanitized SVG charts that follow recalculation |
| ORG-16 | Known gap | Some org-plot types and gnuplot options are not drawn |
<!-- compatibility:end -->
