# What-if controls and tools (CTRL-1 → WHATIF-3)

Status: **in progress**. CTRL-1 (Org constant controls) is implemented; the
later slices are proposed. See the Org guide's *Preview controls* section.

Interactive checkboxes, sliders, date pickers and text fields let a reader change
a model's inputs in the preview and see every dependent result recalculate. On
top of them, named scenarios, one-input sweeps and goal seek answer "what if?"
and "what input gives this answer?" questions. This extends UI-1 and addresses
ORG-04 and field-report items 7 and 8
([report](field-report-hashbin-money-model.md)).

## Format choice

| Format | Fit | Decision |
| --- | --- | --- |
| Org | The only real spreadsheet: tables, formulas, named constants. It is the format of the field-report money model, whose open requests (ORG-04, items 7 and 8) are input marking, preview editing and what-if. Unknown `#+SHEETS_*` keywords are ignored by Emacs, so annotated files still compute identically there. The Calc subset has no date type (ORG-09 disclosure). | **First.** Constants, then table fields. Add verified timestamp arithmetic before Org date pickers. |
| Numbat | Calculator notebook with native `Bool`, `DateTime`, `String` and unit quantities, so all four control kinds map onto real types. `#` comments keep annotations invisible to the CLI. Runs in a worker, so drag latency needs work. | **Second.** Proves the control layer is format-agnostic. |
| Quarto OJS | The only upstream with these exact widgets (`Inputs.range/checkbox/date/text`). Useful only with an Observable runtime, which is OJS-1, the largest sandbox surface in the plan. A declarative-only subset would mislead, since Python/R cells do not see OJS values in Quarto. | **Deferred to OJS-1.** Reuse this layer's DOM handling there. |
| Calca | Natural what-if calculator, but closed upstream with no spec, and mathjs has no date type. | Not in this plan. Can adopt the layer later. |
| CalcFile, Hurmet, Beancount, AsciiMath, GFM, Plain text | No input-driven model, or no evaluator. GFM task toggles stay a separate UI-1 item. | Out of scope. |

## Principles

- **Source is the state.** A control rewrites its declared value in the source,
  one undo step per gesture. Share links, HashBin, downloads, reload and Emacs
  all see the current scenario. No URL parameter or HashBin envelope change.
- **Annotations are inert upstream.** Removing every `#+SHEETS_*` line (Org) or
  `#:` comment (Numbat) leaves a document whose results are identical. Fixtures
  check this against Emacs and the pinned Numbat interpreter.
- **Same evaluation path.** What-if tools evaluate by substituting values into
  source text through the same serializer that write-back uses, then running the
  normal engine. A sweep row or goal-seek answer is exactly what you would get by
  typing that value.
- **Untrusted input.** Every descriptor comes from a shared URL. Counts, sizes,
  evaluation budgets and deadlines are bounded; control HTML passes through
  `src/sanitize.js`; there is no script in rendered output.
- **Candid docs.** Guides describe these as Sheets extensions, not native Org or
  Numbat features.

## Source syntax

### Org

Controls name a target and a kind. A constant target edits its token in
`#+CONSTANTS:`. A field target edits a table cell and must follow its table,
after `#+TBLFM:`, like other table-attached keywords.

```org
#+CONSTANTS: price=25 annual=1 start=<2026-11-01 Sun> plan=Pro
#+SHEETS_CONTROL: price slider 5..100 step 5 label "Monthly price ($)"
#+SHEETS_CONTROL: annual checkbox label "Bill annually"
#+SHEETS_CONTROL: start date label "Launch"
#+SHEETS_CONTROL: plan text

| Tier | Users | Price |
|------+-------+-------|
| Pro  |   120 |    25 |
#+TBLFM: ...
#+SHEETS_CONTROL: @2$2 slider 0..1000 step 10
#+SHEETS_CONTROL: @2$3..@4$3 text
```

- Kinds: `checkbox` (writes `1`/`0`, which ORG-1E `if()` treats as true/false),
  `slider` (requires `min..max`, optional `step`), `date` (writes an Org
  timestamp, keeping the weekday consistent) and `text`. A `text` control on a
  numeric value validates with Emacs number parsing and shows an inline error
  instead of writing invalid input.
- Field targets accept `@r$c`, `@r$name` and named fields from existing
  bindings, and small ranges for `text` (marking a block of input cells
  editable, field-report item 8). Targets are styled as inputs in the preview.
- Diagnostics, at the control line: unknown target; target assigned by a formula
  (it is not an input); imported FILE-1A input (read-only); value outside
  bounds; bounds that are not numeric; constant text containing spaces (the
  `#+CONSTANTS:` grammar cannot hold them); cell text containing `|`; duplicate
  controls for one target; over the count limit.
- Write-back of a field realigns only that table, using the engine's existing
  alignment code, so source stays in Emacs's aligned form.

### Numbat

A trailing `#:` comment on a `let` whose right-hand side is a literal.

```numbat
let price = 25 USD                 #: slider 5 USD .. 100 USD step 5 USD
let annual = true                  #: checkbox
let start = datetime("2026-11-01") #: date
let plan = "Pro"                   #: text
```

The kind must match the value's type in the pinned interpreter. Slider bounds
must have the value's dimension; the control works in the value's own unit
(`value_of(x -> unit_of(x))`). Non-literal right-hand sides, type mismatches and
incompatible units are diagnostics.

### What-if declarations (both formats)

```org
#+SHEETS_WATCH: profit=@>$5 breakeven=$breakeven
#+SHEETS_SCENARIO: Low price=10 users=500
#+SHEETS_SCENARIO: High price=40 users=200
#+SHEETS_SWEEP: price 5..100 step 5 watch profit
```

Numbat uses the same words in `#:` lines (`#: watch profit`, `#: scenario Low
price=10 USD users=500`, `#: sweep price 5 USD .. 100 USD step 5 USD watch profit`).

- **Watch:** a named output (Org cell reference, named field or constant;
  Numbat variable). Watches feed scenario comparison, sweeps and goal seek.
- **Scenario:** a named set of control values. Selecting one writes all its
  values to source as one undo step. A comparison view evaluates each scenario
  and shows the watched outputs side by side.
- **Sweep:** a generated table of watched outputs across one input's range,
  with an optional sanitized SVG line chart. It is declarative, so it is
  reproducible and shareable.
- **Goal seek:** an action, not a declaration. Choose an input control (slider or
  numeric text), a watch and a target value. The result dialog shows the solved
  value, the value rounded to the control's step and the output at each; Apply
  writes it to source as one undo step.

## Architecture

**Plugin contract extension.** `render` may also return `controls`, an array of
descriptors `{id, kind, label, value, min, max, step, line, edit}` where `edit`
is the one-based line plus character span of the value in source. A format
opting into what-if also exports
`whatIf: { evaluate(src, assignments, watches, {signal}) }`, returning watched
values and diagnostics without HTML. The registry gains optional fields; formats
without them are unchanged.

**Shared modules.**

- `src/controls.js` (DOM-free): descriptor validation and limits, `controlHTML()`
  that emits `<label>`, `<input>` and `<output>` with `data-control`, and
  `applyEdit(source, edit, text)` that returns the new source and changed range.
  Per-format serializers live with each engine (Org number, timestamp and
  checkbox text; Numbat literals with units, `true`/`false`, `datetime("…")`,
  escaped strings) and must round-trip through that engine's parser.
- `src/what-if.js` (DOM-free): scenario evaluation, sweep and goal-seek loops
  over `whatIf.evaluate`, with an evaluation budget, AbortSignal and deadline.
- `src/sanitize.js`: a hook that keeps `data-control` only on `<input>`
  elements of type `checkbox`, `range` or `text` (`date` arrives with CTRL-1D),
  and drops their `name`, `form` and `list`. The attribute is only a lookup key:
  the app writes only through the engine's descriptor for that id, so raw HTML
  in other formats cannot borrow a control. Tests cover hostile labels and
  spoofed markup.

**App wiring (`src/app.js`).**

- Delegated `input`/`change` listeners on the preview. Slider and checkbox
  changes write source immediately; text fields commit on `change` or Enter.
  Writes go through ACE `session.replace` on the value range, without moving
  the cursor, merged into one undo group per gesture (textarea fallback too).
- Rendering for a control gesture is scheduled immediately rather than after the
  300 ms debounce, coalesced to one render per animation frame. The existing
  revision check keeps results latest-wins.
- `setPreview` replaces the whole preview, which would end a drag. When the
  preview holds controls, `updatePreview` sanitizes into a template and morphs
  the existing nodes in place, so the slider being dragged, a focused text field
  and table scroll positions survive. Other inputs take their rendered state,
  so undo in the editor moves the controls back.
- History updates are debounced during a drag, because WebKit and Firefox
  throttle `history.replaceState`.
- Numbat currently starts a worker per job. Keep one warm worker with the WASM
  module loaded and create a fresh interpreter context per job, preserving
  "state within one render", cancellation by termination and deadlines.
- Standalone HTML export and print show the current value as text in place of
  each control; exported files stay script-free under their CSP.

**Goal seek method.** Require finite bounds from the control. Scan up to N
evenly spaced points (sharing the sweep loop) to find sign changes of
`watch − target`, then refine each bracket with Brent's method to a tolerance.
Report: no sign change within bounds; nonnumeric or error output at a sample;
apparent discontinuity (sign change where |f| does not shrink); several roots
(list them and preselect the one nearest the current value); budget or deadline
exceeded. Calca's scalar solver remains separate (CALCA-02).

**Limits (initial, to be measured).** 64 controls, 8 scenarios, 200 sweep points,
100 goal-seek evaluations, 200-character labels, 1,000 characters of text
input, and per-job deadlines matching the format's existing ones.

## Slices

Each slice follows the existing delivery rules: reference fixtures before code,
format guide and limitations updates, gallery examples (basic, typical, edge,
error), unit tests, Chromium/Firefox/WebKit browser tests and HashBin/share
round-trips. Ledger entries are split or added as each slice starts.

| Order / slice | Effort | Work | Done when |
| --- | --- | --- | --- |
| 1 / CTRL-1 | M | Shared layer, sanitizer hook, `updatePreview`, undo grouping and Org **constant** controls for checkbox, slider and text. | Drag, keyboard and touch change outputs and source in all three browsers; one undo restores; reload, share link and HashBin reproduce the value; an Emacs fixture shows control lines change nothing; export/print show values. |
| 2 / ORG-DATE-1 | M | Reference first: record Emacs 31.1/Org 9.8.7 results for timestamp fields and constants, day differences, date plus days, comparisons and the `T`/`t`/`U` modes. Implement only the verified cases; the rest get diagnostics. | Independent Emacs fixtures pass in both calculation modes; earlier reference results unchanged; guide lists the supported date subset. |
| 3 / CTRL-1D | S | Org `date` control on top of ORG-DATE-1. | Picker writes valid timestamps (weekday kept consistent) and dependent dates recalculate; the same round-trip checks as CTRL-1. |
| 4 / CTRL-2 | M | Org **field** controls: cell and named-field targets, `text` ranges, input styling, formula-target and imported-input diagnostics, table realignment on write. | Realigned source matches Emacs `org-table-align`; ORG-04's "cannot be edited directly or marked as inputs" disclosure is resolved. |
| 5 / CTRL-3 | M | Numbat `#:` controls for all four kinds, unit-aware sliders, warm worker. | Type and unit validation comes from the pinned interpreter; measured drag latency on gallery examples is recorded and acceptable in all three browsers. |
| 6 / WHATIF-1 | M | `whatIf.evaluate` for Org and Numbat, watches, scenarios with apply and side-by-side comparison. | Comparison values equal those from applying each scenario and rendering; bounds and cancellation tested. |
| 7 / WHATIF-2 | S–M | Declarative sweeps: generated table and optional SVG chart from the shared CHART-1 renderer (`design/charts.md`). | Each sweep row equals a separate render with that value; the point limit and deadline are enforced. |
| 8 / WHATIF-3 | M | Goal seek dialog and solver. | Answers plugged back into Emacs or the pinned Numbat meet the target within tolerance; no-root, several-root, discontinuous, error and budget cases each show their diagnostic; Apply is one undo step. |

Slices 2 and 5 do not depend on each other and can proceed in parallel with
slices 3–4. Slices 6–8 need at least CTRL-1.

## Open questions

- The exact Org date semantics, which ORG-DATE-1 must establish from Emacs, not
  assume.
- Whether a numeric `text` control should render as `type=number`. Browser number
  inputs parse differently from Emacs, so the proposal uses `text` with Emacs
  parsing.
- Whether the scenario comparison view should also be exportable as a static
  table in standalone HTML.
- Two-input sweeps and per-cell notes (field-report item 8, second half) are not
  included.
