# Optional Calc precedence hints (ORG-HINT-1)

Field-report item 5 requests help with Calc's multiplication-before-division
rule. `#+SHEETS_HINTS: precedence` enables an informational source-line advisory;
omitted options and `none` retain existing output. ORG-09 remains resolved: the
arithmetic already matches Emacs and this extension does not change it.

## Syntax contract

The existing Calc parser records explicit parenthesis groups and ungrouped
products containing an explicit multiplication operator in private WeakSets.
When a division's right operand is such a product, it records a possible hint.
The callback runs only after the complete expression parses successfully. The
arithmetic tree, evaluation order and return value remain unchanged.

`a/b*c` and `a/b^2*c` receive hints. `(a/b)*c` and `a/(b*c)` do not. Grouping just
one factor (`a/(b)*c`) or the whole ambiguous expression (`(a/b*c)`) does not
specify which division grouping the author intended and still receives a hint.
Powers (`a/b**c`) are not multiplication. Products using only implicit
multiplication are outside this advisory; an ungrouped product containing an
explicit `*`, even alongside implicit factors, can be flagged.

The advisory masks named/cell/range/remote references as atomic parser
placeholders without resolving or evaluating them. It never inspects substituted
field expressions or printf/mode strings. This is syntax guidance, so a formula
in an unselected `if` branch can still receive a hint. Parser failures, the shared
4,000-character limit, and the existing node/depth bounds stop analysis without
adding a hint. They do not suppress normal calculation errors.

## Source and scheduling contract

The existing Org AST traversal reads the last real SHEETS_HINTS keyword.
Names/values are case-insensitive. Literal SRC, EXAMPLE, EXPORT and COMMENT
blocks cannot enable hints or contribute active formula lines. An invalid final
option gives a warning at that line and disables the advisory.

Only formula lines selected by the current mode are checked: Legacy can use
consecutive stored formulas; Emacs order uses its first stored formula and
existing blank-line rules. Each active formula line is inspected once after its
normal recalculation, yielding at most one informational hint regardless of
assignment or target-row count. Advisories are collected separately from the
arithmetic diagnostics and appended afterward. They cannot trigger Emacs order's
error gate or suppress writes, duplicate checks, or existing cell-retaining errors.

The source keyword travels through existing URL sharing, HashBin versions,
downloads, CLI snapshots and offline files without a new profile or envelope.
ACE receives an `info` annotation at the original formula line. The preview shows
the fixed explanation and line number in a sanitized Formula hints aside;
standalone HTML and printing include it. The source is never rewritten.

## Evidence

Independent Emacs recalculation of `calc-precedence-hints.org` confirms explicit
grouping, powers, implicit products, condition branches, named inputs and remote
references. The reference change adds only this document, keeping all 25 earlier
numeric documents, four rejection documents and five HTML documents unchanged.
This oracle verifies arithmetic; the hint is explicitly a Sheets advisory.

Unit tests cover parser/tree stability, reference masking, ambiguous and grouped
forms, malformed/bounded input, both scheduling modes, literal ownership,
last-directive behavior, exact source and BOM/CRLF lines, saved versions and
coexisting calculation/duplicate errors. Browser tests verify annotation severity,
preview explanations, source edits, shares/reloads, mocked saved-document loading,
source/HTML exports, mobile, print, and guide examples. The staged offline test
loads and reloads a hinted remote-reference formula with no connection.
