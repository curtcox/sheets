# Sharing links

The URL is the document. Typing replaces the current history entry after a 300 ms pause; it does not add an entry for each keystroke.

| Parameter | Meaning |
| --- | --- |
| `?format=gfm` | Manual format. Omit it for Auto. |
| `?view=split` | Split, source, or preview. Split is the default and is normally omitted. |
| `?profile=asciimath-formulas-v1` | AsciiMath Formula list: one formula per nonempty line. |
| `?profile=asciimath-prose-v1` | AsciiMath Mixed prose: only delimited or fenced formulas are typeset. |
| `?profile=org-emacs-v1` | Org Emacs order: row-by-row columns, protected field formulas, duplicate-target rejection. Omit for Legacy source order. |
| `?profile=calca-blocks-v1` | Calca's Structured blocks mode. Omit for Legacy. |
| `?profile=calca-scopes-v1` | Calca's Scoped definitions mode: immutable definitions and heading scopes. |
| `?compressed=…` | Source compressed with lz-string's URI-safe encoding. |
| `#<cid>` | A HashBin content identifier. |
| `?example=<id>` | Load an example once, then replace this parameter with its compressed source. |

Source in a generated URL longer than 7,000 characters moves to `#src=…`,
using the same lz-string encoding as `?compressed=…`. Fragments are not sent to
the web server, so the long source does not trigger its request-line limit when
you open or reload the document. Short links keep query source.

Loading precedence is **CID → fragment source → query source → example → starter document**. A HashBin document supplies its stored format and view unless query parameters explicitly override them. Unknown formats and views safely default to Auto and Split. Invalid compressed links report an error. Decoding stops at 5 MiB to bound expansion.

Editing a loaded CID clears the CID and embeds the new source. Changing the view of an unchanged saved document retains the CID; the view query parameter overrides the saved document's view when the link is loaded. Share links clear stale example, source, and OAuth callback parameters. Unrelated query parameters are preserved. A source fragment wins over stale query source; invalid fragment source reports an error. Editing a long document down to a short one returns its source to the query.

Compatibility profiles are format-specific behavior versions. The supported
`calca-blocks-v1` profile separates calculation blocks from literal code, TeX,
and Mermaid. The `calca-scopes-v1` profile additionally makes definitions
immutable, scopes definitions/relations to headings, and checks connected numeric
constraints. Either Calca profile selects Calca when the format is Auto. AsciiMath supports
`asciimath-formulas-v1` (Formula list) and `asciimath-prose-v1` (Mixed prose); these
select AsciiMath when the format is Auto and preserve the document model while editing. Org supports `org-emacs-v1` (Emacs order), selecting Org under Auto;
unprofiled Org links retain Legacy source order. Omitted profiles retain the
original language rules; unknown or mismatched explicit profiles report an error.
An explicit profile query overrides a saved profile. A format override to another
format drops the stored profile; an incompatible explicit profile is rejected.
Switching a mode creates a compressed source link with the same source,
and removes a previously loaded CID. View changes, sharing, OAuth returns, and
offline reloads preserve the selected profile.

The supported format IDs are `gfm`, `asciimath`, `numbat`, `calcfile`, `org`, `calca`, `hurmet`, `beancount`, `quarto`, and `text`.

## Long links and separate copies

Source-fragment links require this version of Sheets. If you use installed offline
files from an older release, update them before opening a new fragment link.

The fragment protects generated long-source links from the server's request-line
limit. Browsers, messaging apps and shortening services can still truncate or
reject complete URLs. The long-link notice recommends **Download → Source** or
HashBin for a separate copy; source remains in the URL, without a local draft
backup. Offline app files do not store documents.

Existing long query links remain readable if the host accepts them, and the app
moves them to a fragment on its next URL update. A link that receives HTTP 414
before the app loads cannot migrate itself: paste the original source into a
reachable editor when available. Unrelated query parameters are preserved; if
those alone make the request too long, remove them before reloading.

## Links from source files

From a repository checkout with Node 22 or newer:

```sh
node scripts/link.mjs examples/org/typical.org --view=preview --profile=org-emacs-v1
node scripts/link.mjs path/to/model.org --base=http://127.0.0.1:4173/index.html
```

`scripts/link.mjs` reads one UTF-8 regular file and prints exactly one URL followed
by a newline to stdout. Warnings and errors go to stderr. Errors exit with status
1 and produce no URL. The command does not execute source, upload it, or modify
the file. The filename is not embedded. The default editor is
`https://curtcox.github.io/sheets/index.html`.

- `--format <id>` overrides the filename extension. Known extensions select their
  registered format; unknown extensions use Auto. Use `--format auto` to request
  content detection even for a known extension.
- `--view split|source|preview` selects the initial view; Split is the default.
- `--profile <id>` selects an explicit compatible profile. Omit it to retain the
  original rules, including Org Legacy source order. A compatible profile also
  selects its format under Auto.
- `--base <url>` selects another absolute HTTP(S) editor address, without embedded
  credentials. It must serve a compatible Sheets app. Stale source, example,
  CID and OAuth parameters are cleared; unrelated query parameters are preserved.
- `--help` lists supported format/profile IDs. Values also accept `--option=value`.
  Put `--` before a filename beginning with a dash.

The shared app serializer preserves source, format, view and profile, including
Unicode, a UTF-8 BOM, CRLF and trailing whitespace. Invalid UTF-8 is rejected.
Files are bounded at 5 MiB, and generated links must pass the app reader's
1,000,000-character compressed-source limit. Poorly compressing files can exceed
that encoded limit before reaching 5 MiB.

Links above 7,000 characters use the source-fragment fallback and warn on stderr
about remaining complete-URL limits. Oversized non-source base parameters get a
separate warning. This is a source snapshot: later file edits require generating
a new link. Keep the source file or use HashBin for a separate copy. The CLI
provides no storage and remains outside the deployed Pages assets (SHARED-06).
Loading a remote raw file with `?url=` is still unsupported (SHARED-07; FILE-1).

## Optional short links

Choose **Shorten with is.gd** in the Share dialog. This explicitly sends the complete source link through AllOrigins to is.gd. The app validates the returned HTTPS is.gd URL. If shortening fails, the original source link remains ready to copy. HashBin provides a separate content-storage option for large documents.

References and footnotes inside the preview scroll to their targets without changing the document URL. This preserves saved CIDs and avoids rerunning notebook cells.
