# Compare formats and features

These tables describe what **Sheets currently implements**, rather than every
capability of the original language or desktop application. Follow a format name
for syntax, examples, and compatibility limits. The glossary below defines the
feature names. On a narrow screen, scroll the comparison tables horizontally.

The [limitations page](limitations.md) collects the compatibility gaps described
throughout the individual guides.

For callable libraries and reusable definitions, see the
[built-in and custom function comparison](function-comparison.md).

## Calculations

**Yes** means a built-in capability. **No** means no built-in support in this
adapter. Qualified entries describe a subset or require you to write notebook
code; they do not promise automatic conversion or a complete language runtime.

| Format | Numerical evaluation | Named values | Unit conversion | Equation solving |
| --- | --- | --- | --- | --- |
| [GitHub Markdown](formats/gfm.md) | No | No | No | No |
| [AsciiMath](formats/asciimath.md) | No; notation only | No | No | No |
| [Numbat](formats/numbat.md) | Yes | Variables and functions | Yes; dimensional checking | No automatic solver |
| [CalcFile](formats/calcfile.md) | Yes | Friendly variable names, `ans` | Selected units; EUR ↔ USD/GBP/JPY using ECB rates | No |
| [Org tables](formats/org.md) | Table formulas | Cell/range and same-document remote references, named inputs | Limited mathjs unit expressions | No |
| [Calca](formats/calca.md) | Arrow calculations | Variables and functions; optional heading scopes | Yes, through mathjs | Real scalar linear/quadratic subset |
| [Hurmet](formats/hurmet.md) | Calculation cells | Values shared across cells | Yes; unit-aware calculations | No Sheets-specific solver; use explicit formulas |
| [Beancount](formats/beancount.md) | Ledger balancing and reports | Accounts and commodities | Cost/price weights; no report revaluation | One missing posting amount inferred |
| [Quarto](formats/quarto.md) | Python and R code | Per-language cell state | Your code/packages | Your code/packages |
| [Plain text](formats/text.md) | No | No | No | No |

Beancount's missing posting inference balances a transaction; it is not a general
equation solver. Its commodities (such as USD or shares) are tracked quantities,
rather than a physical unit system. Org's constrained formula evaluator accepts
some mathjs unit expressions, but it is primarily a numeric table calculator;
choose Numbat for dimension-checked models.

## Presentation and data

| Format | Prose and math typesetting | Tables and structured data | Diagrams and plots | Executable notebook cells |
| --- | --- | --- | --- | --- |
| [GitHub Markdown](formats/gfm.md) | Markdown and TeX/MathML | Display-only Markdown tables with alignment | Mermaid diagrams | No; code fences display source |
| [AsciiMath](formats/asciimath.md) | AsciiMath/MathML; explicit Formula list or Mixed prose; Auto heuristic | Display-only Markdown tables | Mermaid in mixed documents | No |
| [Numbat](formats/numbat.md) | Source/result rows; `#` comments | Language values; no spreadsheet UI | No Sheets plot viewer | No Python/R cells |
| [CalcFile](formats/calcfile.md) | Plain prose, headers, result rows | Running totals and aggregates | No | No |
| [Org tables](formats/org.md) | Basic Org headings, lists, emphasis, links | Calculated tables and range aggregates | No | No Babel/Lisp execution |
| [Calca](formats/calca.md) | Markdown, TeX, arrow results | Matrices; Markdown tables | Yes with Structured blocks or Scoped definitions; Legacy has the fence caveat below | No Python/R cells |
| [Hurmet](formats/hurmet.md) | Prose and typeset math calculations | Calculation cells in tables; upstream spreadsheet tables | Upstream output; no interactive drawing UI | No Python/R cells |
| [Beancount](formats/beancount.md) | Ledger-specific report views | Balance sheet, income statement, trial balance, journal | No | No |
| [Quarto](formats/quarto.md) | Markdown, TeX, validated controls, nested callouts/divs, figure references, plot size/alt | Markdown tables; Python DataFrame HTML; R console tables | Mermaid, Python matplotlib SVG, R PNG plots | Python and R; OJS/Julia displayed only |
| [Plain text](formats/text.md) | Escaped, preformatted source | Literal source only | No | No |

In Calca's **Legacy** mode, every fenced or indented code block is also calculation input,
regardless of its language label. Although the shared Markdown renderer can display
math and diagrams, their fenced contents may cause calculation diagnostics.
Choose **Structured blocks** or **Scoped definitions** to keep literal, TeX, and
Mermaid fences separate from calculation input. Only `calca` fences, indented code
blocks, and standalone paragraph arrow expressions calculate in these modes.
Scoped definitions also makes definitions immutable,
limits visibility to headings and descendants, and checks connected real scalar
relations for conflicts. Legacy and Structured blocks retain reassignment and
latest-usable-equation behavior.
Use GitHub Markdown or Quarto for documents with literal code or Mermaid fences.
Typesetting an equation in any format does not by itself evaluate or solve it.

## Runtime and connectivity

| Format | Execution model | Offline after downloading offline files | Network-dependent features |
| --- | --- | --- | --- |
| GitHub Markdown | Local renderer | Yes | External images/links |
| AsciiMath | Local translator and renderer | Yes | External images/links in prose |
| Numbat | Fresh worker; 20-second deadline | Yes, ordinary calculations | Fresh ECB currency rates; cached rates may be available |
| CalcFile | Local evaluator with optional rate request | Yes; currency conversions need cached rates | Fresh ECB rates; dated cache fallback on failure |
| Org tables | Local formula evaluator; Legacy or explicit Emacs order | Yes | External links |
| Calca | Local constrained evaluator | Yes | External images/links in prose |
| Hurmet | Fresh worker; 20-second deadline | Yes, ordinary calculations | Fresh ECB rates and upstream remote-data fetches |
| Beancount | Local ledger evaluator | Yes | External links; includes/plugins are unsupported |
| Quarto | Separate fresh Python/R workers; 90 seconds per language | Prose only with execution disabled | Python/R runtimes, packages, external data/images |
| Plain text | Local escaping | Yes | None for displaying source |

All formats support source links, source downloads, rendered HTML, and preview
printing/PDF. HashBin and optional link shortening need a connection regardless
of format. Exported HTML preserves finished output; it does not rerun calculations
or notebook cells. External image URLs still need their server. See
[Getting started](index.md) for sharing, exports, and installing offline files.

## Feature glossary

| Feature or term | Meaning in Sheets |
| --- | --- |
| Prose and markup | Text with structural notation for headings, emphasis, lists, and links. Markdown and Org use different syntax. A plain comment is not automatically formatted prose. |
| Math typesetting | Showing readable mathematical notation as MathML or engine-generated markup. For example, displaying a square root does not calculate its value. |
| TeX and AsciiMath | Two input notations for formulas. TeX uses commands such as `\sqrt{x}`; AsciiMath uses forms such as `sqrt(x)`. Select the appropriate format before mixing them with prose. |
| MathML | Structured mathematical markup displayed by the browser. Sheets uses it for many rendered formulas, including in HTML exports. It is an output representation, rather than an evaluator. |
| Numerical evaluation | Running an expression and displaying its computed result, such as turning `2 + 2` into `4`. |
| Source/result rows | A view pairing an input statement with its evaluated output. Numbat and CalcFile use this instead of treating each line as formatted Markdown. |
| Named values and functions | Reusing a value under a name, or a calculation under a function name. Cells, accounts, and variables have different rules; see the individual guide. |
| Heading scope | Definitions and relations available only in the heading that contains them and its descendants. Calca offers this through Scoped definitions; its older modes share one document context. |
| Immutable definition | The first visible definition remains bound to its expression. A later definition of the same name becomes a constraint rather than overwriting the first. |
| Connected constraint check | Testing all relations linked to a queried name against candidate numeric solutions. Conflicting candidates produce a diagnostic; this is narrower than solving a general simultaneous system. |
| Unit conversion | Carrying a measurement's unit and changing its representation, such as kilometers to meters. Currency conversion additionally needs exchange rates. |
| Reference exchange rate | A dated price of one currency in another. CalcFile supplies ECB EUR-base rates to its pinned engine, which supports EUR ↔ USD/GBP/JPY. Fresh rates need a connection; a disclosed older cache may work offline. Source links do not freeze rates. |
| Dimensional checking | Rejecting incompatible physical operations, such as adding a length to a duration. Writing a unit label in prose alone does not provide this check. |
| Equation solving | Finding an unknown from a relation, rather than evaluating an expression whose inputs are already known. Calca's solver is limited to supported real linear/quadratic relations. |
| Compatibility profile | An explicit version of a format's behavior, stored in shared links and profiled saved documents. AsciiMath offers explicit Formula list and Mixed prose modes while Auto keeps its original heuristic. Calca's Structured blocks profile changes block classification; Scoped definitions adds immutable bindings, heading scopes, and connected numeric constraint checks; Org’s Emacs order changes target scheduling while Legacy preserves source order; plain source downloads need the mode selected again. |
| Literal autolink | A bare web or email address made clickable by the shared Markdown renderer. GFM URL path endings preserve internal parentheses and trim trailing punctuation; email domains may contain underscores and valid email prefixes before a plus sign are linked. Retained native differences and candidate bounds are documented in the GFM guide. Use explicit links to choose labels or bypass automatic recognition. |
| Display-only table | A formatted grid whose cells are literal text. Markdown tables support left/center/right column alignment in preview and export; their cells do not acquire spreadsheet formulas automatically. |
| Named table binding | An Org column alias, named-field snapshot, table parameter or file constant used in a formula. These name numeric inputs, rather than defining custom functions. |
| Table formulas and references | Expressions that read or update cells. Org uses references such as `$2` and `@3$2`; Hurmet has its own table model. |
| Emacs order | Org mode that sorts targets lexically, calculates columns row by row while protecting field targets, then calculates fields. It is one pass, not dependency solving or convergence. |
| Remote table reference | Org reads a named table in the same source document with remote(). Earlier tables expose updated values; later tables expose original values during the current pass. It does not fetch files or recursively recalculate tables. |
| Range and aggregate | A group of values and a summary operation such as sum, mean, or count. Org ranges address cells; CalcFile totals summarize calculation lines. |
| Matrix | A rectangular mathematical value used in an expression. A matrix is different from a document table with editable cell formulas. |
| Diagram | A structured drawing specified as text, such as a Mermaid flowchart. This is different from a plot generated from numerical data. |
| Mermaid | The diagram language supported in `mermaid` code fences by the shared Markdown renderer. Sheets turns its source into a sanitized static SVG drawing. |
| Plot | A data or function graphic produced by code. Quarto captures matplotlib SVG and R graphics as PNG; the exported result is static. |
| Executable notebook cell | A fenced block that runs code and inserts its output. In Quarto, use `{python}` or `{r}`; an ordinary `python` fence only displays code. |
| Cell state | Variables and definitions kept between cells during one render. Quarto shares state within Python or R, never between the two languages, and resets it on the next render. |
| Hidden setup cell | A cell that executes and supplies state but contributes no preview source or output. Quarto include:false controls visibility; eval:false prevents execution. |
| Warning control | Quarto can omit Python stderr or R warnings/messages from the preview. It does not disable execution or suppress error diagnostics. |
| Error continuation | Whether later cells in the same language execute after a failure. Sheets keeps continuation by default; explicit error:false stops that session while the other language remains independent. |
| Plot device size and alt text | Physical dimensions used to generate a plot, plus text describing it to assistive technology. These differ from merely scaling a rendered image and from pixel-identical native CLI output. |
| Metadata and cell options | Settings outside ordinary prose: Quarto YAML can set a title or execution defaults; `#\|` lines control one cell's source/output visibility and figure labels. |
| Fenced div and callout | A colon-fenced Markdown container that can nest around prose or cells. Quarto supports five callout types; collapse and appearance controls are unsupported and diagnosed. |
| Figure reference | A link such as `@fig-name` to a numbered standalone image, figure div or visible cell plot. Quarto supports forward references and diagnoses duplicate, missing or unavailable targets; subfigure and nonfigure cross-references are unsupported. |
| YAML front matter | An initial block between `---` lines containing document settings as indented key/value pairs. In Quarto, indentation determines which settings belong under `execute`. |
| Commodity and posting | A commodity is a ledger's counted item, such as USD or shares. A posting assigns a quantity to an account; postings in a Beancount transaction must balance by their weights. |
| Cost lot and FIFO | A lot records a quantity's acquisition cost. This Beancount subset reduces supported lots first in, first out (oldest first); it does not implement every booking method. |
| Balance assertion | A check that a ledger account contains an expected quantity at a date. It reports a mismatch rather than converting all holdings to a common currency. |
| Formula list | AsciiMath mode that typesets every nonempty source line, including lines that resemble Markdown. |
| Mixed prose | AsciiMath mode that keeps unmarked text as Markdown prose and typesets only dollar-delimited or fenced formulas. |
| Statement boundary | The end of one language statement, which can span several lines or share a line with another statement. Numbat uses its pinned upstream parser; indentation alone is not a separator or continuation rule. |
| Source span | The exact part of the original document associated with a diagnostic. Numbat converts upstream UTF-8 byte offsets into editor lines and UTF-16 columns, including related locations in earlier statements. |
| Diagnostic | A visible parse, calculation, execution, or compatibility message. AsciiMath uses source-line warnings for detectable empty operands while preserving permissive translation; typesetting failures are errors. Source highlighting alone does not validate a document, and partial output may remain after an error. |
| Worker and deadline | A disposable background interpreter and its time limit. Editing or Cancel terminates worker calculations; deadlines include runtime/package loading. |
| Offline support | Operation after using **Download → Offline access** while connected. It caches app assets, not document URLs, remote services, or Python/R runtimes. |
| Compatibility subset | The parts of a language implemented by this adapter. A familiar extension does not guarantee full behavior of the original application. |

For a starting point, open a guide above or browse the [example gallery](../gallery.html).
