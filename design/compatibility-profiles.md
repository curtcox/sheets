# Compatibility profile contract

Status: the first profile, `calca-blocks-v1`, is implemented. It changes Markdown
block classification only; Calca heading scopes and definition semantics remain
future work and must use a separate profile. The first Beancount numeric fixes do
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

The Calca blocks selector switches explicitly between Legacy (no profile) and
Structured blocks (`calca-blocks-v1`). A switch preserves source and clears a
loaded CID; a format change clears the Calca profile. Existing starter documents
remain legacy. The Calca edge gallery example and new documentation links choose
Structured blocks explicitly. HashBin load controls also honor query overrides in
pasted saved links. Unknown/mismatched profiles block loading with a visible error
and leave the original URL intact.

Executable coverage is in `tests/unit/profiles.test.js` and
`tests/browser/calca-profiles.spec.js`: omitted/known/unknown profiles, version-1
and version-2 envelopes, mixed overrides, CID precedence, sharing, source export,
OAuth success/denial, view preservation, and profile migration. The offline browser
suite checks profiled-source reloads from installed assets. Existing URL/HashBin
and Calca tests continue to define the legacy contract.
