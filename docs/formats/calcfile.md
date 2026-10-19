# CalcFile

[CalcFile](https://github.com/peetzweg/calcfile) is an experimental, prose-friendly calculation file format. Sheets uses the Apache-2.0 reference `evaluateDocument()` engine at commit `b11ecb44e4a558e3b55879e70266fae714e774d5`.

Use CalcFile for estimates, travel budgets, and running arithmetic with readable
labels. Choose **CalcFile** explicitly; ordinary prose and arithmetic usually fall
back to Markdown in Auto mode. Source downloads use `.calc`.
[Open the starter example](../../index.html?example=calcfile-basic&format=calcfile).

## Start with a budget

```text
Flights = 240 EUR
Hotel = 120 EUR * 2
Dinner = 65 EUR
total
```

The total is **545 EUR**. Each line is evaluated in document order, and results
appear in rows beside their source. A blank line can end a continuation or subtotal
group; a new `#` heading starts a new total section. This is a line calculator,
rather than a Markdown renderer or a spreadsheet grid.

## Syntax reference

| Write | Purpose |
| --- | --- |
| `Monthly rent = 1400 EUR` | Define a friendly, case-insensitive variable name |
| `Monthly rent + 50 EUR` | Reuse the variable |
| `100 + 25%` | Add 25 percent of the base, producing 125 |
| `25% of 100` | Calculate a percentage, producing 25 |
| `ans * 2` | Use the previous result |
| `+ 20` immediately after a result | Continue the previous calculation |
| `subtotal`, `total`, `grand total` | Sum the current group, section, or document |
| `2 inch to cm` | Convert a supported unit; here, 5.08 cm |
| `100 EUR in USD` | Convert using the shared ECB rate cache |
| `@locale de-DE` then `1,5 * 2` | Change numeric parsing/display conventions |
| `// 100 + 200` | Keep a line as a comment |

For German numeric notation, decimal commas and function argument separators
change together: `round(10,234; 2)` produces 10.23 as a value. A line that ends in
an operator or an empty assignment may be marked incomplete while you type.
An aggregate that mixes unrelated types, such as EUR and kilometers, is an error.

## Compatibility and currencies

Results appear beside source lines. Headers, comments, text, directives, and incomplete or erroneous calculations keep their upstream line kinds and statuses. The engine supports friendly variable names, percentages, arithmetic, aggregates, continuation, locale directives, selected units, currencies, and curated functions from its v0.1 draft.

All **37 required upstream conformance cases pass** against the committed corpus,
including supplied currency-rate environments. Sheets supplies validated ECB
decimal rate strings to that same API. This pinned, pre-1.0 draft can change
upstream; Sheets does not claim compatibility with other apps using `.calc`.

CalcFile's resemblance to prose makes automatic selection unreliable. Choose **CalcFile** explicitly. The extension helper recognizes `.calc`; HashBin plain-text payloads do not carry filenames and use Auto instead.

## Use reference currency rates

```text
Budget = 100 EUR
Budget in USD
ans in EUR
100 EUR in GBP
100 EUR in JPY
```

The conversion rows show an **ECB reference rates as of** notice with the
publication date. Answers depend on the available rate snapshot; they are not
fixed example amounts. Rates are [published against EUR by the ECB](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html)
for information, rather than transaction quotes.

The pinned engine recognizes EUR, USD, GBP and JPY. With the supplied EUR-base
table, one side of a conversion must be EUR: EUR ↔ USD, GBP or JPY works. A direct
`100 USD in GBP` conversion still reports missing pair data; `100 EUR in CHF`
has an unsupported target in this draft, even though the ECB publishes CHF rates.
Same-currency arithmetic and conversion need no rate request. Currency labels in
comments or prose and physical-unit conversions also need no request. The engine
identifies actual missing-data calculations, including variables and `ans`,
before the adapter fetches anything.

Rates come directly from the [official ECB data API](https://data-api.ecb.europa.eu/service/data/EXR/D..EUR.SP00.A?lastNObservations=1&format=csvdata),
which permits browser reads. The daily XML download does not permit cross-origin
reads. The adapter preserves decimal text, selects the latest publication date,
and excludes discontinued series with older dates before building the XML snapshot
used by Numbat and the existing cache. No document source is sent with the request.

Validated rates are shared with Numbat and Hurmet and cached for 24 hours in
optional browser storage. If refreshing fails, a valid older snapshot can be used
with a **Using cached ECB rates** notice and its original publication date. A
publication more than seven days old is flagged even if recently downloaded.
Malformed data and corrupt or future cache entries are rejected. With no usable
snapshot, the conversion keeps its source-line diagnostic; later lines continue.
Cancel or edit while a request is pending to discard its result. Requests have a
twenty-second deadline, and cancelled responses do not update the cache.

Offline currency conversion needs a previously cached rate snapshot as well as
the installed app files. Downloading offline files does not preload rates.
Source links, source downloads, and HashBin documents store source rather than
rate snapshots, so reopening can calculate using newer rates. A rendered HTML
export preserves the finished answers and date notice. Browser storage may be
unavailable or evicted; the current render can still use a successful request.

Do not assume support for a function, unit or currency outside the pinned draft.
See the [feature comparison and glossary](../format-comparison.md).

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.

Compare the available libraries and definition syntax in
[built-in and custom functions](../function-comparison.md).

<!-- compatibility:start -->
## Tracked compatibility status

These entries share the [central limitations ledger](../limitations.md). “Needs detailed audit” means the disclosure is recorded, while its complete upstream case coverage is still being developed.

| ID | Status | Area |
| --- | --- | --- |
| CF-01 | Needs detailed audit | This is a pinned v0.1 draft reference engine, not a compatibility promise for every application using the… |
| CF-02 | Resolved | ECB decimal rate environment supplied to CalcFile |
| CF-03 | Needs detailed audit | Auto detection deliberately does not select CalcFile from ambiguous prose |
| CF-04 | Needs detailed audit | Output is a line calculator with headers and text, not a Markdown renderer or an interactive spreadsheet |
| CF-05 | Intentional | ECB base pairs, cache availability and changing external data |
<!-- compatibility:end -->
