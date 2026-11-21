# Compatibility roadmap: prioritize and eliminate limitations

Part of the [Sheets development plan](../PLAN.md). Delivered work is recorded in
[Delivered slices](delivered-slices.md).

Status: **in progress**, priorities refreshed 2026-10-25 after the HashBin
money-model field report; the implementation baseline below is historical.
This roadmap extends the completed original plan. Its first slices are delivered:
Phases 11–13, then ORG-1A, ORG-1B, QT-2A and BEAN-2A from the previous queue.
Their records are kept in [Delivered slices](delivered-slices.md). The verified baseline is
320 unit tests, 264 browser tests (88 in each of Chromium, Firefox and WebKit),
37 required CalcFile cases, and 672/672 canonical GFM examples (601/672
production HTML and 627/672 final browser DOM, with every difference classified).
The function comparison page separates callable libraries, custom definitions,
imported packages and display-only notation. The original inventory at
`d99cb58` is retained in the ledger's baseline disclosure fields.

After ORG-1C the recorded baseline is 325 unit tests and 267 browser tests.
The field-report triage added six entries; splitting the remaining raw-URL loader
from the completed CLI and recording the delivered FILE-1A subset brings
`docs/compatibility.json` to 77 entries. SHARE-1,
ORG-1E, ORG-TABLE-1/2, LINK-1 and ORG-INPUT-1 resolve the original six new gaps;
the separate raw-URL proposal remains open:

| Format | Resolved | Retained | Open | Audit |
| --- | ---: | ---: | ---: | ---: |
| GFM | 1 | 4 | 0 | 1 |
| AsciiMath | 2 | 2 | 1 | 0 |
| Numbat | 1 | 2 | 0 | 2 |
| CalcFile | 1 | 1 | 0 | 3 |
| Org | 10 | 0 | 1 | 3 |
| Calca | 2 | 0 | 0 | 6 |
| Hurmet | 1 | 1 | 0 | 2 |
| Beancount | 3 | 0 | 2 | 4 |
| Quarto | 4 | 0 | 2 | 6 |
| Plain text | 0 | 2 | 0 | 0 |
| Shared | 2 | 0 | 1 | 4 |
| **Total** | **27** | **12** | **7** | **31** |

None of the 31 compound `audit` entries has an atomic reproducer yet, so they
may still hide wrong results. A 2026-10-19 spot check found one that did
(ORG-09, now resolved). This refresh therefore puts known and suspected
result-changing defects first, then classification of everything still unknown,
then missing capabilities, then new runtimes and architecture.

## Goal and prioritization

Close gaps that change results first, then widely used missing capabilities, then
larger language and runtime features. Within a priority, prefer changes that reuse
an existing engine or benefit several formats. Effort labels are relative:
**S** is a bounded adapter change, **M** changes a subsystem, and **L** introduces
a language/runtime or architectural boundary. These are scope estimates, not
delivery dates; re-estimate after the first reference fixtures.

The limitations page mixes four kinds of entries. Classify them before counting
progress:

| Kind | Treatment |
| --- | --- |
| Implementation defect or missing upstream behavior | Add a reproducer and implement a verified fix. |
| Upstream behavior or format purpose | Retain and explain it. Reserved unit names, dimensional errors, and non-executable Markdown/AsciiMath/plain text are not missing evaluators. |
| Deliberate safety or reproducibility policy | Preserve the default. Add a bounded, explicit alternative only when useful; do not remove sanitization, cancellation, payload bounds, or interpreter isolation to claim parity. |
| Browser or deployment constraint | First test a browser implementation; otherwise provide an optional native execution route with an explicit architecture decision. Do not label an unimplemented route as resolved. |

## Field-report priorities — active order from 2026-10-25

These priorities take precedence over the older queue below for the affected
slices. The remaining queue keeps its relative order. LEDGER-1 continues in
bounded per-format slices; it must not delay recovery from the reported reload
risk. Any newly verified wrong result still becomes a P0 ahead of new syntax.
The field report is evidence of workflow failures, not an upstream oracle.
SHARE-1, ORG-1E, ORG-TABLE-1/2, LINK-1, ORG-INPUT-1 and ORG-HINT-1 are
implemented. FILE-1A now supplies pinned numeric constants; broader FILE-1 work
now includes portable Org snapshots (FILE-1B). Raw-URL loader design remains next.

| Order / slice | Tier | Ledger / report items | Work and completion evidence |
| --- | --- | --- | --- |
| 1 / SHARE-1 (M, implemented) | P0 recovery risk | SHARED-05 (resolved), SHARED-02; report 1 | Source moves to `#src=` above 7,000 URL characters; short query links, CID precedence, complete profiled state and bounded decoding remain supported. The enforcing-server test reproduces old reload HTTP 414 and verifies new reload/reopening without browser storage. OAuth, source download and offline update/reload use long source. The notice recommends a separate source copy; no local draft store is added. See `design/long-source-links.md`. |
| 2 / ORG-1E (M, implemented) | P1 model formulas | ORG-10 (resolved), ORG-01/02; report 4 | Numeric `if` and comparisons work in both modes, including native precedence, selected-branch evaluation, exact comparisons and supported native chains. Two new independent Emacs documents preserve all 22 earlier reference results. Browser checks cover pricing, shares and retained cells on selected errors. Remaining symbolic/vector conditions and Boolean syntax are explicitly disclosed. See `design/org-conditions.md`. |
| 3a / ORG-TABLE-1 (S, implemented) | P1 readability defect | ORG-11 (resolved); report 6 | Single-token cells no longer inherit arbitrary wrapping; multiword labels wrap normally. Wide tables scroll locally, with focused preview arrow keys and matching standalone HTML styles. Geometry checks reproduce the old failure and verify 800 px Split, 390 px mobile, signed/scientific values, long labels, both modes and print overflow. Org gallery covers were regenerated. See `design/org-table-wrapping.md`. |
| 3b / ORG-TABLE-2 (M, implemented) | P1 export compatibility | ORG-12 (resolved), ORG-02 layout; report 6 | Five independent Emacs HTML-export documents cover 19 tables: header/body groups, scopes, default numeric threshold, blank runs, cookies and recalculated values. Both modes, sanitized HTML, print and narrow-table scrolling are checked in browsers. Calculation metadata stays visible under the established policy; rich cell markup and wider export features remain disclosed. See `design/org-table-html.md`. |
| 4 / LINK-1 (S, implemented) | P1 authoring workflow | SHARED-06 (resolved); report 9 and 1 | Documented `node scripts/link.mjs <file>` uses the shared serializer, extension inference and explicit format/view/profile/base options. Unit and browser checks cover exact UTF-8 source, snapshots, both size limits, errors and fragment warnings. Org BOM/CRLF parser handling is corrected. The CLI supplies no storage and stays outside Pages assets. See `design/link-tool.md`. |
| 5a / ORG-INPUT-1 (S, implemented) | P2 readable assumptions | ORG-13 (resolved); report 3 | `#+SHEETS_CONSTANTS: table` shows effective file constants and defining lines in both modes, while omitted options retain native keyword hiding. One new independent Emacs fixture checks duplicate constants, local overrides and literal ownership; unit/browser checks cover errors, exact values, sharing, saved documents, downloads, offline, print and mobile. See `design/org-constants-display.md`. |
| 5b / ORG-HINT-1 (S, implemented) | P2 formula clarity | ORG-09 (resolved); report 5 | `#+SHEETS_HINTS: precedence` adds one informational annotation and preview explanation per active formula line for ungrouped divisor products. The Calc parser distinguishes explicit grouping, powers and multiplication; arithmetic, mode scheduling and errors remain unchanged. An independent Emacs fixture and unit/browser checks cover bounds, references, source round-trips, exports and offline use. See `design/org-precedence-hints.md`. |
| 6a / FILE-1A (M, implemented) | P2 shared numeric inputs | ORG-14 (resolved), ORG-02; report 2 | Versioned source declarations import numeric Org file constants from CID-pinned inputs, verify length/SHA-512, and expose scalar namespaces with provenance. Limits, atomic failures, cancellation, literal ownership and nonrecursive imports are tested; an independent local Emacs equivalent confirms exact arithmetic. Existing envelopes preserve source declarations. See `design/project-inputs.md`. |
| 6b / FILE-1B (M, implemented) | P2 portable projects and raw loading | ORG-02 cross-file, SHARED-07; report 2 and 9 | Version-1 Org project files preserve source/mode/view and verified bytes; project fragments and HashBin version 3 preserve complete state. File validation, closed input loading, explicit live detachment, CLI and offline migration are tested. See `design/portable-projects.md`. A `?url=` loader remains a separate mutable-source proposal: define bounded fetching, CORS/fetch failure, redirects and conversion into an embedded source snapshot. General cross-file table/include graphs need depth/cycle and execution budgets. Preserve existing single-document links. |
| 7 / ORG-MONEY-1 (S–M) | P2 display feature | ORG-02 formatting; report 6 | Design opt-in thousands grouping, including grouped currency display, without feeding decorated strings back into numeric calculation or changing existing `;%.2f` values. Literal dollar prefixes already work. This is a requested extension, not proven native printf parity. Test recalculation, source copy and export. |
| 8 / UI-1 (L, separate designs) | P3 model tools | ORG-04; report 3, 7 and 8 | Evaluate source-backed preview input editing, input styling and per-cell notes separately. Goal seek/what-if needs a bounded numeric contract with no-solution/nonconvergence diagnostics and explicit source updates/undo. Calca’s existing scalar solver does not provide Org goal seek. Keep these below recovery, formula support and readable assumptions. Proposed (2026-10-29): source-backed checkbox, slider, date and text controls for Org then Numbat, plus scenarios, sweeps and goal seek, in slices CTRL-1 → WHATIF-3. Per-cell notes are not included. CTRL-1, Org constant controls, is implemented. See `design/what-if-controls.md`. |

This maps every field-report item to a ledger disclosure and an implementation
slice. SHARED-05/06 and ORG-10/11/12/13 are resolved; the separately tracked
raw-URL proposal SHARED-07 remains open. Cosmetic cues and solver tools
do not gate the bounded sharing, formula and table fixes above.

## Charts — implemented 2026-10-29

Readers will see sheet data as charts. Org gets native `#+PLOT:` (org-plot)
charts drawn from recalculated tables. Omitted options are inferred, and the
inference is shown so it can be pasted into the source. Sheets-only kinds go on
a `#+SHEETS_PLOT:` line that Emacs ignores. Beancount gets a Charts tab that
needs no syntax. All charts share one DOM-free, sanitized SVG renderer
(`src/charts.js`), which WHATIF-2 sweeps will reuse. The slices are CHART-1
(renderer and Org 2D) → CHART-2 (stacked, radar, grid, `set:` subset) →
CHART-3 (pie, donut, area) → CHART-4 (in-cell bars) → CHART-5 (Beancount),
plus the optional CHART-6 and documentation-only CHART-7. An Emacs batch
org-plot harness is the reference. See `design/charts.md`.

Progress: CHART-1 is done (ORG-15). `src/charts.js` draws line, scatter, step
and bar charts; `#+PLOT:` is parsed as org-plot parses it, inference is shown
in captions and annotations, and `scripts/reference/org-plot.el` records
org-plot's own extraction for every fixture and pasted variant. CHART-2 is
done: stacked bars, the `set:` subset, bounds and ticks, radar charts and grid
heatmaps (matching org-plot's own axes, ticks and matrices) and `file:`
placement. ORG-16 records the options that stay diagnosed (3D, scripts).
CHART-3 is done: `#+SHEETS_PLOT:` adds pie, donut and area kinds, `rows:all`,
legend placement and sizes, and the harness confirms Emacs ignores it. CHART-4
is done (ORG-17): `orgtbl-ascii-draw`, `orgtbl-uc-draw-grid` and
`orgtbl-uc-draw-cont` produce Emacs's exact text in both calculation modes,
including `#ERROR`, and every other Lisp formula stays unsupported. CHART-5 is
done (BEAN-10): a Beancount **Charts** tab draws net worth, income against
expenses and where the money went with no syntax, and its data equals
independent beanquery sums for every valid fixture. CHART-6 is
deferred, because the defaults need no overrides and `custom` directives stay
unsupported. CHART-7 is done: the GFM guide documents Mermaid `xychart`, `pie`
and `radar-beta` for GFM, AsciiMath, Quarto and Calca, with a gallery example,
and the format comparison lists every chart kind.

## Prioritized elimination queue — refreshed 2026-10-19

This is the broader queue retained after the field-report priorities above.
Only order 1 (ORG-1C) is delivered; orders 2–4 remain open. The six new
field-report entries are assigned above; all earlier unresolved IDs are assigned
below. Take the remaining rows in order. The only exception is that a newly
reproduced wrong result always goes ahead of new syntax as its own P0 slice. A delivered slice does not close its
whole format.

| Order / slice | Tier | Ledger IDs | Limitation to eliminate | Completion evidence |
| --- | --- | --- | --- | --- |
| 1 / ORG-1C (M, implemented) | P0 wrong result | **ORG-09** (resolved), split from ORG-02/03 | Org evaluates formulas with Emacs `org-calc-default-modes`: degree angle mode, 12-digit internal precision, `(float 8)` display, and no fraction preference. Sheets uses radians and 12 significant display digits. Example: `sin(30)`, `1/3` and `2^0.5` render `-0.988031624093`, `0.333333333333` and `1.41421356237`. Emacs 31.1 with Org 9.8.7 renders `0.5`, `0.33333333` and `1.4142136`. Formula mode letters other than `N` and `%.Nf` (`p`, `n`/`s`/`e`/`f`, `D`/`R`, `F`, `E`, `L`) are silently ignored. | Record ORG-09 with this reproducer before changing code. Add Emacs fixtures for trig, inexact division, powers, large and small magnitudes, integers, existing `%.Nf`/`;N`, and each supported mode letter. Re-check all existing reference documents. Apply the fix to both Legacy and Emacs order, because it is arithmetic correctness, not profile semantics. Document the changed displayed values in the guide's migration notes. Unsupported mode letters get source-line diagnostics. |
| 2 / LEDGER-1 (M, one commit per format) | P0 classification | all 31 `audit` entries | Split each compound entry into two kinds of record: retained policy/upstream statements with evidence, and atomic open gaps with a reproducer, expected behavior, priority and slice. Order by how likely an entry is to hide a result difference: ORG-01/03/04 (mathjs vs Calc on empty cells, integers and ranges), then CALCA-01/02/05 (floating point and displayed digits vs public reference examples), then BEAN-01/02/03/05 (link the existing native assertion/pad/inference fixtures). Next comes the bounded NUM-2/HUR-1 audit of NUM-02/04 and HUR-01/03, then CF-01/03/04, QT-03–08, GFM-03 and SHARED-01–04. | The `audit` count is 0, which completes Phase 11 items 1–2. The limitations page and guides are regenerated and drift tests pass. Every new open item is placed in this queue or in Phases 14–16. If the audit finds a wrong result, it becomes a P0 slice ahead of order 4. |
| 3 / CALCA-V (S prep; external verification) | P0, blocked on a Calca licence | CALCA-03, CALCA-04 | Native-app behavior for equation selection, child redefinition, deferred binding, conflict presentation and Setext headings. | Publish `design/calca-verification.md`: minimal documents with Sheets' current output and space to record the licensed-app result. Results that match become fixtures. A mismatch becomes a profile change (`calca-scopes-v2` if semantics change). Until results exist, both entries stay unresolved and labeled as Sheets policy. This row does not block later rows. |
| 4 / CALCA-3A (M) | P1 | CALCA-07, CALCA-01 (grammar parts) | Indented multiline definitions, named arguments, multiple statements per line, calls to functions defined later, local bindings, and safe indexing/ranges. | Use public reference cases, plus CALCA-V results where available, in a new explicit profile. Legacy, Structured and Scoped links stay unchanged, as do expression guards and bounds. Solver expansion waits for this grammar. |
| 5 / QT-2B (M) | P1 | QT-02, QT-05, QT-06 | Rich R data-frame tables; inline `` `{python} expr` `` and `` `{r} expr` `` in document order; `output: asis` raw output through the sanitizer; separate message control. | Pinned Quarto 1.10.19/knitr/Jupyter reference documents for each control, plus sanitization, export, cancellation and skipped-cell fixtures. |
| 6 / NUM-2 + HUR-1 restore (M, sized by LEDGER-1) | P1 | NUM-02, NUM-04, HUR-01, HUR-03 | Output paths the adapters drop, found by auditing the pinned browser APIs, ASTs and upstream examples. | Parity fixtures against the pinned interpreters. Worker, sanitizer and cancellation boundaries stay unchanged. Terminal/REPL and a plot viewer remain RUN-1/UI-1. |
| 7 / QT-1B (M) | P1 | QT-01 | Cross-reference targets other than figures (tables, equations, sections); subfigures; grouped and prefix-suppressed references; callout titles, collapse and appearance. | Pinned Quarto reference outputs with precise diagnostic locations. Supported documents keep their current flat figure numbering. |
| 8 / FORMAT-1 (M) | P1 | AM-01, GFM-03, CF-01 | Temml's missing arrow for `>->>`/`twoheadrightarrowtail` (16 corpus cases) and other audited notation gaps, fixed by a pinned Temml upgrade or a focused macro. Measure GFM math coverage against a recorded TeX command list. Expand CalcFile only against a named newer upstream commit. | Differential fixtures, vendor rebuild records and licences. Old profiles stay reproducible. |
| 9 / BEAN-2B (M slices) | P2 | BEAN-03, BEAN-02, BEAN-09, BEAN-06 | Price-date selection and an explicitly requested valuation report; inference for several missing amounts where the pinned native accepts it; combined costs, merge markers and lot interpolation; additional rounding options. | bean-check/bean-query fixtures for accepted and rejected cases, missing prices and valuation dates. Native holdings stay distinct from valued reports, and decimal bounds are kept. |
| 10 / ORG-1D (M slices) | P2 | ORG-02 | Target ranges; relative targets in Emacs order; A1 remote notation; dynamic remote indirection; bounded iteration with convergence/cycle diagnostics; global format parameters; Unicode display width. | One Emacs fixture set per item, keeping convergence, precision and width distinct. Cross-file references wait for FILE-1. |
| 11 / CALCA-3B (M–L slices) | P2 | CALCA-02 | Symbolic answers, linear systems, unit-aware equations and function inversion, each as a separately bounded family. | Requires CALCA-3A. Each family needs reference cases for underdetermined, conflicting and no-solution inputs. Do not advertise a universal solver. |
| 12 / FILE-1 → OFFLINE-1 → RUN-1 → UI-1 → OJS-1 (L, separate designs) | P2/P3 | BEAN-01 (includes), ORG-02 (cross-file), SHARED-02/03, QT-04/05/08, NUM-02, QT-07, HUR-01, ORG-04, QT-03 (OJS) | FILE-1 goes first because it unblocks three formats. OFFLINE-1 removes the most common network requirement. RUN-1 and UI-1 follow. OJS-1 goes last because it has the largest sandbox surface. | First publish measured feasibility and data/permission contracts with backward-compatible sharing (Phase 15). Then implement one bounded feature at a time. |
| 13 / NATIVE-1 (L, decision first) | P3 | ORG-01 (Lisp), BEAN-01 (plugins), QT-01 (full Pandoc), QT-03 (Julia), QT-04/05 (native packages) | Behavior that requires desktop upstream tools. | Phase 16's installation, platform, licence and trust decision comes before any implementation. An unbuilt companion is not a fix. |

The 12 retained entries are not elimination targets. They are GFM-02/04/05/06,
AM-04/05, NUM-03/05, HUR-02, TEXT-01/02 and CF-05. Keep them explained.
Bounded, explicit alternatives are mapped as follows: optional sessions for
NUM-03/HUR-02 (RUN-1), newer ECB base pairs for CF-05 (FORMAT-1), and task
toggles for GFM-04 (UI-1). Their defaults stay unchanged.

Exit criteria for this refresh: after orders 1–2, the ledger has zero `audit`
entries and zero known open P0 wrong-result defects, except CALCA-03/04 while
they await external verification. Every release reports resolved, retained,
open and audit counts next to this queue's position.

### Release checklist

For every release: update the atomic ledger and matching guide/comparison,
include editor-loaded examples, run the applicable independent reference,
all required checks and browser projects, push on main, and verify the exact
public commit. Split any compound disclosure a release touches; LEDGER-1 splits
the rest ahead of capability work.
Retain safety/reproducibility policies and the purposes of Markdown, AsciiMath
and Plain text. Native-only capabilities stay open until an approved architecture
actually provides them; writing a plan or adding a link does not resolve a gap.

## Phase 11 — P0: establish a complete compatibility backlog (M)

1. Give every limitation an ID, format, upstream version/reference, smallest
   reproducer, expected behavior, current behavior, priority, dependencies, and
   disposition. Split compound disclosures into independently closable items.
2. Audit upstream examples as well as the present inventory. In particular, check
   Calca's named/multiline definitions, argument binding, indexing/ranges, local
   definitions, locale handling, and symbolic behavior. The current list is not an
   exhaustive specification of the original applications.
3. Pin the compatibility targets. Keep the existing GFM corpus, CalcFile draft,
   and Numbat/Hurmet revisions initially. Use the pinned Beancount/bean-query and
   Emacs reference tools for new fixtures. For Calca, use public reference examples
   and clearly identify cases that still require verification in a licensed app.
4. Make one structured limitation ledger drive the central page and guide
   disclosures, with links to fixtures and status. Keep prose explanations in the
   guides, but check them against the ledger so resolved gaps cannot remain stale.
5. Define behavior versioning before changing established semantics. Old source
   links and version-1 HashBin documents must retain their documented behavior;
   record a compatibility profile in new links/envelopes when behavior changes,
   with explicit migration rather than silent reinterpretation.
   Profiles preserve intentional language semantics, not known incorrect
   arithmetic. Numeric correctness fixes apply to supported documents with
   reference-backed result comparisons and release notes; original source remains
   intact.

Done when: every existing disclosure has a disposition and work item; newly found
gaps are recorded; the reference baseline is reproducible; and the profile/migration
design has fixtures for old URLs and saved documents. This is an enabling milestone,
not permission to postpone known correctness fixes indefinitely.

Status: items 3–5 are complete (pinned targets, generated ledger, and profile
design with migration fixtures). Items 1–2 remain open until the 31 compound
`audit` entries are split; that is queue order 2 (LEDGER-1).

## Phase 12 — P0: eliminate result-changing correctness gaps

| Order / ID | Work | Effort | Completion check |
| --- | --- | --- | --- |
| 1 / BEAN-1 | Preserve numeric source lexemes as exact decimal values throughout parsing, posting weights, inventories, pads, assertions, and reports. Implement the pinned upstream tolerance inference and supported precision options. | L | Decimal quantities and accepted/rejected transactions match the reference on rounding boundaries, prices/costs, mixed precision, large amounts, and very small quantities. |
| 2 / CALCA-1 | Replace line/fence guessing with a parsed document model that distinguishes calculation blocks from literal code, TeX, and Mermaid. Keep the legacy profile for existing documents. | M | Literal fences produce no calculation diagnostics; calculation blocks and arrow lines still run with accurate source locations; old links retain old behavior. |
| 3 / CALCA-2 | Define and implement reference-backed definition availability, reassignment/equation distinctions, dependency resolution, and heading scopes in the new profile. Report conflicting or unsupported relations explicitly. | L | Reference cases for parent/child/sibling headings, reassignment, reverse definitions, and contradictory relations have deliberate, tested results. |

Do not broaden solver behavior while its definition/scoping rules are unsettled.
Security and cancellation regressions block this milestone even if numeric output
improves.

Status: the first slices of all three items are delivered (BEAN-04, CALCA-06,
CALCA-08 resolved). CALCA-03/04 remain unverified pending licensed-app comparison
(queue order 3), and newly found wrong results such as ORG-09 join this phase.

## Phase 13 — P1: close high-value adapter gaps

Implement in this order after the relevant Phase 11 contracts are recorded;
CF-1 can ship while the larger correctness work proceeds.

| Order / ID | Work | Effort | Completion check |
| --- | --- | --- | --- |
| 1 / CF-1 | Connect CalcFile to `src/exchange-rates.js`, converting the cached ECB data to the reference engine's rate environment. Preserve decimal rate text and show rate date/stale/unavailable notices. Fetch only when needed; propagate cancellation. | S | Real UI conversions work with supplied rates; offline cached, missing, malformed, and aborted requests behave deliberately; all 37 draft cases still pass. |
| 2 / GFM-1 | Classify all 90 failures as semantic parsing, extension/serialization, or intentional post-parse sanitization differences. Fix semantic failures first across the shared Markdown pipeline. | M–L | No unexplained failures; original corpus and all existing math, diagrams, task lists, and export examples remain covered. |
| 3 / NUM-1 | Improve Numbat statement boundaries using upstream parser/source information where available, with a tested tokenizer fallback. Map engine diagnostics to actual source spans. | M | Multiline strings, escaped quotes, comments, nesting, continuations, and later-statement recovery match the pinned interpreter. |
| 4 / AM-1 | Add an explicit, shareable formula-list/mixed-prose mode and useful source-line diagnostics for demonstrably malformed formulas. Preserve Auto and permissive upstream parsing where appropriate. | M | Adding prose no longer unexpectedly changes an explicitly selected mode; malformed-input warnings do not reject valid upstream notation. |
| 5 / QT-1 | Replace regex-only nested-div and cross-reference handling with a structured document pass. Validate supported metadata/cell options and report unsupported settings instead of silently implying they work. | M | Nested callouts, duplicate/missing figure labels, references, and option precedence have fixtures with precise line locations. |

For GFM-1, maintain separate raw-parser and final-render metrics. Canonical GFM
compatibility should target all 672 pinned examples before presentation extensions
and sanitization; extension markup and intentional filtering need their own
expectations. Do not normalize away semantic errors or weaken the sanitizer to
increase a percentage. If adapter fixes require recreating the grammar, evaluate
a pinned upstream parser build instead, retaining the buildless deployment model.

Status: delivered. CF-1, GFM-1, NUM-1, AM-1 and QT-1 shipped their bounded
slices; remaining gaps were moved to FORMAT-1, QT-1B and NUM-2.

## Phase 14 — P2: expand language compatibility

| ID | Ordered implementation slices | Dependencies / completion check |
| --- | --- | --- |
| ORG-1 | Delivered: named fields/columns and constants (ORG-1A); named tables and same-document remote references (ORG-1B). Remaining: Calc default/explicit modes as a P0 correctness fix (ORG-1C); remaining numeric Calc functions; bounded iteration with convergence/cycle diagnostics; Unicode display-width alignment; broader Org prose. | Compare each slice with Emacs fixtures. Cross-file references wait for FILE-1. Arbitrary Emacs Lisp belongs to NATIVE-1, not a JavaScript imitation. |
| BEAN-2 | Delivered in BEAN-2A: total-cost lots, explicit lot selection, and STRICT/STRICT_WITH_SIZE/FIFO/LIFO/HIFO/NONE booking. Remaining (BEAN-2B): supported option semantics; multi-commodity missing-amount inference; price-date selection and explicitly requested valuation reports; richer query/report views. | Requires BEAN-1. Match `bean-check`/`bean-query` including rejected ambiguous bookings, missing prices, and valuation dates. Keep native holdings distinct from valued reports. |
| CALCA-3 | Complete reference-backed lexical/core-language behavior first: multiline and named definitions/arguments, local bindings, safe matrix indexing/ranges, locale input, and supported standard functions. Then add symbolic simplification/solutions, linear systems, unit-aware equations, and function inversion in separately bounded slices. | Requires CALCA-1/2 and profile migration. Each advertised family must match its reference cases, including underdetermined, conflicting, and no-solution cases. Add higher-order/transcendental methods only where a verified target justifies them; do not advertise a universal solver. |
| NUM-2 | Audit remaining pinned interpreter functionality and expose useful structured output/plots supported by its actual browser API. Improve result navigation rather than adding a second language implementation. | API feasibility check first. Test parity with the pinned interpreter and keep source/result and worker boundaries intact. |
| HUR-1 | Audit the pinned Hurmet AST/render path for dropped spreadsheet/drawing output. Restore supported output before adding editing tools. | Compare representative upstream documents; preserve scoped styles, sanitization, diagnostics, and cancellation. |
| FORMAT-1 | Add missing math/notation support through pinned translator/Temml upgrades or focused fixes, and expand CalcFile only against a named newer reference target. | Differential fixtures and license/vendor rebuild records. Keep old profiles reproducible; a newer library version alone does not establish compatibility. |

Every slice updates a guide, the central ledger, feature comparison, runnable docs
examples, and relevant gallery fixtures in the same change. Do not combine an
entire format rewrite and an unrelated runtime expansion in one release.

## Phase 15 — P2/P3: remove browser-shell and execution restrictions

1. **QT-2 — notebook outputs and controls (M):** figure dimensions/alt text and
   warning/error/include controls are delivered (QT-2A). QT-2B adds supported
   raw-output modes with sanitization, rich R data-frame tables, and inline
   language expressions in document order.
   Keep execution defaults, skipped cells, and error continuation explicit. Compare
   supported cases against pinned Quarto/knitr/Jupyter reference outputs; full knitr
   rendering is a separate native-runtime target.
2. **FILE-1 — project inputs (L, first increment delivered):** introduce an explicit manifest of user-selected
   files for Beancount includes, cross-file Org tables, and notebook data. Resolve
   only supplied files, detect cycles, and bound aggregate size/depth. Version the
   bundle/share representation while preserving single-document links and existing
   CID precedence. Evaluate explicitly supplied HashBin CID inputs and the separate
   raw-URL loading proposal from the field report, including fetch bounds and
   snapshot semantics. Never infer access to arbitrary local files from an include.
   FILE-1A delivers versioned, verified CID numeric imports for Org; see
   `design/project-inputs.md`. It does not deliver a general file manifest,
   general multi-format dependency bundle or arbitrary raw-URL loader. FILE-1B now
   supplies portable snapshots for the supported Org numeric inputs.

3. **OFFLINE-1 — optional scientific runtimes (L):** investigate self-hosting pinned,
   verified Python/R runtime assets and an explicit package set in a separate
   opt-in download. Measure transfer size, startup, storage, and memory first.
   Test fresh offline execution, interrupted installs, eviction, updates, and
   removal in all browsers. Arbitrary external packages/data remain network inputs.
4. **RUN-1 — explicit run/session controls (L):** keep fresh-per-render execution as
   the default. Evaluate manual Run/Run all and optional per-document live sessions
   for long computations. Isolate documents, show stale output, and verify cancel,
   restart, and full replay. Any Python/R exchange must use explicit typed data and
   defined ordering; shared implicit variable state is not assumed to be an upstream
   compatibility requirement.
5. **OJS-1 — reactive cells and widgets (L):** time-box an upstream-compatible
   Observable runtime experiment with isolated execution and a bounded output
   protocol. Use a separate sandbox for interactive content; never grant widgets
   access to editor storage or insert unsanitized HTML into the editor document.
   Prove cleanup, network behavior, and replay before enabling the feature.
6. **UI-1 — source-backed editing tools (L):** evaluate task toggles, Org recalculation
   application, Hurmet table/drawing controls, and a dedicated REPL as separate
   opt-in tools. Changes must round-trip through source, undo, URL/HashBin, and
   reload. They do not replace the reproducible source editor or turn Plain text
   into a markup/calculation format.

Browser package, memory, and storage limits cannot be made unbounded. Publish a
measured support matrix and a usable alternative for unsupported cases rather
than simply increasing global timeouts or hiding failed imports.

## Phase 16 — P3: a route to full native upstream behavior (L)

Some remaining gaps require applications or runtimes absent from this browser
build: full Quarto/Pandoc and native packages, Julia kernels, arbitrary Emacs Lisp,
Beancount plugins, desktop filesystem operations, or complete TeX document rendering.

Design an optional **local companion execution service** first. It would run pinned
upstream tools against an explicitly supplied project, return diagnostics and
artifacts through the existing document interface, and support cancellation and
resource limits. The static GitHub Pages editor remains independently usable.
Authenticated origin-bound communication and isolated job directories are part of
the design, not an assumption that a web document may execute desktop commands.

This milestone requires a separate decision on installation, supported platforms,
distribution/licenses, and execution trust before implementation. A hosted service
is a further hosting, cost, and data-handling decision, not an implicit dependency.
Closed Calca functionality still needs independently verified compatible behavior;
a generic native backend does not provide access to Calca's proprietary engine.

Done when: each native-only target either works against its pinned upstream tool
with reference fixtures and an end-to-end project round-trip, or remains explicitly
open with its required architecture decision. An unbuilt companion is not a fix.

## Coverage and completion rules

| Inventory area | Resolution path |
| --- | --- |
| GFM parser/serialization and math coverage | GFM-1 and FORMAT-1; intentional sanitization remains documented. |
| AsciiMath ambiguity/incomplete-input feedback | AM-1 and FORMAT-1; notation-only evaluation semantics remain. |
| Numbat grouping, diagnostics, output and REPL | NUM-1/2 and UI-1; reserved units and dimensional checks remain. |
| CalcFile currency feed and draft coverage | CF-1 and FORMAT-1; ambiguous Auto detection stays conservative. |
| Org formulas, references, iteration, layout and editing | ORG-1, FILE-1, UI-1; full Lisp uses Phase 16. |
| Calca block parsing, scopes, language and solvers | CALCA-1/2/3; retain bounded evaluation and explicit profiles. |
| Hurmet output, drawing/table editing and session limits | HUR-1, UI-1, RUN-1; browser network rules still apply. |
| Beancount numeric correctness, inventories, valuation, includes/plugins | BEAN-1/2, FILE-1, Phase 16. |
| Quarto syntax, options, rich output, runtime/packages and languages | QT-1/2, OFFLINE-1, RUN-1, OJS-1, Phase 16. |
| Plain text behavior, Auto choice and raw-payload detection | Preserve intentional literal mode; explicit stored format/profile continues to override Auto. |
| Shared bounds, offline services, exports and external resources | FILE-1, OFFLINE-1, RUN-1 and Phase 16 where applicable; retain safe defaults and disclose unavoidable resource/network limits. |

A work item closes only after an independent reference or clearly specified
behavioral test passes, old links and exports still work, and the docs and runnable
examples agree with the shipped feature. Cancellation, stale-render protection,
sanitization, offline lifecycle, and all three browser projects are release gates
when affected. Keep conformance changes explicit; never merely rewrite expected
results to match a new implementation.

Report separate counts for fixed defects, added upstream capabilities, retained
intentional behavior, and unresolved environment/native-runtime requirements.
The target is zero unclassified limitations and zero known result-changing defects
within an advertised profile, not a misleading claim that every original desktop
feature runs in every browser.

## Reference starting points

- [Current limitation disclosures](../docs/limitations.md) and format-specific guides.
- [Calca reference](https://calca.io/reference), especially definition availability
  and its broader language examples; verify behavior rather than assuming mathjs parity.
- [Org spreadsheet manual](https://orgmode.org/manual/The-Spreadsheet.html) and the
  existing `scripts/org-expected.sh` reference runner.
- [Quarto execution options](https://quarto.org/docs/computations/execution-options.html),
  used to define explicit option/output compatibility cases.
- The pinned Beancount/bean-query tools and `scripts/beancount-expected.py`;
  `tests/fixtures/gfm-conformance.json`; the committed CalcFile corpus; and actual
  vendored Numbat/Hurmet engines. These are starting oracles, not substitutes for
  adding cases for newly supported behavior.
