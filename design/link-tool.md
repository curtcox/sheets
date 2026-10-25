# File-to-link command (LINK-1)

`node scripts/link.mjs <file>` addresses field-report item 9 and resolves
SHARED-06. It runs from a checkout on Node 22 or newer and emits a source snapshot
for the Pages editor, or a compatible editor supplied through `--base`.

## Contract

- Infer format from the dependency-free registry's extension metadata; unknown
  extensions use Auto. Explicit format, view and compatibility profile options
  validate against app metadata. Split and omitted profiles retain existing
  behavior. Both `--option=value` and `--option value` are supported.
- Read a UTF-8 regular file without executing source or changing it. Preserve
  BOM, line endings, whitespace and Unicode. Reject malformed UTF-8. Bound the
  initial file size and actual read to the shared 5 MiB limit, including a file
  that grows during the read.
- Call the app's `writeURL`, then `readURL` before emitting anything. This checks
  canonical compression, decoded size, the 1,000,000-character encoded limit and
  exact source round-trip. Clear stale source/example/CID/OAuth state using the
  same serializer as browser sharing; preserve unrelated base parameters.
- Accept only absolute HTTP(S) editor addresses without credentials. A custom
  address must host a compatible app; the command does not fetch or verify it.
- Print exactly one URL and newline to stdout. Put long-link warnings on stderr;
  errors exit 1 with no URL. Help prints usage to stdout. No upload, network call,
  browser session or HashBin authorization is required.
- Use source fragments above the shared 7,000-character threshold. Warn that
  complete URLs can still be truncated by browsers or messaging apps; separately
  warn if non-source base parameters alone remain too long for a server request.

## Boundaries

The CLI embeds a snapshot and supplies no storage. Regenerate links after file
edits; keep source files or save through the app's HashBin workflow for a separate
copy. The script and its Node imports stay outside the Pages deployment allowlist.
The command introduces no new browser execution path.

The end-to-end test exposed an existing Org parser failure on CRLF files, including
missing tables without diagnostics when a BOM was present. The Org adapter now
strips an initial BOM and normalizes CRLF for parsing/calculation only. Shared
source and editor text stay exact; recalculated source is normalized to LF.
Regression tests compare LF/BOM/CRLF HTML, values, literal-block ownership and
diagnostic line numbers in both modes, alongside the native Org reference checks.

The original compound SHARED-06 record also mentioned a `?url=` loader. That
unimplemented feature is now SHARED-07 under FILE-1. It needs its own contract for
CORS, fetch failure, bounds, mutable URLs and source snapshots before implementation.

## Verification

`tests/unit/link-cli.test.js` covers every registered format, explicit profiles,
Auto, invalid/duplicate/missing options, custom bases and stale parameters,
literal filenames, UTF-8 fidelity, unchanged files, unreadable paths, non-files,
both size bounds and fragment warnings. Browser tests generate short and long
profiled Org links, change the original file, open the snapshots, calculate and
reload with exact source/settings. Existing deployment tests verify that staged
assets exclude scripts and tests.
