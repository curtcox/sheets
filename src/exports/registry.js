import { runWorker } from "../worker-client.js";
import { fileName } from "../downloads.js";
import { EXPORT_LIMITS } from "./snapshot.js";
export const exportTargets = Object.freeze([
  {
    id: "txt",
    label: "Evaluated plain text",
    extension: ".txt",
    mime: "text/plain;charset=utf-8",
  },
  {
    id: "md",
    label: "Evaluated Markdown",
    extension: ".md",
    mime: "text/markdown;charset=utf-8",
  },
  {
    id: "docx",
    label: "Word (.docx)",
    extension: ".docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    id: "xlsx",
    label: "Excel — working formulas",
    extension: ".xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  {
    id: "ods",
    label: "OpenDocument spreadsheet (.ods)",
    extension: ".ods",
    mime: "application/vnd.oasis.opendocument.spreadsheet",
  },
  {
    id: "rtf",
    label: "Rich text (.rtf)",
    extension: ".rtf",
    mime: "application/rtf",
  },
]);
export async function exportSnapshot(
  snapshot,
  id,
  { signal, timeout = 30000, valuesOnly = false } = {},
) {
  const target = exportTargets.find((target) => target.id === id);
  if (!target) throw Error("Unknown export target.");
  // Turndown uses the browser DOM; binary document/workbook writers run isolated.
  const result =
    id === "md"
      ? await (await import("./document.js")).markdown(snapshot)
      : await runWorker(
          new URL("./worker.js", import.meta.url),
          { id, snapshot, valuesOnly },
          { signal, timeout },
        );
  signal?.throwIfAborted();
  const blob = new Blob([result.bytes ?? result.text], { type: target.mime });
  if (blob.size > EXPORT_LIMITS.output) throw Error("Export exceeds 32 MiB.");
  return {
    name: fileName(snapshot.title, target.extension),
    blob,
    diagnostics: [...snapshot.diagnostics, ...(result.diagnostics || [])],
  };
}
