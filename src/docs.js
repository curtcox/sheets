import { watchOfflineUpdates } from "./offline.js";
watchOfflineUpdates();
import { catalog } from "./formats/registry.js";
import { linkExamples } from "./docs-examples.js";
import { renderMarkdown, renderDiagrams } from "./formats/gfm/markdown.js";
import { setPreview, sanitize } from "./sanitize.js";
const pages = [
  ["index", "Getting started"],
  ["url-format", "Sharing links"],
  ["hashbin", "HashBin storage"],
  ["format-comparison", "Compare formats & glossary"],
  ["limitations", "Limitations & compatibility"],
  ...catalog.map((f) => [`formats/${f.id}`, f.label]),
];
const selected = new URL(location.href).searchParams.get("page") || "index";
const page = pages.some(([id]) => id === selected) ? selected : "index";
const nav = document.getElementById("docs-nav"),
  content = document.getElementById("docs-content");
for (const [id, label] of pages) {
  if (id === `formats/${catalog[0].id}`) {
    const heading = document.createElement("strong");
    heading.textContent = "Format guides";
    nav.append(heading);
  }
  const link = document.createElement("a");
  link.href = `docs.html?page=${id}`;
  link.textContent = label;
  if (id === page) link.setAttribute("aria-current", "page");
  nav.append(link);
}
try {
  const response = await fetch(`docs/${page}.md`);
  if (!response.ok)
    throw new Error("This documentation page could not be loaded.");
  const result = renderMarkdown(await response.text());
  setPreview(content, result.html);
  for (const link of content.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href");
    if (!href.startsWith("#") && !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) {
      const resolved = new URL(href, new URL(`docs/${page}.md`, location.href));
      const id = resolved.pathname.split("/docs/")[1]?.replace(/\.md$/, "");
      if (
        /\.md$/.test(resolved.pathname) &&
        pages.some(([candidate]) => candidate === id)
      )
        link.href = `docs.html?page=${id}${resolved.hash}`;
      else link.href = resolved.href;
    }
  }
  for (const table of content.querySelectorAll("table")) {
    if (table.querySelectorAll("thead th").length < 4) continue;
    const scroll = document.createElement("div");
    scroll.className = "docs-table-scroll";
    scroll.tabIndex = 0;
    scroll.setAttribute("role", "region");
    scroll.setAttribute("aria-label", "Scrollable feature comparison");
    table.before(scroll);
    scroll.append(table);
  }
  linkExamples(content, page, location.href);
  await renderDiagrams(content, result.mermaid, { sanitize });
} catch (error) {
  content.textContent = error.message;
}
