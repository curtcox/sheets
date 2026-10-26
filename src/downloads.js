import { catalog } from "./formats/registry.js";
import { serializeProjectFile } from "./project-state.js";
import { snapshotFromPayloads } from "./input-snapshot.js";

export function sourceTitle(source) {
  source = source.replace(/^\uFEFF/, "");
  const title =
    /^(?:#{1,6}\s+|\*+\s+|#\+TITLE:\s*)(.+)$/im.exec(source)?.[1] ||
    (/^---\r?\n/.test(source) && /^title:\s*(.+)$/m.exec(source)?.[1]) ||
    /^option\s+"title"\s+"([^"]+)"/m.exec(source)?.[1] ||
    "Sheet";
  return title.trim().replace(/^(['"])(.*)\1$/, "$2");
}
export function fileName(title, extension) {
  const stem =
    title
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100) || "sheet";
  return stem + extension;
}
export function sourceDownload(source, format) {
  const extension =
    catalog.find((item) => item.id === format)?.extensions[0] || ".txt";
  return {
    name: fileName(sourceTitle(source), extension),
    blob: new Blob([source], { type: "text/plain;charset=utf-8" }),
  };
}
export function projectDownload(document, payloads) {
  const inputSnapshot = snapshotFromPayloads(payloads, document.src),
    text = serializeProjectFile({ ...document, type: "org", inputSnapshot });
  return { name: fileName(sourceTitle(document.src), ".sheets.json"), blob: new Blob([text], { type: "application/json;charset=utf-8" }) };
}
