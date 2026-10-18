import { catalog } from "./formats/registry.js";

export function sourceTitle(source) {
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
