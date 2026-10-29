import { plugin } from "../registry.js";
import * as orga from "../../../vendor/orga.js";
import { recalculateOrg } from "./engine.js";
import { escapeHTML } from "../../util.js";
import { renderOrgTable } from "./table-html.js";
import { orgParserSource } from "./bindings.js";
import { renderFileConstants } from "./constants-html.js";
import { loadOrgInputs } from "./inputs.js";
import { renderSharedInputs } from "./inputs-html.js";
import { controlHTML } from "../../controls.js";
import { orgCharts } from "./plot.js";
// `context.control(line)` renders a SHEETS_CONTROL keyword at its slice-relative line.
function nodeHTML(node, context = {}) {
  const child = (n) => nodeHTML(n, context),
    children = () => (node.children || []).map(child).join("");
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
          .map(child)
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
      // A plot's file: link shows the chart there instead of after its table.
      const chart = node.path?.protocol === "file" && context.fileChart?.(node.path.value);
      if (chart) return chart;
      const path = node.path?.value || node.url || "",
        label =
          (node.children || [])
            .filter((n) => n.type === "text")
            .map(child)
            .join("") || escapeHTML(path);
      return `<a href="${escapeHTML(path)}">${label}</a>`;
    }
    case "keyword":
      if (node.key?.toUpperCase() === "SHEETS_CONTROL")
        return context.control?.(node.position.start.line) ?? "";
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
// Paths of [[file:…]] links outside literal blocks, which can host plots.
function linkedFiles(root) {
  const files = new Set(), stack = [root];
  while (stack.length) {
    const node = stack.pop();
    if (node.type === "block" && ["SRC", "EXAMPLE", "EXPORT", "COMMENT"].includes(node.name?.toUpperCase())) continue;
    if (node.type === "link" && node.path?.protocol === "file") files.add(node.path.value);
    stack.push(...(node.children || []));
  }
  return files;
}
export function renderOrg(src, options = {}) {
  // Edits address the original text, whose first line may start with a BOM.
  const bom = src.startsWith("\uFEFF") ? 1 : 0;
  src = orgParserSource(src);
  const result = recalculateOrg(src, options),
    parts = [],
    controls = result.controls.map((control) =>
      bom && control.edit.line === 1 ? { ...control, edit: { ...control.edit, column: control.edit.column + bom } } : control),
    controlLines = new Map(controls.map((control) => [control.line, controlHTML(control)])),
    prose = (from, to) => nodeHTML(orga.parse(src.split("\n").slice(from, to).join("\n")), {
      control: (line) => controlLines.get(from + line),
      fileChart(name) {
        const chart = fileCharts.get(name);
        if (!chart || chart.placed) return undefined;
        chart.placed = true;
        return chart.html;
      },
    });
  const plots = orgCharts(src.split("\n"), result.tables),
    linked = linkedFiles(orga.parse(src)),
    fileCharts = new Map();
  for (const chart of plots.charts.values())
    if (chart.file && linked.has(chart.file) && !fileCharts.has(chart.file)) fileCharts.set(chart.file, chart);
  let pos = 0,
    sharedPending = true,
    constantsPending = result.showConstants;
  const constants = () => {
    if (sharedPending) {
      parts.push(renderSharedInputs(result.sharedInputs, options.inputSnapshot !== undefined));
      sharedPending = false;
    }
    if (!constantsPending) return;
    parts.push(renderFileConstants(result.fileConstants));
    constantsPending = false;
  };
  for (const { start, end, table } of result.tables) {
    parts.push(prose(pos, start));
    constants();
    const chart = plots.charts.get(start);
    parts.push(renderOrgTable(table), chart && fileCharts.get(chart.file) !== chart ? chart.html : "");
    pos = end;
  }
  parts.push(prose(pos));
  constants();
  if (result.formulaHints.length)
    parts.push('<aside class="notice" aria-label="Formula hints"><strong>Formula hints</strong><ul>' +
      result.formulaHints.map(({ line, message }) => `<li>Line ${line}: ${escapeHTML(message)}</li>`).join("") +
      "</ul></aside>");
  return {
    html:
      parts.join("") +
      '<button data-action="copy-org">Copy recalculated source</button>',
    diagnostics: [...result.diagnostics, ...plots.diagnostics],
    controls,
    recalculatedSource: result.source,
    inputsReady: !result.sharedInputs.some((input) => input.error),
  };
}
export async function renderOrgWithInputs(src, options = {}) {
  const inputs = await loadOrgInputs(src, options);
  options.signal?.throwIfAborted();
  return {
    ...renderOrg(src, { ...options, inputs }),
    inputPayloads: new Map([...inputs.values()].filter((input) => !input.error).map((input) => [input.cid, input.bytes])),
  };
}
export default plugin("org", renderOrgWithInputs);
