# Long source links

SHARE-1 addresses item 1 of the [money-model field report](field-report-hashbin-money-model.md)
and SHARED-05. The old editor could replace its URL with a query longer than the
host would accept. Reloading then requested that query and replaced the editor
with HTTP 414. The browser regression reproduces this end to end against a local
server enforcing an 8,192-byte request-line limit.

## URL contract

- Keep existing short `?compressed=` links. After serializing the complete URL,
  move compressed source to `#src=<lz-string URI encoding>` if it exceeds 7,000
  characters. This leaves headroom below the production limit recorded in the
  report. HTTP requests never contain fragments.
- Keep format, view, profile and unrelated parameters in the query. A fragment
  source uses the same canonical encoding checks, 1,000,000 encoded-character
  limit and 5 MiB decoded-source limit as query source.
- Loading precedence is CID, fragment source, query source, example, starter.
  `src=` reserves a distinct fragment namespace that cannot be a valid CID.
  An invalid source fragment reports an error rather than loading stale query
  source. Writing a CID removes source; shortening a document returns to query
  source. Reachable old long queries migrate when the editor persists them.
- Both hash navigation and browser history restore fragment documents. Preview
  reference clicks continue to scroll without changing the document address.
- The URL remains the document; this change adds no local draft store. It works
  when localStorage/sessionStorage are unavailable and does not need a HashBin
  account. OAuth still uses its existing explicit source snapshot; offline app
  caches still store static assets only.

## Remaining limits

A fragment cannot rescue an old URL that the host rejects before loading the
app. Paste the original source into a reachable editor when available. Browsers,
messengers and shortening services can still limit or truncate complete URLs.
The notice therefore recommends Download → Source or HashBin for a separate
copy. Unknown query parameters are preserved, so an oversized non-source query
can still exceed a host limit; the notice asks the user to remove extra parameters.
An older installed offline app cannot read the new fragment syntax; update its
app files before opening a new fragment link. Existing query and CID links remain
supported by the new reader. No unbounded URL or durable browser-history guarantee
is implied.

## Verification

`tests/browser/long-links.spec.js` verifies old reload failure, new reload and
fresh-tab reopening, exact profiled Org source, blocked browser storage, source
download, fragment navigation/back, and invalid-fragment diagnostics. Unit tests
cover canonical decoding, bounds, legacy links and CID/source/example precedence.
The OAuth save test uses long source, and the offline update test retains long
source across activation and a subsequent offline reload. Existing profile,
sharing, CID and preview-reference tests cover the surrounding contracts.
