import { escapeHTML } from "../../util.js";

export function renderSharedInputs(inputs) {
  if (!inputs.length) return "";
  return '<section class="org-shared-inputs"><h2>Shared inputs</h2><p>Read-only file constants pinned by CID. Dependency formulas are not executed. Reloading needs these inputs to remain available.</p>' +
    inputs.map(({ alias, cid, line, entries, error }) => {
      const label = escapeHTML(alias || "Invalid declaration");
      if (error) return `<p class="error">${label} (line ${line}): ${escapeHTML(error)}</p>`;
      const rows = entries.map(({ name, value, line }) => `<tr><th scope="row" class="org-left"><code>$${label}.${escapeHTML(name)}</code></th><td class="org-right">${escapeHTML(value)}</td><td class="org-left">Line ${line}</td></tr>`).join("");
      return `<p>${label}: <a href="https://256t.us/${cid}">${cid}</a></p><div class="org-table-scroll" role="region" aria-label="Shared input ${label}" tabindex="0"><table class="org-inputs"><caption>${label}</caption><thead><tr><th scope="col" class="org-left">Name</th><th scope="col" class="org-right">Value</th><th scope="col" class="org-left">Defined on</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }).join("") + "</section>";
}
