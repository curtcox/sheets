import { optionalStorage } from "./util.js";
export const ECB_URL =
  "https://data-api.ecb.europa.eu/service/data/EXR/D..EUR.SP00.A?lastNObservations=1&format=csvdata";
const key = "sheets:ecb-rates:v1",
  day = 24 * 60 * 60 * 1000;
const invalid = () => new Error("Invalid ECB daily rate response.");
const validRate = (rate) =>
  typeof rate === "string" &&
  rate.length <= 128 &&
  /^\d+(?:\.\d+)?$/.test(rate) &&
  /[1-9]/.test(rate);
function validDate(date) {
  const time = Date.parse(date + "T00:00:00Z");
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === date
  );
}

/** A bounded parser for the ECB daily XML vocabulary; rate lexemes stay decimal strings. */
export function rateTableFromXML(xml) {
  if (typeof xml !== "string" || xml.length > 256000) throw invalid();
  const stack = [],
    rates = {},
    dates = [];
  let cursor = 0,
    root = false,
    tags = 0;
  const tokens =
    /<!--[\s\S]*?-->|<\?xml\s[^?]*\?>|<\/?[A-Za-z_][\w:.-]*(?:\s+[^<>]*?)?\/?>/g;
  for (const match of xml.matchAll(tokens)) {
    const text = xml.slice(cursor, match.index);
    if (
      /[<>]/.test(text) ||
      (text.trim() && (!stack.length || stack.at(-1).name === "Cube"))
    )
      throw invalid();
    cursor = match.index + match[0].length;
    const tag = match[0];
    if (++tags > 1000) throw invalid();
    if (tag.startsWith("<!--") || tag.startsWith("<?xml")) continue;
    const closing = /^<\/([\w:.-]+)\s*>$/.exec(tag);
    if (closing) {
      if (stack.pop()?.name !== closing[1]) throw invalid();
      continue;
    }
    const opening = /^<([\w:.-]+)([\s\S]*?)(\/?)>$/.exec(tag);
    if (!opening) throw invalid();
    const [, name, raw, selfClosing] = opening,
      attrs = new Map();
    let end = 0;
    for (const a of raw.matchAll(/\s+([\w:.-]+)\s*=\s*(["'])(.*?)\2/g)) {
      if (raw.slice(end, a.index).trim() || attrs.has(a[1])) throw invalid();
      attrs.set(a[1], a[3]);
      end = a.index + a[0].length;
    }
    if (raw.slice(end).trim()) throw invalid();
    const parent = stack.at(-1);
    if (!parent) {
      if (
        root ||
        name !== "gesmes:Envelope" ||
        attrs.get("xmlns") !==
          "http://www.ecb.int/vocabulary/2002-08-01/eurofxref"
      )
        throw invalid();
      root = true;
    }
    if (name === "Cube") {
      if (attrs.has("time")) {
        const date = attrs.get("time");
        if (
          attrs.size !== 1 ||
          selfClosing ||
          parent?.name !== "Cube" ||
          parent.attrs.size ||
          !validDate(date)
        )
          throw invalid();
        dates.push(date);
      } else if (attrs.has("currency") || attrs.has("rate")) {
        const code = attrs.get("currency"),
          rate = attrs.get("rate");
        if (
          attrs.size !== 2 ||
          !selfClosing ||
          !parent?.attrs.has("time") ||
          !/^[A-Z]{3}$/.test(code || "") ||
          code === "EUR" ||
          Object.hasOwn(rates, code) ||
          !validRate(rate)
        )
          throw invalid();
        rates[code] = rate;
      } else if (
        attrs.size ||
        parent?.name !== "gesmes:Envelope" ||
        selfClosing
      )
        throw invalid();
    }
    if (!selfClosing) stack.push({ name, attrs });
    if (stack.length > 16) throw invalid();
  }
  if (
    !root ||
    stack.length ||
    xml.slice(cursor).trim() ||
    dates.length !== 1 ||
    !rates.USD
  )
    throw invalid();
  return { base: "EUR", rates, asOf: dates[0], source: "ECB" };
}

/** The official data API permits browser reads; the daily XML endpoint does not.
 * Rebuild the same daily XML vocabulary for existing caches and Numbat's API.
 */
export function rateXMLFromCSV(csv) {
  if (typeof csv !== "string" || csv.length > 256000) throw invalid();
  const rows = [];
  let row = [],
    field = "",
    quoted = false,
    closed = false;
  const endField = () => {
    row.push(field);
    field = "";
    closed = false;
    if (row.length > 128) throw invalid();
  };
  const endRow = () => {
    endField();
    if (row.some((f) => f !== "")) rows.push(row);
    row = [];
    if (rows.length > 256) throw invalid();
  };
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (quoted) {
      if (c === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += c;
    } else {
      if (closed && !",\r\n".includes(c)) throw invalid();
      if (c === '"') {
        if (field) throw invalid();
        quoted = true;
      } else if (c === ",") endField();
      else if (c === "\r" || c === "\n") {
        endRow();
        if (c === "\r" && csv[i + 1] === "\n") i++;
      } else field += c;
    }
  }
  if (quoted) throw invalid();
  if (field || row.length || closed) endRow();
  const headers = rows.shift();
  if (!headers || new Set(headers).size !== headers.length) throw invalid();
  const fields = [
    "FREQ",
    "CURRENCY",
    "CURRENCY_DENOM",
    "EXR_TYPE",
    "EXR_SUFFIX",
    "TIME_PERIOD",
    "OBS_VALUE",
  ];
  const indices = fields.map((name) => headers.indexOf(name));
  if (indices.includes(-1) || !rows.length) throw invalid();
  const entries = [],
    codes = new Set();
  for (const row of rows) {
    if (row.length !== headers.length) throw invalid();
    const [freq, code, base, type, suffix, date, rate] = indices.map(
      (i) => row[i],
    );
    if (
      freq !== "D" ||
      base !== "EUR" ||
      type !== "SP00" ||
      suffix !== "A" ||
      !/^[A-Z]{3}$/.test(code) ||
      code === "EUR" ||
      codes.has(code) ||
      !validDate(date)
    )
      throw invalid();
    codes.add(code);
    entries.push({ code, date, rate });
  }
  // lastNObservations also includes discontinued series (e.g. RUB). Keep only
  // the latest common publication, rather than mixing old rates into today's data.
  const date = entries.reduce(
    (latest, e) => (e.date > latest ? e.date : latest),
    "",
  );
  const current = entries.filter((e) => e.date === date);
  if (current.some((e) => !validRate(e.rate))) throw invalid();
  const xml = `<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref"><Cube><Cube time='${date}'>${current.map((e) => `<Cube currency='${e.code}' rate='${e.rate}'/>`).join("")}</Cube></Cube></gesmes:Envelope>`;
  rateTableFromXML(xml);
  return xml;
}

/** A separate instance makes cache/cancellation behavior testable without shared test state. */
export function createExchangeRates({ now = Date.now, timeout = 20000 } = {}) {
  let cached;
  function snapshot(data) {
    if (
      !data ||
      !Number.isFinite(data.time) ||
      data.time < 0 ||
      data.time > now()
    )
      return null;
    try {
      const table = rateTableFromXML(data.xml);
      if (Date.parse(table.asOf + "T00:00:00Z") > now()) return null;
      return { xml: data.xml, time: data.time, table };
    } catch {
      return null;
    }
  }
  function result(data, unavailable = false) {
    const oldDate =
      now() - Date.parse(data.table.asOf + "T00:00:00Z") > 7 * day;
    unavailable ||= now() - data.time >= day;
    return {
      ...data,
      stale: unavailable || oldDate,
      notice: unavailable
        ? "Using cached ECB rates; current rates are unavailable."
        : oldDate
          ? "ECB reference rates are more than seven days old."
          : null,
    };
  }
  return async function exchangeRates({
    signal,
    fetchSource = globalThis.fetch,
    storage = optionalStorage("localStorage"),
  } = {}) {
    signal?.throwIfAborted();
    cached = snapshot(cached);
    if (!cached)
      try {
        cached = snapshot(JSON.parse(storage?.getItem(key) || "null"));
      } catch {
        /* Optional storage. */
      }
    if (cached && now() - cached.time < day) return result(cached);
    try {
      const requestSignal = signal
        ? AbortSignal.any([signal, AbortSignal.timeout(timeout)])
        : AbortSignal.timeout(timeout);
      const response = await fetchSource(ECB_URL, { signal: requestSignal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const csv = await response.text();
      requestSignal.throwIfAborted();
      const xml = rateXMLFromCSV(csv);
      const fresh = snapshot({ xml, time: now() });
      if (!fresh) throw invalid();
      signal?.throwIfAborted();
      // An older overlapping request must not roll back a newer publication.
      if (!cached || fresh.table.asOf >= cached.table.asOf) cached = fresh;
      try {
        storage?.setItem(
          key,
          JSON.stringify({ xml: cached.xml, time: cached.time }),
        );
      } catch {
        /* Optional storage. */
      }
      return result(cached);
    } catch {
      signal?.throwIfAborted();
      return cached
        ? result(cached, true)
        : {
            xml: null,
            table: null,
            stale: false,
            notice:
              "ECB exchange rates are unavailable. Currency conversions may fail.",
          };
    }
  };
}
export const exchangeRates = createExchangeRates();
// Retain the previous numeric helper; the worker adapters now use decimal text.
export function ratesFromXML(xml) {
  return Object.fromEntries(
    Object.entries({ EUR: "1", ...rateTableFromXML(xml).rates }).map(
      ([code, rate]) => [code, Number(rate)],
    ),
  );
}
