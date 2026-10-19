# Quarto structured document contract (QT-1)

Reference review: 2026-10-19. This is a specified browser subset, not a claim of
byte-for-byte Quarto CLI HTML compatibility. The tests assert structure, source
coordinates and deliberately scoped behavior rather than Quarto's Bootstrap HTML.

Primary references:

- [Pandoc fenced divs](https://pandoc.org/MANUAL.html#extension-fenced_divs):
  attributed openers, bare closing fences, nesting, and differing fence lengths.
- [Quarto callouts](https://quarto.org/docs/authoring/callouts.html): the five
  callout classes and Markdown contents. Appearance, collapse, automatic headers,
  icons and title attributes remain unsupported and disclosed.
- [Quarto figures](https://quarto.org/docs/authoring/figures.html): standalone
  captioned images with fig identifiers, labelled computational plots, forward
  references, and figure divs whose final paragraph is the caption.
- [Quarto execution options](https://quarto.org/docs/computations/execution-options.html):
  document defaults and individual cell settings. This adapter supports only the
  boolean echo/eval/output controls and plain-text cell label/fig-cap settings.

## Structure and source ownership

One Markdown parse owns the whole document. Custom block tokens identify div
boundaries; ordinary fence tokens identify executable cells after parsing, so
example fences inside another fence or an HTML block cannot execute. Div tokens
balance within their Markdown container (including lists and blockquotes), with
source-line diagnostics for unmatched boundaries. Executable cells remain in the
same token stream, preserving enclosing callouts and document-wide Mermaid IDs.

Inline reference and image-attribute rules consume source only where Markdown
allows them. They preserve code, escapes, math, link text/URLs and raw HTML.
References receive source positions through the shared logical-to-original-line
mapper, including quote/list prefixes, escaped table pipes and repeated cells.

Targets are registered in document order after execution. Only visible plot
outputs qualify as computational figures. Duplicate declarations retain the
first target and diagnose the later declaration; unavailable targets and missing
references remain readable rather than producing broken links. Multiple plots
from one cell share a single wrapper/target. Numbering is flat. Subfigures,
nonfigure references, grouped/prefix-suppressed references and citations are not
implemented. Image/cell captions are plain text; figure-div captions are Markdown.
Sanitization still runs in the normal application pipeline, including exports.

## YAML and evaluation

The pinned js-yaml event stream supplies positions for block, flow and quoted
keys; the same library's JSON schema constructs values and rejects duplicate
keys. Cells accept only contiguous initial #| option lines. Later #| lines stay
in the code, including comments that resemble options. Unsupported fence-header
settings, YAML keys, attribute settings and invalid types produce diagnostics.
Valid sibling settings remain effective; invalid entries do not override defaults.
A syntax error discards that mapping. These are recoverable editor diagnostics,
so users must correct invalid evaluation settings before running untrusted code.

Cell echo/eval/output settings override document execute defaults. Existing
execute:false and execute.enabled:false remain absolute browser execution gates;
no cell can enable a runtime through either gate. The enabled spelling is an
existing browser alias, not an additional Quarto compatibility claim. Every
language retains its independent worker, order, deadline and cancellation.

## Reproducers and checks

- `tests/fixtures/quarto/structure.qmd`: nested callouts across a skipped cell,
  unequal closing fences, forward image/div references, and literal examples.
- `tests/unit/quarto.test.js`: duplicates, absent and invisible figures, metadata
  and cell precedence, malformed/aliased/flow/quoted YAML, code/HTML shielding,
  container boundaries, multi-plot targets, exact list/quote/table coordinates,
  and preserved runtime errors/cancellation.
- `tests/browser/quarto-structure.spec.js`: actual sanitized DOM, ACE annotations,
  share/reload, source and rendered exports, and runnable documentation links.
- `tests/browser/quarto-r.spec.js`: real R/Python execution and figure references,
  per-language state, worker termination and disabled-runtime loading.

Full Pandoc/Quarto grammar and remaining execution/output options stay in QT-2,
FILE-1 and native-runtime milestones. No reference HTML expectations were rewritten
to hide a difference; the existing shared GFM corpus remains unchanged.
