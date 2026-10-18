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
| [Calca](formats/calca.md) | Markdown notes with `=>` calculations |
| [Hurmet](formats/hurmet.md) | Typeset engineering calculations |
| [Beancount](formats/beancount.md) | A core double-entry ledger and reports |
| [Quarto](formats/quarto.md) | Markdown notebooks with Python cells |

Plain text is also available for viewing escaped source.

## Save and share

**Share** copies a complete source link. No account or server storage is required. Links longer than about 8 KB get a reminder to use [HashBin](hashbin.md). Browser, messaging, and proxy limits vary; the app does not truncate your source.

**Download → Source** saves the exact current source with the selected or detected
format’s file extension. **Rendered HTML** saves the finished preview with embedded
styles, MathML, and completed SVG diagrams. For Beancount, choose a report first;
only that report is exported. HTML files need no JavaScript, but external images
still need their original server. **Print / PDF** prints only the preview, even in
Source view; choose your browser’s **Save as PDF** destination to keep a PDF.
Rendered exports become available after rendering finishes and stay disabled while
new edits are pending or after cancellation.

HashBin finalization is deferred; saving is disabled on this deployment. Public CIDs load without registration. Saving requires the site operator's public client ID and your HashBin account. A save displays the price and retention before you confirm.

Python loads Pyodide and imported packages from jsDelivr on first use. Numbat and Hurmet are vendored locally. ECB currency rates are requested only for documents that use currencies and cached for one day. Ordinary source links stay in your browser; optional shortening sends the link to is.gd through AllOrigins. Documents can contain external image links, and executable Python or Hurmet fetches can make network requests.

All generated HTML, MathML, and SVG pass through DOMPurify. Source in a shared link is untrusted. Numbat, Hurmet, and Python execute in disposable workers with deadlines; a new render gets a fresh interpreter. Quarto cells within a single render share their interpreter.
