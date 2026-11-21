/** Navigation inside the rendered preview that must not touch the document address. */
export function setupPreviewNavigation(preview) {
  preview.addEventListener("keydown", (event) => {
    const area = event.target.closest?.(".org-table-scroll, .chart-scroll");
    if (
      !area ||
      event.target !== area ||
      !["ArrowLeft", "ArrowRight"].includes(event.key) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      area.scrollWidth <= area.clientWidth
    )
      return;
    // Native horizontal keyboard scrolling varies across browser engines.
    event.preventDefault();
    area.scrollLeft += event.key === "ArrowRight" ? 40 : -40;
  });
  preview.addEventListener("click", (event) => {
    const reference = event.target.closest?.('a[href^="#"]');
    if (reference) {
      // The fragment can hold a CID or source. References scroll within the preview
      // without replacing any part of the document address.
      event.preventDefault();
      try {
        const id = decodeURIComponent(reference.getAttribute("href").slice(1));
        preview.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ block: "start" });
      } catch {
        /* Malformed references leave the document address intact. */
      }
      return;
    }
    const report = event.target.closest?.("[data-report]");
    if (!report) return;
    preview.querySelectorAll("[role=tab]").forEach((b) => b.setAttribute("aria-selected", b === report));
    preview
      .querySelectorAll("[role=tabpanel]")
      .forEach((p) => (p.hidden = p.id !== `report-${report.dataset.report}`));
  });
}
