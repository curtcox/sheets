import { ratesFromXML } from "../exchange-rates.js";
self.onmessage = async ({ data: { src, xml } }) => {
  try {
    if (xml) globalThis.currencyRates = ratesFromXML(xml);
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
