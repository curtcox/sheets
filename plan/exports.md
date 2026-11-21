# Outside tables, pictures and multi-format exports

Part of the [Sheets development plan](../PLAN.md).

## Outside tables and pictures — 2026-11-08

CSV-first insertion now previews UTF-8 comma/semicolon/tab data, HTML clipboard
tables and spreadsheet cell text, with editable Org/Markdown or picture output.
Linked HTTPS pictures, verified HashBin/256t image CIDs, local/clipboard/drop images,
resizing, descriptions and captions are supported. Version-2 projects and version-4
saved envelopes preserve content-addressed attachments separately from numeric
inputs. Seven gallery examples cover CSV, clipboard, linked and bundled pictures.
See `design/external-content.md` and `docs/insert-content.md`.

## Multi-format exports — 2026-11-08

Status: initial implementation delivered on 2026-11-08. The export dialog,
immutable snapshots, permissive Word/Markdown/workbook backends, evaluated text,
HTML, RTF, XLSX/ODS with supported working Org formulas, Pages links and a Google
Docs download/import route are implemented. OAuth Drive conversion is implemented
and mock-tested, and live creation opened an editable Google Doc with the expected
heading, prose and calculated table. The public client is configured; the Google
project remains restricted to test users.
Pandoc was evaluated and deferred for download/offline cost; see
[backend decision and evidence](../design/exports.md) and [user guide](../docs/exports.md).
The original delivery gates below remain the broader roadmap: Hurmet formula
translation, physical-mobile performance and full target-application layout checks
remain follow-ups. Word and formula-preserving Excel examples were published to
HashBin and their downloaded bytes verified against the generated artifacts.

Export a Sheet to Word, Excel, Google Docs, plain text, Markdown, HTML, and
[Pages Online](https://github.com/curtcox/pages). Reuse a small number of conversion
backends so another supported writer usually needs metadata, options and fixtures,
rather than a new conversion pipeline for every input/output pair.

Confirmed requirements: **working Excel formulas are required in the first Excel
release**; a values-only workbook does not satisfy that milestone. Evaluate
Pandoc alongside a permissively licensed fallback. Keep source downloads and
portable `.sheets.json` backups available as the lossless Sheets-editing path.

### Conversion mechanism and library evaluation

Recommended direction: one export registry, a shared completed-document snapshot,
and two conversion families: document writers and workbook writers. These are
output targets, separate from the existing input-format/detection registry.

| Candidate | Role and reuse | Evaluation gate |
|---|---|---|
| [Pandoc WASM](https://github.com/pandoc/pandoc-wasm) | Preferred candidate for Word `.docx`, GFM `.md`, `.txt`, and later ODT, RTF, EPUB or other supported writers. Its reader → AST → writer architecture avoids writing each document converter ourselves. | Prototype the browser worker API, exact available writers, math, tables and media. Measure compressed download size, cold start and peak memory on desktop and mobile. The wrapper is MIT, but the bundled Pandoc converter is GPL-2.0-or-later; record redistribution/source obligations and license compatibility before selecting it. Evaluation is authorized; adoption is a separate recorded decision. |
| [SheetJS CE](https://docs.sheetjs.com/docs/getting-started/installation/standalone/) | Preferred workbook candidate: native browser module, `.xlsx` and a reusable workbook model for later ODS, CSV and TSV. Apache-2.0. | Verify formula serialization, cached results, recalculation settings, exact numeric values, merges and supported formatting in independent spreadsheet applications. CE focuses on data preservation; do not assume premium styling, chart or calculation features. |
| [Turndown](https://github.com/mixmark-io/turndown) + [GFM plugin](https://github.com/mixmark-io/turndown-plugin-gfm), plus [docx](https://github.com/dolanmiu/docx) | Permissive fallback: MIT HTML-to-Markdown and browser DOCX generation; plain text uses shared structural traversal. | Run the same fidelity corpus as Pandoc. `docx` needs an explicit block-to-DOCX adapter; it is not a general multi-format converter. Record the greater maintenance cost for additional document formats. |
| Existing `src/export-document.js` | Retain sanitized standalone HTML as the fidelity baseline, and reuse it for Pages and as a document-conversion input. | Preserve current completed diagrams, math, selected ledger report, safe URLs and embedded styles. Do not reduce existing HTML fidelity to a lowest-common-denominator document model. |

[Pandoc's manual](https://pandoc.org/MANUAL.html) documents structural, potentially
lossy conversion. Its XLSX reader is not an XLSX writer; workbook generation and
formula translation still need their own path. WASM cannot run external programs
or fetch remote resources itself: supply media explicitly, and keep existing
browser print/PDF rather than promising native Pandoc PDF generation.

Prefer client-side conversion, without a required server or document upload.
Pin selected releases/commits and checksums, rebuild through `scripts/vendor/`,
retain notices and document upstream sources in `vendor/README.md`. Served modules
remain browser-native; a one-time vendoring build is acceptable. Select the backend
after the prototype, recording measured tradeoffs rather than assuming WASM fits
the app's mobile/offline budget. A registry entry is cheap only where the backend
already supports that writer and the common model carries the necessary semantics.

### Shared export contract

1. Refactor the existing HTML capture into a reusable immutable snapshot of the
   current completed render: revision, source, resolved format/mode, title, sanitized
   HTML, selected report, diagnostics and resolved attachments. Wait for async
   diagrams and charts. Disable rendered export during pending/cancelled renders;
   verify the revision again before download or external upload. Never recompute
   the document independently in a converter or use a stale result.
2. Derive a reusable document representation from sanitized output, preserving
   headings, paragraphs, lists, links, tables, code, results, captions and media.
   Retain source TeX/accessible math where available; keep evaluated values and
   calculation explanations distinguishable. DOM capture stays in the app shell;
   engines, formula translators and conversion workers use serializable data.
3. Add optional structured export metadata to render results without breaking
   `{html, diagnostics}` consumers: table IDs, typed cells, exact numeric strings,
   formulas/dependencies, source lines, units and asset references. Preserve this
   metadata across worker messages. HTML is sufficient for prose conversion but
   **not** for recovering calculation dependencies or numeric precision.
4. Add `src/exports/registry.js` and lazy adapters with metadata such as
   `{id,label,extension,mime,kind,capabilities,load,export}`. An adapter receives the
   snapshot, explicit options, AbortSignal and deadline, and returns file(s) or an
   external destination plus fidelity diagnostics. Share progress, cancellation,
   filenames, Blob download and error handling; terminate cancelled heavy workers.
   Keep converter options fixed/validated, with no executable filters or arbitrary
   resource access. Revoke temporary object URLs after use.
5. Publish a per-target capability matrix for equations, working formulas, reports,
   tables, plots, images, links, controls and styling. Explain dropped or flattened
   features before export. Freeze interactive controls at their current values.
   Sanitize every generated HTML/SVG path through `src/sanitize.js`, including
   converter output shown in the app. Bound source, media, rows/cells, output size
   and execution time. Do not fetch arbitrary linked images automatically; use
   validated project attachments or an explicit, bounded external-resource option.

### Target behavior

| Target | Initial delivery and fidelity contract |
|---|---|
| Word | A real `.docx` with editable prose/tables, computed results and packaged images. Test equations and diagram/image fallbacks; warn where they become pictures or text. Do not rename HTML to `.doc` or rely on Word-only HTML embedding. |
| Excel | A real `.xlsx` with working formulas, dependencies and cached calculated values for the documented translatable subset. One worksheet per table/report plus a document/context sheet where appropriate. Preserve headers, units and provenance; describe prose and visual limitations. See the required formula milestone below. |
| Google Docs | Reuse DOCX as the import artifact. Initially provide an explicitly labeled download-and-import route, then a distinct **Export to Google Docs** action using OAuth and Drive upload/conversion to `application/vnd.google-apps.document`. Direct creation is part of this plan and is complete only when the returned document opens successfully. No `.gdoc` download masquerading as the document. |
| Plain text | UTF-8 `.txt` of evaluated content with meaningful paragraph/list/table boundaries, results, units and image descriptions. Distinct from the existing original-source download, even when both use text files. |
| Markdown | UTF-8 GFM `.md` of evaluated content, retaining headings, tables, code and safe links. Offer a bundle when local assets are needed; define the supported math syntax and give explicit fallbacks for complex tables/diagrams. Original Markdown source remains available separately. |
| HTML | Preserve existing standalone `.html`; package supported attachments so project images do not depend on transient Blob URLs. Disclose any retained external resources. |
| Pages Online | Download the same standalone HTML for Pages' existing file import, then add **Open in Pages** using the verified Pages URL/project contract. Deliver an editable static page with results; live Sheets calculations remain a Sheets link/source backup. Pages here means `curtcox/pages`, not Apple Pages or ChatGPT Pages. |

Google's [Drive upload/conversion guide](https://developers.google.com/workspace/drive/api/guides/manage-uploads#import_to_google_docs_types)
supports converting Word/HTML and other document types to Google Docs. Configure
the app's OAuth client and exact allowed origins; prefer the narrow `drive.file`
scope, keep tokens out of URLs/saved documents, and upload only after an explicit
user action. Handle denied consent, offline use, rate limits and ambiguous upload
failures without creating duplicate documents automatically. Keep local downloads
available. Mock auth/network in CI; verify one real user-authorized round-trip as
a release gate, including tables, math and embedded images after Google's import.

For Pages, research on 2026-11-08 verified
[`src/project.js`](https://github.com/curtcox/pages/blob/main/src/project.js),
[`src/export.js`](https://github.com/curtcox/pages/blob/main/src/export.js), and
[`src/fragment-config.mjs`](https://github.com/curtcox/pages/blob/main/src/fragment-config.mjs).
Pages imports text HTML files; projects have `{files:[{name,text}],entry,active}`,
at most 50 files and 5 MiB, with validated relative paths and an HTML/Markdown entry.
ZIP download exists but ZIP import and binary project files are deferred: do not
offer a ZIP as the current import route. Prefer one self-contained `index.html`
with supported images embedded as data URLs; verify CSP/size/fidelity in Pages.
Use its published Fragment Kit URL serialization and canonical
`https://pages.hashbin.page/` destination, with `run=0` for the handoff. Validate the
full envelope/URL size; oversized documents fall back to HTML download/import or
explicit HashBin Publish with its normal confirmation. Never truncate a link,
silently publish, or assume the two apps' document envelopes are interchangeable.
Record tested Pages/Fragment Kit revisions when implementing the adapter.

### Excel formula milestone — required initially

The [SheetJS formula API](https://docs.sheetjs.com/docs/csf/features/formulae/)
writes formulas but does not calculate them. It does not translate Org, Calca, Numbat,
Hurmet, Python or R semantics into Excel. Treat translation as app-owned work,
shared across workbook targets, separate from serialization.

- Define a neutral expression/dependency model and a translator to Excel syntax
  with a versioned support matrix per input format. Start the prototype with Org
  tables, then Hurmet spreadsheet tables; inventory the other engines before
  committing their initial coverage. Emit explicit typed literals and formulas,
  not formulas inferred from displayed strings or arbitrary source text.
- Map column/field rules to concrete cells; handle headers/hline offsets,
  relative/absolute references, ranges, named constants, precedence and dependent
  tables. Cover arithmetic, comparisons/conditionals and common aggregates first.
  Carry referenced inputs into the workbook so formulas do not depend on Sheets,
  an external workbook, a network fetch or a running interpreter.
- Preserve source-to-cell provenance and cached results from that same render;
  request workbook recalculation on open. Validate actual recalculation after
  changing an input in Excel or LibreOffice, rather than reading cached values
  back with the writer and calling that formula support.
- Diagnose differences in rounding, numeric precision, dates, empty/string cells,
  errors, units/currencies and unsupported functions, plus cycles, reverse solving
  and dynamic code. Python/R execution and general language programs do not have
  an automatic Excel equivalent. Never silently replace an unsupported formula
  with a constant in the working-formula mode: block that export with source-line
  explanations or obtain an explicit choice of a separately labeled **values-only
  snapshot**. User-entered strings beginning with `=`, `+`, `-` or `@` remain data;
  only the trusted translator creates formula cells. Apply formula-injection
  protection separately for later CSV/TSV exports.
- Excel release acceptance requires documented formula coverage, an independent
  change-input/recalculate test and clear rejection/fallback behavior outside that
  coverage. Ship working formulas with the first Excel option; a later milestone
  may expand the subset, but may not defer all formulas to a later release.

### Delivery order and acceptance

| Slice | Work | Done when |
|---|---|---|
| EXPORT-1 (M) | Inventory export semantics across all nine input formats; prototype Pandoc, permissive fallback and SheetJS, including the Org formula translator. Record dependency/version/license and mobile performance decisions. | The same representative corpus produces inspected artifacts; formula recalculation is demonstrated; backend selection and fidelity/support matrices are recorded. No new library is adopted solely on a format list. |
| EXPORT-2 (M) | Shared snapshot/metadata, registry, controls and workers; retain HTML/source/print and add evaluated text/Markdown. | Current results, selected reports and attachments export correctly; stale/cancelled renders cannot escape; adding another supported document writer needs only an adapter entry/options and fixtures. |
| EXPORT-3 (L) | Excel workbook model, engine metadata and formula translation. | Working formulas ship with the first Excel release under the acceptance rules above; unsupported formulas cannot silently become values. Independent workbook inspection and recalculation pass. |
| EXPORT-4 (M) | Word and Google Docs import artifact, with media/math fallbacks. | DOCX opens in Word/LibreOffice and imports into Google Docs; content remains editable where promised and all losses are documented. |
| EXPORT-5 (M) | Pages file import and direct handoff; direct Google Docs OAuth upload/conversion. | Pages opens the same results/assets and permits editing; Google returns a usable document URL. Limits, offline/denied-auth cases and explicit publication behavior are covered. |
| EXPORT-6 (S–M) | Documentation, accessibility/mobile/offline polish and extensibility proof. | All seven targets are discoverable; add one extra backend-supported document writer (e.g. ODT) and one workbook writer (e.g. ODS) without changing input engines or shared capture. Do not promise equivalent formulas until independently tested. |

Validation corpus: every input format, multiple tables and selected Beancount
reports, recalculated Org cells, constants/inputs, Hurmet tables, calculation-line
results, Unicode, precision-sensitive money, code, footnotes, math, Mermaid/SVG,
charts, Python/R plots and bundled/linked pictures. Include malicious HTML/SVG,
unsafe URLs, formula-like literal strings, oversized media, converter failures,
editing during export and cancellation. Verify DOCX/XLSX package XML and embedded
assets with independent readers; visually inspect representative output in target
applications. Round-tripping with the same library is insufficient evidence.

For implementation slices, run `npm run check`, `npm test`,
`npm run test:conformance`, appropriate Chromium/Firefox/WebKit export tests and
`node scripts/test-contracts.mjs` with the server running. Run independent Org
reference checks for metadata/translator changes that touch Org behavior. Update
export docs/examples, dependency notices, deployment allowlist and generated
offline inventory together. Cache large conversion engines only under an explicit
measured policy; local exports work offline once their required assets are cached,
while Google Docs and direct external handoffs disclose their network requirement.
