# Sheets

Notes that do the math. Sheets is a buildless editor for calculation documents. Edit source on the left and read the result on the right. Your source, chosen format, and view live in the URL.

## Start a sheet

Choose a format or leave **Auto detect** selected. Auto recognizes strong language signals and falls back to GitHub Markdown. CalcFile has deliberately low confidence; select it explicitly. The [gallery](../gallery.html) contains four examples for each format, including edge and error cases. Each card includes a preview of the rendered document; examples run only when opened in the editor.

- **Source**, **Split**, and **Preview** control the workspace. Use **Ctrl+Alt+1**, **Ctrl+Alt+2**, and **Ctrl+Alt+3** respectively.
- Drag the divider to resize. Focus it and use the arrow keys, Home, or End for keyboard resizing.
- Below 760 pixels, split panes stack vertically. Source and Preview use the full workspace.
- Source highlighting follows the selected or detected format. Beancount, Org, Numbat, and Hurmet have dedicated modes; highlighting does not validate a document.
- Calculations run after a 300 ms pause. Diagnostics appear in the status bar and ACE gutter.
- **Cancel** terminates a running worker. An edit cancels older work automatically.

## Choose a format

| Format | Best for |
| --- | --- |
| [GitHub Markdown](formats/gfm.md) | Tables, checklists, prose, TeX math, and diagrams |
| [AsciiMath](formats/asciimath.md) | Formulas without TeX commands |
| [Numbat](formats/numbat.md) | Dimensional analysis and unit-aware calculations |
| [CalcFile](formats/calcfile.md) | Prose-friendly, line-by-line arithmetic |
| [Org tables](formats/org.md) | Recalculating tables with `#+TBLFM:` |
| [Calca](formats/calca.md) | Markdown notes with `=>` calculations and linear/quadratic equations |
| [Hurmet](formats/hurmet.md) | Typeset engineering calculations |
| [Beancount](formats/beancount.md) | A core double-entry ledger and reports |
| [Quarto](formats/quarto.md) | Markdown notebooks with Python and R cells |

Plain text is also available for viewing escaped source.

Use the [feature comparison and glossary](format-comparison.md) to compare calculations,
units, tables, equations, diagrams, notebook execution, and offline support across
all ten choices. The [built-in and custom function comparison](function-comparison.md)
compares function libraries and shows which formats can define reusable functions.
Each format guide includes a starting example, syntax reference,
and the limits of its implementation in Sheets.

Every code block has an **Open example in editor** link. Short syntax examples in
prose and tables are clickable too; they open a complete example with the needed
definitions or surrounding document. Examples of errors keep their intentional
errors. Use [Limitations and compatibility](limitations.md) for the known gaps
collected from all format guides.

## Save and share

**Share** copies a complete source link. No account or server storage is required. Links longer than about 8 KB get a reminder to use [HashBin](hashbin.md). Browser, messaging, and proxy limits vary; the app does not truncate your source.

**Download → Source** saves the exact current source with the selected or detected
format’s file extension. **Rendered HTML** saves the finished preview with embedded
styles, MathML, and completed SVG diagrams and embedded R plot images. For Beancount, choose a report first;
only that report is exported. HTML files need no JavaScript, but external images
still need their original server. **Print / PDF** prints only the preview, even in
Source view; choose your browser’s **Save as PDF** destination to keep a PDF.
Rendered exports become available after rendering finishes and stay disabled while
new edits are pending or after cancellation.

[HashBin](hashbin.md) saving is enabled on this deployment. Public CIDs load without
signing in. Saving connects your HashBin account and displays the price, retention,
and balance before you confirm.

Python loads Pyodide and imported packages from jsDelivr on first use; R loads webR from webr.r-wasm.org. Numbat and Hurmet are vendored locally. ECB currency rates are requested only for documents that use currencies and cached for one day. Ordinary source links stay in your browser; optional shortening sends the link to is.gd through AllOrigins. Documents can contain external image links, and executable Python, R, or Hurmet fetches can make network requests.

All generated HTML, MathML, and SVG pass through DOMPurify. Source in a shared link is untrusted. Numbat, Hurmet, Python, and R execute in disposable workers with deadlines; a new render gets a fresh interpreter. Quarto cells within a single render share the interpreter for their language; Python and R have independent state.

## Work offline

Choose **Download → Offline access → Download offline files** while connected. The app
reloads when ready and preserves your current source link. Vendored formats, math,
diagrams, docs, and gallery examples then work offline, including newly opened
source links. The cache contains static app files; it does not save your document
URLs or HashBin payloads. Download source separately if you want a local backup.

Python/R execution and external images or services still need a connection. Existing
cached currency rates may work with a stale-rate notice. Browser storage can be
cleared or evicted. **Offline access** also lets you check for updates, apply a
completed update, or remove the offline download. Updates wait until you choose
**Use update and reload**, preserving current editor source first.
