# Optional file constants summary (ORG-INPUT-1)

Field-report item 3 requested a readable assumptions table without manually
echoing every file constant through a formula. `#+SHEETS_CONSTANTS: table` enables
a read-only summary and resolves ORG-13. Omitting the keyword or selecting `none`
retains the original native-style keyword hiding in both calculation modes.

## Source and calculation contract

This is a Sheets presentation extension, not a compatibility profile. Storing the
choice in source makes shares, existing HashBin envelope versions, CLI links,
downloads and recalculated copies preserve it. No URL or envelope change is
needed. Source text and arithmetic remain unchanged by enabling the display.
Auto detection recognizes constants and display keywords, including assumptions
documents without calculation tables.

The existing Org AST traversal owns constants and the new keyword. Literal SRC,
EXAMPLE, EXPORT and COMMENT blocks cannot install either. Keywords and option
values are case-insensitive. The last real display directive wins; a final value
other than `table` or `none` gives a warning at its original line and hides the
summary. The display keyword applies to the whole document, including preceding
tables, like the existing file constants scope.

The same traversal records each effective constant's name, literal value,
defining line and validation status. Existing last-declaration precedence and
first-declaration order come from the file-binding map. Earlier declaration
errors remain diagnostics even if a later declaration supersedes them. No values
are evaluated a second time or converted through JavaScript numbers for display.
Unsupported numeric bindings remain visible with an Unsupported label; malformed
declaration tokens remain diagnostics and create no binding or summary row.

The summary explicitly describes file-level values: table parameters and named
fields still take precedence in their own tables. It does not imply that every
formula reads the displayed value. No new editing, input styling, notes or goal
seek behavior is introduced; these remain UI-1 work.

## Presentation

Render one File constants table after opening prose and before the first
calculation table. Without calculation tables, render after the prose. Columns
show Name, Value and Defined on; row headers identify constants and numeric
values align right. An enabled document with no named constants gets a clear
empty message. The normal accessible horizontal-scroll region, print overflow
and standalone export styles apply. All names and values are escaped, and the
app and HTML exporter still apply the shared sanitizer.

The guide has a runnable example and the Org edge gallery example opts in.
Existing documents without this keyword retain identical preview HTML.

## Evidence

The new `constants-display.org` fixture was recalculated by independent Emacs:
the table-local rate produces 27.00 while the file rate produces 15.00, using
the last duplicate constant. The literal source block supplies no bindings.
The reference JSON adds only this fixture; all 24 earlier numeric documents,
four rejection documents and five HTML documents remain unchanged. Native Org
does not render the new summary; its numeric results are the calculation oracle,
while the summary is explicitly a Sheets extension.

Unit checks cover metadata, both modes, unchanged default HTML, duplicate and
literal ownership, original diagnostic lines, invalid options/values, escaping,
exact numeric spelling, empty documents, BOM/CRLF and both saved envelope versions.
Browser checks cover source edits, exact shared source and reloads, mocked saved
document loading, source and HTML downloads, recalculated copy, sanitization,
mobile and print. The existing staged offline test now opens this option and
reloads it without a connection. The Org edge cover is regenerated and reviewed.
