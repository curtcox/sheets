/** Behavior versions are explicit; omitted profiles retain the original rules. */
export const CALCA_BLOCKS = "calca-blocks-v1";
export const CALCA_SCOPES = "calca-scopes-v1";
export const ASCIIMATH_FORMULAS = "asciimath-formulas-v1";
export const ASCIIMATH_PROSE = "asciimath-prose-v1";
export const ORG_EMACS = "org-emacs-v1";
export const profiles = [
  { id: ORG_EMACS, format: "org", label: "Emacs order" },
  { id: ASCIIMATH_FORMULAS, format: "asciimath", label: "Formula list" },
  { id: ASCIIMATH_PROSE, format: "asciimath", label: "Mixed prose" },
  { id: CALCA_BLOCKS, format: "calca", label: "Structured blocks" },
  { id: CALCA_SCOPES, format: "calca", label: "Scoped definitions" },
];
export function validateProfile(profile, format = "auto") {
  if (profile === undefined || profile === null) return undefined;
  const entry = profiles.find((item) => item.id === profile);
  if (!entry)
    throw new Error(`Unsupported compatibility profile: ${String(profile)}.`);
  if (format !== "auto" && entry.format !== format)
    throw new Error(
      `Compatibility profile ${profile} requires ${entry.format}.`,
    );
  return profile;
}
// Explicit format overrides discard a saved profile from a different format.
// An explicit profile override is always validated against the resulting format.
export function resolveDocument(doc, overrides = {}) {
  const format = overrides.format ?? doc.type ?? "auto";
  const profile = Object.hasOwn(overrides, "profile")
    ? overrides.profile
    : overrides.format && overrides.format !== doc.type
      ? undefined
      : doc.profile;
  validateProfile(profile, format);
  return {
    src: doc.src,
    format,
    view: overrides.view ?? doc.view ?? "split",
    ...(profile ? { profile } : {}),
  };
}
