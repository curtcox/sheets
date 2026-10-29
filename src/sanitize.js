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
// Control ids are only lookup keys into engine descriptors. Keep them on
// supported input types; anything else is left as ordinary sanitized markup.
const controlTypes = new Set(["checkbox", "range", "text"]);
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (!node.hasAttribute?.("data-control")) return;
  if (
    node.nodeName !== "INPUT" ||
    !controlTypes.has((node.getAttribute("type") || "text").toLowerCase())
  )
    node.removeAttribute("data-control");
  else for (const name of ["name", "form", "list"]) node.removeAttribute(name);
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
/**
 * Like setPreview, but keeps matching nodes in place so a control the reader is
 * using survives the re-render. `keep(input)` marks inputs whose live state stays.
 */
export function updatePreview(element, html, keep = () => false) {
  const template = element.ownerDocument.createElement("template");
  template.innerHTML = sanitize(html);
  morphChildren(element, template.content, keep);
}
const sameNode = (a, b) =>
  a.nodeType === b.nodeType &&
  a.nodeName === b.nodeName &&
  (a.nodeType !== 1 ||
    (a.namespaceURI === b.namespaceURI &&
      a.getAttribute("data-control") === b.getAttribute("data-control") &&
      a.getAttribute("type") === b.getAttribute("type")));
function morphChildren(target, source, keep) {
  const next = [...source.childNodes];
  next.forEach((node, index) => {
    const current = target.childNodes[index];
    if (!current) target.append(node);
    else if (!sameNode(current, node)) current.replaceWith(node);
    else if (node.nodeType !== 1) {
      if (current.nodeValue !== node.nodeValue) current.nodeValue = node.nodeValue;
    } else {
      for (const { name } of [...current.attributes])
        if (!node.hasAttribute(name)) current.removeAttribute(name);
      for (const { name, value } of [...node.attributes])
        if (current.getAttribute(name) !== value) current.setAttribute(name, value);
      // Attributes stop driving an input once it is dirty; sync live state too.
      if (current.nodeName === "INPUT" && !keep(current)) {
        if (current.type === "checkbox") current.checked = node.hasAttribute("checked");
        else current.value = node.getAttribute("value") ?? "";
      }
      morphChildren(current, node, keep);
    }
  });
  while (target.childNodes.length > next.length) target.lastChild.remove();
}
