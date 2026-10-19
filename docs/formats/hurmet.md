# Hurmet

[Hurmet](https://hurmet.org/) combines prose and mathematical calculations. Sheets vendors the MIT-licensed [ronkok/Hurmet](https://github.com/ronkok/Hurmet) engine at commit `24abefdaecbc84a10e628326a235391db41caf83` as a browser ES module, with its own Temml and scoped CSS.

Use Hurmet for engineering notes where the calculation itself should be typeset
inside the explanation. Choose **Hurmet**, or use its `¢` calculation markers for
Auto detection. Source downloads use `.hurmet`.
[Open the starter example](../../index.html?example=hurmet-basic&format=hurmet).

## Start with an inline calculation

Native inline calculation syntax starts with `¢` and a backtick:

```text
Set a value: ¢` x = 3 `.
Square it: ¢` x^2 = ? `.
```

Native display cells use `¢¢ … ¢¢`. Sheets also accepts simple paired `¢ … ¢` delimiters as a convenience. Auto recognizes both forms. The adapter supplies default Hurmet metadata when none is present, recalculates the document AST with the same upstream calculation pass used by `updateAndSave`, then converts it to HTML.

The example defines `x` before using it and displays a squared result of **9**.
Calculations share values within the document's render. Changing a definition
reruns the source in a fresh worker, rather than keeping an earlier session alive.

## Units and table cells

Unit names are quoted inside a calculation; the result request can select a unit:

```text
¢` L = 12 'ft' `
¢` w = 110 'lbf/ft' `
¢` M = (w L^2)/8 = ?? lbf-ft `
```

This beam example produces a bending moment of **1,980 lbf-ft**. `= ?` requests a
calculated result; the gallery's `= ?? unit` form requests it in a chosen unit.
The unit-aware engine checks calculations rather than treating `'ft'` as a prose
label.

Calculation cells can also appear in table text:

```text
| Quantity | Calculation |
| --- | --- |
| Side | ¢` a = 4 ` |
| Area | ¢` a^2 = ? ` |
```

The area cell uses the value defined above it. This is different from a plain
Markdown table, whose cells are never evaluated. Start from the gallery's
[table example](../../index.html?example=hurmet-edge&format=hurmet) when mixing
source tables and calculations.

Currency units use the same quoted notation:

```text
¢`100 'EUR' = ?? USD`
```

The shared service reads the browser-accessible official ECB data API; the
original daily XML endpoint blocks cross-origin reads. The worker receives ECB
rates as decimal strings, as required by Hurmet's
rational-number parser. Validated rates use the shared 24-hour cache; a refresh
failure can use an older snapshot with a notice. Missing rates retain calculation
diagnostics. Source links contain source rather than a frozen rate snapshot.

## Engine behavior and limits

The upstream engine handles units, calculation cells, and spreadsheet tables. Gallery examples cover inline calculations, a beam calculation with units, table cells, and an undefined variable. Calculation errors become editor diagnostics. Cached ECB currency rates populate `globalThis.currencyRates` in the worker.

Sheets is a source editor and preview, not Hurmet's rich-text editing UI. Interactive drawing tools and live spreadsheet editing are outside this shell. Hurmet calculations may fetch remote data according to upstream behavior and browser CORS rules. Each render runs in a fresh worker with a 20-second deadline.

The source editor keeps Markdown highlighting around inline and display calculations. Calculation cells highlight operators, numbers, identifiers, and quoted units; fenced code stays literal. Highlighting is a lexical aid; rendering diagnostics report evaluation errors.

For an undefined variable, check spelling and definition order. For a unit error,
check both quoted input units and the requested result unit. Ordinary calculations
work with the offline files installed; external data and fresh exchange rates need
a connection. A rendered HTML export keeps the finished typesetting and results,
without a live interpreter. See the [feature comparison and glossary](../format-comparison.md).

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.

<!-- compatibility:start -->
## Tracked compatibility status

These entries share the [central limitations ledger](../limitations.md). “Needs detailed audit” means the disclosure is recorded, while its complete upstream case coverage is still being developed.

| ID | Status | Area |
| --- | --- | --- |
| HUR-01 | Needs detailed audit | Sheets embeds a pinned upstream calculation/rendering engine, not Hurmet's rich-text editing application |
| HUR-02 | Intentional | Every render gets a fresh worker with a 20-second deadline |
| HUR-03 | Needs detailed audit | Remote-data fetches follow upstream behavior and browser CORS rules |
| HUR-04 | Resolved | Decimal-string ECB rates reach the rational parser |
<!-- compatibility:end -->
