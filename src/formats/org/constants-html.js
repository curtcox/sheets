import { escapeHTML } from "../../util.js";

export function renderFileConstants(entries) {
  const explanation = "Effective file-level values. Table parameters and named fields can override these.";
  if (!entries.length)
    return '<p class="org-constants-empty">No file constants declared.</p>';
  const rows = entries.map(({ name, value, line, valid }) =>
    `<tr><th scope="row" class="org-left"><code>$${escapeHTML(name)}</code></th>` +
    `<td class="org-${valid ? "right" : "left"}">${valid ? escapeHTML(value) : `<span class="error">Unsupported: ${escapeHTML(value)}</span>`}</td>` +
    `<td class="org-left">Line ${line}</td></tr>`,
  ).join("");
  return `<p>${explanation}</p><div class="org-table-scroll" role="region" aria-label="File constants" tabindex="0"><table class="org-constants"><caption>File constants</caption><thead><tr><th scope="col" class="org-left">Name</th><th scope="col" class="org-right">Value</th><th scope="col" class="org-left">Defined on</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
