# Sheets

A buildless, single-page editor for calculation-oriented text documents. Source,
format, and view live in the URL. Optional HashBin storage provides CID links.

Supports GitHub Markdown, AsciiMath, Numbat, CalcFile, Org tables, a Calca-compatible
subset, Hurmet, a Beancount core subset, and Quarto notebooks with Python. Includes
36 gallery examples with rendered previews, format guides, diagnostics, responsive
split views, ACE, and
sanitized HTML/MathML/SVG output. Download source files, export the finished preview
as standalone HTML, or print it to PDF. Beancount, Org, Numbat, and Hurmet have
format-specific source highlighting. Offline access is available as an optional
app-file download.

## Run locally

Requires Node 22 or newer. No application build is needed.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:4173/>. Any static server can serve the repository directly.
Vendored libraries and WASM are committed. Only Python downloads its pinned
Pyodide runtime/packages on demand. HashBin's OAuth SDK is loaded only for sign-in.

## Verify

```sh
npm run check
npm test
npm run test:conformance
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
```

Unit tests run real Numbat WASM and Hurmet, all 37 required CalcFile conformance
cases, URL/detection/HashBin/sharing tests, and the recorded GFM corpus (582/672
exact HTML matches; deviations listed in the format guide). Browser tests render
all 36 examples in Chromium, Firefox, and WebKit, including real Python, and check
sharing, cancellation, XSS boundaries, mobile layouts, docs, gallery and reports.

Independent fixture checks require Emacs and Python reference tools:

```sh
python -m pip install beancount==3.2.0 beanquery==0.2.0
bash scripts/org-expected.sh --check
python scripts/beancount-expected.py --check
```

CI runs these reference checks before browser tests. Generated reference outputs
are committed and also compared with the JavaScript engines by unit tests.

## Offline access

Choose **Download → Offline access → Download offline files** while connected.
Sheets saves its static app files, vendored engines, docs, and gallery examples in
this browser, then reloads while preserving your current source/format/view link.
You can open new source links, switch formats, calculate with the eight vendored
engines, and browse docs/gallery without a network connection.

Python execution, external images, HashBin, link shortening, and fresh currency
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
```

The script starts and stops its own temporary local server, renders all 36
examples through the editor, and updates `examples/covers/`. Python examples need
jsDelivr access. Covers use a 640 × 400 viewport; Beancount examples show the trial
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

## HashBin setup (deferred)

Final HashBin load/save integration is deferred. The current client and public-CID
loading are provisional; account registration and real save/load verification
remain future work. Saving is intentionally disabled in this deployment.

Public CIDs load without configuration. Saving stays disabled until a public
HashBin app client ID is added to the `hashbin-client-id` meta tag in `index.html`.
Register the app for `https://curtcox.github.io/sheets/`, with a callback at
`https://curtcox.github.io/sheets/index.html`. Do not commit secrets. OAuth
snapshot/restore, quotes and payload round-trips are tested with mocks; a real
account sign-in and charged save need registration and manual verification.

## Source map

- `src/app.js`: shell, editor, diagnostics, startup and sharing.
- `src/editor-modes.js`: project-owned ACE highlighting, including Hurmet cells in Markdown.
- `src/formats/`: lazy plugins and DOM-free engines.
- `src/workers/`: disposable Numbat, Hurmet and Python interpreters.
- `src/url-state.js`, `render-scheduler.js`, `hashbin*.js`: state and persistence.
- `examples/`: four examples per format and the gallery catalog.
- `docs/`: supported subsets, gaps, sharing and storage guides.
- `vendor/`: pinned, licensed browser assets. See `vendor/README.md` and `engines.json`.
- `scripts/vendor/`: one-time dependency builds; never part of deployment.
- `tests/`: unit, conformance, reference fixtures and Playwright browser tests.

The Beancount and Org engines intentionally implement subsets; see their format
guides before relying on advanced syntax. Calca has no public spec, and this is a
compatible subset. Quarto supports Python and a subset of Pandoc markup; other
languages are displayed without execution. Optional later features in PLAN.md
(webR and equation solving) remain future work.

## License

MIT for project code, as proposed in PLAN.md. Vendored code retains its own
licenses. The GFM spec fixture is separately CC-BY-SA 4.0 and is not deployed.
HashBin and sharing code are adapted from
[ManimOnline](https://github.com/curtcox/ManimOnline).
