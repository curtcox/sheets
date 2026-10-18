# Compatibility profile contract (design)

Status: designed, not implemented. The first numeric fixes do not require a new
profile: correcting arithmetic does not preserve a known wrong result as a dialect.
This contract gates later Calca scoping/block changes and explicit AsciiMath modes.

- An existing source URL without a profile and a version-1 HashBin envelope keep
  the current format's language rules. Source, selected format, view, CID priority,
  and unrelated URL parameters retain their current meanings.
- A new behavior profile has a format-specific, versioned ID, such as
  `calca-reference-v1`. A future explicit `profile` query parameter overrides the
  stored profile only when the profile belongs to the selected format. Unsupported
  explicit profiles produce a diagnostic rather than silently using another one.
- New HashBin envelopes that require a profile use version 2 with a profile field.
  Version 1 remains readable. Never mutate or reinterpret immutable saved content.
  Format/view query overrides continue to work; a format override cannot carry a
  profile from the previously stored format into a different language.
- Editing, sharing, OAuth return snapshots, downloads, and source-link reloads must
  retain the selected profile. Changing formats chooses that format's compatible
  default explicitly. Ordinary source downloads include the source alone; the UI
  must disclose when behavior depends on a profile outside the source notation.
- An existing document migrates only through an explicit profile choice. Preserve
  its source, show changed results/diagnostics, and create a new share link or saved
  document. New starter documents may choose a new default while old unprofiled
  links continue to resolve to the legacy language rules.

Before rollout, add executable cases for omitted/known/unknown profiles, version-1
and version-2 envelopes, mixed format/profile overrides, CID precedence, sharing,
OAuth restoration, and source-view reloads. Existing fixtures in
`tests/unit/url-state.test.js`, `tests/unit/hashbin.test.js`, and browser sharing
tests are the unchanged legacy contract. There is no profile selector or version-2
envelope support in this release.
