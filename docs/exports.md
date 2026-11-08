# Export a Sheet

Open **More → Download → Export to Word, Excel, Docs…** after the preview finishes.
Choose a format, read its conversion notes, then download or open the result.
Exports use the current calculated results and selected Beancount report. Editing,
changing format or cancelling a render invalidates pending conversions.

Keep **Portable project** or **Source** as well if you want to change calculations
in Sheets later. A document export is an evaluated snapshot; it does not preserve
Sheets' interactive controls or Python/R execution.

| Target | Preserved | Limitations |
|---|---|---|
| Word `.docx` | Editable headings, prose, emphasis, links, lists and tables; included pictures and rendered diagrams | Equations become readable text. Linked images use descriptions. Complex table spans, nested lists and exact page layout can differ. |
| Excel `.xlsx` | Tables, typed numeric cells, cached values, supported working Org formulas, editable named inputs, source/provenance sheet | Working formulas use the subset below; unsupported formulas block export. Prose goes in the Document sheet. Plots and pictures are not workbook charts/images. |
| OpenDocument `.ods` | Same workbook model and supported formulas | Formula syntax is serialized by SheetJS; test the workbook in your spreadsheet program. Styling and recalculation behavior can differ. |
| Google Docs — download Word | The Word artifact, ready for manual import | Upload the `.docx` to Google Drive and choose **Open with → Google Docs**. Google may change layout and equation/image rendering. |
| Google Docs — create in Drive | Uploads Word and requests conversion into an editable Google Doc | Needs online access, a configured Google OAuth client and your Google consent. The successful result is an **Open exported Google Doc** link. See setup below. |
| Evaluated plain text `.txt` | Readable content, result values, list/table boundaries, equation text and picture descriptions | Formatting, diagrams and interactive behavior are flattened. This differs from the original source download. |
| Evaluated Markdown `.md` | GFM headings, lists, tables, code, links and picture references; equation text between dollar delimiters | Diagrams become descriptions. Complex tables, styling and equation rendering depend on the Markdown viewer. Included pictures use embedded data URLs, unsupported by some viewers. |
| HTML | Existing standalone styled preview, MathML, completed diagrams, charts and embedded project pictures | Linked pictures remain external. Controls are frozen; scripts do not run. |
| Pages Online | Same standalone HTML, opened as editable `index.html` with scripts disabled | Static results only. Pages has file/envelope limits; large handoffs offer HTML download/import. This is [curtcox/pages](https://github.com/curtcox/pages), not Apple Pages. |
| Rich text `.rtf` | Evaluated content in an editable text document | Tables, equations, pictures and styling become text. |

All formats support Unicode. HTML/SVG passes through the app's sanitizer. Converter
workers have a 30-second deadline and stop on cancellation. Documents are bounded
to 8 MiB and 100,000 table cells; output is bounded to 32 MiB. Word media is bounded
to 16 MiB and 16 million pixels per source image. No converter fetches arbitrary
external images. Include pictures in the Sheets project to package their bytes.
Local exports work offline after the app's optional offline download, including the
small vendored conversion libraries. Google sign-in/upload and Pages online need a
connection. PDF continues to use **Print / PDF**.

## Working Excel formulas

The initial formula translator supports **Org tables**:

- Numeric literals, arithmetic `+ - * / ^`, unary minus and percent.
- Numeric cell/column targets, relative/absolute references, table boundaries,
  hline-bounded ranges and named columns/fields.
- File/table constants and imported numeric inputs become editable values on the
  **Inputs** sheet. Same-document `remote()` accepts absolute numeric cells/ranges.
- Comparisons, comparison chains, `if`, `vsum`, `vmean`, `vmin`, `vmax`, `vcount`,
  `vprod`, `abs`, `sqrt`, `exp`, `ln`, `floor`, `ceil`, `min` and `max`.
- Fixed numeric display `;%.Nf` and `;fN` becomes `ROUND(...,N)` for 0–12 places,
  because Org reuses formatted cell text in downstream calculations.

Only translated formulas become executable formula cells. Literal text beginning
with `=`, `+`, `-` or `@` remains text unless it is a plain numeric literal.
Excel-precision numeric literals are numbers; longer exact numbers remain text.
Formulas referencing nonnumeric or excessive-precision cells, cycles/self references,
Lisp, custom precision, fractions, coercion/empty-field modes and unsupported functions
produce an explanation with a source line. Resolve Org diagnostics first.

Excel uses floating-point numbers and dependency recalculation, whereas Org can
use exact arithmetic and procedural calculation order. Rounding ties and results
near precision boundaries can differ. Cached values come from the same completed
Sheets render, and XLSX requests full recalculation on open. Change an input in the
workbook to check behavior before depending on a converted model.

Working formula conversion for Hurmet, Calca, CalcFile, Numbat and Python/R is not
available yet. Choose **Values-only snapshot (no working formulas)** explicitly to
export their displayed tables without formulas. Static Markdown/Beancount tables
also export as values. Calculation-line documents without tables should use a
Word, Markdown or text export.

## Google Docs setup

The public Sheets client is configured for `https://sheets.hashbin.page`,
`https://curtcox.github.io` and local testing at `http://127.0.0.1:4173`. The Google
project is currently in **Testing**: only approved test accounts can use direct
creation, and Google displays the project name **Hashbin** during consent. The
owner’s account completed a live conversion on 2026-11-08. Download/import is
available to everyone without Google sign-in in Sheets.

For another deployment, a website owner needs a Google Cloud project with the **Drive API** enabled, an
OAuth consent screen and an **OAuth client ID → Web application**. Add the exact
Sheets origin under authorized JavaScript origins (production is
`https://sheets.hashbin.page`; local testing is `http://127.0.0.1:4173`). Configure
allowed test users if the consent screen is in testing. Request only
`https://www.googleapis.com/auth/drive.file`.

Configure the public client ID in `index.html` as
`<meta name="google-client-id" content="YOUR_ID.apps.googleusercontent.com">`
so visitors can export directly, or enter it in the export dialog for a one-time
check. Choose **Create Google Doc**.
The token request excludes previously granted scopes from other clients in the
same Google project. No client secret belongs in this static app. Tokens stay in memory and are not
written to URLs, source, drafts or HashBin. Signing in does not upload anything
until you choose that action. If an upload is interrupted or fails ambiguously,
check Drive before retrying: the document might already exist. The app does not
retry uploads automatically. Download-and-import works without this setup.

## Pages handoff

**Pages Online — open editable page** creates a bounded Pages document link and
opens it at `https://pages.hashbin.page/` with `run=0`. If the browser blocks the
new tab, use the returned link. If the document is too large for a reliable link,
download **Rendered HTML**, open Pages and import that HTML file. Current Pages
supports text-file import, not ZIP import; this route does not upload or publish
anything to HashBin automatically.
