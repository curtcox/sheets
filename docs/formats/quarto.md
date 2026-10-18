# Quarto browser notebooks

Sheets implements a browser subset of [Quarto](https://quarto.org/): Markdown, TeX math, YAML front matter, callouts, basic figure labels/references, and executable Python cells. This is not the Quarto CLI or the full Pandoc language.

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

Python uses **Pyodide 0.27.7** (MPL-2.0), loaded lazily from jsDelivr. All cells in a render share one interpreter. Each new render starts fresh. Imported packages load with `loadPackagesFromImports`; packages outside Pyodide's distribution, native extensions it does not support, and system-level access are unavailable.

Cell options on `#|` lines support `echo`, `eval`, `output`, `label`, and `fig-cap`. Front matter supports `title`, `author`, `date`, and `execute` defaults. `execute: false` skips Python execution. Stdout, stderr, the final expression's repr, a DataFrame's `_repr_html_()`, and matplotlib SVG figures appear as output. Displayed output is sanitized. A Python error is associated with its cell's first source line; later cells continue.

Pandoc-style `::: {.callout-note}` (also warning, tip, important, caution) becomes an aside. Figure labels such as `fig-demo` support basic `@fig-demo` references. This is a simple document pass, without nested-div parsing or full cross-reference semantics. Ordinary R, OJS, and Julia cells are displayed with a **not executed in the browser** note.

Execution has a **90-second deadline**, including runtime and package loading. Cancel or edit to terminate the worker. The initial download needs a network connection; subsequent loads benefit from the browser cache. Auto recognizes executable fences and Quarto-specific YAML keys. Arbitrary Python in a shared document runs inside a worker without access to the editor DOM or its storage.
