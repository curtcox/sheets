# Sheets: Development Plan

A single-page web app for editing and previewing calculation-oriented text
documents. The whole document state lives in the URL; saving to and loading from
HashBin is optional. Users can edit source, read the rendered document, or show
both. Header links lead to documentation and an example gallery.

[ManimOnline](https://github.com/curtcox/ManimOnline) is the reference for the
original structure and conventions: a buildless static site, ACE editor, URL
sharing, HashBin client, gallery, Node unit tests and Playwright browser tests in
CI. Shared shell, sharing, storage and offline code now comes from Fragment Kit
(see README.md).

## Plan documents

- [Compatibility roadmap](plan/compatibility-roadmap.md): how limitations are
  classified and prioritized, and the open work queue.
- [Exports](plan/exports.md): remaining export follow-ups.
- `design/`: one design record per delivered or proposed feature.
- `docs/compatibility.json`: the limitation ledger that drives
  [Limitations](docs/limitations.md) and the guides' status tables.

## Status

All ten formats are implemented and deployed at <https://sheets.hashbin.page/>,
with supported subsets and gaps disclosed in the format guides. Also delivered:
compatibility profiles, long-link fragments, the file-to-link CLI, portable Org
projects with CID-pinned numeric inputs, outside tables and pictures, Org/Beancount
charts, Org preview controls, multi-format exports, optional offline access,
HashBin Publish saves and optional AI. Open work is ordered in the
[compatibility roadmap](plan/compatibility-roadmap.md).

## Decisions

| Topic | Decision |
|---|---|
| Build | **Buildless.** Native ES modules in `src/`; no bundler at deploy time. Third-party code is vendored under `vendor/` at pinned versions. Libraries that ship only as source (Numbat, CalcFile, Hurmet) are built once by scripts in `scripts/vendor/`, and the output is committed. |
| Editor | ACE, vendored, with project-owned modes for Beancount, Org, Numbat and Hurmet. |
| Math rendering | [Temml](https://temml.org) (TeX to MathML), shared by GFM, AsciiMath, Quarto and Calca. Hurmet bundles its own copy. |
| Sanitizing | All rendered HTML, including generated SVG and diagram post-passes, goes through `src/sanitize.js` (DOMPurify). Every shared URL is untrusted input. |
| Heavy engines | Numbat, Hurmet, Python and R run in disposable workers with a deadline and cancellation. Python and R run inside HashBin SDK sandboxes (opaque-origin frames). Stale results are discarded by revision. |
| Beancount | Own permissively licensed engine for a core subset. (@rustledger/wasm is GPL-3.0, and Python Beancount needs C extensions Pyodide lacks.) |
| Quarto | Markdown plus `{python}` cells on Pyodide and `{r}` cells on webR. OJS and Julia cells are shown but not executed. |
| CalcFile | [peetzweg/calcfile](https://github.com/peetzweg/calcfile) v0.1 draft (Apache-2.0), pinned to a commit because the format is pre-1.0. |
| Compatibility | Behavior changes to established semantics ship as explicit, shareable profiles; omitted profiles keep the original rules. Numeric correctness fixes apply to all documents. |
| Storage | HashBin saves go through HashBin Publish (the pinned SDK); Sheets never holds a HashBin credential. |

## Architecture

```
index.html, gallery.html, docs.html   editor shell, gallery, docs viewer
docs/                    user guides, format guides, compatibility ledger
design/                  feature designs and decisions
plan/                    roadmap and open work
src/
  app.js                 wiring: editor, toolbar, URL state, scheduler, views, sharing, HashBin
  url-state.js           query/fragment source, format, view, profile, CID
  project-state.js       portable project fragments and inputs
  sheets-document.js     HashBin saved-document envelopes (versions 1–4)
  render-scheduler.js    debounce, revision counter, cancellation
  sanitize.js            DOMPurify policy shared by all output
  charts.js, chart-*.js  DOM-free SVG chart renderer
  controls.js            source-backed preview controls
  exports/               export dialog, snapshots and backends
  formats/
    registry.js          catalog, lazy loading, dependency-free detection
    <id>/index.js        format plugin
  workers/               Numbat, Hurmet, Python and R hosts
vendor/                  pinned third-party code, licenses, Fragment Kit
scripts/                 dev server, staging, link CLI, references, vendoring
examples/                gallery sources, catalog.json, covers/
tests/unit/              node --test (engines, URL state, detection, HashBin, docs)
tests/fixtures/          inputs, expected outputs and conformance corpora
tests/browser/           Playwright (Chromium, Firefox, WebKit)
```

### Format plugin contract

```js
export default {
  id: 'numbat',                    // used in URLs and saved documents
  label: 'Numbat',
  extensions: ['.nbt'],
  aceMode: 'numbat',
  detect(src) { return 0..1 },     // confidence; used only by Auto
  async load() { /* import engine, start worker */ },
  async render(src, { signal }) { return { html, diagnostics: [{ line, message }] } },
  docs: 'docs/formats/numbat.md',
};
```

Engines contain no DOM code so `node --test` can import them directly. `render`
returns HTML that the shell sanitizes before display. Diagnostic lines are
one-based and appear as ACE gutter annotations and in the status bar.

### URL state

[Sharing links](docs/url-format.md) is the contract: `?format`, `?view`,
`?profile`, `?compressed` / `#src=` (fragments above 7,000 characters), project
fragments, `#<cid>` and `?example`. Loading precedence is CID → project fragment →
fragment source → query source → example → starter. Shares preserve the complete
source, format, view and profile; decoding is bounded to 5 MiB.

### Saved documents

`{"format":"sheets-document","version":1–4,"type":"<format id>","src":"…","view":"split"}`,
with version 2 adding a profile, 3 a portable project and 4 attachments. Plain-text
payloads also load, using Auto detection. See the [HashBin guide](docs/hashbin.md).

## Adding or extending a format

Every format needs:

- an engine in `src/formats/<id>/`, with vendored dependencies listed in
  `vendor/README.md`
- registration in `src/formats/registry.js`, URL/HashBin validation, docs,
  examples and tests together
- `detect()` with unit tests, including tests that it does not claim other
  formats' examples
- at least four gallery examples (basic, typical, edge, error) with covers
- `docs/formats/<id>.md`: what the format is, the supported subset, known gaps
  and upstream links, plus ledger entries in `docs/compatibility.json`
- unit tests against fixtures (and an independent reference where one exists),
  a browser test that renders every gallery example, and a HashBin round-trip
  that keeps the format

| Format | Engine | Auto detection |
|---|---|---|
| GFM | markdown-it with task lists, footnotes, alerts; highlight.js; Temml; lazy Mermaid | Fallback |
| AsciiMath | asciimath2tex, then Temml, inside GFM prose | AsciiMath fences or AsciiMath-only tokens |
| Numbat | Patched Numbat 1.24.0 WASM in a worker, one result per statement | `let`, `fn`, `->`, `unit`, `dimension` |
| CalcFile | Pinned upstream core bundle | Never from prose; use the format or `.calc` |
| Org tables | orga for prose; own `#+TBLFM:` evaluator with Emacs Calc modes | `#+TBLFM:`, hlines, Sheets/Org keywords |
| Calca | Own document model over constrained mathjs | `=>` lines |
| Hurmet | Pinned upstream bundle in a worker | `¢` delimiters |
| Beancount | Own decimal engine and reports | Dated directives |
| Quarto | js-yaml front matter, GFM prose, Pyodide and webR cells | Executable cells or Quarto front matter |
| Plain text | Escaped text | Manual only |
