# Outside tables and pictures

CSV-first delivery: Insert previews bounded UTF-8 delimited values and inserts
native Org/Markdown tables. Table inputs retain leading zeros and numeric text.
CSV quoting errors fail before source changes. Imports capture the current
selection and document identity; asynchronous work cannot overwrite later edits.

Next increments add linked pictures (including verified HashBin/256t payloads),
versioned bundled attachments, picture/table choice, HTML spreadsheet paste,
portable exports and mixed gallery examples. Picture decoding stays in the UI;
parsing and document validation stay DOM-free. All output uses sanitize.js.

Verification includes unit, browser and conformance suites, shared contracts,
Org reference checks in CI, gallery cover hashes and offline manifest checks.
