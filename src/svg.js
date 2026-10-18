/** Inline generated SVG class rules before the sanitizer removes <style> elements.
 * Parsing remains inert; only DOMPurify's graphic-property allowlist survives. */
export function inlineSVGStyles(svg) {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  for (const element of doc.querySelectorAll("style")) {
    const sheet = new CSSStyleSheet();
    try {
      sheet.replaceSync(element.textContent);
    } catch {
      element.remove();
      continue;
    }
    function apply(rules) {
      for (const rule of rules) {
        if (rule.selectorText && rule.style) {
          let nodes = [];
          try {
            nodes = doc.querySelectorAll(rule.selectorText);
          } catch {
            continue;
          }
          for (const node of nodes)
            node.setAttribute(
              "style",
              `${node.getAttribute("style") || ""};${rule.style.cssText}`,
            );
        } else if (rule.cssRules) apply(rule.cssRules);
      }
    }
    apply(sheet.cssRules);
    element.remove();
  }
  return new XMLSerializer().serializeToString(doc.documentElement);
}
