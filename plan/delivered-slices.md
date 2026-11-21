# Delivered compatibility slices (historical record)

Part of the [Sheets development plan](../PLAN.md); see also the
[compatibility roadmap](compatibility-roadmap.md).

These records describe what each delivered slice shipped, in delivery order.
The [prioritized queue](compatibility-roadmap.md#prioritized-elimination-queue--refreshed-2026-10-19), not these notes, decides what to do next.

First increment: `docs/compatibility.json` imports the existing disclosures with
stable IDs, priorities, classifications, audit status, and evidence fields.
`scripts/compatibility-docs.mjs` generates the central page and guide status tables;
unit tests reject drift. Compound entries without atomic reproducers remain
explicitly marked for detailed audit, so Phase 11 is not complete.
`design/compatibility-profiles.md` records the migration contract without changing
URL or HashBin behavior. The Beancount oracle now preserves decimal strings, with
22 independent fixtures covering supported arithmetic/tolerance behavior, including
large/tiny amounts, costs/prices, inference, assertions, padding, and lots. BEAN-1's
first slice implements decimal arithmetic, supported tolerance options, and exact
report text. Other booking/rounding options and wider audits remain open.

Second increment: CALCA-1 introduces a parsed Markdown document model and the
explicit `calca-blocks-v1` profile. Structured blocks isolate literal fences,
inline code/math, TeX, Mermaid, headings, links, and HTML from calculation input;
supported Calca fences, indented blocks, and paragraph arrow expressions retain
source locations and document order, including footnotes. Unprofiled URLs and
version-1 HashBin documents keep the original renderer. Profiles now round-trip
through URLs, version-2 envelopes, sharing, OAuth snapshots, view changes,
and offline reloads. Source downloads keep text alone and disclose the need to
select the profile when reusing it. The profile contract
has executable migration cases; the broader Phase 11 atomic audit remains open.
Third increment: CALCA-2 adds `calca-scopes-v1` (Scoped definitions) while keeping
Legacy and Structured blocks semantics unchanged. First visible definitions are
immutable, repeated definitions become constraints, and definitions/relations are
available within their heading and descendants. Deferred numeric dependencies and
function free variables use query-visible bindings. Candidate real scalar roots
are checked against connected relations; contradictions and unsupported systems
report diagnostics. Cycles, depth, statement count and evaluation work are bounded.
The published parent/child/sibling example has an attributed reference fixture;
child redefinition, deferred binding, conflict presentation and Setext support are
explicit project policies pending licensed-app comparison (CALCA-04). The gallery,
docs editor links, URL/HashBin envelopes, OAuth and offline tests cover the profile.
An indirect built-in function-value guard bypass is closed for all shared math
users. Calca still evaluates one line at a time; CALCA-3's input grammar, symbolic
answers, function inversion and general systems remain future work.

Fourth increment: CF-1 connects CalcFile's actual missing-external-data diagnostics
to the shared ECB service. The official data API supplies a CORS-readable decimal
CSV; a validated daily XML snapshot retains existing Numbat/cache interfaces and
excludes discontinued older series. Decimal rate lexemes and publication dates reach the
pinned engine unchanged, enabling EUR ↔ USD/GBP/JPY. Requests are skipped for
same-currency arithmetic/conversion, prose, comments and ordinary unit conversion.
The cache validates daily-feed structure, positive rates, dates and timestamps;
stale/offline fallback retains its original date and shows a notice. Cancellations
do not render or cache late responses. Source links and saved documents retain
source, not rate snapshots. The pinned engine's EUR-base pair and four-currency
boundaries remain disclosed under CF-05. The original 37 conformance cases remain
unchanged. Shared-consumer coverage also found and fixed Hurmet's numeric-rate
bridge: its rational parser now receives decimal strings instead of numbers.

The first BEAN-1 increment fixes the independent oracle:
`scripts/beancount-expected.py` now stores canonical decimal strings instead of
Python floats, so the test cannot hide a precision defect. Reports and serialized
fixture expectations preserve those strings; 22 reference fixtures cover the
supported arithmetic and tolerance rules, including half-even rounding ties.

GFM-1 first increment implemented: all original 90 failures are classified in
`tests/fixtures/gfm-audit.json`. The runner now preserves upstream extension flags
(including the two disabled task-list examples, which remain measured), separating
raw exact HTML (**662/672**) from production exact HTML (**593/672**) and the actual
sanitized browser DOM (**619/672**, with 32 policy-only differences). Browser DOM
serialization is a distinct metric, never a replacement for exact parser strings.

Shared renderer fixes preserve table alignment through the sanitizer and HTML
export, recognize common `www.` links through the existing bounded HTTP matcher,
escape GFM raw-text tags before browser parsing, and collapse redundant adjacent
strong delimiters while preserving Calca token maps. Existing math, Mermaid,
footnotes, alerts, tasks, exports and all shared consumers remain covered.

GFM-1 second increment implemented: the original semantic cases **625, 626, 630**
now pass for bounded GFM path endings and email-domain plus signs. Native
cmark-gfm 0.29.0.gfm.13 confirms 31 additional fixtures, including all URL schemes,
parentheses, entities, existing links, anchors and literal code. Empty-blockquote
serialization now matches, canonical tasks omit production CSS hooks, and the
corpus reader no longer invents newlines for empty outputs. Current metrics:
**672/672 raw**, **601/672 production HTML**, **627/672 final browser DOM** (32
policy-only differences). The corpus's two disabled task cases remain included
using their published expectations.

The expanded native audit also exposes **four additional host/email differences**
outside the corpus, recorded with native expected output in
`tests/fixtures/gfm-autolinks.json` and tracked by **GFM-06**. Two involve email recognition; two retain useful behavior where the pinned native version is
more restrictive (uppercase WWW and numeric email-domain endings). **GFM-05**
records the automatic candidate bound. Thus the original corpus gap GFM-01 is
resolved, while GFM-1 remains open for broader host/email recognition. Evaluate
native quirks against the published spec before changing those two policies.

`design/gfm-autolinks.md` records the evaluated pinned alternatives: the mdast
transform still misses entity-suffix case 626, and micromark's syntax extension
omits FTP case 628. Retain MarkdownIt's token/source-map contract for now; the
focused path adapter adds the host-underscore rule and delegates other host checks
to the existing library. A broader
host/email replacement requires fresh reference evidence and bounded complexity.
CI builds the checksum-pinned native oracle and rejects fixture drift.

GFM-1 third increment completes the audited parser/conformance work: domain
underscores in bare emails and valid prefixes before a plus sign now match native
cmark-gfm. A linear, DOM-free supplementary scanner and ordered merge preserve
existing URI/email normalization, Unicode hosts, code/link/HTML contexts and
source offsets. Long invalid runs have isolated-worker regression coverage;
new candidates are capped at 10,000 characters. Existing library matches retain
precedence. The reviewed corpus metrics stay **672/672 raw**, **601/672 production
HTML**, and **627/672 final DOM**.

The expanded native audit has **57 fixtures, 53 matches and four retained
policies**: uppercase WWW, numeric email-domain endings, Unicode email hosts with
IDNA normalization, and preserving raw HTML anchors instead of nesting email
links. Both previously open email-recognition gaps are fixed. GFM-06 now records
intentional differences, GFM-05 includes supplementary email bounds, and GFM-04's
display-only behavior is explicitly retained. Temml coverage expansion remains
FORMAT-1 (GFM-03); it is not a parser defect. **NUM-1** is completed below.

NUM-1 replaces the heuristic grouper with the pinned Numbat parser's own
consumption/recovery ranges. A reviewable source patch exposes those ranges and
structured diagnostic labels through the WASM bridge, preserving evaluation
semantics. The rebuilt artifact passes 25 whole-document output comparisons
captured from the original unmodified WASM. Tests cover multiline strings,
escaped quotes/backslashes, interpolation, comments, lists, functions, decorators,
`where`, semicolons, Unicode offsets, related earlier-input/module locations,
recovery, and context reset. Editor annotations use actual document lines and
columns rather than the first line of a statement.

The parser strategy supersedes a duplicate JavaScript tokenizer: if upstream
lexing fails, the tested fallback is one complete interpreter input, preserving
upstream rejection without guessing code inside an unterminated string. Parse,
type and runtime errors retain later-statement recovery when tokenization
succeeds. NUM-01 is resolved; NUM-05 records lexical-error behavior and the
engine report's row-local numbering separately from editor positions. Output,
plots, terminal/REPL and remaining units audit stay NUM-2/UI-1. **AM-1** is completed below.

AM-1 adds explicit Formula list and Mixed prose profiles to the existing
versioned URL/HashBin/OAuth contract. The mode picker follows the active format;
legacy AsciiMath documents keep Auto's heuristic. Gallery and documentation
examples pin their intended modes, and source downloads document the need to
reselect a mode. Source-aware warnings inspect the pinned translator's tree for
synthesized empty operands and unfinished text; actual translation/Temml errors
are exposed too. Warnings preserve permissive output and Show TeX.

Source maps follow Markdown tokens through paragraphs, inline math, lists,
quotes, tables (including escaped pipes/repeated cells), display math, fences,
Unicode, and footnotes. Formula-list lines retain original line numbers. The
436-case upstream audit preserves pinned translations and records six existing
reference discrepancies; the unsupported twoheadrightarrowtail command accounts
for 16 repeated typesetting failures. Standalone operators, mixed/one-sided
brackets, text and one-sided limit signs do not gain spurious warnings. AM-02/03
are resolved; AM-05 retains advisory validation, AM-04 inherits shared Markdown
policy, and the concrete notation gaps remain FORMAT-1 (AM-01). The next Phase 13
priority is **QT-1**.

**QT-1 implemented (2026-10-19).** One Markdown token stream now owns nested
callouts/divs, executable cells and figure references. Forward image/div/visible
cell-plot targets receive flat document-order numbering; duplicates, missing and
unavailable targets report original locations without creating duplicate IDs or
broken links. Code, escapes, links, math and raw HTML remain literal. YAML event
positions support typed metadata/cell validation for block/flow/quoted keys and
syntax errors; valid cell booleans override defaults while document disable gates
remain absolute. Tests cover nested cells, differing fences, container recovery,
precise diagnostics, exports/shares, real worker execution and runnable docs.
QT-09/10 resolve this structural subset; QT-01/02 explicitly retain the remaining
Quarto/Pandoc grammar, cross-reference and option gaps. Reference contracts and
reproducers are recorded in `design/quarto-structure.md`. This completes Phase 13;
the next ordered implementation slice is **ORG-1** in Phase 14.

**ORG-1A implemented (2026-10-19).** Nine new reference documents cover numeric
named columns/fields, parameters, file constants, precedence, duplicate names,
pre-pass field snapshots, named ranges, scientific numbers, marked rows across
hlines and literal input. The three existing numeric reference documents retain
their values. The native runner now extracts real Org tables through the Emacs
structure API, rather than counting table-shaped lines in source blocks. New
source-line diagnostics reject unsupported binding values without fallback.
Literal-block execution and quoted-reference substitution gaps are fixed;
ORG-05/06 are resolved, while ORG-02 now names the remaining work explicitly.
The updated guide, function/feature comparison and gallery all link runnable
examples. See `design/org-names.md`. Next: **ORG-1B**, starting with native
column/field priority, duplicate targets and same-document remote references.

**ORG-1B implemented (2026-10-19).** An explicit `org-emacs-v1` profile
preserves the old source-order contract while adding native lexical target order,
row-major column execution, field protection and duplicate-target rejection.
The first stored formula line is active in this mode, including after blank
lines. Same-document remote scalar/range references work in both modes, reading
the current document-order pass state without recursive dependency evaluation.
First-match duplicate table names, remote column aliases/field names, forward
references and cycles have independent native fixtures. AST-owned table discovery
now separates blank-separated tables. The Emacs oracle checks 20 successful
documents and four native rejection documents; its extraction handles affiliated
NAME/CAPTION keywords. Original reference values and Legacy links are retained.
ORG-07/08 are resolved; ORG-02 lists remaining target syntax, remote indirection/
file inputs, iteration, numeric modes and layout gaps. Runnable guide examples,
mode migration, sharing/saved envelopes, offline reloads and gallery cover the
new mode. See `design/org-order.md`. Next: **QT-2A**, starting with native
notebook-control reference fixtures; broader Org work stays open.

**QT-2A implemented (2026-10-19).** Typed include/warning/error controls now
reach both execution backends. Hidden setup preserves state; warning filtering
follows Python stderr and R condition channels. Explicit error:false stops later
cells in the affected session before they execute, while existing omitted-error
continuation and independent language sessions remain explicit browser policies.
Document figure sizes configure Python defaults/R devices; R supports per-cell
sizes, Python diagnoses them, and safe alt text survives SVG/PNG sanitization and
exports. Existing size defaults remain unchanged when options are omitted.
Seven native reference documents cover control/default/override and halt behavior
against Quarto 1.10.19, pinned Jupyter dependencies and knitr 1.45; CI runs the
independent reference script. QT-11/12 resolve this bounded slice; QT-02 retains
wider metadata/output modes, native error/default architecture and exact device
rendering gaps. Runnable docs and the R gallery cover the controls. See
`design/quarto-controls.md`. Next: **BEAN-2A**, beginning with native total-cost
and booking/lot fixtures; rich notebook output/inline expressions follow later.

**BEAN-2A implemented (2026-10-19).** Per-unit/total costs and explicit
commodity/date/label selectors now feed exact decimal lot booking. STRICT is the
native default, with file-wide/per-account overrides for STRICT_WITH_SIZE,
FIFO/LIFO/HIFO and NONE. Ambiguous, unmatched and insufficient reductions reject
their weight-commodity group without committing lot reservations; supported short
covers and merged positions retain exact quantities. The independent oracle now
checks remaining cost positions as well as validity/balances. Original 22 numeric
fixture results remain unchanged. Runnable docs, migration guidance and the
gallery disclose the former implicit FIFO/total-cost errors. BEAN-07/08 resolve
this bounded slice; BEAN-09 retains combined costs, lot interpolation, broader
commodity inference and mixed-inventory audit. See `design/beancount-booking.md`.
Next: **CALCA-3A**, beginning with reference-backed definition/binding grammar;
Beancount valuation and query expansion follow numeric correctness separately.

**ORG-1C implemented (2026-10-19).** Org formulas now use a DOM-free Emacs Calc
subset (`src/formats/org/calc.js`) in both calculation modes. It follows Calc's
precedence (`*` binds tighter than `/`), exact integers, decimal floats rounded to
the internal precision, the native-double path for transcendental functions with
Calc's own argument reduction, `math-format-number` display, and Org's mode
parser. Supported letters are p/n/f/s/e/D/R/F/E/N/L, plus one printf conversion
applied to the displayed value and the table `%` parameter. Field text is read as
Calc input with Org's empty/E/N reference rules. Symbolic, complex, unit, date,
string and duration results are diagnosed and keep the cell. Two new Emacs
reference documents (`calc-modes.org`, `calc-arithmetic.org`) are checked in both
modes. All 20 earlier reference documents keep their values, and gallery examples
are unchanged. One docs example now uses `;N`, as Emacs requires for text cells.
Tests that encoded mathjs behavior were changed only to Emacs-verified results:
`5.` for a float sum, exact `1e309`/`1e-400` constants, and diagnostics for quoted
Calc strings. During development, a differential harness of 484 hand-written and
1,200 generated formulas found no numeric mismatch for any formula Sheets
evaluates. ORG-09 is resolved; ORG-02/03 are narrowed. See `design/org-calc.md`.
Next: **LEDGER-1**.

## Original implementation batch (historical)

1. Create the atomic ledger and profile design (Phase 11).
2. Change the Beancount reference oracle to decimal strings and add precision/
   tolerance boundary fixtures, then implement BEAN-1.
3. Implement CALCA-1 with legacy-link coverage.
4. Ship CF-1 as the first bounded missing-capability fix.
5. Classify all GFM failures and take the first verified semantic fixes.
