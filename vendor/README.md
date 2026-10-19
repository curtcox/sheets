# Vendored dependencies

Rebuild npm libraries with `npm ci && npm run vendor`. Versions are locked in package-lock.json.
All generated bundles are unmodified upstream code compiled to browser ES modules.
Transitive license notices are in `licenses/` and in esbuild `.LEGAL.txt` files.

| Library | Version | License | Source | Rebuild |
|---|---|---|---|---|
| markdown-it | 15.0.3 | MIT | https://github.com/markdown-it/markdown-it | npm run vendor |
| markdown-it-task-lists | 2.1.1 | ISC | https://github.com/revin/markdown-it-task-lists | npm run vendor |
| markdown-it-footnote | 4.0.0 | MIT | https://github.com/markdown-it/markdown-it-footnote | npm run vendor |
| markdown-it-github-alerts | 1.0.1 | MIT | https://github.com/antfu/markdown-it-github-alerts | npm run vendor |
| highlight.js | 11.12.0 | BSD-3-Clause | https://github.com/highlightjs/highlight.js | npm run vendor |
| temml | 0.14.0 | MIT | https://github.com/ronkok/Temml | npm run vendor |
| dompurify | 3.4.17 | (MPL-2.0 OR Apache-2.0) | https://github.com/cure53/DOMPurify | npm run vendor |
| lz-string | 1.5.0 | MIT | https://github.com/pieroxy/lz-string | npm run vendor |
| decimal.js | 10.6.0 | MIT | https://github.com/MikeMcl/decimal.js | npm run vendor |
| asciimath2tex | 1.5.0 | Apache-2.0 | https://github.com/christianp/asciimath2tex | npm run vendor |
| mathjs | 15.2.0 | Apache-2.0 | https://github.com/josdejong/mathjs | npm run vendor |
| orga | 5.0.0 | MIT | https://github.com/orgapp/orgajs | npm run vendor |
| js-yaml | 5.5.0 | MIT | https://github.com/nodeca/js-yaml | npm run vendor |
| mermaid | 12.2.0 | MIT | https://github.com/mermaid-js/mermaid | npm run vendor |
| ace-builds | 1.45.0 | BSD-3-Clause | https://github.com/ajaxorg/ace | npm run vendor |

Numbat and Hurmet retain dependency notices in their own `licenses/` directories. Hurmet includes a small build wrapper to expose AST diagnostics and initialize its own Temml global; its source is in `scripts/vendor/build-hurmet.mjs`.

Numbat applies `scripts/vendor/numbat.patch` before building. The bridge exposes parser statement ranges and structured diagnostic labels; the interpreter rules are unchanged.

Source-built engines are documented in `engines.json`; rebuild with `scripts/vendor/{numbat,calcfile,hurmet}.sh`. Pyodide 0.27.7 (MPL-2.0) is loaded on demand from https://cdn.jsdelivr.net/pyodide/v0.27.7/full/.

R is loaded on demand from https://webr.r-wasm.org/v0.6.0/ (webR 0.6.0).
The JavaScript loader is MIT; the R/webR distribution binaries are GPL-3.0.
See the [upstream licenses](https://github.com/r-wasm/webr/blob/v0.6.0/LICENSE.md)
and [release sources](https://github.com/r-wasm/webr/releases/tag/v0.6.0).
These runtime assets are downloaded from upstream and are not vendored or included
in the offline app cache. `src/webr-client.js` and its same-origin bootstrap
`src/workers/webr-worker.js` pin the runtime URLs. The bootstrap creates webR’s
own worker directly, so cancellation also stops its initial CDN download.
