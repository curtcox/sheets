# Numbat

[Numbat](https://numbat.dev/) is a unit-aware language. Sheets vendors [sharkdp/numbat](https://github.com/sharkdp/numbat) v1.24.0 at commit `79046422203060e296da41c8c762c506200d2c93`, compiled with its WASM build script and a small Sheets source-span bridge patch. The engine is dual MIT/Apache-2.0 licensed.

Use Numbat for physical models, engineering checks, and calculations where mixing
incompatible dimensions should be an error. Select **Numbat** or write declarations
such as `let distance = ...` for Auto detection. Downloads use `.nbt`.
[Open the starter example](../../index.html?example=numbat-basic&format=numbat).

## Start with measurements

```text
let distance = 120 km
let duration = 2 h
distance / duration -> km/h
```

The last statement produces a speed of **60 km/h**. Change either definition and
the whole document runs again. Names must be defined before use. `#` starts a
comment; comments explain the calculation but are not Markdown headings.

## Syntax reference

| Write | Purpose |
| --- | --- |
| `let distance = 120 km` | Bind a value with a unit |
| `distance / duration -> km/h` | Evaluate and choose the output unit |
| `fn fall(t) = 0.5 * gravity * t^2` | Define a reusable function after defining `gravity` |
| `fall(3 s) -> m` | Call the function and convert the result |
| `unit sheetstep = 1.7018 m` | Define a custom unit |
| `sqrt(9)` | Call an available mathematical function |

Numbat tracks dimensions through expressions: `3 m + 2 s` is invalid, while
compatible lengths can be converted before display. An output conversion changes
the representation of a measurement, not its physical value. For prose with inline
calculations, consider Hurmet; this view is a sequence of source/result rows.

## Execution, currencies, and limits

The worker creates `Numbat.new(true, true, FormatType.Html)` and evaluates statements in one context. Each row retains the original source and formatted result. Statement boundaries come from the pinned interpreter's parser, including semicolons, multiline strings and interpolation, decorators, lists, function parameters, and local `where` definitions. Indentation alone does not join separate statements.

The editor places error annotations at the actual source line and column, including inside multiline statements and after Unicode text. Related locations retain their original document positions, including references to earlier definitions. Later statements can still run after parse, type, or runtime errors when the tokenizer can read the document. The engine's formatted error report uses line numbers local to its individual input row; editor annotations use whole-document positions.

### Multiline calculations

Use line breaks where Numbat's grammar allows them. For example, a definition may continue after `=`, list elements can span lines, and a function can have local definitions:

```text
let readings =
  [2 m, 4 m, 6 m]
fn sheet_average(values) = total / count
  where total = sum(values)
    and count = len(values)
sheet_average(readings) -> m
```

This produces **4 m**. Numbat 1.24.0 rejects a newline immediately after a binary plus operator. Arbitrary newlines inside parentheses are also not interchangeable with newlines inside a list or function argument list.

To see recovery and a precise multiline diagnostic, open this example:

```text
let readings = [2 m, 4 m]
let total = sum([
  2 m,
  missing_reading
])
42
```

The editor reports `missing_reading` on line 4; the final statement still produces **42**. The document is rerun from the beginning after an edit.

The upstream prelude, units, functions, declarations, and dimensional checking are available. `let`, `fn`, `unit`, `dimension`, and `->` are Auto detection signals. Some short names, such as `g`, are already units and cannot be redefined.

A render has a 20-second deadline. Editing or cancelling terminates the worker, and the next render starts a fresh context. A lexical error, such as an unterminated string or an unexpected character, prevents the upstream tokenizer from finding statement boundaries. Sheets then submits the complete document as one input and reports the error; it does not execute apparent statements inside the broken text. Fix that lexical error before expecting partial results. Terminal commands and an interactive REPL are outside this editor.

Currency documents request cached ECB XML and pass it to `set_exchange_rates`.
The shared service obtains decimal data from the browser-accessible official ECB
data API and builds a daily XML snapshot; the original XML download endpoint
does not permit cross-origin reads. Only rates from the latest publication are
used, excluding discontinued older series. On failure a visible notice explains that rates are unavailable or cached. Unit tests execute the actual committed WASM binary.

The source editor highlights declarations, conversions, numbers, identifiers, strings, and comments, including common Greek identifiers used in calculations. Highlighting is a lexical aid; rendering diagnostics report evaluation errors.

If a name is rejected, check whether it is already a unit and choose a more
descriptive identifier. If units fail to combine, inspect dimensions before
removing unit labels. Ordinary unit calculations work after the offline files are
installed; fresh currency rates require a connection. See the
[feature comparison and glossary](../format-comparison.md).

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.

<!-- compatibility:start -->
## Tracked compatibility status

These entries share the [central limitations ledger](../limitations.md). “Needs detailed audit” means the disclosure is recorded, while its complete upstream case coverage is still being developed.

| ID | Status | Area |
| --- | --- | --- |
| NUM-01 | Resolved | Statement boundaries and source diagnostics use the pinned upstream parser |
| NUM-02 | Needs detailed audit | Terminal commands, a persistent interactive REPL, and a Sheets plot viewer are not provided |
| NUM-03 | Intentional | A fresh worker starts for every render, with a 20-second deadline |
| NUM-04 | Needs detailed audit | Some short names are predefined units and cannot be redefined |
| NUM-05 | Intentional | Lexical errors stop partial evaluation; formatted engine reports use input-local lines |
<!-- compatibility:end -->
