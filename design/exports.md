# Export architecture and backend decision

2026-11-08. The first implementation uses permissive browser libraries with an
app-owned immutable snapshot, document tree, workbook model and export registry.
Pandoc remains an evaluated option for future document writers; it is not vendored.

## Evaluation

The test input contained a heading, emphasized Unicode prose, a numeric table and
MathML. `pandoc-wasm` 1.1.0 (bundled Pandoc 3.9) produced valid DOCX, GFM, plain text
and ODT packages in a temporary Node process. Cold module initialization took
173 ms; conversions took 1,161 ms for DOCX, 27 ms for GFM, 5 ms for plain text and
80 ms for ODT. The process RSS after all conversions was 446 MB, not an isolated
WASM peak-memory measurement. These are local desktop observations, not a promise
about mobile hardware.

| Asset | Bytes | gzip bytes |
|---|---:|---:|
| Pandoc WASM | 58,580,800 | 16,431,114 |
| docx 9.15.3 browser bundle | 293,061 | 87,447 |
| Turndown 7.2.5 browser bundle | 10,945 | 4,131 |
| SheetJS CE 0.20.3 browser bundle | 502,366 | 163,324 |

The app's optional offline package includes the permissive libraries; bundling
Pandoc would add over 16 MB compressed for document conversion alone. Its wrapper
is MIT but the distributed WASM package is GPL-2.0-or-later, requiring a separate
redistribution/source-compliance decision. The smaller fallback keeps download and
offline costs modest. It requires more app-owned document mapping; this is the
explicit tradeoff against Pandoc's much broader writer list. The GFM plugin and
ZIP utility add small bundles beyond the table. Re-run size measurements after
upgrades; versions and tarball integrity live in the lockfile.

## Data path

`htmlDownload` still defines the sanitized HTML fidelity baseline. `captureSnapshot`
captures the completed preview and derives a serializable document tree; it does
not re-evaluate source. Binary converters run in a fresh worker with cancellation
and deadline. Turndown runs on the browser thread because its browser build uses
the DOM. Word preparation converts sanitized diagrams and embedded pictures to
bounded PNGs before passing bytes to the worker. No new converter fetches linked
images. The original HTML path preserves MathML and SVG.

Org records formulas during the existing calculation pass via an optional callback.
Its result carries the same tables, formula targets, source lines and bindings
used for the rendered values. Workbook translation reuses the Calc parser and
Org address resolver. Unsupported expressions, nonnumeric dependencies, precision
limits and cycles block working-formula export. Values-only export is an explicit
choice. The workbook writer never interprets formula-looking user strings as code.
Other calculation engines remain explicitly outside the working-formula subset.

SheetJS CE writes both XLSX and ODS from the same workbook model. Its XLSX writer
does not serialize `CalcPr`, so app code updates the generated OOXML ZIP with
standard auto/full-recalculation flags using fflate. No vendor bundle is edited.
A document/context sheet retains source and mapping; long cell text is bounded.
RTF demonstrates another lightweight document writer reusing the same model,
with intentionally disclosed text-only fidelity. Adding targets does not require
changing input engines unless new semantic metadata is necessary.

## Verification and remaining external gates

Unit tests cover formula mapping, cycles, precision, string injection, unsupported
engine behavior and Google multipart metadata. Browser tests produce actual files,
exercise media, denial/fallback, cancellation, mobile dialog and mocked Google
conversion. Existing HTML/print tests remain in place.

Independent ZIP/XML inspection verified editable Word paragraphs/table cells and
XLSX formula/cached-value pairs. Microsoft Excel opened the generated XLSX without
repair and displayed the cross-sheet formula in D2. This installed Excel is in
read-only mode, so it could not perform the edit-and-recalculate gate. Independently,
Python `formulas` 1.3.4 loaded the exported workbook, calculated D2 as 24, then
calculated 80 after changing B2 from 3 to 10. The new independent CI job also passed LibreOffice Calc: it changes B2 to 10,
opens/recalculates the exported XLSX, and verifies D2 is 80 while D3 remains 60.
The original export implementation passed this gate in GitHub Actions run
42525405946. The check is retained in `scripts/export-reference.py`.

Google upload uses `multipart/related` and Drive's conversion MIME type, with
`drive.file` consent and no persisted tokens. On 2026-11-08, the owner approved a
dedicated browser client in the existing Hashbin project and enabled Drive API.
The public ID is configured in `index.html`; no client secret is used or stored.
The token request sets `include_granted_scopes: false` to keep the returned token
limited to the requested file scope even if other clients in the project have
prior grants ([Google API reference](https://developers.google.com/identity/oauth2/web/reference/js-reference#TokenClientConfig)).
Authorized origins are `https://sheets.hashbin.page`, `https://curtcox.github.io`
and `http://127.0.0.1:4173`. The project remains in Testing with the owner as a
test user; public OAuth release still requires completing project branding and
reviewing its publication settings. This setup does not make the canonical
Cloudflare host deploy itself.

A real local export, after the owner approved Google’s limited file consent,
created a native Google Doc and opened successfully in Editing mode, saved
privately to Drive. Visual inspection verified the heading, prose and editable
2-row table with totals 24 and 60. This verifies the basic import path, not every
math/media/layout case. Pages handoff uses the current v1 Pages
envelope and Fragment Kit compression; its full payload, URL and 5 MiB envelope
limits are checked. A live browser check at `pages.hashbin.page` accepted the
exported `index.html`, kept automatic execution off on open, and rendered the
verification table with total 24 after Run.

After the owner approved the quoted $0.02 save and one-month retention, HashBin
reported both sample exports uploaded. The remote bytes exactly matched the
local artifacts (Word 9,886 bytes; Excel 8,499 bytes). Retention ends 2026-12-08:

- [Word example](https://hashbin.org/info.html?cid=AAAAACaeAw_XtnIpLacMwMQW_hDAWd5xVWmyxPPmC-NEnMn7JcnHvE6WgfRjWidSOFA4a5ejviBd6HhfTs_TX5FioLgh7A)
- [Excel example with working formulas](https://hashbin.org/info.html?cid=AAAAACEzbmpTauvHGMVixY0Xx58e5CAw7cBnaAeu555J9nTZUtNOaK-uXWvb3qdpkYSsm4dMi-vE1jTc4IiXiU6GrDgFMQ)

Physical-phone memory/performance, full Word/Google layout inspection and broader
Hurmet formula coverage remain release
follow-ups; do not describe those gates as passed by viewport or mocked tests.
