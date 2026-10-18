import { plugin } from "../registry.js";
import { runWorker } from "../../worker-client.js";
import { exchangeRates } from "../../exchange-rates.js";
import { escapeHTML } from "../../util.js";
export default plugin("hurmet", async (src, { signal } = {}) => {
  const rates = /\b(?:USD|EUR|GBP|JPY|CHF)\b|[$€£¥]/.test(src)
    ? await exchangeRates({ signal })
    : {};
  const result = await runWorker(
    new URL("../../workers/hurmet.worker.js", import.meta.url),
    { src, xml: rates.xml },
    { signal, timeout: 20000 },
  );
  if (rates.notice)
    result.html =
      `<p class="notice">${escapeHTML(rates.notice)}</p>` + result.html;
  return result;
});
