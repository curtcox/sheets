import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createExchangeRates,
  rateTableFromXML,
  ratesFromXML,
  rateXMLFromCSV,
  ECB_URL,
} from "../../src/exchange-rates.js";
const xml = readFileSync(
  new URL("../fixtures/exchange-rates/ecb-2026-10-16.xml", import.meta.url),
  "utf8",
);
const csv = readFileSync(
  new URL("../fixtures/exchange-rates/ecb-api-2026-10-16.csv", import.meta.url),
  "utf8",
);
const today = Date.parse("2026-10-18T12:00:00Z"),
  day = 86400000;
const response = (body = csv) => ({ ok: true, text: async () => body });
const storage = (data = null) => {
  let value = data === null ? null : JSON.stringify(data);
  return {
    getItem: () => value,
    setItem: (key, next) => {
      assert.equal(key, "sheets:ecb-rates:v1");
      value = next;
    },
  };
};

test("ECB API CSV becomes a coherent XML snapshot without rounding or mixing discontinued series", () => {
  const table = rateTableFromXML(rateXMLFromCSV(csv));
  assert.equal(table.asOf, "2026-10-16");
  assert.equal(table.rates.USD, "1.1253");
  assert.equal(table.rates.GBP, "0.84385");
  assert.ok(!Object.hasOwn(table.rates, "RUB"));
  assert.ok(!Object.hasOwn(table.rates, "ARS"));
  const precise = csv.replace(
    ",1.1253,",
    ",1.1234567890123456789012345678901234567890,",
  );
  assert.equal(
    rateTableFromXML(rateXMLFromCSV(precise)).rates.USD,
    "1.1234567890123456789012345678901234567890",
  );
  assert.equal(
    rateTableFromXML(
      rateXMLFromCSV(
        'FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE,TITLE\r\nD,USD,EUR,SP00,A,2026-10-16,1.25,"A comma, and ""quotes""\ninside a field"\r\n',
      ),
    ).rates.USD,
    "1.25",
  );
});
test("malformed CSV quoting, schemas, series, dates and current rates are rejected", () => {
  const header =
    "FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE\n";
  const row = "D,USD,EUR,SP00,A,2026-10-16,1.25\n";
  for (const bad of [
    "",
    " ".repeat(256001),
    header + row.slice(0, row.lastIndexOf(",")),
    header + row + row,
    header + row.replace("EUR", "GBP"),
    header + row.replace("2026-10-16", "2026-02-30"),
    header + row.replace("USD", "EUR"),
    header + row.replace("SP00", "BAD"),
    header + row.replace("1.25", '"1.25"junk'),
    header + row.replace("1.25", '"1.25'),
    header + row.replace("1.25", '1".25'),
    header + row.replace("1.25", "-1"),
    header + row.replace("1.25", "1e2"),
    header + row.replace("1.25", "NaN"),
    header + row.replace("1.25", "1'/><evil>"),
    header.replace("OBS_VALUE", "BAD") + row,
    header + row.replace("USD", "GBP"),
  ]) {
    assert.throws(() => rateXMLFromCSV(bad), /Invalid ECB/);
  }
});

test("ECB daily parsing retains decimal lexemes, publication date and the Hurmet numeric interface", () => {
  const table = rateTableFromXML(xml);
  assert.equal(table.base, "EUR");
  assert.equal(table.asOf, "2026-10-16");
  assert.equal(table.rates.USD, "1.1253");
  assert.equal(table.rates.SEK, "11.1450");
  const precise = xml.replace(
    "1.1253",
    "1.1234567890123456789012345678901234567890",
  );
  assert.equal(
    rateTableFromXML(precise).rates.USD,
    "1.1234567890123456789012345678901234567890",
  );
  assert.equal(ratesFromXML(xml).USD, 1.1253);
  assert.equal(ratesFromXML(xml).EUR, 1);
  assert.equal(
    rateTableFromXML(
      xml.replace(
        /currency='USD' rate='1.1253'/,
        'rate="1.1253" currency="USD"',
      ),
    ).rates.USD,
    "1.1253",
  );
});
test("malformed ECB rates, dates, duplicate entries, markup and oversized input are rejected", () => {
  for (const bad of [
    "<html>currency='USD'</html>",
    xml.slice(0, -20),
    xml + "junk",
    xml.replace("2026-10-16", "2026-02-30"),
    xml.replace("currency='USD'", "currency='USD' currency='USD'"),
    xml.replace("currency='JPY'", "currency='USD'"),
    xml.replace("currency='USD'", "currency='EUR'"),
    xml.replace("<Cube currency='USD' rate='1.1253'/>", ""),
    xml.replace("rate='1.1253'", ""),
    xml.replace("</gesmes:Envelope>", "</Envelope>"),
    xml.replace("<Cube>", "<!DOCTYPE xml><Cube>"),
    " ".repeat(256001),
    null,
    ...[
      "0",
      "-1",
      "NaN",
      "Infinity",
      "1.2.3",
      "1e2",
      "&evil;",
      "1<script>",
    ].map((rate) => xml.replace("1.1253", rate)),
  ])
    assert.throws(() => rateTableFromXML(bad), /Invalid ECB/);
});
test("fresh ECB memory and storage caches avoid requests and expire after 24 hours", async () => {
  let time = today,
    calls = 0;
  const cache = storage(),
    get = createExchangeRates({ now: () => time });
  const options = {
    storage: cache,
    fetchSource: async (url) => {
      assert.equal(url, ECB_URL);
      calls++;
      return response();
    },
  };
  const first = await get(options);
  assert.equal(first.table.rates.USD, "1.1253");
  assert.equal(first.notice, null);
  assert.equal(first.stale, false);
  time += day - 1;
  await get(options);
  await createExchangeRates({ now: () => time })(options);
  assert.equal(calls, 1);
  time++;
  await get(options);
  assert.equal(calls, 2);
  assert.deepEqual(Object.keys(JSON.parse(cache.getItem())).sort(), [
    "time",
    "xml",
  ]);
});
test("offline or malformed refreshes retain validated stale rates and the original date/time", async () => {
  for (const fetchSource of [
    async () => {
      throw new Error("offline");
    },
    async () => response("bad"),
    async () => ({ ok: false, status: 503 }),
  ]) {
    const cache = storage({ xml, time: today - 2 * day });
    const result = await createExchangeRates({ now: () => today })({
      storage: cache,
      fetchSource,
    });
    assert.equal(result.table.asOf, "2026-10-16");
    assert.equal(result.time, today - 2 * day);
    assert.equal(result.stale, true);
    assert.match(result.notice, /Using cached ECB/);
    assert.equal(JSON.parse(cache.getItem()).time, today - 2 * day);
  }
});
test("corrupted, future or invalid stored rates are not used as fallback", async () => {
  for (const data of [
    { xml: "bad", time: today },
    { xml, time: today + 1 },
    { xml, time: "today" },
    { xml: xml.replace("2026-10-16", "2026-10-20"), time: today },
  ]) {
    const result = await createExchangeRates({ now: () => today })({
      storage: storage(data),
      fetchSource: async () => response("bad"),
    });
    assert.equal(result.xml, null);
    assert.equal(result.table, null);
    assert.match(result.notice, /unavailable/);
  }
  const denied = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("denied");
    },
  };
  const result = await createExchangeRates({ now: () => today })({
    storage: denied,
    fetchSource: async () => response(),
  });
  assert.equal(result.table.rates.USD, "1.1253");
});
test("an old publication is disclosed even when it was downloaded recently", async () => {
  const result = await createExchangeRates({ now: () => today })({
    storage: storage({
      xml: xml.replace("2026-10-16", "2026-10-01"),
      time: today,
    }),
    fetchSource: () => assert.fail("fresh cache"),
  });
  assert.equal(result.stale, true);
  assert.match(result.notice, /seven days old/);
});
test("aborts before cache access, during fetch or during body reading propagate without cache writes", async () => {
  const aborted = new AbortController();
  aborted.abort();
  await assert.rejects(
    createExchangeRates({ now: () => today })({
      signal: aborted.signal,
      storage: { getItem: () => assert.fail("aborted") },
    }),
    { name: "AbortError" },
  );
  for (const phase of ["fetch", "body"]) {
    const controller = new AbortController(),
      cache = storage();
    let release;
    const delayed = new Promise((resolve) => (release = resolve));
    const pending = createExchangeRates({ now: () => today })({
      signal: controller.signal,
      storage: cache,
      fetchSource: async () => {
        if (phase === "fetch") await delayed;
        return {
          ok: true,
          text: async () => {
            if (phase === "body") await delayed;
            return csv;
          },
        };
      },
    });
    controller.abort();
    release();
    await assert.rejects(pending, { name: "AbortError" });
    assert.equal(cache.getItem(), null);
  }
});
test("timeouts fall back to cache and overlapping requests cannot roll back a newer publication", async () => {
  const cache = storage({ xml, time: today - 2 * day });
  const result = await createExchangeRates({ now: () => today, timeout: 1 })({
    storage: cache,
    fetchSource: async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return response();
    },
  });
  assert.equal(result.stale, true);
  assert.equal(result.time, today - 2 * day);
  const get = createExchangeRates({ now: () => today }),
    stored = storage();
  let release;
  const first = get({
    storage: stored,
    fetchSource: () => new Promise((resolve) => (release = resolve)),
  });
  await get({
    storage: stored,
    fetchSource: async () =>
      response(csv.replaceAll("2026-10-16", "2026-10-17")),
  });
  release(response());
  assert.equal((await first).table.asOf, "2026-10-17");
  assert.match(JSON.parse(stored.getItem()).xml, /2026-10-17/);
});
