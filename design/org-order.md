# Org scheduling and same-document references (ORG-1B)

The compatibility target is the supported numeric subset of Emacs Org's global
single-pass recalculation. The native oracle uses the installed Org implementation,
not JavaScript-produced expected values. Local review used Emacs 31.1 / Org 9.8.7;
CI independently runs its installed Org 9.6.15. Original successful reference
values remain unchanged. The expanded oracle checks 20 successful documents and
four documents that must raise native user-error before table writes. Error
wording is not compared across versions; the rejection class and retained rows are.

## Scheduling and migration

Legacy's documented source-order behavior is preserved for omitted profiles and
version-1 HashBin documents. The explicit org-emacs-v1 profile selects Emacs order.
The selector, Auto detection, URL/HashBin envelope validation, sharing, view changes,
OAuth restoration, source export and installed offline behavior use the existing
profile contract. Source files alone do not contain the profile.

Emacs order sorts stored targets lexically (not numerically), applies column
formulas within each row, then applies sorted field formulas. Field targets are
protected from column writes. Named field reads retain their pre-pass snapshots.
Duplicate targets are preflighted before writes, including aliases of a named
field and boundary/numeric column collisions. Only the first TBLFM line after a
table is active; preceding blank lines are allowed. Legacy retains its original
adjacent-multiple-line execution. Supported targets are single absolute numeric
columns/boundaries or absolute/named fields; target ranges and relative targets
are explicitly rejected in the new mode. This is not full native target syntax.

## Same-document reads

Active NAME/TBLNAME keywords select the first following real table before the
next heading. Table names match case-insensitively, first occurrence wins;
aliases in descriptors remain case-sensitive. Bare names contain letters,
digits, underscores, dots or hyphens, starting with a letter/digit/underscore.
Numeric remote cells/ranges support absolute RC addresses, boundaries, hlines,
column aliases and scalar named fields. Remote names and descriptors resolve
against the target table, before local reference substitution.

All tables are parsed before the pass. Reads observe current table state without
recursively evaluating the referenced table. Earlier tables expose updated values,
later tables original values, self references partial state. Cycles and chains are
bounded by this single pass, rather than recursively traversed or solved. Every
render starts from the editor source with fresh state. Range endpoints are checked
before traversal and ranges are capped at 100,000 cells.

AST ownership excludes literal blocks from naming/data; contiguous row runs split
orga's merged blank-separated tables. The native oracle independently extracts
tables through org-element, stepping past affiliated NAME/CAPTION keywords to the
actual first table line. Explicit JSON vectors prevent array/alist ambiguity.

## Evidence and remaining scope

order-columns/fields/active.org cover scheduling and active formula selection;
remote-basic/order/names/duplicates/cycle.org cover scalar/range reads, updated
aliases/fields, duplicate names, forward links and cycles. rejected/*.org covers
duplicate columns/cells, boundaries and named/numeric aliases. The existing 12
reference documents remain checked. Unit/browser coverage adds literal name
ownership, original source-line diagnostics, failed reads retaining cells,
mode migration and transport/export/offline contracts.

Unlike native Calc error markers, Sheets retains a cell after a failed remote
calculation and reports a diagnostic. Canonical target collisions are rejected
rather than providing obscure spellings that write the same cell. Target ranges,
full Calc/vector/string modes, iteration, dynamic remote names, A1 descriptors,
property/external bindings, cross-file/ID lookup and exact native layout remain
open. This profile is a bounded scheduling contract, not the full Emacs application.

Primary local reference: org-table.el's org-table-get-stored-formulas,
org-table-recalculate, org-table-recalculate-buffer-tables and
org-table-get-remote-range. The public [spreadsheet manual](https://orgmode.org/manual/The-Spreadsheet.html)
describes the broader target; implementation details above are also exercised
against the actual installed native functions.
