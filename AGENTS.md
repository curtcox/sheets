# Project map

Sheets is a buildless static ES-module app. Read PLAN.md for scope and README.md
for commands. Keep served code browser-native and engines free of DOM APIs.

- `src/app.js` wires ACE, URL state, scheduler, view modes, sharing and HashBin.
- `src/formats/registry.js` owns metadata and dependency-free detection. Register
  a format there, in URL/HashBin validation, docs, examples and tests together.
- Every plugin exports `{id,label,extensions,aceMode,detect,load,render,docs}`.
  `render` returns `{html,diagnostics}`; diagnostic lines are one-based.
- All output must pass through `src/sanitize.js`, including generated SVG and
  any async diagram post-pass. Do not insert raw engine HTML directly.
- Worker jobs have an AbortSignal and deadline. Terminate cancelled jobs; never
  apply a stale result. Keep shared interpreter state within one render only.
- URL precedence: CID, compressed source, example, starter. Preserve complete
  source/format/view on shares. Compression decoding is size-bounded.
- Vendored files are generated. Change the scripts, pin versions/commits, rebuild,
  retain licenses, and update documentation rather than editing bundles by hand.
- `scripts/stage.mjs` defines the complete Pages deployment allowlist. Tests and
  scripts must not become public deployment assets.

Run `npm run check`, `npm test`, `npm run test:conformance`, and browser tests
appropriate to changes. Real Python tests need network access to jsDelivr.
For Org/Beancount changes, run the independent reference checks in README.md.
Review recorded conformance changes; do not blindly update expected results.
Keep format guides candid about supported subsets and known differences.
