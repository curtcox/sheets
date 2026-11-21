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
  if (doc.inputSnapshot && !["org", "auto"].includes(format))
    throw new Error("Portable snapshots require Org format. Use live inputs before switching formats.");
  return {
    src: doc.src,
    format,
    view: overrides.view ?? doc.view ?? "split",
    ...(profile ? { profile } : {}),
    ...(doc.inputSnapshot ? { format: "org", inputSnapshot: doc.inputSnapshot } : {}),
    ...(doc.attachments ? { attachments: doc.attachments } : {}),
  };
}
const SAVED = "Links and saved documents preserve this mode; source files contain text only.";
const TEXT_ONLY = "Source files contain text only; reselect this mode when reusing them.";
/** Label and explanation shown beside the profile selector for a format. */
export function profileCopy(format, profile) {
  if (format === "org")
    return {
      label: "Org calculation",
      help: profile
        ? `Columns calculate row by row before protected field formulas, using Emacs target order. ${SAVED}`
        : "Legacy applies assignments in source order. Choose Emacs order explicitly to migrate; the source stays unchanged.",
    };
  if (format === "asciimath")
    return {
      label: "AsciiMath mode",
      help:
        profile === ASCIIMATH_FORMULAS
          ? `Each nonempty line is a formula, even when it resembles Markdown. ${SAVED}`
          : profile === ASCIIMATH_PROSE
            ? `Prose stays prose. Mark formulas with dollar delimiters or asciimath fences. ${SAVED}`
            : "Auto chooses formula lines or mixed prose from the document's structure. Select an explicit mode to keep that choice while editing.",
    };
  return {
    label: "Calca blocks",
    help:
      profile === CALCA_SCOPES
        ? `Definitions belong to headings and descendants; repeated definitions become constraints. ${TEXT_ONLY}`
        : profile
          ? `Calca fences, indented code, and standalone arrows calculate. ${TEXT_ONLY}`
          : "Legacy evaluates every code fence. Structured blocks keep other languages, formulas, and diagrams literal.",
  };
}
