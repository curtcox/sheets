# Portable Org snapshots (FILE-1B)

Download → Portable project produces a `.sheets.json` file containing the exact
Org source, calculation profile, view and verified CID input bytes. Download →
Open project snapshot checks a chosen file, then shows its source in the normal
editor. Plain Source (.org) still downloads only root text. This is an Org-only
project container, not a new calculation format or a general filesystem.

## Representation and bounds

Version-1 files contain `format: sheets-project`, `version: 1`, a `document`
with Org type/source/view/optional profile, and `inputSnapshot` version 1 with
`payloads` of canonical CID/base64url data pairs. Original dependency bytes,
including BOM/CRLF, are preserved. Duplicate CIDs, unknown fields/versions,
noncanonical encodings, invalid profiles and excess resources are rejected.
Shared CID primitives preserve the existing HashBin CID contract.

Limits are 8 payloads, 64 KiB each, 256 KiB aggregate and 5 MiB root plus input
bytes. File JSON and decoded project JSON also have a 5 MiB cap; expansion may
reach this before the raw-byte limit. Compressed project links retain the
1,000,000-character limit. Opening rejects an unshareable file before replacing
source. Edits beyond link limits show a warning and disable Share.

SHA-512/inline identity and UTF-8 are verified before a local file is installed,
and again before bundled values are used. Missing hashed inputs fail closed with
no network fallback. Inline CIDs need no payload entry. Source edits can leave
verified unused payloads attached; exports retain only currently used inputs.
Numeric validation, literal ownership and nonrecursive imports remain FILE-1A.
Dependency formulas never execute.

## Transport and editing

Complete links always use `#project=<lz-string>`. Precedence is CID, project
fragment, source fragment, query source, example, starter. View/profile query
overrides remain explicit; non-Org formats are rejected. Org stays selected
until Use live inputs detaches bundled data. Back can restore the prior snapshot.

HashBin version 3 carries inputSnapshot and requires Org; profile is optional for
Legacy. Versions 1/2 retain their behavior. Quoting, confirmation, OAuth snapshots
and anonymous loads preserve the bundle. The CLI verifies project files and emits
complete links. Import/export performs no upload; save/shorten retain the existing
explicit user actions. Source downloads do not include dependency bytes.

Opening adds history after validation. Source edits abort pending file installation;
navigation and the scheduler discard stale operations. Copy/export readiness guards
remain in force. Source, profile and view stay editable within a snapshot. App-file
offline access plus a complete project file/link permits dependency-free reloads;
a root HashBin CID still needs a connection to retrieve the project itself.

## Evidence

The committed v1 JSON fixture fixes source, profile, view and exact dependency bytes.
Unit tests cover versions, legacy envelopes, URL overrides, bounds, integrity,
missing data, OAuth and CLI transport. Browser tests cover actual file downloads,
opening, edits, shares/reloads, confirmed version-3 saves, atomic file rejection,
cancellation and live detachment. The staged offline test reloads hashed inputs
from bundled bytes. Native Org expectations remain unchanged. Raw URLs, recursive
graphs and other formats' project resources remain FILE-1 work.
