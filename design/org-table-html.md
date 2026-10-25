# Org table header and alignment semantics (ORG-TABLE-2)

This resolves the bounded header/alignment gap in ORG-12 and field-report item 6.
Ordinary rectangular tables now preserve native header/body groups, column header
scope and default column alignment in both calculation modes, preview, sanitized
standalone HTML and print. The Org calculation engine and source row numbering
are unchanged.

## Native contract

The oracle exports actual HTML with Emacs 31.1 / Org 9.8.7, after recalculating
the source tables. `scripts/org-html-expected.el` uses `ox-html` with Babel
execution disabled, then libxml2 to record the exported DOM. Its reference format
is an array of table row groups; a cell is `tag:scope:alignment`. Random IDs,
theme, column specifications and rich cell contents are outside this comparison.
The behavior also follows the Emacs 29 sources used by CI:
[table export helpers](https://github.com/emacs-mirror/emacs/blob/emacs-29/lisp/org/ox.el),
[HTML exporter](https://github.com/emacs-mirror/emacs/blob/emacs-29/lisp/org/ox-html.el),
and [number appearance settings](https://github.com/emacs-mirror/emacs/blob/emacs-29/lisp/org/org-table.el).

- The first row group becomes `<thead>` with `<th scope="col">` when an internal
  separator establishes a header. Subsequent groups use `<tbody>` and `<td>`.
  Leading rules and a single trailing rule alone do not create a header.
  Consecutive trailing rules have a native edge case: the first group is a
  header even without body rows. This is retained and independently recorded.
- Alignment belongs to the entire column, including its headers. The native
  default threshold is at least 50% number-like cells. Headers are included.
  Blank cells following a number-like cell continue its numeric run, including
  across separator lines; leading blanks do not. Use recalculated values.
- The appearance test is not number validation. It recognizes decimal,
  scientific, hexadecimal, radix, fraction, percent, nan and infinity forms.
  Currency prefixes and grouping commas do not automatically count as numeric.
  Native HTML export tests exported text: escaped comparison signs and
  superscript markup do not satisfy the number-like pattern. Sheets matches
  their alignment while continuing to show rich cell markup literally.
- Alignment-cookie-only rows are omitted from the preview. The last `<l>`,
  `<r>` or `<c>` cookie in a column overrides automatic alignment. Width suffixes
  retain the alignment letter; width-only cookies are hidden without imposing
  a width. Cookies in an ordinary row with other text remain literal. Source
  and copied recalculated source retain all cookie rows and row addresses.

`table-html.js` is a DOM-free presentation adapter. All cell text is escaped;
tags, scope and alignment classes are chosen from fixed sets. The existing final
sanitizer remains in the preview and export paths. Scoped CSS supplies the same
alignment in the app and script-free downloads. ORG-TABLE-1 scrolling, focused
arrow keys and print overflow behavior remain in place.

## Evidence and retained differences

Five HTML documents contain 19 native table cases: ordinary/multirow headers,
multiple body groups, leading/trailing/consecutive rules, threshold ties, blank
runs, scientific and number-like fields, currency strings, last-cookie priority,
width cookies, literal lookalikes and formula results. The browser suite compares
the native descriptors and computed styles in both modes, then checks downloaded
HTML, mobile layouts and print. Unit tests check source/cookie preservation,
escaping and the calculation-metadata policy. All 24 prior numeric documents and
four native rejection records remain unchanged.

Sheets continues to display calculation marker rows and columns; native Org
HTML export omits them. They are excluded from automatic alignment statistics
where native export treats them as special. Full cell markup rendering, captions,
column-group styling, native width/truncation, custom export options and ragged-row
parity are not claimed. Ragged rows retain the engine's existing padding. These
remain ORG-02; resolving ORG-12 does not resolve full Org export compatibility.
