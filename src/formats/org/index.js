import { plugin } from "../registry.js";
import * as orga from "../../../vendor/orga.js";
import { recalculateOrg } from "./engine.js";
import { escapeHTML } from "../../util.js";
function cellHTML(cell) {
  // Keep individual values intact, including signed/scientific money text.
  // Multiword labels may wrap at ordinary word boundaries.
  const wrap = /\s/.test(cell) ? ' class="org-table-wrap"' : "";
  return `<td${wrap}>${escapeHTML(cell)}</td>`;
}
function nodeHTML(node) {
  const children = () => (node.children || []).map(nodeHTML).join("");
  switch (node.type) {
    case "text": {
      const text = escapeHTML(node.value),
        tag = {
          bold: "strong",
          italic: "em",
          underline: "u",
          strikeThrough: "del",
          code: "code",
          verbatim: "code",
        }[node.style];
      return tag ? `<${tag}>${text}</${tag}>` : text;
    }
    case "headline": {
      const level = Math.min(node.level || 2, 6),
        title = (node.children || [])
          .filter((n) => !["todo", "tags"].includes(n.type))
          .map(nodeHTML)
          .join("");
      // Org's HTML export shows TODO keywords and tags by default.
      return `<h${level}>${node.keyword ? `<span class="org-todo">${escapeHTML(node.keyword)}</span> ` : ""}${title}${node.tags?.length ? ` <span class="org-tags">${node.tags.map(escapeHTML).join(" ")}</span>` : ""}</h${level}>`;
    }
    case "planning":
      // Org omits planning lines and these drawers from exports by default.
      return "";
    case "drawer":
      return ["PROPERTIES", "LOGBOOK"].includes(node.name?.toUpperCase())
        ? ""
        : children();
    case "paragraph":
      return `<p>${children()}</p>`;
    case "list": {
      const tag = node.ordered ? "ol" : "ul";
      return `<${tag}>${children()}</${tag}>`;
    }
    case "list.item":
      return `<li>${children()}</li>`;
    case "bold":
      return `<strong>${children()}</strong>`;
    case "italic":
      return `<em>${children()}</em>`;
    case "code":
    case "verbatim":
      return `<code>${escapeHTML(node.value || "")}</code>`;
    case "link": {
      const path = node.path?.value || node.url || "",
        label =
          (node.children || [])
            .filter((n) => n.type === "text")
            .map(nodeHTML)
            .join("") || escapeHTML(path);
      return `<a href="${escapeHTML(path)}">${label}</a>`;
    }
    case "keyword":
      return node.key?.toUpperCase() === "TITLE"
        ? `<h1>${escapeHTML(node.value)}</h1>`
        : "";
    case "block": {
      const name = node.name?.toUpperCase();
      if (name === "COMMENT") return "";
      if (["SRC", "EXAMPLE", "EXPORT"].includes(name))
        return `<pre><code>${escapeHTML(node.value || "")}</code></pre>`;
      return children();
    }
    case "table":
    case "link.path":
    case "opening":
    case "closing":
    case "stars":
    case "list.item.bullet":
      return "";
    case "newline":
      return "\n";
    default:
      return node.children ? children() : escapeHTML(node.value || "");
  }
}
export function renderOrg(src, options = {}) {
  const result = recalculateOrg(src, options),
    parts = [];
  let pos = 0;
  for (const { start, end, table } of result.tables) {
    const prose = src.split("\n").slice(pos, start).join("\n");
    parts.push(nodeHTML(orga.parse(prose)));
    parts.push(
      `<div class="org-table-scroll" role="region" aria-label="Org table" tabindex="0"><table>${table.layout.map((index) => (index === null ? "" : `<tr>${table.rows[index].map(cellHTML).join("")}</tr>`)).join("")}</table></div>`,
    );
    pos = end;
  }
  parts.push(nodeHTML(orga.parse(src.split("\n").slice(pos).join("\n"))));
  return {
    html:
      parts.join("") +
      '<button data-action="copy-org">Copy recalculated source</button>',
    diagnostics: result.diagnostics,
    recalculatedSource: result.source,
  };
}
export default plugin("org", async (src, options) => renderOrg(src, options));
