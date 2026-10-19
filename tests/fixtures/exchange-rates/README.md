# ECB reference data

`ecb-2026-10-16.xml` is the unmodified daily feed retrieved on 2026-10-18 from
[the ECB](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml).
`ecb-api-2026-10-16.csv` is the unmodified response retrieved on 2026-10-18 from
[the official ECB data API](https://data-api.ecb.europa.eu/service/data/EXR/D..EUR.SP00.A?lastNObservations=1&format=csvdata).
The API permits browser cross-origin reads; the daily XML endpoint does not.
The adapter retains decimal text from the API, selects the latest publication,
and excludes discontinued older series before building a compatible XML snapshot.
The XML fixture also tests legacy cache compatibility. Differences in trailing
zeros between the XML and CSV feeds do not change their numeric values.
[The reference-rate page](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html)
describes the publication schedule and EUR base. These are reference rates for
information, not transaction quotes. Tests fix the clock or alter dates explicitly;
the file's date is not a claim that a cached rate is current.

The adapter tests compare CalcFile results with the same pinned reference engine
given its documented decimal-string rate environment. The original 37-case
conformance corpus remains unmodified. Synthetic precision and malformed-input
cases are project tests, not additional upstream conformance cases.
