# Numbat

[Numbat](https://numbat.dev/) is a unit-aware language. Sheets vendors [sharkdp/numbat](https://github.com/sharkdp/numbat) v1.24.0 at commit `79046422203060e296da41c8c762c506200d2c93`, compiled with its WASM build script. The engine is dual MIT/Apache-2.0 licensed.

```text
let distance = 120 km
let duration = 2 h
distance / duration -> km/h
```

The worker creates `Numbat.new(true, true, FormatType.Html)` and evaluates statements in one context. Each row retains its source line and formatted result. Bracketed and indented continuations are grouped. Errors attach to the statement's first line, and later statements can still run.

The upstream prelude, units, functions, declarations, and dimensional checking are available. `let`, `fn`, `unit`, `dimension`, and `->` are Auto detection signals. Some short names, such as `g`, are already units and cannot be redefined.

A render has a 20-second deadline. Editing or cancelling terminates the worker, and the next render starts a fresh context. The statement grouper covers common multiline calculations, not every possible lexical corner of the full language. Terminal commands and an interactive REPL are outside this editor.

Currency documents request cached ECB XML and pass it to `set_exchange_rates`. On failure a visible notice explains that rates are unavailable or cached. Unit tests execute the actual committed WASM binary.

The source editor highlights declarations, conversions, numbers, identifiers, strings, and comments, including common Greek identifiers used in calculations. Highlighting is a lexical aid; rendering diagnostics report evaluation errors.
