import { htmlDownload } from "../export-document.js";
import { sourceTitle } from "../downloads.js";
import { sanitize } from "../sanitize.js";

import { EXPORT_LIMITS } from "./model.js";
export { EXPORT_LIMITS, modelText } from "./model.js";
const bytes = (value) => new TextEncoder().encode(value).length;
function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
// Capture only once, after the app has completed its asynchronous post-passes.
export function captureSnapshot(preview, state, result, revision, options = {}) {
  const title =
    preview.querySelector("h1")?.textContent || sourceTitle(state.src);
  const { html, fragment } = htmlDownload(preview, { title, ...options });
  if (bytes(html) > EXPORT_LIMITS.document)
    throw Error("Export document exceeds 8 MiB.");
  const root = document.createElement("div");
  root.innerHTML = sanitize(fragment);
  const diagnostics = [];
  const visit = (node) => {
    if (node.nodeType === 3) return { type: "text", text: node.textContent };
    if (node.nodeType !== 1) return null;
    const tag = node.localName,
      children = () => [...node.childNodes].map(visit).filter(Boolean);
    if (tag === "input")
      return {
        type: "text",
        text:
          node.type === "checkbox"
            ? node.checked
              ? "[x]"
              : "[ ]"
            : node.value,
      };
    if (tag === "img") {
      const src = node.getAttribute("src") || "",
        embedded = /^data:image\/(?:png|jpeg|webp);base64,/i.test(src);
      if (!embedded)
        diagnostics.push(
          "Linked images stay linked in HTML/Markdown; Word uses their descriptions. Include pictures in the Sheets project to package them.",
        );
      return {
        type: "image",
        src: embedded || /^https?:/i.test(src) ? src : "",
        alt: node.alt || "Picture",
        width: Number(node.getAttribute("width")) || 640,
      };
    }
    if (tag === "svg")
      return {
        type: "svg",
        svg: sanitize(node.outerHTML),
        alt:
          node.getAttribute("aria-label") ||
          node.textContent.trim() ||
          "Diagram",
      };
    if (tag === "math") {
      const tex = node.querySelector(
        'annotation[encoding="application/x-tex"]',
      )?.textContent;
      diagnostics.push(
        "Equations are exported as readable text outside HTML and Pages.",
      );
      return {
        type: "math",
        text: tex || node.textContent,
        display: node.getAttribute("display") === "block",
      };
    }
    if (tag === "a")
      return {
        type: "link",
        href: node.getAttribute("href") || "",
        children: children(),
      };
    if (/^h[1-6]$/.test(tag))
      return { type: "heading", level: Number(tag[1]), children: children() };
    const types = {
      p: "paragraph",
      pre: "code",
      blockquote: "quote",
      ul: "list",
      ol: "list",
      li: "item",
      table: "table",
      tr: "row",
      td: "cell",
      th: "cell",
      strong: "strong",
      b: "strong",
      em: "em",
      i: "em",
      del: "strike",
      s: "strike",
      code: "inlineCode",
      br: "break",
      hr: "rule",
    };
    return {
      type: types[tag] || "group",
      ...(tag === "ol" ? { ordered: true } : {}),
      ...(tag === "th" ? { header: true } : {}),
      ...(tag === "tr" && options.appearance !== "plain"
        ? { shaded: [...node.parentElement.children].indexOf(node) % 2 === 1 } : {}),
      ...(tag === "td" || tag === "th"
        ? { colspan: node.colSpan, rowspan: node.rowSpan }
        : {}),
      children: children(),
    };
  };
  const model = [...root.childNodes].map(visit).filter(Boolean);
  let cells = 0;
  const count = (nodes) => {
    for (const n of nodes) {
      if (n.type === "cell") cells++;
      count(n.children || []);
    }
  };
  count(model);
  if (cells > EXPORT_LIMITS.cells)
    throw Error("Export exceeds 100,000 table cells.");
  return freeze({
    revision,
    title,
    html,
    fragment,
    model,
    state: structuredClone(state),
    workbook: structuredClone(result.workbook),
    renderDiagnostics: structuredClone(result.diagnostics || []),
    diagnostics: [...new Set(diagnostics)],
  });
}
