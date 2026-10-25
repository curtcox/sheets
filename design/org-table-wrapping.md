# Narrow Org table readability (ORG-TABLE-1)

This resolves ORG-11 and the wrapping defect in item 6 of the money-model field
report. The preview inherited `overflow-wrap: anywhere`; at an 800 px Split
viewport, a numeric cell in the browser reproducer occupied three text lines.
Ordinary wrapping alone also allowed breaks inside scientific notation.

## Layout contract

Each generated Org table sits in a bounded `.org-table-scroll` region. It can
overflow horizontally inside that region without widening the preview or the
document page. The table stops inheriting arbitrary word breaks.

Single-token cells use `white-space: nowrap`, preserving numbers, signs, currency
prefixes, scientific exponents, fractions and one-word headings. A cell containing
whitespace receives a static wrapping class instead, so multiword labels can
wrap at ordinary word boundaries. This is a layout rule, not a numeric parser or
an assertion that displayed currency text can be used in formulas. All cell text
remains escaped and the final HTML still goes through the shared sanitizer.

The scroll region is labeled and focusable. The preview handles unmodified Left
and Right arrows only when that region itself has focus and overflows. This
supplies consistent horizontal keyboard scrolling where native browser behavior
differs; keys in the editor, other controls or descendants retain their defaults.

Standalone HTML exports embed the same layout styles, retain the region and need
no JavaScript. Print styles release scroll clipping. A table wider than the
printable page can still need landscape orientation or wider paper; this does
not implement automatic table scaling or pagination.

## Evidence and boundaries

`tests/browser/org-tables.spec.js` reproduces the old wrapping geometrically,
using text-range line positions rather than only inspecting CSS declarations.
It verifies 800 px Split and 390 px mobile, both Org calculation modes, decimal,
currency, signed, scientific and large values, long labels, local/keyboard
scrolling, unchanged source, sanitized standalone HTML and print overflow.

The 24 successful Emacs numeric documents and four rejection fixtures remain
unchanged. The four Org gallery covers were regenerated; their pixels were
unchanged at the gallery's wider preview size. Other formats keep their existing
table styling.

This does not supply native header semantics or numeric-column alignment
(ORG-12), source display-width parity, thousands grouping, or a new calculation
mode. Those remain separate work.
