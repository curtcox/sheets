# Compatibility profile contract

Status: `calca-blocks-v1` changes Markdown block classification only.
`calca-scopes-v1` adds heading scopes and immutable definitions with a bounded
numeric constraint policy. The first Beancount numeric fixes do
not require a profile: correcting arithmetic does not retain a known wrong result
as a dialect.

- An existing source URL without a profile and a version-1 HashBin envelope keep
  the current format's language rules. Source, selected format, view, CID priority,
  and unrelated URL parameters retain their current meanings.
- A new behavior profile has a format-specific, versioned ID, such as
  `calca-blocks-v1`. The explicit `profile` query parameter overrides the
  stored profile only when the profile belongs to the selected format. Unsupported
  explicit profiles produce a diagnostic rather than silently using another one.
  With Auto selected, a supported explicit profile selects its owning format.
- New HashBin envelopes that require a profile use version 2 with a profile field.
  Version 1 remains readable. Never mutate or reinterpret immutable saved content.
  Format/view query overrides continue to work; a format override cannot carry a
  profile from the previously stored format into a different language.
- Editing, sharing, OAuth return snapshots, and source-link reloads retain the
  selected profile. Changing formats chooses that format's compatible default
  explicitly. Rendered downloads preserve the finished result. Ordinary source
  downloads include the source alone; the UI discloses when behavior depends on a
  profile outside the source notation.
- An existing document migrates only through an explicit profile choice. Preserve
  its source, show changed results/diagnostics, and create a new share link or saved
  document. New starter documents may choose a new default while old unprofiled
  links continue to resolve to the legacy language rules.

The Calca blocks selector switches explicitly between Legacy (no profile),
Structured blocks (`calca-blocks-v1`), and Scoped definitions (`calca-scopes-v1`).
A switch preserves source and clears a loaded CID; a format change clears the Calca profile. Existing starter documents
remain legacy. The Calca edge gallery example and new documentation links choose
Structured blocks explicitly; the equations/functions/scopes example and scoped
documentation examples choose Scoped definitions. HashBin load controls also honor
query overrides in pasted saved links. Unknown/mismatched profiles block loading with a visible error
and leave the original URL intact.

Executable coverage is in `tests/unit/profiles.test.js` and
`tests/browser/calca-profiles.spec.js`: omitted/known/unknown profiles, version-1
and version-2 envelopes, mixed overrides, CID precedence, sharing, source export,
OAuth success/denial, view preservation, and profile migration. The offline browser
suite checks profiled-source reloads from installed assets. Existing URL/HashBin
and Calca tests continue to define the legacy contract.

## Scoped definitions policy

The public Calca reference motivates immutable definitions, document-order
availability, and parent/child/sibling heading scopes. An attributed fixture is
stored in `tests/fixtures/calca/scopes.json`; it is not an independent native-app
oracle. First definitions retain expressions rather than eager values. Repeated
visible definitions become relations, including in children. Definitions do not
shadow inherited names. Deferred bodies and function free variables use the
query's visible bindings. ATX and Setext headings create scopes. A bare unbound
name displays itself; compound symbolic answers are unsupported.

Only real scalar linear/quadratic candidates are solved. Connected relations
must accept a candidate within 64 machine epsilons of relative error (no absolute
floor). For solved unknowns, arithmetic magnitudes account for cancellation when
checking rounded polynomial roots; this is not an exact proof. Other connected
relations either evaluate at the candidate or report an unsupported diagnostic.
No generic system or function inversion is implied.
Multiple/no roots, cycles, over-deep dependencies and excess work are explicit.
Unrelated calculations can continue after a conflict. Child redefinition,
deferred binding, Setext handling and conflict presentation are Sheets policies
pending native-app verification and stay under CALCA-04 audit. Further changes to
these semantics require another profile rather than reinterpreting saved data.

The shared expression guard now rejects dangerous or unlisted built-ins used as
function values as well as direct calls. This security correction applies to all
profiles; retaining an evaluation bypass is not a compatibility contract.

## Org calculation order

`org-emacs-v1` adds an explicit **Emacs order** option. Unprofiled Org links and
version-1 saved documents retain **Legacy** source-order assignments and adjacent
multiple-formula-line execution. This is an intentional migration because those
rules were documented behavior. New guide examples and the Org edge gallery
choose the new profile explicitly; existing source text is never changed by the
mode switch. The URL, envelope, OAuth, view, source-export and offline contract
applies. `design/org-order.md` defines the bounded native scheduling contract;
this mode does not claim the full Emacs/Calc application. Remote references are
new syntax in both modes and do not change previously supported calculations.
