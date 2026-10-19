# Quarto notebook controls and figures (QT-2A)

The native reference target is Quarto CLI 1.10.19, nbclient 0.10.2, nbformat 5.10.4,
ipykernel 6.29.5, IPython 8.18.1, Matplotlib 3.9.4 and knitr 1.45 on Ubuntu 24.04.
The Python requirements are pinned in tests/fixtures/quarto/reference-requirements.txt.
The official setup action is commit-pinned and selects that exact CLI release.
Local CLI review used the official macOS release after checksum verification;
the CI reference additionally renders R through native knitr/rmarkdown.

scripts/quarto-reference.py imports no app code. It renders seven qmd documents in
temporary directories, checks visible/absent text and image alt attributes through
an HTML parser, and asserts error:false rejects a render before a later cell can
create its sentinel file. The expected contract is declarative, not a snapshot of
browser output. Platform-specific bootstrap HTML and cropped bitmap pixels are
deliberately excluded. --language python supports local verification without R.

## Supported controls

- include:false runs hidden setup but suppresses all of that cell's preview.
  It dominates echo/output visibility. Failure diagnostics remain in the editor.
- eval:false/document disable gates still prevent runtime loading/execution.
  Per-cell typed booleans override corresponding document execution defaults.
- warning:false hides the Jupyter-style Python stderr stream. R warnings remain
  structured internally; the pinned knitr parser aliases YAML warning to message,
  so false suppresses both warnings/messages and true restores both, at document
  and cell level. output:false
  suppresses normal streams, warnings/messages and figures; diagnostics remain.
- A hidden R cell always stops on error, as knitr requires, even with error:true;
  hidden Python errors follow their error setting.
- error:true continues with the next cell; explicit error:false makes each backend
  stop before subsequent cells, including hidden ones. The renderer marks remaining
  cells unexecuted rather than misassigning results. Real-backend tests put an
  infinite loop after the error to prove execution actually stops.

The existing browser default remains error:true when omitted, unlike Quarto CLI's
default stopping behavior. This is preserved documented behavior, not a claim of
native-default parity. Python and R remain separate concurrent interpreters; an
error in one does not cancel the other. Within a cell, execution stops at its error
instead of supplying all of knitr's expression recovery. Partial previews, notices
and diagnostics remain available where a CLI render would fail. No behavior profile
is needed to recognize previously unsupported explicit options; existing defaults
and disable gates stay intact. Cancellation/90-second deadlines remain unchanged.

## Figure contract

Document fig-width/fig-height configure initial Matplotlib figsize/environment
defaults and R canvas devices. R also supports per-cell sizes; Python cell-level
sizes are diagnosed/ignored, following Jupyter's document-only contract. Matplotlib
defaults/environment are initialized once; manual code overrides remain possible.
An explicit partial size fills the other dimension from the native 7x5 inch default.
Omitting both retains the previous browser device defaults. Finite positive sizes
up to 20 inches bound ordinary requested devices; arbitrary user plotting code is
still constrained by interpreter termination rather than these option validators.

The pinned webR device declares 1/72-inch logical units and captures 2x bitmaps.
R PNG display attributes use 96 CSS pixels per inch. Python SVGs retain the actual
Matplotlib device dimensions; manual figsize changes remain reflected in output.
Fig-alt is plain text, escaped into R img alt or Python SVG role/aria-label; empty
alt is decorative. The app's normal sanitizer remains the final boundary. Multiple
plots in a cell share its target/caption/alt; hidden plots cannot register targets.
Python closes captured plots even on error, preventing leakage into later cells,
and honors a final semicolon (including before a comment) when suppressing the
last expression display. The native/browser contract includes that output case.

Full image attributes, independent message settings, output:asis, rich/inline R
output, caption/alt arrays, format/DPI/retina, exact CLI cropping/font metrics and
device pixel identity remain open under QT-01/02/06. References:
[execution options](https://quarto.org/docs/computations/execution-options.html),
[Jupyter cells](https://quarto.org/docs/reference/cells/cells-jupyter.html),
[knitr cells](https://quarto.org/docs/reference/cells/cells-knitr.html), and pinned
Quarto share/rmd/{execute,hooks}.R plus webR v0.6.0 packages/webr/src/canvas.c.
