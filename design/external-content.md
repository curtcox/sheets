# Outside tables and pictures

CSV-first delivery: Insert previews bounded UTF-8 delimited values and inserts
native Org/Markdown tables. Table inputs retain leading zeros and numeric text.
CSV quoting errors fail before source changes. Imports capture the current
selection and document identity; asynchronous work cannot overwrite later edits.

Linked HTTPS pictures, verified HashBin/256t payloads, versioned bundled
attachments, picture/table choice, HTML spreadsheet paste, portable exports and
mixed gallery examples are implemented. Version-2 projects and version-4 saved
envelopes carry an attachment collection independently of Org numeric inputs.
References in source use content CIDs; only referenced bytes enter snapshots.
An in-memory attachment archive preserves pictures across source undo/redo.
Existing v1 projects and v1/v2/v3 saved envelopes retain their behavior. Picture decoding stays in the UI;
parsing and document validation stay DOM-free. All output uses sanitize.js.

Verification includes unit, browser and conformance suites, shared contracts,
Org reference checks in CI, gallery cover hashes and offline manifest checks.

Image limits are eight distinct references, 256 KiB each, 512 KiB combined and
16 million decoded pixels. HashBin image retrieval has a 15-second deadline and
a 256 KiB byte cap. Hashes and encoded dimensions are checked before display.
General HTTPS inclusion needs host CORS permission, and CSP allows HTTPS fetches
for that explicit import. Scripts, frames, worker isolation and sanitization keep
their existing boundaries. No vendored files were modified.

The HashBin gallery uses a synthetic 60-byte WebP encoded as an inline CID. It
requires no upload or expiring service payload; ordinary larger CIDs are covered
by browser fixtures with verified responses. Rebuild picture fixtures with
`node scripts/external-content-examples.mjs` while the app server is running.
