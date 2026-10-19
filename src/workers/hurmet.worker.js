import { rateTableFromXML } from "../exchange-rates.js";
self.onmessage = async ({ data: { src, xml } }) => {
  try {
    // Hurmet's rational parser expects decimal text, including the EUR base.
    if (xml)
      globalThis.currencyRates = { EUR: "1", ...rateTableFromXML(xml).rates };
    const { renderHurmet } = await import("../formats/hurmet/engine.js");
    const result = await renderHurmet(src);
    self.postMessage({
      ...result,
      html: `<div class="hurmet-document">${result.html}</div>`,
    });
  } catch (error) {
    self.postMessage({ error: error.message || String(error) });
  }
};
