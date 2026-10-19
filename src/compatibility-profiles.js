/** Behavior versions are explicit; omitted profiles retain the original rules. */
export const CALCA_BLOCKS = "calca-blocks-v1";
export const profiles = [
  { id: CALCA_BLOCKS, format: "calca", label: "Structured blocks" },
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
