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
| `@locale de-DE` then `1,5 * 2` | Change numeric parsing/display conventions |
| `// 100 + 200` | Keep a line as a comment |

For German numeric notation, decimal commas and function argument separators
change together: `round(10,234; 2)` produces 10.23 as a value. A line that ends in
an operator or an empty assignment may be marked incomplete while you type.
An aggregate that mixes unrelated types, such as EUR and kilometers, is an error.

## Compatibility and currencies

Results appear beside source lines. Headers, comments, text, directives, and incomplete or erroneous calculations keep their upstream line kinds and statuses. The engine supports friendly variable names, percentages, arithmetic, aggregates, continuation, locale directives, selected units, currencies, and curated functions from its v0.1 draft.

All **37 required upstream conformance cases pass** against the committed corpus. They include supplied currency-rate environments. The UI does not supply external currency rates to CalcFile, so conversions between currencies report missing external data. This pinned, pre-1.0 draft can change upstream; Sheets does not claim compatibility with other apps using `.calc`.

CalcFile's resemblance to prose makes automatic selection unreliable. Choose **CalcFile** explicitly. The extension helper recognizes `.calc`; HashBin plain-text payloads do not carry filenames and use Auto instead.

Same-currency arithmetic works without exchange rates. `100 EUR in USD` cannot
convert on this deployment because the adapter does not supply the required rate
environment; use Numbat or Hurmet for the integrated ECB rate path. Do not assume
support for a function or unit outside the pinned draft. See the
[feature comparison and glossary](../format-comparison.md).
