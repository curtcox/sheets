import { validateProfile } from './compatibility-profiles.js';
import { validateInputSnapshot, SNAPSHOT_LIMITS } from './input-snapshot.js';
import { validateAttachments } from './attachments.js';

export function validateProjectDocument({ src, type, view = 'split', profile, inputSnapshot, attachments }) {
  const modern = attachments !== undefined;
  if ((!modern && type !== 'org') || (modern && !['org','gfm'].includes(type)) || typeof src !== 'string' || !['split','source','preview'].includes(view))
    throw Error('Portable projects require Org source (or Markdown with pictures) and a valid view.');
  if (inputSnapshot !== undefined && type !== 'org') throw Error('Bundled numeric inputs require Org source.');
  validateProfile(profile, type);
  const result = { src, type, view, ...(profile ? { profile } : {}) };
  if (inputSnapshot !== undefined || !modern) result.inputSnapshot = validateInputSnapshot(inputSnapshot, src);
  if (modern) result.attachments = validateAttachments(attachments);
  return result;
}
export function serializeProjectFile(document) {
  const { inputSnapshot, attachments, ...root } = validateProjectDocument(document),
    text = JSON.stringify({ format: 'sheets-project', version: attachments === undefined ? 1 : 2, document: root,
      ...(inputSnapshot ? { inputSnapshot } : {}), ...(attachments !== undefined ? { attachments } : {}) });
  if (new TextEncoder().encode(text).byteLength > SNAPSHOT_LIMITS.document) throw Error('Portable project JSON exceeds 5 MiB.');
  return text;
}
export function parseProjectFile(text) {
  if (new TextEncoder().encode(text).byteLength > SNAPSHOT_LIMITS.document) throw Error('Portable project JSON exceeds 5 MiB.');
  let project;
  try { project = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw Error('Portable project is not valid JSON.'); }
  if (!project || project.format !== 'sheets-project' || ![1,2].includes(project.version) || !project.document ||
      Object.keys(project).some(key => !['format','version','document','inputSnapshot',...(project.version === 2 ? ['attachments'] : [])].includes(key)) ||
      Object.keys(project.document).some(key => !['src','type','view','profile'].includes(key)) ||
      (project.version === 2 && !Array.isArray(project.attachments))) throw Error('Unsupported portable project format or version.');
  return validateProjectDocument({ ...project.document, inputSnapshot: project.inputSnapshot, ...(project.version === 2 ? { attachments: project.attachments } : {}) });
}
