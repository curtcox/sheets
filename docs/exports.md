# Export a Sheet

Open **More → Download → Export / Save…** after the preview finishes.
Choose **Format**, **Contents**, and **Destination** separately. Contents can be
calculated results (the selected report), source, both, or an editable portable
project. Results and source can be combined in HTML, Word, Markdown, plain text
and RTF. Original source files preserve the source exactly. Portable projects
preserve source, view, calculation mode, bundled inputs and pictures.

Destinations include file download, print/PDF, Google Docs, Pages Online and
HashBin. Print/PDF and Pages use HTML; Google Docs uses Word. HashBin saves an
editable sheet, using the portable-project choices. Unsupported combinations show
an explanation and disable the action without changing your choices. To import
into Google Docs manually, download Word and upload it to Drive.

**Rendered HTML** and **Print / PDF** in the Download menu open this same dialog
with the corresponding format and destination selected.
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
| Print / Save as PDF | The chosen HTML contents, math, diagrams and optional reload QR, in an isolated print document | Uses the browser's print dialog; PDF is not a separate converter or downloaded automatically. Pagination, fonts and background colors depend on browser/printer settings. |
| Original source file | Exact source text in the format's native extension | Results, included picture bytes and bundled inputs are not packaged. Use a portable project to retain dependencies. Requires Source contents and Download file. |
| Portable project `.sheets.json` | Editable source, format, view, calculation mode, bundled inputs and included pictures | Supports Org, or Markdown with included pictures; other formats need original source downloads. Limited to 5 MiB serialized JSON. Requires Editable portable project contents; download or save through HashBin. Org inputs must finish verification first. |

All formats support Unicode. HTML/SVG passes through the app's sanitizer. Converter
workers have a 30-second deadline and stop on cancellation. Documents are bounded
to 8 MiB and 100,000 table cells; output is bounded to 32 MiB. Word media is bounded
to 16 MiB and 16 million pixels per source image. No converter fetches arbitrary
external images. Include pictures in the Sheets project to package their bytes.
Word pictures and diagrams are rasterized to PNG, at most 600 pixels wide and
1,600 pixels high; unusually tall images can change proportions. A diagram that
cannot be rasterized falls back to a description with a conversion note. The
16 MiB media bound applies to the prepared data URLs. Workbook Document-sheet
content and source are each truncated to 30,000 characters; keep the original
source or portable project for the complete document. Workbooks need at least
one table. Exported Word links support HTTP(S) and mailto; local anchors become
readable text.

Local exports work offline after the app's optional offline download, including the
small vendored conversion libraries. Google sign-in/upload and Pages online need a
connection. PDF uses the **Print / Save as PDF** destination.

## QR codes and screen appearance

Choose **Embed a QR code to reopen this sheet** for HTML, print/PDF, Word,
Markdown, Google Docs or Pages. The QR points back to Sheets with the complete
sheet state, including the source even when only results are exported. It is not
an export-file link. QR images are embedded PNGs; Markdown viewers must support
embedded image data. Plain text, RTF, workbooks, original source and portable
project files do not embed QR images.

If no short link is ready, the dialog prompts you to **Make short URL with is.gd**
or **Save sheet to HashBin for a reload QR**. Shortening sends the full sheet URL
to is.gd through AllOrigins. Short links made in Share or Export are reused for
the same sheet during this session. You can explicitly use the full URL; codes
that are too dense or too large require a shorter link.

HashBin shows the price and asks for approval before saving. On success the
export dialog returns with **Saved HashBin sheet (256t-backed)** selected. This
QR reopens the saved sheet **in Sheets**, which verifies and loads its content
from HashBin/256t; it does not open raw JSON. Saving alone does not print or export.
Changing the sheet invalidates its saved-link/short-link association. HashBin
retention and network availability still apply when reopening saved content.

**Preserve screen appearance** is enabled by default. HTML and print/PDF retain
alternating table row shading and request exact printed colors. Word (and Google
Docs conversion) includes the alternating row shading, with the usual conversion
layout limits. Uncheck it for the simpler export styling without row shading.
Browser or printer background-color settings can override print color requests.
Paper sizing, pagination, fonts and other document conversions can differ from
the screen. The print document includes only your chosen contents and QR.

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

**HTML → Pages Online** creates a bounded Pages document link and
opens it at `https://pages.hashbin.page/` with `run=0`. If the browser blocks the
new tab, use the returned link. If the document is too large for a reliable link,
download **Rendered HTML**, open Pages and import that HTML file. Current Pages
supports text-file import, not ZIP import; this route does not upload or publish
anything to HashBin automatically.

The HTML and serialized Pages envelope are each limited to 5 MiB. Links longer
than 7,000 characters move the envelope into the fragment; links longer than
100,000 characters are rejected with the HTML download/import instructions.

## Automated verification

Every target above has automated coverage. Run the export browser suites on
Chromium, Firefox and WebKit:

```sh
npx playwright test tests/browser/exports.spec.js tests/browser/multi-export.spec.js tests/browser/export-options.spec.js tests/browser/export-targets.spec.js
node --test tests/unit/export-*.test.js
```

| Contract | Automated checks |
|---|---|
| Word and manual Google Docs import | `export-targets.spec.js` inspects OOXML headings, bold text, lists, tables, hyperlink relationships, Unicode and linked-image descriptions; `export-options.spec.js` checks embedded QR PNGs and shading. Manual Google import uses this same Word download. |
| Excel and ODS | `export-targets.spec.js` reads both packages and checks typed cells, formulas, editable Inputs and provenance. `export-workbook.test.js` checks translation and rejection rules; `multi-export.spec.js` checks explicit values-only fallback. |
| Plain text, Markdown and RTF | `export-targets.spec.js` checks actual evaluated content and Unicode (including RTF surrogate escapes), Markdown links/emphasis and picture references. |
| HTML and print/PDF | `exports.spec.js` checks sanitization, math, completed diagrams, selected ledger reports and full-length print content; `export-options.spec.js` checks source/both contents, QR decoding and appearance. The system print dialog and saved PDF pagination are manual checks. |
| Pages Online | `export-targets.spec.js` decodes the actual handoff and checks its HTML; `export-pages.test.js` covers both URL encodings and size failures. Set `SHEETS_VERIFY_LIVE_PAGES=1` to additionally open the deployed Pages receiver and verify its imported source and disabled auto-run setting. |
| Direct Google Docs creation | `multi-export.spec.js` mocks Google Identity and Drive, checks OAuth scope and multipart upload, and verifies the returned link. `export-google.test.js` checks binary preservation and failure without retries. These do not exercise real consent or Google's conversion fidelity. |
| Source, portable projects and HashBin | `export-targets.spec.js` checks exact source and parsed project state. `projects.spec.js` checks bundled dependency round-trips; `export-options.spec.js` checks reviewed HashBin saves and reload QRs using a mock service. Real pricing, authorization and retention require a live account check. |

The independent workbook check used in CI generates an XLSX, inspects it with
openpyxl and changes an input before LibreOffice recalculation:

```sh
node scripts/export-reference.mjs /tmp/sheets-export-reference
python scripts/export-reference.py /tmp/sheets-export-reference
```

It requires openpyxl 3.1.5 and LibreOffice Calc. ODS package/formula checks use
SheetJS, the same library that writes ODS; they are not an independent ODS
recalculation oracle. These tests do not certify identical layout in Microsoft
Word, Google Docs, Excel or every OpenDocument reader.

`export-targets.spec.js` also accepts `SHEETS_TEST_BASE_URL` for a deployment
(include its path and trailing slash). Unlike the older export suites, its
navigation stays on that deployment. A deployed version missing the current
export dialog or targets should fail this check, rather than silently testing
localhost.

To smoke-test both public Sheets deployments and their Pages receiver without
signing in, uploading or publishing:

```sh
node scripts/verify-export-sites.mjs
# Or supply one or more deployment base URLs, including trailing slashes.
node scripts/verify-export-sites.mjs https://curtcox.github.io/sheets/
```

The command reports asset HTTP status, downloads and inspects the available
document/workbook artifacts, and verifies the Pages import with auto-run disabled.
It exits unsuccessfully if a deployment is missing the current export UI.
It does not perform live Google consent/conversion or paid HashBin saves.

Deployment audit on **2026-11-08**:

- `https://sheets.hashbin.page/` renders calculations but has only legacy download
  actions: the export dialog, `src/exports/ui.js` and `docs/exports.md` are absent
  (the two files return HTTP 404).
- `https://curtcox.github.io/sheets/` has the older export dialog. Text, Markdown,
  RTF, Word, XLSX, ODS and Word-for-Google-import downloads passed content checks;
  workbook formulas, editable inputs and cached results were verified. The newer
  independent contents/destination controls, export QR and appearance controls
  are not deployed there.
- `https://pages.hashbin.page/` accepted the exported HTML from both the local
  current app and the GitHub Pages copy, preserving source with auto-run disabled.

These are observed deployment differences, not claims that the current checkout
has been published.
