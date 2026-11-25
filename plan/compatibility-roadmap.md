# Compatibility roadmap

Part of the [Sheets development plan](../PLAN.md). This page decides what to do
next. What is already supported is described in the [format guides](../docs/index.md)
and the [limitation ledger](../docs/limitations.md); designs are in `design/`.

## Current ledger

`docs/compatibility.json` has 81 entries. Regenerate the limitations page and the
guides' status tables with `node scripts/compatibility-docs.mjs`; unit tests
reject drift.

| Format | Resolved | Retained | Open | Audit |
| --- | ---: | ---: | ---: | ---: |
| GFM | 1 | 4 | 0 | 1 |
| AsciiMath | 2 | 2 | 1 | 0 |
| Numbat | 1 | 2 | 0 | 2 |
| CalcFile | 1 | 1 | 0 | 3 |
| Org | 12 | 0 | 2 | 3 |
| Calca | 2 | 0 | 0 | 6 |
| Hurmet | 1 | 1 | 0 | 2 |
| Beancount | 4 | 0 | 2 | 4 |
| Quarto | 4 | 0 | 2 | 6 |
| Plain text | 0 | 2 | 0 | 0 |
| Shared | 2 | 0 | 1 | 4 |
| **Total** | **30** | **12** | **8** | **31** |

`audit` entries are compound disclosures imported before the ledger existed. None
has an atomic reproducer yet, so any of them may hide a wrong result.

## Goal and prioritization

Close gaps that change results first, then widely used missing capabilities, then
larger language and runtime features. Within a priority, prefer changes that reuse
an existing engine or benefit several formats. Any newly verified wrong result
becomes a P0 slice ahead of new syntax. Effort labels are relative: **S** is a
bounded adapter change, **M** changes a subsystem, and **L** introduces a
language/runtime or architectural boundary.

Classify each limitation before counting progress:

| Kind | Treatment |
| --- | --- |
| Implementation defect or missing upstream behavior | Add a reproducer and implement a verified fix. |
| Upstream behavior or format purpose | Retain and explain it. Reserved unit names, dimensional errors, and non-executable Markdown/AsciiMath/plain text are not missing evaluators. |
| Deliberate safety or reproducibility policy | Preserve the default. Add a bounded, explicit alternative only when useful; never remove sanitization, cancellation, payload bounds or interpreter isolation to claim parity. |
| Browser or deployment constraint | First test a browser implementation; otherwise provide an optional native route with an explicit architecture decision. An unimplemented route does not resolve a gap. |

Behavior changes to established semantics ship as explicit compatibility profiles
(`design/compatibility-profiles.md`). Profiles preserve intentional language
semantics, not known incorrect arithmetic: numeric correctness fixes apply to all
supported documents, with reference-backed comparisons.

## Open queue

Take rows in order. A delivered slice does not close its whole format.

| Order / slice | Tier | Ledger IDs | Work | Completion evidence |
| --- | --- | --- | --- | --- |
| 1 / LEDGER-1 (M, one commit per format) | P0 classification | all 31 `audit` entries | Split each compound entry into retained policy/upstream statements with evidence and atomic open gaps with a reproducer, expected behavior, priority and slice. Order by risk of hiding a result difference: ORG-01/03/04 (mathjs vs Calc on empty cells, integers, ranges), CALCA-01/05 (floating point and displayed digits), BEAN-01/02/03/05 (link existing native fixtures), then NUM-02/04, HUR-01/03, CF-01/03/04, QT-03–08, GFM-03 and SHARED-01–04. | Zero `audit` entries; regenerated pages pass drift tests; every new open item has a row here. A wrong result found here becomes a P0 slice. |
| 2 / CALCA-V (S prep; external) | P0, needs a Calca licence | CALCA-03, CALCA-04 | Native-app behavior for equation selection, child redefinition, deferred binding, conflict presentation and Setext headings. | `design/calca-verification.md` with minimal documents, Sheets' output and space for licensed-app results. Matches become fixtures; mismatches become a new profile. Does not block later rows. |
| 3 / SHARE-URL (M) | P2 field report | SHARED-07 | A `?url=` raw-source loader: bounded fetching, CORS/fetch failures, redirects and conversion into an embedded source snapshot. | Existing single-document links unchanged; failures and bounds tested. |
| 4 / ORG-MONEY-1 (S–M) | P2 field report | ORG-02 formatting | Opt-in thousands grouping, including grouped currency display, without feeding decorated strings back into calculation or changing `;%.2f` values. | Recalculation, source copy and export tests. |
| 5 / What-if slices (M each) | P3 field report | ORG-04 | ORG-DATE-1 → CTRL-1D → CTRL-2 → CTRL-3 → WHATIF-1 → WHATIF-2 → WHATIF-3, as specified in `design/what-if-controls.md` (CTRL-1 is delivered). | Each slice's "Done when" in that design. |
| 6 / CALCA-3A (M) | P1 | CALCA-07, CALCA-01 | Indented multiline definitions, named arguments, multiple statements per line, calls to later functions, local bindings, safe indexing/ranges. | Public reference cases (plus CALCA-V results) in a new profile; existing profiles unchanged. |
| 7 / QT-2B (M) | P1 | QT-02, QT-05, QT-06 | Rich R data-frame tables; inline `` `{python} expr` `` / `` `{r} expr` ``; sanitized `output: asis`; separate message control. | Pinned Quarto 1.10.19/knitr/Jupyter reference documents plus sanitization, export, cancellation and skipped-cell fixtures. |
| 8 / NUM-2 + HUR-1 (M) | P1 | NUM-02, NUM-04, HUR-01, HUR-03 | Output the adapters drop, found by auditing the pinned APIs, ASTs and upstream examples. | Parity fixtures against the pinned interpreters; worker, sanitizer and cancellation boundaries unchanged. |
| 9 / QT-1B (M) | P1 | QT-01 | Table, equation and section cross-references; subfigures; grouped and prefix-suppressed references; callout titles, collapse and appearance. | Pinned Quarto reference outputs with precise diagnostics; current figure numbering unchanged. |
| 10 / FORMAT-1 (M) | P1 | AM-01, GFM-03, CF-01 | Temml's missing `>->>` arrow and other audited notation gaps via a pinned upgrade or focused macro; measure GFM math coverage against a recorded TeX command list; expand CalcFile only against a named newer upstream commit. | Differential fixtures, vendor rebuild records and licences; old profiles reproducible. |
| 11 / BEAN-2B (M slices) | P2 | BEAN-03, BEAN-02, BEAN-09, BEAN-06 | Price-date selection and an explicit valuation report; multi-posting inference where native accepts it; combined costs, merge markers, lot interpolation; remaining rounding options. | bean-check/bean-query fixtures for accepted and rejected cases; decimal bounds kept. |
| 12 / ORG-1D (M slices) | P2 | ORG-02 | Target ranges; relative targets in Emacs order; A1 remote notation; dynamic remote indirection; bounded iteration with convergence/cycle diagnostics; global format parameters; Unicode display width. | One Emacs fixture set per item. |
| 13 / CALCA-3B (M–L slices) | P2 | CALCA-02 | Symbolic answers, linear systems, unit-aware equations, function inversion, each separately bounded. | Requires CALCA-3A; reference cases for underdetermined, conflicting and no-solution inputs. No universal-solver claim. |
| 14 / FILE-1 → OFFLINE-1 → RUN-1 → UI-1 → OJS-1 (L, separate designs) | P2/P3 | BEAN-01 (includes), ORG-02 (cross-file), SHARED-02/03, QT-03/04/05/07/08, NUM-02, HUR-01, ORG-04 | See [Runtime and architecture work](#runtime-and-architecture-work). | A published feasibility and data/permission contract before each implementation. |
| 15 / NATIVE-1 (L, decision first) | P3 | ORG-01 (Lisp), BEAN-01 (plugins), QT-01 (Pandoc), QT-03 (Julia), QT-04/05 (native packages) | Behavior that requires desktop upstream tools. | An installation, platform, licence and trust decision before any code. |

ORG-16 (3D plots, gnuplot scripts and custom time formats) stays open at P3;
optional chart overrides (CHART-6 in `design/charts.md`) are deferred.

The 12 retained entries are GFM-02/04/05/06, AM-04/05, NUM-03/05, HUR-02,
TEXT-01/02 and CF-05. They are explained, not elimination targets. Bounded
alternatives: optional sessions for NUM-03/HUR-02 (RUN-1), newer ECB base pairs
for CF-05 (FORMAT-1) and task toggles for GFM-04 (UI-1).

## Runtime and architecture work

- **FILE-1 — project inputs:** delivered for CID-pinned numeric Org inputs and
  portable Org snapshots (`design/project-inputs.md`, `design/portable-projects.md`).
  Remaining: an explicit manifest of user-selected files for Beancount includes,
  cross-file Org tables and notebook data, with cycle detection and bounded size
  and depth. Never infer access to local files from an include.
- **OFFLINE-1 — optional scientific runtimes:** self-host pinned, verified
  Python/R assets and an explicit package set as a separate opt-in download.
  Measure transfer size, startup, storage and memory first; test interrupted
  installs, eviction, updates and removal in all browsers.
- **RUN-1 — run/session controls:** keep fresh-per-render execution as the
  default. Evaluate manual Run/Run all and optional per-document sessions, with
  isolation, stale-output display, cancel, restart and full replay.
- **UI-1 — source-backed editing tools:** task toggles, Org recalculation
  application, Hurmet table/drawing controls and a REPL as separate opt-in tools
  that round-trip through source, undo, URL/HashBin and reload.
- **OJS-1 — reactive cells:** a time-boxed Observable runtime experiment in a
  separate sandbox with a bounded output protocol; widgets never reach editor
  storage or insert unsanitized HTML.
- **NATIVE-1 — local companion:** an optional service that runs pinned upstream
  tools against an explicitly supplied project and returns diagnostics and
  artifacts, with cancellation, resource limits and authenticated origin-bound
  communication. The static editor stays independently usable. A generic native
  backend cannot provide Calca's proprietary engine.

Browser package, memory and storage limits cannot be made unbounded. Publish a
measured support matrix and a usable alternative rather than raising global
timeouts or hiding failed imports.

## Release checklist

For every release: update the atomic ledger and matching guide/comparison,
include editor-loaded examples, run the applicable independent reference and all
required checks and browser projects, push on main, and verify the public commit.
Split any compound disclosure a release touches.

A work item closes only after an independent reference or clearly specified
behavioral test passes, old links and exports still work, and docs and runnable
examples agree with the shipped feature. Cancellation, stale-render protection,
sanitization, offline lifecycle and all three browser projects are release gates
when affected. Never rewrite expected results merely to match a new
implementation. Writing a plan or adding a link does not resolve a gap.

## Reference oracles

- [Org spreadsheet manual](https://orgmode.org/manual/The-Spreadsheet.html) and
  `scripts/org-expected.sh` (Emacs 31.1 / Org 9.8.7).
- The pinned Beancount/bean-query tools and `scripts/beancount-expected.py`.
- [Quarto execution options](https://quarto.org/docs/computations/execution-options.html)
  and `scripts/quarto-reference.py`.
- [Calca reference](https://calca.io/reference); verify behavior rather than
  assuming mathjs parity.
- `tests/fixtures/gfm-conformance.json`, `scripts/gfm-reference.sh`, the committed
  CalcFile corpus, the AsciiMath corpus and the vendored Numbat/Hurmet engines.
