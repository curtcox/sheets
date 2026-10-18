import { optionalStorage } from "./util.js";
const key = "sheets:ecb-rates:v1",
  lifetime = 24 * 60 * 60 * 1000;
let cached;
export async function exchangeRates({
  signal,
  fetchSource = globalThis.fetch,
  storage = optionalStorage("localStorage"),
} = {}) {
  if (!cached)
    try {
      cached = JSON.parse(storage?.getItem(key) || "null");
    } catch {
      /* Storage is optional. */
    }
  if (cached?.xml && Date.now() - cached.time < lifetime)
    return { ...cached, notice: null };
  try {
    const response = await fetchSource(
      "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml",
      {
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(5000)])
          : AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    if (!/currency=['"]USD['"]/.test(xml))
      throw new Error("Invalid ECB response");
    cached = { xml, time: Date.now() };
    try {
      storage?.setItem(key, JSON.stringify(cached));
    } catch {
      /* Optional. */
    }
    return { ...cached, notice: null };
  } catch (error) {
    signal?.throwIfAborted();
    return {
      xml: cached?.xml || null,
      notice: cached?.xml
        ? "Using cached ECB rates; current rates are unavailable."
        : "ECB exchange rates are unavailable. Currency conversions may fail.",
    };
  }
}
export function ratesFromXML(xml) {
  const rates = { EUR: 1 };
  for (const m of (xml || "").matchAll(
    /currency=['"]([A-Z]+)['"]\s+rate=['"]([\d.]+)['"]/g,
  ))
    rates[m[1]] = Number(m[2]);
  return rates;
}
