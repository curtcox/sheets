# CalcFile

[CalcFile](https://github.com/peetzweg/calcfile) is an experimental, prose-friendly calculation file format. Sheets uses the Apache-2.0 reference `evaluateDocument()` engine at commit `b11ecb44e4a558e3b55879e70266fae714e774d5`.

```text
Flights = 240 EUR
Hotel = 120 EUR * 2
Dinner = 65 EUR
total
```

Results appear beside source lines. Headers, comments, text, directives, and incomplete or erroneous calculations keep their upstream line kinds and statuses. The engine supports friendly variable names, percentages, arithmetic, aggregates, continuation, locale directives, selected units, currencies, and curated functions from its v0.1 draft.

All **37 required upstream conformance cases pass** against the committed corpus. They include supplied currency-rate environments. The UI does not supply external currency rates to CalcFile, so conversions between currencies report missing external data. This pinned, pre-1.0 draft can change upstream; Sheets does not claim compatibility with other apps using `.calc`.

CalcFile's resemblance to prose makes automatic selection unreliable. Choose **CalcFile** explicitly. The extension helper recognizes `.calc`; HashBin plain-text payloads do not carry filenames and use Auto instead.
