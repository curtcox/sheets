import { plugin } from "../registry.js";
import { runWorker } from "../../worker-client.js";
import { exchangeRates } from "../../exchange-rates.js";
import { escapeHTML } from "../../util.js";
export default plugin("numbat", async (src, { signal } = {}) => {
  const currency = /\b(?:USD|EUR|GBP|JPY|CHF|currencies)\b|[$€£¥]/.test(src);
  const rates = currency ? await exchangeRates({ signal }) : {};
  const result = await runWorker(
    new URL("../../workers/numbat.worker.js", import.meta.url),
    { src, xml: rates.xml },
    { signal, timeout: 20000 },
  );
  if (rates.notice)
    result.html =
      `<p class="notice">${escapeHTML(rates.notice)}</p>` + result.html;
  return result;
});
