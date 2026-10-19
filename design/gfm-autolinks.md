# GFM autolink adapter and reference audit

Target: the published cmark-gfm 0.29.0.gfm.13 corpus, with its extension flags.
Native comparison: the same tagged C implementation, built independently by
`scripts/gfm-reference.sh`. The archive SHA-256 is checked before compiling;
`scripts/gfm-autolink-expected.mjs` checks the native version before recording or
checking HTML. It never calls the Sheets renderer.

## Evaluated alternatives

- `mdast-util-gfm-autolink-literal@2.0.1`, using its public from-Markdown transform
  on text nodes, handles internal excess parentheses and invalid email domains,
  but still links the `&hl` part of the entity-like suffix in corpus case 626.
  It cannot close the current gap by itself.
- `micromark@4.0.3` with `micromark-extension-gfm-autolink-literal@2.1.0` matches
  10 of the 11 extended-autolink corpus examples. Case 628 differs because the
  extension does not autolink FTP. It also introduces a different token/event
  model; replacing the shared parser would need a source-map bridge for Calca
  and validation of the existing math, alerts, footnotes and Mermaid pipeline.
- Native cmark-gfm remains the independent oracle. Its native task checkbox
  serialization differs from the two disabled examples' published expectations;
  corpus and native fixture metrics therefore remain explicitly separate.

The bounded fix keeps linkify-it 6.1.0 host validation and normalization while
checking underscore placement in host labels and adding the pinned GFM path-ending rules across HTTP, HTTPS, FTP and www. Only
unmatched trailing closing parentheses are removed; internal ones remain. The
reference's alphabetic entity-suffix handling is reproduced, and email recognition preserves valid prefixes before a domain plus while
accepting plus signs in local parts. www
prefixes follow the permitted preceding-character rule. Automatic scanning keeps
the existing 10,000-character-after-prefix bound. Explicit links remain complete
within the existing document size limit.

The adapter is synchronous and DOM-free, does not rewrite source, and leaves
MarkdownIt in charge of code/link/HTML contexts and link validation. All final
output still passes through the existing sanitizer.

## Evidence and limits

All 672 published examples match canonical raw HTML. Production retains its CSS
hooks, highlighting, HTML5 void tags, and consistently enabled GFM extensions;
these are measured separately from the browser's sanitized DOM.

The 57 native autolink fixtures include 53 matches and four intentional
native differences: uppercase WWW, numeric final email-domain characters,
Unicode email hosts with existing IDNA normalization, and preservation of an
existing raw HTML anchor instead of emitting a nested email link. The previously
open underscore-domain and valid-prefix-before-plus cases now match. The
fixture's `knownDeviations` records each policy and unit tests reject unreviewed
drift. GFM-06 is now retained policy rather than an unsupported email feature.

## Email supplement and parser choice

The pinned mdast transform was reevaluated for the email work. It matches the two
original missing cases, but rejects `/a@b.c_d` and links all of `a@b.c._d`, while
native cmark links the valid prefix `a@b.c`. These concrete cases rule out using
that transform as a drop-in native email matcher. Replacing the entire parser
would still require the Calca source-map bridge and extension migration described
above, so this increment keeps MarkdownIt and its context/token contract.

`email-autolinks.js` implements a supplementary plain-text scan. It tracks local
starts and scans forward domains, rather than retrying a regex from every offset.
Each domain run is traversed at most twice, even if it is invalid or contains
multiple @ signs. Complete new candidates are limited to 10,000 characters;
longer ones are ignored by this supplemental pass. Existing library matches keep
their earlier behavior. The merge of the two ordered match streams is linear,
with existing URLs, explicit URI matches and valid emails taking precedence.
This preserves Unicode normalization and prevents new email matches inside URL
paths. MarkdownIt still controls code, images, link labels, HTML anchors and
escapes; neither pass edits source or token maps.

Regression coverage includes source offsets after non-BMP text, ordering and
nonoverlap, underscore placement, trailing punctuation, valid prefixes before
plus, multiple addresses, code, explicit/HTML links, images, and URL paths/queries.
An isolated worker exercises long invalid runs, repeated @ signs, many matches,
and the candidate bound under a deadline. The browser checks every shared
Markdown consumer and rendered HTML export. The strict sanitizer stays unchanged.

References: [pinned cmark autolink implementation](https://github.com/github/cmark-gfm/blob/0.29.0.gfm.13/extensions/autolink.c),
[GFM autolink specification](https://github.github.com/gfm/#autolinks-extension-),
[mdast extension](https://github.com/syntax-tree/mdast-util-gfm-autolink-literal),
[micromark extension](https://github.com/micromark/micromark-extension-gfm-autolink-literal).
