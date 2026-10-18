import { hurmetDocument } from "./source.js";
import { renderDocument } from "../../../vendor/hurmet/index.js";
export async function renderHurmet(src) {
  const document = hurmetDocument(src),
    offset = document.split("\n").length - src.split("\n").length;
  const result = await renderDocument(document);
  return {
    ...result,
    diagnostics: result.diagnostics.map((d) => ({
      ...d,
      line: Math.max(1, d.line - offset),
    })),
  };
}
