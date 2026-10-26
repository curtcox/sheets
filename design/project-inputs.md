# FILE-1: versioned shared inputs

Field-report item 2 duplicated seven file constants across three Org models.
The first increment, FILE-1A, imports numeric file constants from immutable
HashBin CIDs. This supplies shared assumptions without executing another document
or changing ordinary same-document `remote()` behavior. It is a Sheets extension,
not native Org cross-file table compatibility. ORG-02 remains open for its wider
subset; SHARED-07 remains open for mutable raw-URL loading.

## Implemented source contract: FILE-1A

`#+SHEETS_INPUT: v1 prices <cid>` declares a case-sensitive namespace, referenced
as `$prices.storagePrice` in Calc expressions. The explicit v1 token versions the
import semantics inside source. Existing compressed links, source fragments,
HashBin envelopes, OAuth snapshots, downloads and the CLI preserve it without a
new envelope/profile. Old single-document sources still take their original path.

Keywords are case-insensitive; namespaces and constant names are ASCII names,
case-sensitive, at most 64 characters. Only bare canonical HashBin CIDs are
accepted, with no paths, arbitrary URLs, implicit lookup or alias overrides.
Duplicate aliases invalidate the set. Reusing one CID under different aliases
is allowed and reads it once per render. Literal SRC/EXAMPLE/EXPORT/COMMENT
blocks cannot install declarations.

An input is a saved Org document (existing version 1 or version 2) or plain Org
source. Read its numeric file `#+CONSTANTS:` through the existing AST/binding
rules: last declaration wins, original numeric strings remain exact, and literal
blocks do not supply values. Dependency tables/formulas are never recalculated;
property lookups, source code and other engines never execute. Invalid numeric
declarations, including superseded erroneous declarations, reject that input.
Presentation-only warnings in the dependency do not affect numeric imports.

References are scalar and occupy a distinct namespace. Local file/table/field
bindings neither override `$prices.rate` nor provide fallback when it is absent.
Imported ranges, assigning to imports, native cross-file `remote()`, dependency
table reads and recursively imported inputs are unsupported. A dependency with
any real input declaration is rejected: graph depth is one, so cycles cannot run.

## Resource and integrity contract

Each render owns its data and all fetches. No persistent dependency cache or
global interpreter state is introduced. Inputs of 64 bytes or less decode
directly from the CID without network. Larger inputs load only from
`https://256t.us/<cid>`, with credentials omitted, no referrer, redirects rejected
and no HTTP cache reuse. The browser's normal CORS rules apply.

The resolver streams responses and verifies actual byte length and SHA-512
against the CID before decoding strict UTF-8 or parsing any content. The CID
layout follows the [256t specification](https://github.com/curtcox/256t.org/blob/65177793268f9084c661d8d3315c2c339d189ae1/README.md): six big-endian length bytes and
either literal bytes up to 64 bytes or a SHA-512 digest above that. Web Crypto
verification requires HTTPS or localhost. Content mismatch cannot replace a
pinned assumption. No HashBin OAuth session or write/charge is involved.

Limits are 8 declarations, 64 KiB per distinct payload, 256 KiB aggregate payload
bytes, 5 MiB for root source plus payloads, 128 effective constants per input and
1,000 characters per numeric value. Source size is checked before the additional
AST pass. One 10-second loading deadline covers the entire set, including stalled
headers/bodies. An edit, navigation or cancellation aborts the current work and
the scheduler cannot apply its late result. Duplicate CIDs count once toward
the byte budget. Reads remain sequential to make aggregate accounting simple.
Copy recalculated source is disabled while waiting/rendering/cancelled, just like
rendered exports, so a slow input load cannot copy an earlier calculation.

The imported set is atomic: any declaration, load, integrity, size or content
failure applies no imported values. The preview exposes each declaration's
failure, formula errors retain old cells, and unrelated local formulas can still
calculate. Unavailable imports do not become zero or fall back to old/local data.
The low-level synchronous engine accepts explicitly supplied, CID-matched inputs;
the async plugin resolves them first. Neither API fetches recursively.

## Presentation and retention

Always show imported values, namespace, defining dependency lines and public CID
provenance in a read-only Shared inputs summary, including HTML exports/printing.
This is separate from the optional own-file constants summary. Names/values/errors
are escaped and all output passes through the existing sanitizer. The editor and
source downloads preserve declarations and formulas, never flatten imported data.

Pinning identifies content; it does not purchase retention. Reloads need the
referenced payloads to remain available, unless the CID contains inline content.
Source links/downloads are not bundles of dependencies. Offline app files do not
cache input payloads. Updating assumptions creates a new CID; consumers explicitly
change their reference. Old models remain pinned rather than silently refreshing.

## Remaining FILE-1 designs

1. A portable project snapshot should bundle a versioned root plus verified
   dependency bytes, preserve aliases/CIDs and recorded engine profiles, and use
   aggregate bounds before parsing. Missing or conflicting payloads must fail,
   with no fallback to mutable network content. Import/export UI and share size
   behavior need their own migration fixtures; no bundle format is promised yet.
2. A `?url=` loader is a separate mutable-source workflow. It must define explicit
   user URL selection, CORS/status/redirect handling, a bounded fetch deadline,
   strict decoding, and conversion into an embedded source snapshot. Keeping a
   mutable URL as a hidden live dependency would not be reproducible. Automatic
   refresh, arbitrary file paths and credentials are outside this increment.
3. Recursive Org table projects, Beancount includes and Quarto resources need
   separate typed dependency graphs, cycle/depth rules, profiles and aggregate
   execution budgets. FILE-1A is not a generic project filesystem or solver.

## Verification

Independent Emacs checks use a local-constant equivalent to the namespaced model:
3.00 and 3.30 decimal results, a large exact integer plus one, and duplicate
constant precedence. Only that fixture is added to the native reference JSON;
all 26 prior numeric, four rejection and five HTML documents are unchanged.
Native Emacs does not implement the Sheets CID extension.

Unit tests exercise both scheduling modes, saved versions, inline/hashed CIDs,
SHA-512 mismatch, exact bytes/UTF-8, streamed limits, deadlines, aborts, alias and
namespace failures, atomic sets, deduplication, nested/literal ownership and
unchanged source. Controlled browser responses check provenance, both modes,
sharing/reload, saved roots, source/HTML downloads, mobile/print, missing or altered
content, cancellation and stale-result prevention. The guide's inline CID example
works without a service or sign-in; staged offline tests cover inline success and
network input failure without pretending app files include dependencies.
