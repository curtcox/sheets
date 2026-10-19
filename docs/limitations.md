# Limitations and compatibility

This page is generated from the shared [compatibility ledger](compatibility.json). It preserves the known disclosures from the format guides and tracks resolved work separately. The baseline inventory is imported; items marked for detailed audit still need atomic reproducers and upstream verification. No full-compatibility claim is implied.

See the [feature comparison and glossary](format-comparison.md) for capability definitions. The same ledger supplies the status summaries in each format guide.

## GitHub Markdown

See the [GitHub Markdown guide](formats/gfm.md). Compatibility target: cmark-gfm 0.29.0.gfm.13 / markdown-it 15.0.3.

- **GFM-01 — The pinned GFM corpus matches 582 of 672 exact HTML examples (86.6%); 90 deviations are documented** (Needs detailed audit). The pinned GFM corpus matches **582 of 672 exact HTML examples (86.6%)**; **90 deviations** are documented. These include serialization differences in void tags, task-list classes, and highlighted code, as well as differences in reference resolution, tables, nested emphasis, raw HTML, escapes, and extended autolinks. The guide lists the affected specification sections and counts.

- **GFM-02 — HTML is sanitized after parsing** (Intentional). HTML is sanitized after parsing. Scripts, event handlers, forms, embedded documents, arbitrary styles, SVG foreign objects, and animation are removed, even where the original parser would preserve them. Static SVG and MathML use a restricted presentation allowlist.

- **GFM-03 — Math uses Temml's supported TeX notation, not a complete TeX document engine** (Needs detailed audit). Math uses Temml's supported TeX notation, not a complete TeX document engine. Currency-like dollar pairs are deliberately excluded from math parsing.

- **GFM-04 — Code fences display code; Markdown formulas and table cells do not calculate** (Needs detailed audit). Code fences display code; Markdown formulas and table cells do not calculate. Task state is edited in source, rather than through an interactive checklist. Mermaid output is sanitized static SVG with strict security settings.

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

See the [AsciiMath guide](formats/asciimath.md). Compatibility target: asciimath2tex 1.5.0 / Temml 0.14.0.

- **AM-01 — Formula support follows the pinned asciimath2tex translator, then Temml** (Needs detailed audit). Formula support follows the pinned asciimath2tex translator, then Temml. This renders notation; it does not calculate, solve, or check the truth of an equality.

- **AM-02 — Incomplete expressions may still render without a diagnostic because the translator is permissive** (Needs detailed audit). Incomplete expressions may still render without a diagnostic because the translator is permissive. A rendered formula is not proof of valid input.

- **AM-03 — A document switches from one-formula-per-line mode to mixed Markdown mode when it contains Markdown…** (Needs detailed audit). A document switches from one-formula-per-line mode to mixed Markdown mode when it contains Markdown structure or math delimiters. Unmarked lines then become prose. Dollar-delimited formulas use AsciiMath rather than TeX in this format.

- **AM-04 — Mixed prose inherits the Markdown rendering and sanitization limits above.** (Needs detailed audit). Mixed prose inherits the Markdown rendering and sanitization limits above.

## Numbat

See the [Numbat guide](formats/numbat.md). Compatibility target: Numbat 1.24.0.

- **NUM-01 — Sheets runs pinned Numbat 1.24.0 through its WASM interpreter** (Needs detailed audit). Sheets runs pinned Numbat 1.24.0 through its WASM interpreter. The adapter's statement grouper handles common bracketed and indented continuations, but not every lexical corner of the complete language. A multiline statement's diagnostic attaches to its first source line.

- **NUM-02 — Terminal commands, a persistent interactive REPL, and a Sheets plot viewer are not provided** (Needs detailed audit). Terminal commands, a persistent interactive REPL, and a Sheets plot viewer are not provided. The interface displays source/result rows, not Markdown prose.

- **NUM-03 — A fresh worker starts for every render, with a 20-second deadline** (Intentional). A fresh worker starts for every render, with a **20-second deadline**. Editing or cancellation terminates it; definitions do not persist between renders.

- **NUM-04 — Some short names are predefined units and cannot be redefined** (Needs detailed audit). Some short names are predefined units and cannot be redefined. Currency rates depend on the ECB request/cache; missing or stale rates are disclosed rather than replaced with an invented value.

## CalcFile

See the [CalcFile guide](formats/calcfile.md). Compatibility target: CalcFile b11ecb44e4a5 (v0.1 draft).

- **CF-01 — This is a pinned v0.1 draft reference engine, not a compatibility promise for every application using the…** (Needs detailed audit). This is a pinned **v0.1 draft** reference engine, not a compatibility promise for every application using the same file extension. Functions, units, and locale behavior are limited to that draft.

- **CF-02 — All 37 required upstream conformance cases pass, including cases with supplied exchange rates** (Known gap). All 37 required upstream conformance cases pass, including cases with supplied exchange rates. The **Sheets UI supplies no currency-rate environment** to CalcFile, so cross-currency conversion reports missing external data.

- **CF-03 — Auto detection deliberately does not select CalcFile from ambiguous prose** (Needs detailed audit). Auto detection deliberately does not select CalcFile from ambiguous prose. Choose it explicitly. Raw HashBin text lacks a filename and uses Auto unless the format is overridden or stored in a Sheets envelope.

- **CF-04 — Output is a line calculator with headers and text, not a Markdown renderer or an interactive spreadsheet** (Needs detailed audit). Output is a line calculator with headers and text, not a Markdown renderer or an interactive spreadsheet. Incomplete input can remain incomplete while typing; aggregates reject incompatible types.

## Org tables

See the [Org tables guide](formats/org.md). Compatibility target: Emacs numeric fixture oracle; documented Calc subset.

- **ORG-01 — This is a JavaScript spreadsheet subset, not Emacs Org, Babel, or the complete Emacs Calc language** (Needs detailed audit). This is a JavaScript spreadsheet subset, not Emacs Org, Babel, or the complete Emacs Calc language. Emacs Lisp formulas are explicitly unsupported.

- **ORG-02 — Named fields, remote tables, iteration modes, arbitrary Calc syntax, and exact Emacs display-width…** (Needs detailed audit). Named fields, remote tables, iteration modes, arbitrary Calc syntax, and exact Emacs display-width alignment are not implemented. Formulas execute in order, rather than iterating until results converge.

- **ORG-03 — Surrounding prose supports basic headings, lists, emphasis, and links, rather than the full Org…** (Needs detailed audit). Surrounding prose supports basic headings, lists, emphasis, and links, rather than the full Org application/export environment. Numeric table calculations use the constrained mathjs evaluator; this is not a general dimension-checked physical modeling language. Ranges skip nonnumeric cells unless numeric coercion is requested.

- **ORG-04 — Recalculation updates the preview** (Needs detailed audit). Recalculation updates the preview. The editor retains the original source until you copy recalculated source and paste it. Out-of-range references report diagnostics instead of creating cells. Independent Emacs comparisons cover supported numeric fixtures and exclude the intentional Lisp-error example.

## Calca

See the [Calca guide](formats/calca.md). Compatibility target: public Calca reference; licensed-app verification still needed.

- **CALCA-01 — This is a compatible subset implemented with constrained mathjs, not the original commercial Calca…** (Needs detailed audit). This is a compatible subset implemented with constrained mathjs, not the original commercial Calca application or a complete mathjs shell. Object access, arbitrary JavaScript, imports, ranges, and unlisted functions are rejected.

- **CALCA-02 — Equation solving supports real scalar linear and quadratic polynomials with numeric coefficients** (Needs detailed audit). Equation solving supports **real scalar linear and quadratic polynomials with numeric coefficients**. Symbolic answers, unit-valued equations, general simultaneous systems, function inversion, higher powers, unknown denominators, and transcendental equations are unsupported.

- **CALCA-03 — Explicit assignments take priority** (Needs detailed audit). Explicit assignments take priority. Queries look backward for the most recent usable equation and may skip unsupported or underdetermined relations. This is not a simultaneous-equation consistency checker. Derived answers are not stored as assignments. An expression depending on multiple or no roots reports a diagnostic rather than choosing a root; query the unknown directly instead. Identities report infinitely many solutions rather than selecting an answer.

- **CALCA-04 — Numeric definitions use assignment-time values; unresolved definitions use current values when queried** (Needs detailed audit). Numeric definitions use assignment-time values; unresolved definitions use current values when queried. Reassignment is allowed, headings do not create scopes, and state resets on every render. These behaviors differ from Calca.

- **CALCA-05 — Results use floating-point arithmetic with up to 12 significant displayed digits** (Needs detailed audit). Results use floating-point arithmetic with up to 12 significant displayed digits. Expressions are limited to **4,000 characters and 1,000 syntax nodes**, documents to **256 equations**, with additional bounds on definition expansion.

- **CALCA-07 — Reserved names and remaining input grammar** (Needs detailed audit). Both profiles still evaluate one line at a time. Indentation-based multiline definitions, named arguments, multiple statements per line, and the original app’s broader prose/calculation inference remain unsupported. Built-in unit/constant names can conflict with unknown names; use distinct identifiers. Arrow answers replace preview text while the editor source remains intact.

### Resolved compatibility gaps

- **CALCA-06 — Calculation and literal Markdown block isolation** (Resolved). Structured blocks (calca-blocks-v1) uses parsed Markdown boundaries: only calca-labelled fences, indented code, and standalone paragraph arrow expressions calculate. Literal language/unlabelled fences, TeX, Mermaid, inline code/math, headings, links, and HTML do not run as calculations. Legacy remains the default for unprofiled URLs and version-1 saved documents. This resolves Markdown block isolation in the explicit profile; it does not implement Calca’s complete input grammar.

## Hurmet

See the [Hurmet guide](formats/hurmet.md). Compatibility target: Hurmet 24abefdaecbc.

- **HUR-01 — Sheets embeds a pinned upstream calculation/rendering engine, not Hurmet's rich-text editing application** (Needs detailed audit). Sheets embeds a pinned upstream calculation/rendering engine, not Hurmet's rich-text editing application. Interactive drawing tools and live spreadsheet editing are outside this shell; tables and calculations are edited as source.

- **HUR-02 — Every render gets a fresh worker with a 20-second deadline** (Intentional). Every render gets a fresh worker with a **20-second deadline**. There is no persistent calculation session across edits.

- **HUR-03 — Remote-data fetches follow upstream behavior and browser CORS rules** (Needs detailed audit). Remote-data fetches follow upstream behavior and browser CORS rules. Fresh ECB currency rates and uncached remote data need a connection; ordinary calculations can use downloaded offline assets. HTML exports contain finished static output, rather than a live Hurmet interpreter.

## Beancount

See the [Beancount guide](formats/beancount.md). Compatibility target: Beancount 3.2.0 / beanquery 0.2.0.

- **BEAN-01 — This is a project-owned core JavaScript engine, not Python Beancount or a full query environment** (Needs detailed audit). This is a project-owned core JavaScript engine, not Python Beancount or a full query environment. Includes, plugins, advanced options, advanced booking methods, lot selectors, total-cost syntax, and multi-commodity interpolation across multiple missing amounts are unsupported.

- **BEAN-02 — Transactions infer at most one missing posting amount** (Needs detailed audit). Transactions infer at most **one missing posting amount**. Supported per-unit cost lots are reduced FIFO. Cost/price weights balance transactions, while displayed holdings retain their native quantities and commodities.

- **BEAN-03 — Price directives are retained but do not revalue reports** (Needs detailed audit). Price directives are retained but **do not revalue reports**. There is no consolidated reporting currency or automatic market-price valuation.

- **BEAN-05 — Balance assertions observe the start of their date, before that day's transactions** (Needs detailed audit). Balance assertions observe the start of their date, before that day's transactions. A pad acts at its next assertion. Reports can show partial balances alongside errors; they do not certify a ledger. Reports are predefined views, and a rendered export includes only the selected report.

- **BEAN-06 — Decimal resource bounds and remaining rounding options** (Known gap). Numeric literals are bounded at 256 digits, and arithmetic uses a 28-significant-digit context. Other advanced options, including automatic rounding-account postings, remain unsupported. These are separate from the resolved decimal/tolerance work.

### Resolved compatibility gaps

- **BEAN-04 — Decimal arithmetic and precision tolerances** (Resolved). Amounts are preserved as decimal values with a 28-significant-digit, half-even arithmetic context. Transactions infer commodity tolerances; supported options control the multiplier, defaults, and cost/price contributions. Balance assertions support inferred and explicit tolerances. Earlier versions used a fixed 1e-8 transaction tolerance and binary numbers; reports also rounded to eight decimal places. These precision gaps are resolved for the supported syntax.

## Quarto

See the [Quarto guide](formats/quarto.md). Compatibility target: documented Quarto subset / Pyodide 0.27.7 / webR 0.6.0.

- **QT-01 — This is a browser subset, not the Quarto CLI or full Pandoc** (Needs detailed audit). This is a browser subset, not the Quarto CLI or full Pandoc. YAML metadata, callouts, and figure references implement the documented basic forms. Nested-div parsing and complete cross-reference semantics are not implemented.

- **QT-02 — Metadata support is limited to title, author, date, and execution defaults** (Needs detailed audit). Metadata support is limited to title, author, date, and execution defaults. Cell options support source visibility, evaluation, output visibility, a label, and a figure caption; the full Quarto metadata and cell-option system is not implemented.

- **QT-03 — Python and R execute; OJS and Julia are displayed without execution. Ordinary language fences only display…** (Needs detailed audit). **Python and R execute; OJS and Julia are displayed without execution.** Ordinary language fences only display source; executable fences require braces.

- **QT-04 — Python uses pinned Pyodide 0.27.7** (Needs detailed audit). Python uses pinned Pyodide 0.27.7. Packages outside its distribution, unsupported native extensions, and system-level access are unavailable. Imports load packages through Pyodide's supported import mechanism.

- **QT-05 — R uses pinned webR 0.6.0** (Needs detailed audit). R uses pinned webR 0.6.0. Bundled or explicitly installed compatible packages are available; desktop-only packages and operating-system access are not. Extra packages must be downloaded again for a fresh render. Interactive input, debugging prompts, rich knitr HTML, inline R, and widgets are unsupported.

- **QT-06 — R data frames print as console text rather than rich HTML** (Needs detailed audit). R data frames print as console text rather than rich HTML. R plots are static embedded PNG images at 640 × 400 logical pixels; Python matplotlib output is static SVG. This is not a live widget environment.

- **QT-07 — State is shared only within each language during one render** (Needs detailed audit). State is shared only within each language during one render. **Python and R do not exchange variables.** Their jobs may run concurrently, so interleaving cells does not order cross-language file or network side effects. Every render starts fresh sessions; interpreter state and packages are not exported.

- **QT-08 — Each language has a 90-second deadline, including runtime/package loading** (Needs detailed audit). Each language has a **90-second deadline**, including runtime/package loading. Cancel or edit terminates the interpreter. Python/R execution requires a connection and is not in the offline download. Disable execution to read prose offline. Fetches and packages remain subject to browser networking/CORS limits.

## Plain text

See the [Plain text guide](formats/text.md). Compatibility target: literal source mode.

- **TEXT-01 — Plain text intentionally displays escaped source** (Intentional). Plain text intentionally displays escaped source. It has no markup, math, calculations, evaluated tables, diagrams, links, or executable cells. This is a literal viewing mode rather than an incomplete adapter to a calculation language.

- **TEXT-02 — Auto detection never selects it; choose it explicitly** (Intentional). Auto detection never selects it; choose it explicitly. A raw HashBin payload without a Sheets envelope uses Auto unless overridden.

## Limits shared by formats

- **SHARED-01 — Highlighting is a lexical aid, not validation** (Needs detailed audit). Highlighting is a lexical aid, not validation. Diagnostics and partial output must be read together. All rendered HTML, MathML, and SVG pass through the same sanitizer, including engine-generated and asynchronously generated output.

- **SHARED-02 — Source links retain the document, format, and view** (Needs detailed audit). Source links retain the document, format, and view. Around 8 KB the UI suggests HashBin; browser, messaging, and proxy URL limits vary. Decoded shared source and HashBin payloads are bounded at **5 MiB**; unsupported envelope versions are rejected.

- **SHARED-03 — Offline files cache static app assets, not document URLs, HashBin payloads, external images, fresh…** (Needs detailed audit). Offline files cache static app assets, not document URLs, HashBin payloads, external images, fresh currency rates, or Python/R runtimes. Browser storage may be evicted. HashBin and optional link shortening require a connection.

- **SHARED-04 — Rendered HTML and PDF preserve finished output, not a running interpreter or editable application controls** (Needs detailed audit). Rendered HTML and PDF preserve finished output, not a running interpreter or editable application controls. External image URLs still need their server.
