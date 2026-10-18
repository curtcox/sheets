import DOMPurify from "../vendor/dompurify.js";
const graphics = new Set([
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-miterlimit",
  "opacity",
  "color",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "text-anchor",
  "dominant-baseline",
  "white-space",
  "display",
  "vertical-align",
  "margin-left",
  "margin-right",
  "padding-left",
  "padding-right",
  "height",
  "width",
  "min-width",
  "max-width",
  "transform",
  "transform-origin",
]);
DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
  if (data.attrName !== "style") return;
  if (
    ![
      "http://www.w3.org/2000/svg",
      "http://www.w3.org/1998/Math/MathML",
    ].includes(node.namespaceURI)
  ) {
    data.keepAttr = false;
    return;
  }
  data.attrValue = data.attrValue
    .split(";")
    .filter((declaration) => {
      const colon = declaration.indexOf(":"),
        name = declaration.slice(0, colon).trim().toLowerCase(),
        value = declaration.slice(colon + 1).trim();
      return (
        colon > 0 &&
        graphics.has(name) &&
        value &&
        !/url\s*\(|expression|javascript|@|[<>\\]/i.test(value)
      );
    })
    .join(";");
  if (!data.attrValue) data.keepAttr = false;
});
// Final boundary for every engine, including Python HTML and generated SVG.
export const sanitize = (html) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, mathMl: true, svg: true, svgFilters: true },
    FORBID_TAGS: [
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "foreignObject",
      "animate",
      "animateMotion",
      "animateTransform",
      "set",
    ],
    FORBID_ATTR: ["srcset", "autofocus", "formaction", "target"],
    ADD_ATTR: [
      "display",
      "data-line",
      "data-report",
      "data-action",
      "data-cell",
      "data-mermaid",
    ],
  });
export function setPreview(element, html) {
  element.innerHTML = sanitize(html);
}
