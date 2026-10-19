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
reference's alphabetic entity-suffix handling is reproduced, and fuzzy email
domains reject plus signs without rejecting plus signs in local parts. www
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

The 35 native autolink fixtures include 31 passing cases and four deliberately
recorded differences beyond the corpus. URL-host underscores follow the reference last-two-labels rule. Email-domain
underscores and a valid prefix before a plus sign still differ. Uppercase WWW and numeric final email-domain characters remain supported
where this pinned native version leaves text unlinked. The fixture's
`knownDeviations` names and explains each difference; unit tests reject unreviewed
changes to that list. GFM-06 keeps the broader compatibility work open.

Do not broaden the current adapter into an independent host/email grammar without
reevaluating the parser choice and source-map contract. Distinguish the pinned
native implementation's quirks from the published specification before removing
existing valid-link behavior.

References: [pinned cmark autolink implementation](https://github.com/github/cmark-gfm/blob/0.29.0.gfm.13/extensions/autolink.c),
[GFM autolink specification](https://github.github.com/gfm/#autolinks-extension-),
[mdast extension](https://github.com/syntax-tree/mdast-util-gfm-autolink-literal),
[micromark extension](https://github.com/micromark/micromark-extension-gfm-autolink-literal).
