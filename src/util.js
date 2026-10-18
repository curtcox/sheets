export const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const diagnostic = (line, message, severity = "error") => ({
  line,
  message,
  severity,
});
export function resultRows(rows) {
  return `<div class="result-lines">${rows.map(({ line, source, output = "", kind = "" }) => `<div class="result-line ${escapeHTML(kind)}" data-line="${line}"><span class="line-number">${line}</span><code>${escapeHTML(source)}</code><output>${output}</output></div>`).join("")}</div>`;
}
export const abortError = () =>
  new DOMException("Rendering cancelled", "AbortError");

export function optionalStorage(name) {
  try {
    return globalThis[name];
  } catch {
    return undefined;
  }
}
