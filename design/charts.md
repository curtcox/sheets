# Charts from sheet data (CHART-1 → CHART-7)

Status: **in progress** (2026-10-29). CHART-1 is implemented; see the Org
guide's *Charts* section and ORG-15/ORG-16 in the compatibility ledger.

Readers can see a document's numbers as charts that update with the source,
preview controls and what-if tools. The author should get a useful chart from
one bare line, or for Beancount from no syntax at all, and should only need
options to override a default.

## Format choice

| Format | Fit | Decision |
| --- | --- | --- |
| Org | The only real spreadsheet. It already has a native chart keyword, `#+PLOT:` (org-plot, gnuplot backend), placed directly above a table. Emacs 31.1 / Org 9.8.7 is installed locally, and `org-plot/gnuplot-script` and its data dump run in batch without gnuplot, which gives an independent reference for option parsing and series extraction. Charts also show the effect of CTRL-1 controls. | **First.** Native `#+PLOT:` over recalculated tables, with Sheets-only options on a separate `#+SHEETS_PLOT:` line. |
| Beancount | Ledgers have obvious default charts (net worth over time, monthly income against expenses, where the money went). Beancount itself has no chart syntax. Fava, its standard web UI, shows such charts by default. | **Second.** A **Charts** report tab with no syntax at all. |
| Numbat | No native plotting. Its useful charts are input sweeps. | Through WHATIF-2 sweeps, which reuse the shared renderer. No separate syntax. |
| GFM, Quarto, AsciiMath, Calca | Mermaid 12.2.0 is already vendored and rendered with strict security. It includes `xychart`, `pie`, `radar`, `sankey` and `treemap`. Quarto also has matplotlib and R plots. Their tables are display-only, so there is no calculated data to bind. | Documentation and a gallery example only (CHART-7). |
| CalcFile, Hurmet, Plain text | No tabular model to chart. Hurmet has its own upstream drawing. | Out of scope. |

## Principles

- **Explicit options mean what they mean upstream.** An option written on
  `#+PLOT:` selects the same columns, x values, labels and plot style that
  org-plot would. Sheets supplies only what gnuplot would otherwise decide:
  ticks, colors, legend, sizing and number formatting.
- **Omitted options are inferred, visibly.** org-plot's own defaults
  (`ind:0`, `with:lines`, every column) give nonsense for the usual labelled
  table. Sheets infers omitted options from the data instead. The chart
  caption names the inferred options, and an informational gutter annotation
  on the `#+PLOT:` line gives them as text that can be pasted in. Pasting them
  makes Emacs plot the same data.
- **Static, sanitized SVG.** Charts are inline SVG strings built without DOM
  APIs, so engines stay testable in Node. They pass through `src/sanitize.js`
  like all other output, use only classes and the allowed presentation
  attributes, have no script, and work unchanged in print, standalone export,
  offline use and HashBin documents. Each mark has a native `<title>` tooltip.
  There is no hover crosshair and no legend toggling.
- **Source is the state.** No URL, HashBin envelope or profile changes. Charts
  are recomputed from the recalculated table on every render, so controls and
  undo move them too.
- **Candid docs.** The Org guide separates native org-plot behavior,
  Sheets inference and Sheets-only options. Pixel parity with gnuplot is not
  a goal.

## Org syntax

```org
#+NAME: revenue
#+PLOT: title:"Revenue by quarter"
| Quarter | North | South | Total |
|---------+-------+-------+-------|
| Q1      |   120 |    90 |   210 |
| Q2      |   140 |   110 |   250 |
|---------+-------+-------+-------|
| Total   |   260 |   200 |   460 |
#+TBLFM: $4=$2+$3::@>$2=vsum(@I..@II)::@>$3=vsum(@I..@II)
```

Sheets draws grouped bars for North, South and Total by quarter, excluding the
summary row. The caption reads *Inferred: ind:1 deps:(2 3 4) with:histograms;
summary row @4 excluded.* Rows are named as in Org formulas, where `@N` counts
non-rule rows.

### Native options (org-plot)

The `#+PLOT:` lines are parsed exactly as `org-plot/add-options-to-plist` and
`org-plot/gnuplot` parse them. That includes the quirks, which the Emacs
fixtures pin:

- Every contiguous `#+…` line directly above the table is scanned. Several
  `#+PLOT:` lines merge. `set:` and `line:` accumulate, and other keys are
  overwritten in Emacs's scanning order.
- Keys are matched as substrings, in org-plot's table order. For example,
  `xmin:0` also sets `ymin`, because `min:` matches first.
- A header row, meaning a rule after the first row, supplies the series labels.
  `labels:` overrides them.
- When every value in the `ind` column is an Org timestamp, the x axis is time
  (`timeind`). When any value is not a number, it is categories (`textind`).
  Plain ISO dates are therefore categories, as they are in Emacs.

Option support:

| Option | Slice | Sheets behavior |
| --- | --- | --- |
| `ind`, `deps`, `labels`, `title`, `transpose`/`trans` | 1 | As org-plot. |
| `type:2d` `with:lines/points/linespoints/steps` | 1 | Line, scatter, line and markers, steps. |
| `with:histograms`, `with:boxes`, `with:impulses` | 1 | Bars. |
| `set:"style histogram rowstacked"` | 2 | Stacked bars. |
| `set:` subset: `xlabel`, `ylabel`, `title`, `yrange [a:b]`, `xrange`, `logscale y`, `key off`, `key top/bottom left/right`, `grid` | 2 | Applied. Any other `set:` gets an informational diagnostic and is ignored. |
| `min`/`ymin`, `max`/`ymax`, `xmin`, `xmax`, `ticks` | 2 | Axis bounds and tick count. |
| `type:radar` | 2 | Radar chart using `ticks`, `min` and `max`. |
| `type:grid` | 2 | Heatmap of the matrix org-plot extracts, with a sequential color scale and a legend bar. |
| `file:` | 2 | When the document links `[[file:NAME]]`, the chart appears at that link. Otherwise it appears after the table. |
| `type:3d`, `script:`, `line:`, `map:`, custom `timefmt:` | 2 | Diagnosed as unsupported. Nothing is drawn for that plot. |

### Inference of omitted options

Inference is applied only to options that are absent after merging:

1. **Data rows.** Skip rule lines, the header, alignment-cookie rows and, in
   marked tables, the marker column and `!`/`^`/`_`/`$`/`/` rows. Skip a
   final single-row group after a rule whose first cell is text such as
   *Total*, *Sum* or *Average*. org-plot includes the cookie and marker rows,
   which breaks gnuplot. That difference is documented, not inferred.
2. **`ind`.** Use column 1 when it is all text, all timestamps, or numeric and
   strictly increasing. Otherwise use row numbers (`ind:0`).
3. **`deps`.** Plot the numeric columns other than `ind`, using the same rule
   that right-aligns a column in the HTML table (at least half of its non-empty
   cells are numbers). This rule means "right-aligned columns are plotted".
   The first eight are used. An informational diagnostic reports any more.
4. **`with`.** Bars (`histograms`) for category x, lines for numeric or time x,
   and points when there are fewer than two rows.

Explicit `ind`/`deps`/`with` turn off the matching inference step. If `deps`
names a column whose values are text, the text cells are drawn as gaps and a
diagnostic gives the row of the first one.

### Sheets-only options

`#+SHEETS_PLOT:` sits in the same keyword block above the table. org-plot's
line regexp needs `#+PLOT:`, so Emacs ignores this keyword. Its options refine
the chart in Sheets only:

| Option | Slice | Meaning |
| --- | --- | --- |
| `kind:pie`, `kind:donut` | 3 | One slice per row, using the first dependent column. Other dependent columns are reported as ignored. Negative or empty values are diagnosed. More than eight slices merge into *Other*. |
| `kind:area` | 3 | Stacked area for numeric or time x. |
| `rows:all` | 3 | Turns off summary-row exclusion. |
| `legend:none/right/bottom` | 3 | Overrides legend placement. |
| `size:small/medium/wide` | 3 | Chart proportions, 4:3, 16:9 (default) or 21:9. |

`kind` overrides the native `type`/`with` in Sheets only, so an Emacs user still
gets an ordinary org-plot chart. The guide says that `pie`, `donut` and `area`
have no org-plot equivalent.

### In-cell bars

Org's own `orgtbl-ascii-draw`, `orgtbl-uc-draw-grid` and `orgtbl-uc-draw-cont`
are Lisp formulas, for example `$3='(orgtbl-ascii-draw $2 0 100 20)`. These are
what `orgtbl-ascii-plot` inserts. Sheets recognizes exactly these three calls
with literal or field arguments and produces the same text as Emacs. All other
Lisp stays unsupported (ORG-01). Field arguments arrive as strings unless the
`;N` flag is present, as in other Lisp formulas. The Emacs fixtures establish
how each function treats empty, non-numeric and out-of-range values, and
Sheets copies that behavior.

## Beancount Charts tab

A **Charts** tab sits between *Trial balance* and *Account journal* and needs no
source syntax:

1. **Net worth over time.** The Assets and Liabilities balance at each period
   end, one line per currency. The period is daily under 62 days of data,
   weekly under a year, and monthly otherwise.
2. **Income and expenses by month.** Grouped bars per period. Income is shown
   with its sign flipped so both groups of bars point up, and a net line is
   drawn across them.
3. **Where the money went.** Horizontal bars for the second-level Expenses
   accounts over the whole ledger. The largest eight are shown and the rest
   merge into *Other*.

The currency is `option "operating_currency"` when present. Otherwise it is the
currency used in the most postings. Charts 2 and 3 use only that currency,
because Sheets does not revalue between commodities (BEAN-03). A note under
the charts names any commodities left out. A ledger with no dated postings
shows a short message instead of empty axes.

**Overrides (CHART-6, decided after CHART-5).** Native Beancount `custom`
directives are currently reported as unsupported. Accepting them generally is
a compatibility fix in its own right. `custom "sheets-chart" "balance"
Assets:Checking` could then add an account-balance chart, and other forms
could change the period or currency. Leave this out unless the defaults turn
out to need overrides.

## Shared renderer

`src/charts.js` is DOM-free and takes a normalized spec:

```js
chartSVG({
  kind,            // line | points | linespoints | steps | bar | area | pie | donut | radar | heatmap
  stacked, horizontal,
  title, size, legend,
  x: { type: "category" | "linear" | "time", label, values },
  y: { label, min, max, log, ticks },
  series: [{ label, values, text }],   // text = original cell strings for tooltips
}) // → { svg, summary, diagnostics }
```

- **Axes.** Ticks use 1-2-5 steps. Bars always include zero. Lines include zero
  when the data minimum is non-negative and below 30% of the maximum. Axis
  numbers are grouped by thousands. Tooltips show the original cell text, so
  a chart never displays a value differently from its table. Time axes choose
  day, month or year ticks. Long category labels are truncated with an
  ellipsis and keep the full text in `<title>`. More than 12 categories rotate
  their labels.
- **Legend.** None for a single series, whose label becomes the y-axis label.
  Otherwise a legend sits above the plot in series order.
- **Color.** An eight-color categorical palette and a sequential ramp for
  heatmaps, both defined as CSS custom properties with light and dark values.
  Marks use classes (`chart-s1`…`chart-s8`), not inline colors. Line series
  also differ in marker shape so they stay distinguishable without color.
  Before the palette is fixed, it is checked against the `dataviz` guidance
  for contrast and color-vision deficiency in both themes. The same rules go
  into the standalone export styles.
- **Size.** The SVG has a `viewBox` and scales to the preview width, with a
  480 px minimum width. Narrower previews scroll the chart horizontally in a
  focusable region, as Org tables already do (ORG-TABLE-1). Print keeps each
  figure on one page.
- **Accessibility.** Each chart is a `<figure>` holding `<svg role="img">`
  with `<title>` and `<desc>`. The desc text is the `summary` (kind, series,
  ranges). A `<figcaption>` holds the title and any inference note.
- **Limits.** 32 charts per document, 8 series (12 with `deps`), 2,000 points
  per chart, 10,000 heatmap cells, 200-character labels. Over a limit, the
  chart is truncated or skipped with a diagnostic and never fails silently.
- **Morphing.** Preview controls re-render through `updatePreview`. SVG nodes
  morph in place, so dragging a slider redraws the chart without replacing the
  figure. Drag latency is measured on the gallery examples in all three
  browsers.

WHATIF-2 sweep charts call the same renderer.

## Reference checks

- **org-plot harness**, `scripts/reference/org-plot.el`, run by the README's
  independent Org check. It loads each fixture with Emacs 31.1 / Org 9.8.7
  and, for each table, runs org-plot's option collection, header and
  transpose handling, ind-type check and `org-plot/gnuplot-script` with the
  data dump. gnuplot itself is not run. It records the merged options, data
  rows, series columns, x mode (`timeind`/`textind`/numeric/row) and `with`.
  Sheets' extraction must match it for every fixture with explicit options.
  Documents that rely on inference must match after their caption's inferred
  options are pasted in.
- **In-cell bars**: Emacs recalculates fixture tables in batch, and the cell
  text must match exactly in both calculation modes.
- **Beancount**: the existing Python reference checks gain `bean-query`
  queries for period-end balances and per-period Income/Expenses sums. The
  chart data must equal those numbers exactly before any rendering.
- **Renderer**: Node unit tests check SVG structure, ticks, scales, limits and
  escaping of hostile labels. A sanitizer round-trip must not change the chart
  markup. Browser tests in Chromium, Firefox and WebKit cover light and dark
  themes, 390 px mobile, Split at 800 px, print, standalone export, offline
  reload and a control-driven redraw.

## Slices

Each slice follows the usual delivery rules: reference fixtures before code,
guide and limitations updates, ledger entries, gallery examples (basic,
typical, edge and error) with regenerated covers, unit tests, browser tests in
all three engines, and share/HashBin round-trips.

| Order / slice | Effort | Work | Done when |
| --- | --- | --- | --- |
| 1 / CHART-1 | M | `src/charts.js` with line, points, linespoints, steps and grouped bars on category, linear and time axes. Palette CSS and export styles. Org `#+PLOT:` parsing with org-plot quirks, data extraction, inference and its caption and annotation, and charts placed after their tables. The org-plot reference harness. | Every explicit-option fixture matches the Emacs harness. Pasting the inferred options reproduces the harness data. Charts redraw when CTRL-1 controls change. Sanitizer, export, print, mobile and both themes pass in all browsers. `mortgage.org` and `what-if.org` gain plots. |
| 2 / CHART-2 | M | Stacked bars from `rowstacked`, the `set:` subset, bounds and ticks, `type:radar`, `type:grid` heatmap, `file:` placement and diagnostics for unsupported options. | The harness covers each option. Heatmap matrices and radar axes match org-plot's extracted data. |
| 3 / CHART-3 | S | `#+SHEETS_PLOT:` with `kind:pie/donut/area`, `rows`, `legend` and `size`. | Emacs ignores the line (harness unchanged). Pie limits, *Other* merging and negative-value diagnostics are tested. |
| 4 / CHART-4 | S | In-cell bars from `orgtbl-ascii-draw`, `orgtbl-uc-draw-grid` and `orgtbl-uc-draw-cont`. | Exact text equality with Emacs recalculation in both modes, including empty, non-numeric and out-of-range values. ORG-01's disclosure names these three as the only supported Lisp. |
| 5 / CHART-5 | M | The Beancount Charts tab and its three default charts. | Chart data equals the `bean-query` reference numbers. Empty, single-day and multi-currency ledgers behave as described above. The tab appears in export and print. |
| 6 / CHART-6 | S, optional | Accept native `custom` directives, then `custom "sheets-chart"` overrides. | Decided after CHART-5. The bean-check fixture accepts the same `custom` lines. |
| 7 / CHART-7 | S | Document Mermaid `xychart`, `pie` and `radar` for GFM, Quarto, AsciiMath and Calca, with one gallery example. Update the format comparison's *Diagrams and plots* column for Org and Beancount. | Docs build and the drift tests pass. |

CHART-1 must come first. After it, CHART-2, CHART-3, CHART-4 and CHART-5 do not
depend on each other. CHART-7 can be done at any time. WHATIF-2 needs CHART-1.

## Open questions

- Whether the inference caption should stay visible once a chart has no
  inferred options left. The proposal hides it.
- Whether standalone export should also embed each chart's data as a table for
  readers whose software ignores SVG. Org tables are already present. Beancount
  charts would need one.
- Whether `time` axes should also accept plain ISO dates through
  `#+SHEETS_PLOT:`. Emacs treats them as categories.
