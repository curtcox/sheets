# Limitations and compatibility

This page is generated from the shared [compatibility ledger](compatibility.json). It preserves the known disclosures from the format guides and tracks resolved work separately. The baseline inventory is imported; items marked for detailed audit still need atomic reproducers and upstream verification. No full-compatibility claim is implied.

See the [feature comparison and glossary](format-comparison.md) for capability definitions. The same ledger supplies the status summaries in each format guide.

## GitHub Markdown

See the [GitHub Markdown guide](formats/gfm.md). Compatibility target: cmark-gfm 0.29.0.gfm.13 / markdown-it 15.0.3.

- **GFM-02 — HTML is sanitized after parsing** (Intentional). GFM raw-text tags (including script, style, title, and iframe) are escaped as readable text before browser parsing. All output is then sanitized. Active scripts, event handlers, forms, embedded documents, arbitrary styles, SVG foreign objects, and animation cannot survive as active elements, even where the original parser would preserve them. Static SVG and MathML use a restricted presentation allowlist.

- **GFM-03 — Math uses Temml's supported TeX notation, not a complete TeX document engine** (Needs detailed audit). Math uses Temml's supported TeX notation, not a complete TeX document engine. Currency-like dollar pairs are deliberately excluded from math parsing.

- **GFM-04 — Code fences display code; Markdown formulas and table cells do not calculate** (Intentional). Code fences display code; Markdown formulas and table cells do not calculate. Task state is edited in source, rather than through an interactive checklist. Mermaid output is sanitized static SVG with strict security settings.

- **GFM-05 — Automatic link recognition has bounded candidates** (Intentional). Automatic URL recognition scans at most 10,000 characters after a recognized prefix, preserving the existing linkify-it bound. The supplementary GFM email scanner emits only complete candidates of at most 10,000 characters. Remaining text stays visible and existing library matches keep their behavior. Use an explicit Markdown link for a longer address.

- **GFM-06 — Email gaps are fixed; native autolink differences are intentional** (Intentional). Email-domain underscores and valid email prefixes before a plus sign now match the native reference. The separate audit has **53 matching fixtures and four intentional differences**: Sheets retains uppercase WWW links, numeric final email-domain characters, Unicode email hosts with IDNA normalization, and an existing raw HTML anchor instead of producing a nested email link. Canonical corpus conformance remains **672/672**; these native differences are retained policies, not unresolved email-recognition gaps.

### Resolved compatibility gaps

- **GFM-01 — All 672 published GFM corpus examples match canonical raw HTML** (Resolved). Canonical raw HTML matches **672/672** published examples with their extension flags, including the two task examples marked disabled upstream. The three original autolink boundary gaps and empty-blockquote serialization are fixed; two old empty-output mismatches were corpus-reader artifacts. Production HTML matches **601/672** and the sanitized browser DOM matches **627/672**, with all remaining corpus differences classified as presentation, extension mode, or sanitization. This is corpus conformance, not full native-engine parity; broader host/email differences are tracked by GFM-06.

Current corpus measurements (see the guide for definitions):

| Layer | Exact matches | Remaining differences |
| --- | ---: | --- |
| Canonical raw HTML | 672/672 | None in the published corpus |
| Production HTML | 601/672 | 58 HTML5 void-tag spellings, two highlighted fences, two task CSS hooks, nine extension-mode differences |
| Sanitized browser DOM | 627/672 | 32 sanitization-only differences plus 13 presentation/extension-mode differences |

The independent native autolink audit has 53 matches and four intentional differences outside this corpus (GFM-06).

## AsciiMath

See the [AsciiMath guide](formats/asciimath.md). Compatibility target: asciimath2tex 1.5.0 / Temml 0.14.0.

- **AM-01 — Pinned translator and Temml retain audited notation gaps** (Known gap). AsciiMath is notation rendering, not evaluation, solving, or a truth check. In 436 pinned upstream cases, 430 translator TeX strings match; four existing differences retain explicit thin spaces omitted by expectations. Two nested-matrix cases have malformed JavaScript expectation strings and different grouping. Temml does not support the arrow command produced by >->> and twoheadrightarrowtail (16 duplicated corpus cases); Sheets now reports these typesetting failures at the formula location. Broader translator/MathML coverage remains FORMAT-1.

- **AM-04 — Mixed prose inherits the Markdown rendering and sanitization limits above.** (Intentional). Mixed prose inherits the Markdown rendering and sanitization limits above.

- **AM-05 — Incomplete-input warnings are advisory and preserve permissive notation** (Intentional). The adapter inspects the pinned translator tree instead of imposing balanced/matching-delimiter grammar. Standalone operator names, one-sided delimiters, mixed interval brackets, text labels and one-sided limit signs retain upstream interpretation without new warnings. Detectable missing operands receive warnings while still rendering. Other incomplete forms may remain unflagged; no warning means neither a proof of syntax completeness nor a true mathematical statement. Unsupported Temml commands remain typesetting errors (AM-01).

### Resolved compatibility gaps

- **AM-02 — Detectable incomplete formulas now have source-line diagnostics** (Resolved). Sheets warns about synthesized empty denominators, subscripts, exponents and required arguments, bare opening delimiters in required arguments, and unfinished text arguments. Translation and Temml failures are reported separately. Locations cover formula lists, inline/display math and fences, including lists, quotes, tables, Unicode and footnotes. Warnings retain the translated output and Show TeX; later formulas still render. This is not a complete validity or truth checker (AM-05).

- **AM-03 — Formula list and Mixed prose modes are explicit and shareable** (Resolved). AsciiMath mode offers Formula list (asciimath-formulas-v1) and Mixed prose (asciimath-prose-v1). Explicit modes survive edits, sharing, version-2 saves, sign-in returns and offline reloads, and select AsciiMath under Format Auto. Omitted profiles retain the original heuristic; adding Markdown/dollar delimiters can still switch an Auto document. Formula list treats every nonempty line as notation. Mixed prose typesets only delimited/fenced math. Source files contain only text, so reselect the mode when reusing them.

## Numbat

See the [Numbat guide](formats/numbat.md). Compatibility target: Numbat 1.24.0.

- **NUM-02 — Terminal commands, a persistent interactive REPL, and a Sheets plot viewer are not provided** (Needs detailed audit). Terminal commands, a persistent interactive REPL, and a Sheets plot viewer are not provided. The interface displays source/result rows, not Markdown prose.

- **NUM-03 — A fresh worker starts for every render, with a 20-second deadline** (Intentional). A fresh worker starts for every render, with a **20-second deadline**. Editing or cancellation terminates it; definitions do not persist between renders.

- **NUM-04 — Some short names are predefined units and cannot be redefined** (Needs detailed audit). Some short names are predefined units and cannot be redefined. Currency rates depend on the ECB request/cache; missing or stale rates are disclosed rather than replaced with an invented value. Browser requests now use the official ECB data API; the shared service builds the daily XML required by Numbat, excluding discontinued older series. The original daily XML download blocks cross-origin reads.

- **NUM-05 — Lexical errors stop partial evaluation; formatted engine reports use input-local lines** (Intentional). If the upstream tokenizer cannot read the document (for example, an unterminated string or unexpected character), Sheets evaluates it as one complete input and reports the lexical error without partial results. Valid-looking text inside a broken string is never guessed to be code. With readable tokens, later statements can run after parse/type/runtime errors. Formatted engine reports retain row-local line numbers; editor annotations use original document positions. Imported-module labels stay in the engine report and are not assigned false editor locations.

### Resolved compatibility gaps

- **NUM-01 — Statement boundaries and source diagnostics use the pinned upstream parser** (Resolved). The adapter now uses Numbat 1.24.0 parser consumption/recovery ranges instead of indentation and trailing-character guesses. Multiline strings, escaped quotes, interpolation, comments, decorators, lists, function parameters, where definitions and semicolons are covered by 25 fixtures checked against the original unmodified WASM. Editor diagnostics map UTF-8 byte spans to actual document lines and UTF-16 columns, retaining related locations from earlier inputs. Lexical-error fallback and local engine-report numbering are disclosed separately in NUM-05.

## CalcFile

See the [CalcFile guide](formats/calcfile.md). Compatibility target: CalcFile b11ecb44e4a5 (v0.1 draft).

- **CF-01 — This is a pinned v0.1 draft reference engine, not a compatibility promise for every application using the…** (Needs detailed audit). This is a pinned **v0.1 draft** reference engine, not a compatibility promise for every application using the same file extension. Functions, units, and locale behavior are limited to that draft.

- **CF-03 — Auto detection deliberately does not select CalcFile from ambiguous prose** (Needs detailed audit). Auto detection deliberately does not select CalcFile from ambiguous prose. Choose it explicitly. Raw HashBin text lacks a filename and uses Auto unless the format is overridden or stored in a Sheets envelope.

- **CF-04 — Output is a line calculator with headers and text, not a Markdown renderer or an interactive spreadsheet** (Needs detailed audit). Output is a line calculator with headers and text, not a Markdown renderer or an interactive spreadsheet. Incomplete input can remain incomplete while typing; aggregates reject incompatible types.

- **CF-05 — ECB base pairs, cache availability and changing external data** (Intentional). The pinned engine recognizes EUR, USD, GBP and JPY and converts only when one side is the rate table base. Sheets supplies the ECB EUR base, so direct non-EUR pairs and currencies such as CHF remain unsupported. Validated rates are cached for 24 hours; refresh failure may use an older snapshot with a notice and original date, and publications older than seven days are flagged. Offline conversion needs a previously cached snapshot plus installed app files; offline installation does not preload rates. Malformed feeds and corrupt/future cache entries are rejected. Requests have a twenty-second deadline. Optional storage may be unavailable or evicted. Source links, downloads and HashBin documents store source rather than rates; rendered HTML preserves the finished answers and date. The original daily XML download blocks cross-origin browser reads; the official ECB data API is used instead, with no document source in requests.

### Resolved compatibility gaps

- **CF-02 — ECB decimal rate environment supplied to CalcFile** (Resolved). The shared service reads the browser-accessible official ECB data API and builds a validated daily XML snapshot while preserving decimal rate text and the latest publication date. Discontinued older series are excluded. CalcFile now supplies validated decimal-string ECB rates with their publication date, fetching only when the engine reports missing external data. Supported EUR-base conversions work online or with a valid cache. Refresh failures disclose older cached rates; malformed or unavailable data keeps source-line diagnostics. Cancellation discards late responses without cache writes. The original 37 required upstream conformance cases still pass. Pair/currency and rate-snapshot boundaries remain under CF-05.

## Org tables

See the [Org tables guide](formats/org.md). Compatibility target: Emacs numeric fixture oracle; documented Calc subset.

- **ORG-01 — This is a JavaScript spreadsheet subset, not Emacs Org, Babel, or the complete Emacs Calc language** (Needs detailed audit). This is a JavaScript spreadsheet subset, not Emacs Org, Babel, or the complete Emacs Calc language. Emacs Lisp formulas are explicitly unsupported.

- **ORG-02 — Remaining Org target syntax, numeric modes, iteration and native layout are incomplete** (Known gap). Numeric named bindings, same-document remote cells/ranges and Emacs Calc default/explicit numeric modes work (ORG-09). The explicit Emacs-order profile supplies row-major sorted columns, protected fields, sorted field formulas and duplicate-target rejection; Legacy retains source-order links. Target ranges, relative targets in Emacs order, dynamic remote indirection, A1 remote notation, cross-file/ID references, iteration, property/external or nonnumeric bindings, Calc symbolic/complex/unit/date/duration results and exact Emacs display-width/export layout remain unsupported. Remote and Calc failure diagnostics retain the affected cell instead of native symbolic or #ERROR text. Numeric conditional formulas and comparisons are supported (ORG-10), while vector/symbolic conditions and comparisons, logical operators and ternary syntax remain unsupported, and preview table layout in ORG-12. Thousands grouping, including grouped currency display, is not provided. ;%.2f controls decimal places and a literal dollar prefix is possible, but it does not add grouping. Cross-document inputs still require duplicated constants or tables until FILE-1.

- **ORG-03 — Surrounding prose supports basic headings, lists, emphasis, and links, rather than the full Org…** (Needs detailed audit). Surrounding prose supports basic headings, lists, emphasis, and links, rather than the full Org application/export environment. Numeric table calculations use a project-owned Emacs Calc subset (ORG-09), not the complete Calc language or a dimension-checked physical modeling language. Cell text is read as Calc input: empty fields become zero and are dropped from ranges unless E keeps them as nan; nonnumeric text is symbolic in Calc and produces a diagnostic unless N converts it with Emacs number parsing.

- **ORG-04 — Recalculation updates the preview** (Needs detailed audit). Recalculation updates the preview. The editor retains the original source until you copy recalculated source and paste it. Out-of-range references report diagnostics instead of creating cells. Independent Emacs comparisons cover supported numeric fixtures and exclude the intentional Lisp-error example. Preview cells cannot be edited directly, marked as inputs, or given per-cell notes. Org has no goal seek or what-if tool; Calca’s scalar solver is a separate format and does not solve Org table cells. These are UI-1 feature requests, not native recalculation fixes.

- **ORG-12 — Preview tables lack native header semantics and numeric alignment** (Known gap). Org preview tables currently render every cell as td and left-align columns. Rows before the first separator do not become thead/th, and numeric columns are not right-aligned as in native Org HTML export. This is an HTML presentation gap, separate from source display-width alignment and the narrow-cell wrapping defect (ORG-11).

- **ORG-13 — File constants calculate but are hidden in the preview** (Known gap). #+CONSTANTS: supplies numeric inputs but its keyword is omitted from the preview, as in native Org HTML export. Readers therefore cannot see those assumptions unless the source or a separate Inputs table exposes them. Echo constants through field formulas in an Inputs table today. An optional constants display is a usability feature request, not an arithmetic compatibility defect.

### Resolved compatibility gaps

- **ORG-05 — Numeric named bindings and marked-row selection match Emacs fixtures** (Resolved). The first name row supplies column aliases; field markers name adjacent fields; numeric table parameters and file constants provide reusable inputs. Precedence, duplicate behavior, pre-pass field snapshots, scientific notation, ranges and marked-row selection are checked against Emacs. Named fields can be targets; column targets stay numeric. Remaining binding and evaluation features stay under ORG-02.

- **ORG-06 — Literal Org blocks no longer run formulas or install constants** (Resolved). Active tables and constants are discovered through the Org AST. Source/example/export blocks remain escaped literals and comment blocks are omitted. Their apparent formulas and constants do not affect calculations. Quoted formula strings retain their literal dollar signs. Exact source is preserved in editor shares and downloads.

- **ORG-07 — Explicit Emacs order matches supported native scheduling and duplicate-target rejection** (Resolved). The org-emacs-v1 profile sorts stored targets lexically, applies columns row by row with field protection, then applies sorted field formulas. Duplicate numeric/named/boundary targets reject the formula line before writes. Only the first stored TBLFM line is active, allowing preceding blank lines. Existing unprofiled links and version-1 saves retain Legacy source order. Target ranges, relative targets and full dependency solving remain outside this supported slice.

- **ORG-08 — Same-document remote references read current pass state without recursive evaluation** (Resolved). remote() reads numeric cells/ranges or named numeric fields from active named tables in the same source document. Table names are case-insensitive and first-match wins; field/column aliases remain case-sensitive. References use current document-order pass state and never recursively recalculate dependencies. Blank-separated tables remain distinct and literal blocks cannot supply data. Missing/unsupported/out-of-range references report source-line diagnostics and retain the cell. Dynamic names, A1 notation, relative remote addresses and file/ID lookup remain unsupported.

- **ORG-09 — Formulas use Emacs Calc default modes, exact integers and Calc display** (Resolved). Formulas follow a DOM-free Emacs Calc subset in both Legacy and Emacs order: degree angles, 12 internal digits and an 8-significant-digit float display, exact integers, trailing-point floats (5.), Calc scientific-notation thresholds, multiplication binding tighter than division (10/4*2 is 1.25), Calc function names (arcsin, not asin) and Calc exact trigonometric/logarithm special cases. Mode letters p, n, f, s, e, D, R, F, E, N and L, one printf conversion (%d, %f, %e or %g, applied to the displayed value as Emacs does) and the table % format parameter are supported. Symbolic results, complex numbers, infinities, units, dates, strings, durations (T, t, U), symbolic mode S and unit mode u produce source-line diagnostics and retain the cell instead of native symbolic or #ERROR text. No advisory hint warns about mixed multiplication/division; parenthesize the intended division explicitly.

- **ORG-10 — Numeric Calc conditionals and comparisons match Emacs fixtures** (Resolved). Both calculation modes support if(c,a,b) with a real scalar condition (zero is false, nonzero is true), and exact numeric <, >, <=, >=, ==, = and != comparisons returning 0 or 1. Arithmetic binds before comparisons. Only the selected branch evaluates, but both branches and referenced field text must parse; table addresses and named inputs resolve before selection. Ascending/descending three-value chains, homogeneous equality/distinctness chains and explicit grouping follow native Calc. Symbolic/nan conditions or unresolved comparisons, vector conditions/comparisons, logical operators and ternary syntax remain outside this slice. Selected errors retain the cell with a source-line diagnostic. Formula bounds remain in force, with at most 10,000 numeric comparisons per evaluation.

- **ORG-11 — Org table values stay intact in narrow previews and HTML exports** (Resolved). Org tables use a bounded horizontal scroll area instead of breaking single-token cells across lines. This keeps values such as 0.03, signed amounts, scientific notation and one-word headings intact; multiword cells can wrap at ordinary word boundaries. The preview scroll area is keyboard-focusable and supports left/right arrows, and standalone HTML exports retain the layout without scripts. Screen overflow is released for printing; tables wider than the printable page can still need landscape or wider paper. Native header semantics and numeric alignment remain a separate open gap (ORG-12).

## Calca

See the [Calca guide](formats/calca.md). Compatibility target: public Calca reference; licensed-app verification still needed.

- **CALCA-01 — This is a compatible subset implemented with constrained mathjs, not the original commercial Calca…** (Needs detailed audit). This is a compatible subset implemented with constrained mathjs, not the original commercial Calca application or a complete mathjs shell. Object access, arbitrary JavaScript, imports, ranges, and unlisted functions are rejected.

- **CALCA-02 — Equation solving supports real scalar linear and quadratic polynomials with numeric coefficients** (Needs detailed audit). Equation solving supports **real scalar linear and quadratic polynomials with numeric coefficients**. Symbolic answers, unit-valued equations, general simultaneous systems, function inversion, higher powers, unknown denominators, and transcendental equations are unsupported.

- **CALCA-03 — Equation selection and bounded connected-constraint checks** (Needs detailed audit). Legacy and Structured blocks prioritize explicit assignments and the latest usable equation, possibly skipping unsupported or underdetermined relations. Scoped definitions checks all connected real scalar relations against candidate roots and reports conflicts; it is not a general simultaneous-system solver. Derived answers are not stored as assignments. Expressions depending on multiple or no roots report diagnostics; query the unknown directly. Identities report infinitely many solutions. Complete native-app equation selection and conflict behavior still needs verification.

- **CALCA-04 — Definition semantics and native-app verification** (Needs detailed audit). Legacy and Structured blocks allow reassignment, share one document context, and use assignment-time values for resolved numeric definitions. Scoped definitions (calca-scopes-v1) retains the first visible definition, treats repeated definitions as constraints, resolves deferred dependencies and function free variables at query time, and scopes definitions/relations to headings and descendants. Child definitions cannot shadow inherited names. The public heading example is covered; child redefinition, deferred binding, conflict presentation, and Setext rules are explicit Sheets policies pending licensed-app comparison. State resets on every render.

- **CALCA-05 — Results use floating-point arithmetic with up to 12 significant displayed digits** (Needs detailed audit). Results use floating-point arithmetic with up to 12 significant displayed digits. Scoped relation checks allow 64 machine epsilons of relative error; solved unknowns use arithmetic magnitude, including terms lost to cancellation, without an absolute floor. These checks are numerical, not exact proofs. Expressions allow 4,000 characters and 1,000 syntax nodes. Legacy and Structured blocks allow 256 equations; Scoped definitions allows 256 definitions/relations together, with dependency/relation-expansion depth 32 and bounded query work. This numerical policy is not verified native Calca equivalence.

- **CALCA-07 — Reserved names and remaining input grammar** (Needs detailed audit). All Calca modes still evaluate one line at a time. Indentation-based multiline definitions, named arguments, multiple statements per line, and the original app’s broader prose/calculation inference remain unsupported. Built-in unit/constant names can conflict with unknown names; use distinct identifiers. Arrow answers replace preview text while the editor source remains intact. Forward calls to undeclared functions are unsupported. Unlisted built-in functions are rejected both as direct calls and as function values, so user-function arguments cannot bypass the allowlist. Scoped definitions rejects nested assignments in expressions and function bodies to preserve immutable bindings.

### Resolved compatibility gaps

- **CALCA-06 — Calculation and literal Markdown block isolation** (Resolved). Structured blocks (calca-blocks-v1), also included in Scoped definitions (calca-scopes-v1), uses parsed Markdown boundaries: only calca-labelled fences, indented code, and standalone paragraph arrow expressions calculate. Literal language/unlabelled fences, TeX, Mermaid, inline code/math, headings, links, and HTML do not run as calculations. Legacy remains the default for unprofiled URLs and version-1 saved documents. This resolves Markdown block isolation in the explicit profile; it does not implement Calca’s complete input grammar.

- **CALCA-08 — Heading-local immutable definitions in an explicit profile** (Resolved). Scoped definitions (calca-scopes-v1) adds immutable visible definitions, heading-local definitions/relations, deferred dependency ordering, cycle diagnostics, reverse linear/quadratic definitions, and connected real scalar constraint checks. The public-reference heading fixture is reproduced; broader native semantics remain under CALCA-04 audit. Legacy and Structured blocks retain their earlier semantics. Source links, version-2 saved documents, OAuth snapshots, exports and offline reloads preserve the selected mode; plain source files require reselecting it.

## Hurmet

See the [Hurmet guide](formats/hurmet.md). Compatibility target: Hurmet 24abefdaecbc.

- **HUR-01 — Sheets embeds a pinned upstream calculation/rendering engine, not Hurmet's rich-text editing application** (Needs detailed audit). Sheets embeds a pinned upstream calculation/rendering engine, not Hurmet's rich-text editing application. Interactive drawing tools and live spreadsheet editing are outside this shell; tables and calculations are edited as source.

- **HUR-02 — Every render gets a fresh worker with a 20-second deadline** (Intentional). Every render gets a fresh worker with a **20-second deadline**. There is no persistent calculation session across edits.

- **HUR-03 — Remote-data fetches follow upstream behavior and browser CORS rules** (Needs detailed audit). Remote-data fetches follow upstream behavior and browser CORS rules. Fresh ECB currency rates and uncached remote data need a connection; ordinary calculations can use downloaded offline assets. HTML exports contain finished static output, rather than a live Hurmet interpreter.

### Resolved compatibility gaps

- **HUR-04 — Decimal-string ECB rates reach the rational parser** (Resolved). The Hurmet worker now supplies ECB decimal strings, including EUR = 1, instead of JavaScript numbers. This fixes the currency rational-parser runtime error. Validated shared rates use the 24-hour cache and a disclosed older fallback when refreshing fails. Missing rates retain diagnostics, and source links do not freeze rate snapshots. The shared service uses the CORS-readable official ECB data API rather than the blocked daily XML download.

## Beancount

See the [Beancount guide](formats/beancount.md). Compatibility target: Beancount 3.2.0 / beanquery 0.2.0.

- **BEAN-01 — This is a project-owned core JavaScript engine, not Python Beancount or a full query environment** (Needs detailed audit). This is a project-owned core JavaScript engine, not Python Beancount or a full query environment. Includes, plugins, advanced options, combined costs, merge markers, lot cost/quantity interpolation, and multi-commodity interpolation across multiple missing amounts remain unsupported. Per-unit/total costs, date/label selectors, and six booking methods are supported; see BEAN-07/08.

- **BEAN-02 — Transactions infer at most one missing posting amount** (Needs detailed audit). Transactions infer at most **one missing posting amount**. For cost transactions with a missing posting, one weight commodity must be known. Cost/price weights balance transactions, while displayed holdings retain native quantities and commodities. No consolidated valuation is implied.

- **BEAN-03 — Price directives are retained but do not revalue reports** (Needs detailed audit). Price directives are retained but **do not revalue reports**. There is no consolidated reporting currency or automatic market-price valuation.

- **BEAN-05 — Balance assertions observe the start of their date, before that day's transactions** (Needs detailed audit). Balance assertions observe the start of their date, before that day's transactions. A pad acts at its next assertion. Reports can show partial balances alongside errors; they do not certify a ledger. Reports are predefined views, and a rendered export includes only the selected report.

- **BEAN-06 — Decimal resource bounds and remaining rounding options** (Known gap). Numeric literals are bounded at 256 digits, and arithmetic uses a 28-significant-digit context. Other advanced options, including automatic rounding-account postings, remain unsupported. These are separate from the resolved decimal/tolerance work.

- **BEAN-09 — Remaining cost grammar, lot interpolation and booking bounds** (Known gap). Combined per-unit/total costs, merge markers, cost/quantity interpolation within a lot, arbitrary arithmetic amounts, and automatic lot commodity inference across several cost commodities remain unsupported. Cost transactions with a missing posting require one known weight commodity and one missing amount. AVERAGE is diagnosed as unsupported; the pinned native version also rejects its reductions. Total costs on zero units are diagnosed instead of crashing with the native division-by-zero error. Uncosted and costed positions are distinct; additional mixed-inventory edge cases still need audit.

### Resolved compatibility gaps

- **BEAN-04 — Decimal arithmetic and precision tolerances** (Resolved). Amounts are preserved as decimal values with a 28-significant-digit, half-even arithmetic context. Transactions infer commodity tolerances; supported options control the multiplier, defaults, and cost/price contributions. Balance assertions support inferred and explicit tolerances. Earlier versions used a fixed 1e-8 transaction tolerance and binary numbers; reports also rounded to eight decimal places. These precision gaps are resolved for the supported syntax.

- **BEAN-07 — Per-unit/total costs and date/label lot selectors** (Resolved). Per-unit and total-cost lots, commodity/date/label selectors, exact decimal normalization, merged identical positions, and short-position covers now match the pinned native fixtures. Older versions silently interpreted total costs as unit costs. This bounded syntax gap is resolved; combined costs, merge markers, lot interpolation, and broader commodity inference remain open in BEAN-09.

- **BEAN-08 — Explicit booking policies and ambiguous-reduction rejection** (Resolved). STRICT (the native default), STRICT_WITH_SIZE, FIFO, LIFO, HIFO, and NONE are supported file-wide and per account. Insufficient/unmatched/ambiguous reductions reject their weight-commodity group without changing its inventory; other groups may remain in partial reports. Earlier versions always reduced FIFO. Specify FIFO explicitly to retain that intended policy; unambiguous per-unit ledgers retain their balances. Native fixtures compare remaining cost positions as well as validity and balances.

## Quarto

See the [Quarto guide](formats/quarto.md). Compatibility target: Quarto 1.10.19 control fixtures / documented browser subset / Pyodide 0.27.7 / webR 0.6.0.

- **QT-01 — This is a browser subset, not the Quarto CLI or full Pandoc** (Known gap). This remains a browser subset of Quarto and Pandoc. Nested callouts/divs and forward figure references now use a structured Markdown pass with source diagnostics. Cross-references use flat figure numbering only; subfigures, grouped/prefix-suppressed references, nonfigure targets, citations, localisation, automatic callout headers/icons, and appearance/collapse/title controls remain unsupported. Unsupported attributes are diagnosed; raw HTML IDs do not register figures. Image/cell captions are plain text.

- **QT-02 — Broader notebook metadata, output modes and native execution policies remain incomplete** (Known gap). Include, warning, explicit error controls, plot alt text, document figure dimensions and R cell figure sizes are supported. Typed invalid/unsupported keys retain source locations. Structured authors, independent message controls, raw output modes, broader metadata, per-plot alt/caption arrays and full image attributes remain unsupported. Sheets retains continue-after-error by default instead of the CLI stop default, stops the rest of a failed cell, and provides partial previews; error:false halts only later cells in the affected independent language session. Plot formats, DPI/retina, exact cropping/font/pixel parity and full native engine recovery remain incomplete.

- **QT-03 — Python and R execute; OJS and Julia are displayed without execution. Ordinary language fences only display…** (Needs detailed audit). **Python and R execute; OJS and Julia are displayed without execution.** Ordinary language fences only display source; executable fences require braces.

- **QT-04 — Python uses pinned Pyodide 0.27.7** (Needs detailed audit). Python uses pinned Pyodide 0.27.7. Packages outside its distribution, unsupported native extensions, and system-level access are unavailable. Imports load packages through Pyodide's supported import mechanism.

- **QT-05 — R uses pinned webR 0.6.0** (Needs detailed audit). R uses pinned webR 0.6.0. Bundled or explicitly installed compatible packages are available; desktop-only packages and operating-system access are not. Extra packages must be downloaded again for a fresh render. Interactive input, debugging prompts, rich knitr HTML, inline R, and widgets are unsupported.

- **QT-06 — R data frames print as console text rather than rich HTML** (Needs detailed audit). R data frames print as console text rather than rich HTML. R plots are static embedded PNG images at 640 × 400 logical pixels; Python matplotlib output is static SVG. This is not a live widget environment.

- **QT-07 — State is shared only within each language during one render** (Needs detailed audit). State is shared only within each language during one render. **Python and R do not exchange variables.** Their jobs may run concurrently, so interleaving cells does not order cross-language file or network side effects. Every render starts fresh sessions; interpreter state and packages are not exported.

- **QT-08 — Each language has a 90-second deadline, including runtime/package loading** (Needs detailed audit). Each language has a **90-second deadline**, including runtime/package loading. Cancel or edit terminates the interpreter. Python/R execution requires a connection and is not in the offline download. Disable execution to read prose offline. Fetches and packages remain subject to browser networking/CORS limits.

### Resolved compatibility gaps

- **QT-09 — Nested divs and basic figure targets use structured parsing** (Resolved). Nested callouts/divs can contain executable cells. Standalone images, figure divs and visible cell plots support forward figure references. Duplicate, absent, unavailable and malformed targets report original source locations; code, escaped syntax, links, math and raw HTML stay literal. Multiple plots from one cell share one target. This resolves the QT-1 structural subset; remaining grammar and cross-reference features stay in QT-01.

- **QT-10 — Supported YAML options are validated at their source keys** (Resolved). Supported metadata and cell option types are validated using parsed YAML event positions, including quoted/flow keys, aliases and duplicate-key errors. Cell booleans override defaults; document execution-disable gates remain absolute. Unsupported/invalid entries produce diagnostics while valid siblings still work. Remaining controls stay in QT-02.

- **QT-11 — Typed include, warning and explicit error controls govern actual notebook execution** (Resolved). Include:false executes hidden setup and preserves state while suppressing its preview; failures remain diagnostics. Warning controls filter Python stderr and R warnings/messages; native knitr aliases YAML warning to its message setting at document and cell level. Hidden R failures stop their session even with error:true, following knitr; hidden Python failures follow their error setting. Explicit error:false stops later cells in that language at the backend; error:true continues to the next cell. Defaults and overrides are verified against pinned Quarto/Jupyter/knitr contracts. Existing omitted-error continuation, independent sessions, failed-cell recovery and partial-preview differences remain disclosed under QT-02.

- **QT-12 — Plot dimensions and alternative text survive rendering and exports** (Resolved). Document fig-width/fig-height set Python Matplotlib defaults and R canvas sizes in inches; R additionally supports per-cell overrides. Python cell sizes are diagnosed, matching the native Jupyter restriction. Values are finite positive numbers up to 20 inches, with a 7 by 5 inch fallback when one explicit dimension is missing; omitted sizes retain existing browser defaults. Fig-alt becomes escaped SVG accessibility text or PNG alt text, with decorative empty-alt support. CLI pixel/cropping/DPI, other graphics devices and full image/subfigure attributes remain separate gaps.

## Plain text

See the [Plain text guide](formats/text.md). Compatibility target: literal source mode.

- **TEXT-01 — Plain text intentionally displays escaped source** (Intentional). Plain text intentionally displays escaped source. It has no markup, math, calculations, evaluated tables, diagrams, links, or executable cells. This is a literal viewing mode rather than an incomplete adapter to a calculation language.

- **TEXT-02 — Auto detection never selects it; choose it explicitly** (Intentional). Auto detection never selects it; choose it explicitly. A raw HashBin payload without a Sheets envelope uses Auto unless overridden.

## Limits shared by formats

- **SHARED-01 — Highlighting is a lexical aid, not validation** (Needs detailed audit). Highlighting is a lexical aid, not validation. Diagnostics and partial output must be read together. All rendered HTML, MathML, and SVG pass through the same sanitizer, including engine-generated and asynchronously generated output.

- **SHARED-02 — Source links retain the document, format, and view** (Needs detailed audit). Source links retain the document, format, view and explicit profile. Above 7,000 characters, generated links move source to #src= so it is omitted from HTTP requests (SHARED-05). Short ?compressed= links remain readable. Browser, messaging and proxy limits on complete URLs still vary; the UI recommends a source download or HashBin for a separate copy. Existing oversized query links can still fail before the app loads. Decoded shared source and HashBin payloads are bounded at **5 MiB**; unsupported envelope versions are rejected. No supported file-to-link CLI or ?url= raw-source loader is available (SHARED-06).

- **SHARED-03 — Offline files cache static app assets, not document URLs, HashBin payloads, external images, fresh…** (Needs detailed audit). Offline files cache static app assets, not document URLs, HashBin payloads, external images, fresh currency rates, or Python/R runtimes. Browser storage may be evicted. HashBin and optional link shortening require a connection.

- **SHARED-04 — Rendered HTML and PDF preserve finished output, not a running interpreter or editable application controls** (Needs detailed audit). Rendered HTML and PDF preserve finished output, not a running interpreter or editable application controls. External image URLs still need their server.

- **SHARED-06 — Files have no supported command-line link generator or raw-URL loader** (Known gap). No supported script turns a local source file into a Sheets link, and ?url= does not load raw source. Hand-built query links bypass the shared serializer’s fragment fallback and may exceed host limits. A file-to-link command should use the shared serializer and clearly flag long links and remaining browser/messaging limits; it would not itself provide storage. HashBin saves require interactive owner sign-in, balance and per-save confirmation; public saved CIDs load without sign-in.

### Resolved compatibility gaps

- **SHARED-05 — Long source URLs use fragments to avoid server request limits** (Resolved). Generated source links longer than 7,000 characters put compressed source in #src=, keeping it out of HTTP requests. Short ?compressed= links and CID precedence are preserved; reachable legacy query links migrate when the editor persists them. An enforcing-server regression reproduces the old reload HTTP 414 and verifies reload, fresh-tab sharing, source download and profiled state with browser storage blocked. OAuth and offline-update/reload tests use long source. This adds no local draft store: complete URLs may still be truncated by other apps, so the notice recommends Download → Source or HashBin for a separate copy. Old links already rejected by a host cannot load the app to migrate; unrelated oversized query parameters can still exceed host limits.
