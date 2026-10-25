# Sheets

A buildless, single-page editor for calculation-oriented text documents. Source,
format, and view live in the URL. Optional HashBin storage provides CID links.
Explicit compatibility profiles also travel with shared links and saved documents.
Generated links above 7,000 characters keep compressed source in the fragment,
avoiding host request-line limits on reload; short query links remain readable.

Supports GitHub Markdown, AsciiMath, Numbat, CalcFile, Org tables, a Calca-compatible
subset, Hurmet, a Beancount core subset, and Quarto notebooks with Python and R. Includes
36 gallery examples with rendered previews, format guides, diagnostics, responsive
split views, ACE, and
sanitized HTML/MathML/SVG output. Download source files, export the finished preview
as standalone HTML, or print it to PDF. Beancount, Org, Numbat, and Hurmet have
format-specific source highlighting. Offline access is available as an optional
app-file download. Calca supports numeric linear and quadratic equation solving.
Its optional **Structured blocks** mode separates calculation input from literal
code, TeX, and Mermaid. **Scoped definitions** adds immutable definitions, heading
scopes, deferred numeric dependencies, and connected relation checks. Existing
unprofiled Calca documents retain Legacy rules. CalcFile converts EUR to/from
USD, GBP and JPY through the shared, dated ECB cache, preserving decimal rate text.
Org supports named numeric inputs, same-document remote table references, numeric
comparisons and conditional formulas with `if(c,a,b)`.
Its optional **Emacs order** mode supplies native column/field scheduling and
duplicate-target checks; existing unprofiled links retain Legacy source order.
Org's source option `#+SHEETS_CONSTANTS: table` shows file assumptions with their
defining lines; omitted options retain native keyword hiding.

## Run locally

Requires Node 22 or newer. No application build is needed.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:4173/>. Any static server can serve the repository directly.
Vendored libraries and WASM are committed. Python and R download their pinned
Pyodide/webR runtimes on demand. HashBin's OAuth SDK is loaded only for sign-in.

## Create a link from a file

```sh
node scripts/link.mjs examples/org/typical.org --view=preview --profile=org-emacs-v1
```

The command reads a UTF-8 file, infers its format from the extension, and prints
one URL to stdout. It embeds a snapshot; regenerate the link after editing the
file. Options include `--format`, `--view`, `--profile` and `--base` for another
editor address. Long links use source fragments and warn on stderr. See
[file-to-link usage and limits](docs/url-format.md#links-from-source-files).

## Verify

```sh
npm run check
npm test
npm run test:conformance
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
```

Compatibility disclosures are tracked in `docs/compatibility.json`. Run
`node scripts/compatibility-docs.mjs` after editing the ledger to regenerate the
central limitations page and the status tables in format guides. Unit tests check
for disclosure drift. Imported compound entries remain marked for detailed audit;
they are not claims of completed upstream conformance.

Unit tests run real Numbat WASM and Hurmet, all 37 required CalcFile conformance
cases, URL/detection/HashBin/sharing tests, and the recorded GFM corpus (672/672
raw exact HTML matches, 601/672 production HTML; every deviation classified in
the format guide). Browser tests render
all 36 examples in Chromium, Firefox, and WebKit, including real Python and R, and check
sharing, cancellation, XSS boundaries, mobile layouts, docs, gallery and reports.

The GFM browser suite separately checks 627/672 final DOM matches, including
32 intentional sanitization differences. Reproduce that metric with
`node scripts/gfm-render-conformance.mjs`.

An additional native GFM audit has 53 matching fixtures and four intentional
autolink differences beyond that corpus; see the format guide. Run
`bash scripts/gfm-reference.sh --check` to build its checksum-pinned cmark-gfm
oracle (requires CMake, a C compiler, curl, and network access).

Independent fixture checks require Emacs and Python reference tools. Beancount
reference balances and remaining cost-lot positions use decimal strings, never floats:

```sh
python -m pip install beancount==3.2.0 beanquery==0.2.0
bash scripts/org-expected.sh --check
python scripts/beancount-expected.py --check
```

Notebook control reference checks additionally require Quarto **1.10.19**,
knitr **1.45**/rmarkdown, and the pinned Jupyter dependencies:

```sh
python -m pip install -r tests/fixtures/quarto/reference-requirements.txt
python scripts/quarto-reference.py --check
```

Without native R, run the Python subset with `--language python`. Set
`SHEETS_QUARTO_BIN` when the pinned Quarto executable is outside PATH.

CI runs these reference checks before browser tests. Generated reference outputs
are committed and compared with the browser adapters by unit/browser tests. The
Org check covers 25 numeric fixture documents and four rejections. It also
exports five HTML fixture documents (19 tables) to compare header groups, scopes
and alignment; it requires an Emacs build with libxml2 support.

## Offline access

Choose **Download → Offline access → Download offline files** while connected.
Sheets saves its static app files, vendored engines, docs, and gallery examples in
this browser, then reloads while preserving your current source/format/view link.
You can open new source links, switch formats, calculate with the eight vendored
engines, and browse docs/gallery without a network connection.

Python and R execution, external images, HashBin, link shortening, and fresh currency
rates still need a connection. Previously cached ECB rates can be used with the
existing stale-rate notice. Browser storage can be evicted; source downloads are
available for independent backups. Offline caches contain static app files only;
document URLs, OAuth callbacks, CID payloads, and external responses are never
added to them. Your source remains in your link and browser history as before.

Reopen **Offline access** to check for updates or remove offline files. An update
is verified in a separate cache and waits for **Use update and reload**; current
editor source is preserved before open pages reload. A failed download leaves
the prior release intact. Removing offline files also unregisters this app's
service worker without touching other apps' caches.

`sw.js` and `offline-assets.json` are the only added root deployment assets.
Staging creates the manifest from the deployment allowlist, hashes each file, and
sets the worker's release version. The local development server serves the same
manifest and worker substitutions on demand. This is deployment metadata; the
application still uses native ES modules without an application build.

## Regenerate gallery covers

The gallery loads committed PNG previews; browsing it does not execute examples.
After changing example source or preview styling, regenerate the covers with:

```sh
npx playwright install chromium
npm run gallery:covers
# Reproducible currency preview using the recorded ECB feed:
node scripts/render-gallery.mjs --only=calcfile-edge --rates-fixture=tests/fixtures/exchange-rates/ecb-api-2026-10-16.csv
```

The script starts and stops its own temporary local server, renders all 36
examples through the editor, and updates `examples/covers/`. Python examples need
jsDelivr access; R examples need webr.r-wasm.org. Covers use a 640 × 400 viewport; Beancount examples show the trial
balance, except the error example, which shows diagnostics. Unit tests check
coverage, dimensions, and source hashes so changed examples cannot silently keep
stale images. The application and Pages deployment still need no build.

## Deployment

GitHub Pages is configured with **GitHub Actions** as its source. Push to `main`
or dispatch the deployment workflow to run tests, stage only public assets,
publish, and check the deployed page's marker. `tests/`, `scripts/`, package
metadata, and development files are excluded. The editor footer gets the commit
SHA during staging. The intended URL is <https://curtcox.github.io/sheets/>.

Deployment runs only after the complete test workflow succeeds.

## HashBin setup

Sheets is registered with public client ID
`app_8e03e133-83b4-4ee2-b3d5-39397f573879`. Its redirect URI is
`https://curtcox.github.io/sheets/index.html`. Registration, redirect validation,
and the `content:write` / `balance:read` scope request have been checked against
HashBin's authorization endpoint. Saving is enabled through the toolbar panel.

Public CIDs load without sign-in. Saving uses the hosted OAuth SDK with PKCE and
preserves source, format, and view across sign-in. The save dialog shows the
retention period, cost, and account balance before its final Save confirmation.
Source edited while a quote is open gets a fresh quote before uploading.

The `hashbin-client-id` meta tag in `index.html` is public configuration; no client
secret belongs in this repository. OAuth callbacks, quote handling, and document
round-trips have automated coverage. Live account authorization and a charged
save require the user's account and the final per-save confirmation. See the
[HashBin guide](docs/hashbin.md).

## Source map

- `src/app.js`: shell, editor, diagnostics, startup and sharing.
- `src/editor-modes.js`: project-owned ACE highlighting, including Hurmet cells in Markdown.
- `src/formats/`: lazy plugins and DOM-free engines.
- `src/workers/`: disposable Numbat, Hurmet, Python and R interpreters.
- `src/url-state.js`, `render-scheduler.js`, `hashbin*.js`: state and persistence.
- `examples/`: four examples per format and the gallery catalog.
- `docs/`: supported subsets, gaps, sharing and storage guides.
- `vendor/`: pinned, licensed browser assets. See `vendor/README.md` and `engines.json`.
- `scripts/vendor/`: one-time dependency builds; never part of deployment.
- `tests/`: unit, conformance, reference fixtures and Playwright browser tests.

The Beancount and Org engines intentionally implement subsets; see their format
guides before relying on advanced syntax. Calca has no public spec, and this is a
compatible subset. Quarto supports Python, R and a subset of Pandoc markup; other
languages are displayed without execution. Calca solves real scalar linear and
quadratic equations, with limits described in its guide. Quarto R execution uses
webR 0.6.0 with console output, PNG plots, per-language state, cancellation and
deadlines.

## License

MIT for project code, as proposed in PLAN.md. Vendored code retains its own
licenses. The GFM spec fixture is separately CC-BY-SA 4.0 and is not deployed.
HashBin and sharing code are adapted from
[ManimOnline](https://github.com/curtcox/ManimOnline).

Numbat statement/diagnostic fixtures retain whole-document output captured from
the original unmodified 1.24.0 WASM. To independently check those records, build
commit `79046422203060e296da41c8c762c506200d2c93` with the upstream
`numbat-wasm/build.sh` **without** the Sheets patch, then run
`node scripts/numbat-expected.mjs /absolute/path/to/numbat-wasm/www/pkg`.
The normal vendoring script applies `scripts/vendor/numbat.patch` to expose parser
ranges and diagnostic labels; `npm test` also checks that the patched interpreter
retains all recorded original output. See `tests/fixtures/numbat/statements.json`.

AsciiMath's upstream corpus is pinned to npm 1.5.0's source commit
`4f4be2ca744afe0a82c2a24d559aee86688c570e`. After checking out that commit from
`christianp/asciimath2tex`, run
`node scripts/asciimath-reference.mjs /absolute/path/to/test.js` to verify the
436 imported records. With no path, the script downloads that pinned test file;
CI runs this check. It checks the reviewed file's SHA-256 first.
`npm test` preserves current translations and rejects unclassified discrepancies;
the fixture records six existing reference differences and retains upstream's
Apache-2.0 license. Diagnostic warnings leave permissive translated output intact.
