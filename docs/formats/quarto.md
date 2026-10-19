# Quarto browser notebooks

Sheets implements a browser subset of [Quarto](https://quarto.org/): Markdown, TeX math, YAML front matter, nested callouts, figure labels/references, and executable Python and R cells. This is not the Quarto CLI or the full Pandoc language.

Use Quarto for reproducible explanations that combine prose, data processing,
tables, and plots. Select **Quarto** or use executable `{python}` / `{r}` fences
for Auto detection. Source downloads use `.qmd`.
[Open the Python starter](../../index.html?example=quarto-basic&format=quarto) or the
[R plotting example](../../index.html?example=quarto-edge&format=quarto).

## Start with shared cell state

````text
---
title: A small notebook
execute:
  echo: true
---

```{python}
values = [3, 7, 11]
print(values)
```

```{python}
sum(values) / len(values)
```
````

The second cell sees `values` from the first and displays **7.0**. The braces in
`{python}` matter: an ordinary `python` code fence is highlighted source, not an
executable cell. R likewise uses `{r}`. Editing any source starts a fresh render,
so results always come from the current document rather than a previous session.

## Python output and packages

Python uses **Pyodide 0.27.7** (MPL-2.0), loaded lazily from jsDelivr. All Python cells in a render share one interpreter. Each new render starts fresh. Imported packages load with `loadPackagesFromImports`; packages outside Pyodide's distribution, native extensions it does not support, and system-level access are unavailable.

Use `print(...)` for console text or leave a value as the cell's final expression
to display its representation. A pandas DataFrame returned as that final value can
supply a sanitized HTML table. Matplotlib figures become static SVG output:

````text
```{python}
import matplotlib.pyplot as plt
plt.plot([1, 2, 3], [2, 4, 3])
plt.show()
```
````

## R output and plots

R uses **[webR 0.6.0](https://docs.r-wasm.org/webr/v0.6.0/)**, loaded lazily from `https://webr.r-wasm.org/v0.6.0/`. R distribution binaries use GPL-3.0; the webR JavaScript loader uses MIT. R cells share a separate R session; Python and R variables are independent. Within each language, cells execute in document order. The two languages can run concurrently, so interleaving them does not order network or file side effects. Every render starts both sessions fresh.

````text
```{r}
measurements <- c(3, 7, 11)
mean(measurements)
```

```{r}
#| label: fig-measurements
#| fig-cap: Measurements from R
plot(measurements, type = "b")
```
````

R console output includes printed values, visible expressions, messages and warnings. Base graphics plots are captured as embedded PNG images (640 × 400 logical pixels) with the same figure labels/captions as Python. R data frames print as console text; rich knitr HTML output, inline R expressions, widgets, and R/Python variable exchange are not implemented. The R packages bundled with webR are available. Additional compatible packages can be installed explicitly with `webr::install("package")`, then loaded with `library(package)`; they are downloaded again for a fresh render. Desktop R packages and operating-system access are not available. Browser networking and CORS restrictions apply.

webR uses its PostMessage channel so R works on GitHub Pages without special server headers or a webR service worker. Interactive input (`readline()`, `menu()`, `browser()`) is unsupported. Cancellation and deadlines close webR’s interpreter worker directly rather than trying to interrupt R code.

## Metadata and execution options

Put document metadata in a YAML block at the very start. Put cell options on
`#|` lines at the beginning of the cell, before its code:

| Setting | Effect |
| --- | --- |
| YAML `title`, `author`, `date` | Display document metadata |
| YAML `execute: false` | Render prose/source without running Python or R |
| `execute:` with nested `echo: false` | Hide echoed source by default; still run the cells |
| Cell `#\| echo: false` | Hide this cell's source, keeping its output |
| Cell `#\| eval: false` | Skip this cell; its variables will not be defined |
| Cell `#\| output: false` | Run the code, but hide its normal output |
| Cell `#\| label: fig-demo` | Name a figure for a basic `@fig-demo` reference |
| Cell `#\| fig-cap: A description` | Caption captured figures |

Use real YAML booleans (`false`, without quotes). Cell settings override the corresponding execution
defaults (`echo`, `eval`, `output`). Document `execute: false` always disables execution,
even if a cell requests `eval: true`. The existing `execute.enabled: false` browser
alias also disables all execution. `output: false` still allows execution diagnostics to be shown. To stop
code from running, use `eval: false` or disable document execution rather than
merely hiding its source/output.

Cell options on `#|` lines support `echo`, `eval`, `output`, `label`, and `fig-cap`. Front matter supports plain-text `title`, `author`, `date` (or a numeric year), `format: html`, and `execute` defaults. Structured author records and other output formats are unsupported. `execute: false` skips both Python and R execution. Stdout, stderr, the final expression's repr, a DataFrame's `_repr_html_()`, and matplotlib SVG figures appear as output. Displayed output is sanitized. An execution error is associated with its cell's first source line; later cells continue.

## Prose features and compatibility

Callouts and fenced divs are parsed as Markdown blocks. They can nest and contain
executable cells, lists, tables, math and diagrams. A closing fence has at least
three colons; its length need not match the opening fence. Generic divs accept
identifiers and classes. The five callout classes are note, warning, tip,
important and caution. Headings inside a callout remain ordinary headings;
Quarto's automatic title/icon styling, collapse, appearance and title attributes
are not implemented. Unsupported attributes produce a diagnostic.

`````text
---
execute: false
---

See @fig-icon before its definition.

:::: {.callout-note}
## A nested notebook

::: {.callout-tip}
This cell stays inside both callouts.

```{python}
print("Read without running")
```

:::
:::::

![Sheets icon](src/icon.svg){#fig-icon}
`````

A standalone Markdown image with an identifier beginning with `fig-`, a figure
div, or a cell with visible plot output and a `fig-` label can be referenced using
`@fig-name`. Forward references work. Figures receive flat numbers in document
order. The final paragraph of a figure div becomes its caption:

````text
See @fig-panel.

::: {#fig-panel}
A figure containing **Markdown**.

A panel caption.
:::
````

Image and cell captions use plain text. Several plots from one cell share one
figure wrapper and target. Subfigure numbering/layout, grouped or suppressed
reference prefixes, tables/equations/sections/callout references, citations,
localisation and the full Pandoc attribute grammar are unsupported. Raw HTML
identifiers do not register figure targets. Verbatim code, escaped references,
links, math and raw HTML are not rewritten as figure references.

Duplicate figure labels report the duplicate's source line and retain the first
declaration. Missing references stay visible and receive a diagnostic. A labelled
cell with no visible plot output (including skipped or hidden output) reports an
unavailable figure and does not create a broken link. Unclosed divs report their
opening line and close at the end of their Markdown container. Unmatched closing
fences report their own line.

### Option diagnostics

Unsupported metadata/options and invalid values report the original YAML key line
and column, including flow mappings and quoted keys. Unsupported entries are
ignored; valid settings still apply. Invalid booleans do not override defaults.
YAML syntax errors discard that metadata or cell-option mapping. Check diagnostics
before running a document whose evaluation settings are invalid. Options must be
contiguous initial `#|` lines; later `#|` comments remain code. Settings after the
language in the executable fence are unsupported; use `#|` lines instead.

````text
---
execute: false
toc: true
---

```{python}
#| echo: "false"
#| warning: false
print("Execution stays disabled while the unsupported settings are reported")
```
````

OJS and Julia cells are displayed with a **not executed in the browser** note.
These supported forms follow the [Quarto callout](https://quarto.org/docs/authoring/callouts.html),
[figure](https://quarto.org/docs/authoring/figures.html) and
[execution-option](https://quarto.org/docs/computations/execution-options.html)
guides and [Pandoc fenced div syntax](https://pandoc.org/MANUAL.html#extension-fenced_divs).

Each language has a **90-second deadline**, including runtime and package loading. Cancel or edit to terminate the worker. The initial download needs a network connection; subsequent loads benefit from the browser cache. Auto recognizes executable fences and Quarto-specific YAML keys. Code in a shared document runs inside disposable workers without access to the editor DOM or its storage. Python and R execution require a connection and are not included in the optional offline download.

If a later cell reports a missing name, check whether the defining cell was skipped
or failed, and whether the name belongs to the other language. A first run can take
longer while runtimes/packages download. Use **Cancel** for a long-running render;
use `execute: false` to read only the prose offline. Rendered HTML includes completed
tables, figures, and captions without rerunning code; packages and interpreter state
are not exported. See the [feature comparison and glossary](../format-comparison.md).

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.

<!-- compatibility:start -->
## Tracked compatibility status

These entries share the [central limitations ledger](../limitations.md). “Needs detailed audit” means the disclosure is recorded, while its complete upstream case coverage is still being developed.

| ID | Status | Area |
| --- | --- | --- |
| QT-01 | Known gap | This is a browser subset, not the Quarto CLI or full Pandoc |
| QT-02 | Known gap | Remaining metadata and cell controls are unsupported and diagnosed |
| QT-03 | Needs detailed audit | Python and R execute; OJS and Julia are displayed without execution. Ordinary language fences only display… |
| QT-04 | Needs detailed audit | Python uses pinned Pyodide 0.27.7 |
| QT-05 | Needs detailed audit | R uses pinned webR 0.6.0 |
| QT-06 | Needs detailed audit | R data frames print as console text rather than rich HTML |
| QT-07 | Needs detailed audit | State is shared only within each language during one render |
| QT-08 | Needs detailed audit | Each language has a 90-second deadline, including runtime/package loading |
| QT-09 | Resolved | Nested divs and basic figure targets use structured parsing |
| QT-10 | Resolved | Supported YAML options are validated at their source keys |
<!-- compatibility:end -->
