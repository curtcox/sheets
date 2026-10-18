# Hurmet

[Hurmet](https://hurmet.org/) combines prose and mathematical calculations. Sheets vendors the MIT-licensed [ronkok/Hurmet](https://github.com/ronkok/Hurmet) engine at commit `24abefdaecbc84a10e628326a235391db41caf83` as a browser ES module, with its own Temml and scoped CSS.

Native inline calculation syntax starts with `¢` and a backtick:

```text
Set a value: ¢` x = 3 `.
Square it: ¢` x^2 = ? `.
```

Native display cells use `¢¢ … ¢¢`. Sheets also accepts simple paired `¢ … ¢` delimiters as a convenience. Auto recognizes both forms. The adapter supplies default Hurmet metadata when none is present, recalculates the document AST with the same upstream calculation pass used by `updateAndSave`, then converts it to HTML.

The upstream engine handles units, calculation cells, and spreadsheet tables. Gallery examples cover inline calculations, a beam calculation with units, table cells, and an undefined variable. Calculation errors become editor diagnostics. Cached ECB currency rates populate `globalThis.currencyRates` in the worker.

Sheets is a source editor and preview, not Hurmet's rich-text editing UI. Interactive drawing tools and live spreadsheet editing are outside this shell. Hurmet calculations may fetch remote data according to upstream behavior and browser CORS rules. Each render runs in a fresh worker with a 20-second deadline.

The source editor keeps Markdown highlighting around inline and display calculations. Calculation cells highlight operators, numbers, identifiers, and quoted units; fenced code stays literal. Highlighting is a lexical aid; rendering diagnostics report evaluation errors.
