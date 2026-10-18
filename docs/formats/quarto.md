# Quarto browser notebooks

Sheets implements a browser subset of [Quarto](https://quarto.org/): Markdown, TeX math, YAML front matter, callouts, basic figure labels/references, and executable Python and R cells. This is not the Quarto CLI or the full Pandoc language.

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

Python uses **Pyodide 0.27.7** (MPL-2.0), loaded lazily from jsDelivr. All Python cells in a render share one interpreter. Each new render starts fresh. Imported packages load with `loadPackagesFromImports`; packages outside Pyodide's distribution, native extensions it does not support, and system-level access are unavailable.

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

Cell options on `#|` lines support `echo`, `eval`, `output`, `label`, and `fig-cap`. Front matter supports `title`, `author`, `date`, and `execute` defaults. `execute: false` skips both Python and R execution. Stdout, stderr, the final expression's repr, a DataFrame's `_repr_html_()`, and matplotlib SVG figures appear as output. Displayed output is sanitized. An execution error is associated with its cell's first source line; later cells continue.

Pandoc-style `::: {.callout-note}` (also warning, tip, important, caution) becomes an aside. Figure labels such as `fig-demo` support basic `@fig-demo` references. This is a simple document pass, without nested-div parsing or full cross-reference semantics. OJS and Julia cells are displayed with a **not executed in the browser** note.

Each language has a **90-second deadline**, including runtime and package loading. Cancel or edit to terminate the worker. The initial download needs a network connection; subsequent loads benefit from the browser cache. Auto recognizes executable fences and Quarto-specific YAML keys. Code in a shared document runs inside disposable workers without access to the editor DOM or its storage. Python and R execution require a connection and are not included in the optional offline download.
