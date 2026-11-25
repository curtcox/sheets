# Exports: remaining work

Part of the [Sheets development plan](../PLAN.md).

Outside tables and pictures (`design/external-content.md`,
[user guide](../docs/insert-content.md)) and multi-format exports
(`design/exports.md`, [user guide](../docs/exports.md)) are implemented: Word,
Markdown, plain text, RTF, standalone HTML, print/PDF, Excel/ODS workbooks with
working Org formulas, Google Docs (download/import and OAuth Drive conversion) and
the Pages Online handoff, all from one immutable snapshot and export registry.

## Follow-ups

| Item | Work | Done when |
|---|---|---|
| Hurmet formulas | Extend the workbook formula translator to Hurmet spreadsheet tables. Other engines stay values-only unless an inventory shows a safe translatable subset. | Independent change-input/recalculate checks pass in LibreOffice; unsupported formulas still block working-formula export or require the explicit values-only choice. |
| Mobile performance | Measure Word/workbook export memory and time on physical phones. | Results are recorded in `design/exports.md`; limits are adjusted only on measured evidence. Viewport or mocked tests do not count. |
| Target layout | Inspect Word and Google Docs output for math, media and complex tables in the real applications. | Findings and any losses are documented in the export guide. |
| Google release | The Google Cloud project is in Testing with the owner as the only test user. Complete branding and publication review before advertising Drive conversion to everyone. | Any Google account can complete consent and conversion from the canonical origin. |
| More writers | ODT or CSV/TSV, reusing the document tree or workbook model. CSV/TSV need formula-injection protection. | A new writer needs only an adapter entry, options and fixtures. |

## Rules for export changes

- Export only the completed, current render; never recompute in a converter or
  apply a stale result. Sanitize every generated HTML/SVG through `src/sanitize.js`.
- Only the trusted translator creates formula cells; user strings beginning with
  `=`, `+`, `-` or `@` remain data. Never silently replace an unsupported formula
  with a constant.
- Do not fetch linked resources automatically; use validated attachments.
- Run `npm run check`, `npm test`, `npm run test:conformance`, the export browser
  tests in all three browsers and `node scripts/test-contracts.mjs`. Update the
  export guide, dependency notices, deployment allowlist and offline inventory
  together.
