# Limitations and compatibility

This page collects the known limitations disclosed in the format guides. It
describes the versions and adapters shipped by Sheets, rather than claiming full
compatibility with the latest upstream language or desktop application. Follow
each guide for supported syntax, runnable examples, and details. The
[feature comparison and glossary](format-comparison.md) explains the feature terms.

## GitHub Markdown

See the [GitHub Markdown guide](formats/gfm.md).

- The pinned GFM corpus matches **582 of 672 exact HTML examples (86.6%)**;
  **90 deviations** are documented. These include serialization differences in
  void tags, task-list classes, and highlighted code, as well as differences in
  reference resolution, tables, nested emphasis, raw HTML, escapes, and extended
  autolinks. The guide lists the affected specification sections and counts.
- HTML is sanitized after parsing. Scripts, event handlers, forms, embedded
  documents, arbitrary styles, SVG foreign objects, and animation are removed,
  even where the original parser would preserve them. Static SVG and MathML use
  a restricted presentation allowlist.
- Math uses Temml's supported TeX notation, not a complete TeX document engine.
  Currency-like dollar pairs are deliberately excluded from math parsing.
- Code fences display code; Markdown formulas and table cells do not calculate.
  Task state is edited in source, rather than through an interactive checklist.
  Mermaid output is sanitized static SVG with strict security settings.

The same exact-HTML deviation counts recorded in the format guide are:

| GFM specification section | Deviations |
| --- | ---: |
| Tabs | 1 |
| Thematic breaks | 11 |
| ATX headings | 1 |
| Setext headings | 11 |
| Indented code blocks | 1 |
| Fenced code blocks | 2 |
| Link reference definitions | 3 |
| Paragraphs | 1 |
| Tables | 1 |
| Block quotes | 4 |
| Task list items | 2 |
| Backslash escapes | 1 |
| Emphasis and strong emphasis | 9 |
| Links | 3 |
| Images | 19 |
| Autolinks | 4 |
| Extended autolinks | 8 |
| Disallowed raw HTML | 1 |
| Hard line breaks | 7 |

## AsciiMath

See the [AsciiMath guide](formats/asciimath.md).

- Formula support follows the pinned asciimath2tex translator, then Temml. This
  renders notation; it does not calculate, solve, or check the truth of an equality.
- Incomplete expressions may still render without a diagnostic because the
  translator is permissive. A rendered formula is not proof of valid input.
- A document switches from one-formula-per-line mode to mixed Markdown mode when
  it contains Markdown structure or math delimiters. Unmarked lines then become
  prose. Dollar-delimited formulas use AsciiMath rather than TeX in this format.
- Mixed prose inherits the Markdown rendering and sanitization limits above.

## Numbat

See the [Numbat guide](formats/numbat.md).

- Sheets runs pinned Numbat 1.24.0 through its WASM interpreter. The adapter's
  statement grouper handles common bracketed and indented continuations, but not
  every lexical corner of the complete language. A multiline statement's diagnostic
  attaches to its first source line.
- Terminal commands, a persistent interactive REPL, and a Sheets plot viewer are
  not provided. The interface displays source/result rows, not Markdown prose.
- A fresh worker starts for every render, with a **20-second deadline**. Editing
  or cancellation terminates it; definitions do not persist between renders.
- Some short names are predefined units and cannot be redefined. Currency rates
  depend on the ECB request/cache; missing or stale rates are disclosed rather
  than replaced with an invented value.

## CalcFile

See the [CalcFile guide](formats/calcfile.md).

- This is a pinned **v0.1 draft** reference engine, not a compatibility promise
  for every application using the same file extension. Functions, units, and
  locale behavior are limited to that draft.
- All 37 required upstream conformance cases pass, including cases with supplied
  exchange rates. The **Sheets UI supplies no currency-rate environment** to
  CalcFile, so cross-currency conversion reports missing external data.
- Auto detection deliberately does not select CalcFile from ambiguous prose.
  Choose it explicitly. Raw HashBin text lacks a filename and uses Auto unless
  the format is overridden or stored in a Sheets envelope.
- Output is a line calculator with headers and text, not a Markdown renderer or
  an interactive spreadsheet. Incomplete input can remain incomplete while typing;
  aggregates reject incompatible types.

## Org tables

See the [Org tables guide](formats/org.md).

- This is a JavaScript spreadsheet subset, not Emacs Org, Babel, or the complete
  Emacs Calc language. Emacs Lisp formulas are explicitly unsupported.
- Named fields, remote tables, iteration modes, arbitrary Calc syntax, and exact
  Emacs display-width alignment are not implemented. Formulas execute in order,
  rather than iterating until results converge.
- Surrounding prose supports basic headings, lists, emphasis, and links, rather
  than the full Org application/export environment. Numeric table calculations
  use the constrained mathjs evaluator; this is not a general dimension-checked
  physical modeling language. Ranges skip nonnumeric cells unless numeric coercion
  is requested.
- Recalculation updates the preview. The editor retains the original source
  until you copy recalculated source and paste it. Out-of-range references report
  diagnostics instead of creating cells. Independent Emacs comparisons cover
  supported numeric fixtures and exclude the intentional Lisp-error example.

## Calca

See the [Calca-compatible guide](formats/calca.md).

- This is a compatible subset implemented with constrained mathjs, not the
  original commercial Calca application or a complete mathjs shell. Object
  access, arbitrary JavaScript, imports, ranges, and unlisted functions are rejected.
- Equation solving supports **real scalar linear and quadratic polynomials with
  numeric coefficients**. Symbolic answers, unit-valued equations, general
  simultaneous systems, function inversion, higher powers, unknown denominators,
  and transcendental equations are unsupported.
- Explicit assignments take priority. Queries look backward for the most recent
  usable equation and may skip unsupported or underdetermined relations. This is
  not a simultaneous-equation consistency checker. Derived answers are not stored
  as assignments. An expression depending on multiple or no roots reports a
  diagnostic rather than choosing a root; query the unknown directly instead.
  Identities report infinitely many solutions rather than selecting an answer.
- Numeric definitions use assignment-time values; unresolved definitions use
  current values when queried. Reassignment is allowed, headings do not create
  scopes, and state resets on every render. These behaviors differ from Calca.
- Results use floating-point arithmetic with up to 12 significant displayed
  digits. Expressions are limited to **4,000 characters and 1,000 syntax nodes**,
  documents to **256 equations**, with additional bounds on definition expansion.
- Every fenced or indented code block is calculation input, regardless of its
  language label. Literal code, math, or Mermaid fences can therefore produce
  calculation diagnostics. Arrow answers replace text in the preview; the editor
  source is retained. Built-in unit/constant names can conflict with unknown names.

## Hurmet

See the [Hurmet guide](formats/hurmet.md).

- Sheets embeds a pinned upstream calculation/rendering engine, not Hurmet's
  rich-text editing application. Interactive drawing tools and live spreadsheet
  editing are outside this shell; tables and calculations are edited as source.
- Every render gets a fresh worker with a **20-second deadline**. There is no
  persistent calculation session across edits.
- Remote-data fetches follow upstream behavior and browser CORS rules. Fresh ECB
  currency rates and uncached remote data need a connection; ordinary calculations
  can use downloaded offline assets. HTML exports contain finished static output,
  rather than a live Hurmet interpreter.

## Beancount

See the [Beancount core-subset guide](formats/beancount.md).

- This is a project-owned core JavaScript engine, not Python Beancount or a full
  query environment. Includes, plugins, advanced options, advanced booking methods,
  lot selectors, total-cost syntax, and multi-commodity interpolation across
  multiple missing amounts are unsupported.
- Transactions infer at most **one missing posting amount**. Supported per-unit
  cost lots are reduced FIFO. Cost/price weights balance transactions, while
  displayed holdings retain their native quantities and commodities.
- Price directives are retained but **do not revalue reports**. There is no
  consolidated reporting currency or automatic market-price valuation.
- Arithmetic uses JavaScript numbers and a fixed **1e-8 transaction tolerance**,
  rather than Beancount's exact Decimal arithmetic and inferred tolerances.
  Upstream tolerance and rounding rules are not fully implemented.
- Balance assertions observe the start of their date, before that day's
  transactions. A pad acts at its next assertion. Reports can show partial balances
  alongside errors; they do not certify a ledger. Reports are predefined views,
  and a rendered export includes only the selected report.

## Quarto

See the [Quarto browser-notebook guide](formats/quarto.md).

- This is a browser subset, not the Quarto CLI or full Pandoc. YAML metadata,
  callouts, and figure references implement the documented basic forms. Nested-div
  parsing and complete cross-reference semantics are not implemented.
- Metadata support is limited to title, author, date, and execution defaults. Cell
  options support source visibility, evaluation, output visibility, a label, and a
  figure caption; the full Quarto metadata and cell-option system is not implemented.
- **Python and R execute; OJS and Julia are displayed without execution.** Ordinary
  language fences only display source; executable fences require braces.
- Python uses pinned Pyodide 0.27.7. Packages outside its distribution, unsupported
  native extensions, and system-level access are unavailable. Imports load packages
  through Pyodide's supported import mechanism.
- R uses pinned webR 0.6.0. Bundled or explicitly installed compatible packages
  are available; desktop-only packages and operating-system access are not.
  Extra packages must be downloaded again for a fresh render. Interactive input,
  debugging prompts, rich knitr HTML, inline R, and widgets are unsupported.
- R data frames print as console text rather than rich HTML. R plots are static
  embedded PNG images at 640 × 400 logical pixels; Python matplotlib output is
  static SVG. This is not a live widget environment.
- State is shared only within each language during one render. **Python and R do
  not exchange variables.** Their jobs may run concurrently, so interleaving cells
  does not order cross-language file or network side effects. Every render starts
  fresh sessions; interpreter state and packages are not exported.
- Each language has a **90-second deadline**, including runtime/package loading.
  Cancel or edit terminates the interpreter. Python/R execution requires a
  connection and is not in the offline download. Disable execution to read prose
  offline. Fetches and packages remain subject to browser networking/CORS limits.

## Plain text

See the [Plain text guide](formats/text.md).

- Plain text intentionally displays escaped source. It has no markup, math,
  calculations, evaluated tables, diagrams, links, or executable cells. This is a
  literal viewing mode rather than an incomplete adapter to a calculation language.
- Auto detection never selects it; choose it explicitly. A raw HashBin payload
  without a Sheets envelope uses Auto unless overridden.

## Limits shared by formats

- Highlighting is a lexical aid, not validation. Diagnostics and partial output
  must be read together. All rendered HTML, MathML, and SVG pass through the same
  sanitizer, including engine-generated and asynchronously generated output.
- Source links retain the document, format, and view. Around 8 KB the UI suggests
  HashBin; browser, messaging, and proxy URL limits vary. Decoded shared source and
  HashBin payloads are bounded at **5 MiB**; unsupported envelope versions are rejected.
- Offline files cache static app assets, not document URLs, HashBin payloads,
  external images, fresh currency rates, or Python/R runtimes. Browser storage may
  be evicted. HashBin and optional link shortening require a connection.
- Rendered HTML and PDF preserve finished output, not a running interpreter or
  editable application controls. External image URLs still need their server.

For the positive capability matrix, return to [Compare formats and features](format-comparison.md).
