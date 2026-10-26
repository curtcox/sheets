import { validateProfile } from "./compatibility-profiles.js";
import { validateInputSnapshot, SNAPSHOT_LIMITS } from "./input-snapshot.js";

export function validateProjectDocument({ src, type, view = "split", profile, inputSnapshot }) {
  if (type !== "org" || typeof src !== "string" || !["split", "source", "preview"].includes(view))
    throw new Error("Portable projects require Org source and a valid view.");
  validateProfile(profile, type);
  return { src, type, view, ...(profile ? { profile } : {}), inputSnapshot: validateInputSnapshot(inputSnapshot, src) };
}
export function serializeProjectFile(document) {
  const { inputSnapshot, ...root } = validateProjectDocument(document),
    text = JSON.stringify({ format: "sheets-project", version: 1, document: root, inputSnapshot });
  if (new TextEncoder().encode(text).byteLength > SNAPSHOT_LIMITS.document) throw new Error("Portable project JSON exceeds 5 MiB.");
  return text;
}
export function parseProjectFile(text) {
  if (new TextEncoder().encode(text).byteLength > SNAPSHOT_LIMITS.document) throw new Error("Portable project JSON exceeds 5 MiB.");
  let project;
  try { project = JSON.parse(text.replace(/^\uFEFF/, "")); } catch { throw new Error("Portable project is not valid JSON."); }
  if (!project || project.format !== "sheets-project" || project.version !== 1 || !project.document ||
      Object.keys(project).some((key) => !["format", "version", "document", "inputSnapshot"].includes(key)) ||
      Object.keys(project.document).some((key) => !["src", "type", "view", "profile"].includes(key)))
    throw new Error("Unsupported portable project format or version.");
  return validateProjectDocument({ ...project.document, inputSnapshot: project.inputSnapshot });
}
