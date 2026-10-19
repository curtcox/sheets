# Built-in and custom functions

This page compares functions available **in Sheets**, using its pinned engines
and documented subsets. A **built-in function** is a callable operation supplied
by the calculation engine. A **custom function** is a reusable calculation you
define with parameters. A named value, a ledger directive, or a typeset function
name alone does not define a callable function.

The overview lists representative functions for the larger libraries. The
CalcFile list and the Calca/Org allowlist below are complete for the current
adapter. Upstream reference links describe larger libraries and may include
features outside Sheets; consult the [limitations](limitations.md) as well.

## Compare the formats

| Format | Numeric and scientific functions | Collections and other helpers | Define custom functions? |
| --- | --- | --- | --- |
| [GitHub Markdown](formats/gfm.md) | No calculation library; TeX math is typeset | Markdown tables and Mermaid display content | No numerical functions; TeX notation/macros do not create an evaluator |
| [AsciiMath](formats/asciimath.md) | Names such as `sqrt`, `sin`, `log` and `sum` describe notation, without evaluating it | Matrix notation is displayed, without matrix calculations | No; writing `f(x)` only typesets it |
| [Numbat](formats/numbat.md) | `abs`, `sqrt`, `cbrt`, `exp`, `ln`, `log10`, `sin`, `cos`, `round`, `round_in`; dimensional checking | `sum`, `mean`, `median`, `minimum`, `maximum`, `stdev`; lists, strings, dates, random sampling and domain helpers | **Yes**, with `fn`; optional type/dimension annotations and local `where` bindings |
| [CalcFile](formats/calcfile.md) | Exactly `sqrt`, `abs`, `round`, `floor`, `ceil`, `min`, `max` | Line aggregates: `subtotal`, `total`, `grand total`, `avg`, `subavg` | **No** in the pinned v0.1 engine; named values are supported |
| [Org tables](formats/org.md) | The constrained mathjs allowlist below, in table formulas | Named numeric bindings and six range helpers: `vsum`, `vmean`, `vmin`, `vmax`, `vcount`, `vprod` | **No** in Sheets; formula assignments write cells, and Emacs Lisp/custom Calc extensions are unavailable |
| [Calca](formats/calca.md) | The constrained mathjs allowlist below; numeric, trigonometric and symbolic helpers | Statistics, matrices and units through the same allowlist | **Yes**, single-line named functions in calculation blocks; availability follows the selected Calca profile |
| [Hurmet](formats/hurmet.md) | `abs`, `sqrt`, `sin`, `cos`, `exp`, `ln`, `log`, `floor`, `ceil`, `round`; real/complex and unit-aware calculations | `sum`, `product`, `mean`, `median`, `variance`, `stddev`, `transpose`, `zeros`, `ones`, `length`, `dataframe`, `fetch` | **Yes**, a multiline `function` / `return` / `end` calculation cell; recursion is unsupported |
| [Beancount](formats/beancount.md) | No general expression/function library in the ledger source | Fixed account reports, balance checks, posting inference and lot handling | **No**; Python plugins and a query-function console are not shipped |
| [Quarto: Python](formats/quarto.md) | Python built-ins such as `abs`, `round`, `min`, `max`, `pow`; import `math` for `sqrt`, `sin`, `log` | Built-ins such as `sum`, `len`, `sorted`, `map`; import `statistics` or compatible scientific packages for more | **Yes**, Python `def` or `lambda` inside executable Python cells |
| [Quarto: R](formats/quarto.md) | R functions such as `abs`, `sqrt`, `sin`, `cos`, `exp`, `log`, `round` | `sum`, `mean`, `median`, `min`, `max`, `length`, `lapply`; standard statistics and compatible packages | **Yes**, R `function(...)` assigned to a name inside executable R cells |
| [Plain text](formats/text.md) | None; source is displayed literally | None | No |

Auto detection chooses a format; it does not add a function library or translate
function names. Select a format explicitly when comparing examples.

## Calca and Org: complete callable allowlist

Both adapters use mathjs **15.2.0** through the same constrained expression layer.
These are the permitted built-in call names; this is not the full mathjs API.

| Family | Allowed names |
| --- | --- |
| Magnitudes and roots | `abs`, `sqrt`, `cbrt` |
| Exponentials and logarithms | `exp`, `log`, `log10` |
| Trigonometry | `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2` |
| Hyperbolic functions | `sinh`, `cosh`, `tanh` |
| Rounding | `floor`, `ceil`, `round` |
| Reductions and statistics | `min`, `max`, `sum`, `mean`, `median`, `prod` |
| Arrays and matrices | `size`, `det`, `transpose`, `inv`, `dot`, `cross`, `norm`, `concat` |
| Symbolic operations | `simplify`, `derivative` |
| Conversion and construction | `number`, `unit` |

Calca additionally accepts functions defined in its calculation context. Org adds
its six range helpers, but creates a fresh formula scope for each calculation;
there is no document syntax for installing a custom function. The shared call
allowlist does not give Org the complete GNU Calc language or Calca's equation
solver. Array/matrix values use the expression syntax supported by the adapter;
object access, ranges, arbitrary JavaScript, imports and unlisted mathjs calls are
unavailable. Individual function arguments must still have compatible types.

[mathjs function reference](https://mathjs.org/docs/reference/functions.html)
describes signatures; only the names above are exposed here. For example,
`log` is available, but `ln` is not a Calca/Org alias.

## CalcFile: functions versus line aggregates

The seven callable functions above accept numeric arguments. Use parentheses for
a call. Locale settings change both decimal notation and argument separators;
see the [CalcFile guide](formats/calcfile.md). Function parameters are not a way
to define a new function in this engine.

Line aggregates have different syntax: a standalone aggregate keyword reads
successful calculation lines. `subtotal` and `subavg` use the current group;
`total` and `avg` use the current section; `grand total` spans the document.
Groups/sections and type compatibility follow the pinned engine's rules.

```calcfile
sqrt(9)
abs(-5)
round(2.345, 2)
min(2, 4, 6)
max(2, 4, 6)
```

This example displays **3**, **5**, **2.35**, **2**, and **6**. Assignments store
values; the adapter does not support parameterised function declarations.

## Org: functions inside table formulas

Range helpers operate on referenced table values. Nonnumeric range entries are
normally skipped; the numeric coercion flag changes that behavior. A formula's
left side is a target cell or column, not a function declaration.

```org
| 2 | 0 |
| 4 | 0 |
| 6 | 0 |
#+TBLFM: @1$2=vsum(@1$1..@3$1)::@2$2=vmean(@1$1..@3$1)::@3$2=sqrt(9)
```

The second column becomes **12**, **4**, and **3**. Named columns/fields, numeric
table parameters and file constants can also supply formula inputs; they do not
define custom functions. The [Org guide](formats/org.md)
details reference syntax and the differences from Emacs Org/Calc.

## Numbat: built-ins and a custom function

Numbat **1.24.0** loads its prelude, including mathematical, list, string, date,
statistics and domain functions. For example, a mean takes a list, and compatible
quantities retain their dimensions. Define functions with the language's `fn`
syntax, rather than a Calca-style assignment:

```numbat
sqrt(9)
mean([2 m, 4 m, 6 m])
fn square(x) = x^2
square(5 m)
```

Results include **3**, **4 m**, and **25 m²**. Definitions share the current
render's interpreter; define a function before calling it. The
[pinned prelude](https://github.com/sharkdp/numbat/blob/79046422203060e296da41c8c762c506200d2c93/numbat/modules/prelude.nbt)
links to the loaded modules, and the
[function-definition guide](https://numbat.dev/doc/function-definitions.html) explains
annotations and local definitions. Browser runtime and output limits still apply;
a library helper does not imply every CLI or interactive output is supported.

## Calca: a reusable calculation

```calca
square(x) = x^2
square(5) =>
sqrt(9) =>
mean([2, 4, 6]) =>
derivative("x^3", "x") =>
```

This example opens with **Structured blocks** selected and wraps the definitions
in a calculation block. The numeric results are **25**, **3**, and **4**; the last
line displays a symbolic derivative. Function definitions are single-line named
expressions. Multiline bodies and local bindings are unsupported.

Legacy and Structured blocks share a document calculation context. Scoped
definitions follows heading scopes and its documented dependency rules. Custom
functions do not add general function inversion or an unrestricted symbolic
solver. Read the [Calca guide](formats/calca.md) before choosing a profile.

## Hurmet: use a function cell

Hurmet's pinned upstream engine supplies a larger scientific/engineering library.
The table gives examples, not an exhaustive list. Custom functions use a multiline
calculation cell; a typeset equation with a function-shaped left side does not
establish a callable definition in Sheets.

```hurmet
¢¢ function square(x)
  return x^2
end ¢¢

¢` square(5) = ? `
¢` sqrt(9) = ? `
¢` mean([2, 4, 6]) = ? `
```

The calls display **25**, **3**, and **4**. A function can contain local variables
and control flow, but recursive calls are unsupported. Sheets preserves the
upstream calculation pass; it does not provide Hurmet's full rich-text editing
UI. The [pinned manual's function reference](https://github.com/ronkok/Hurmet/blob/24abefdaecbc84a10e628326a235391db41caf83/docs/manual.md#functions)
and [user-defined function section](https://github.com/ronkok/Hurmet/blob/24abefdaecbc84a10e628326a235391db41caf83/docs/manual.md#user-defined-functions)
describe the broader library and definition syntax. Remote-data helpers remain
subject to browser networking and the render deadline.

## Quarto: Python and R libraries

Quarto itself does not supply a shared numerical function namespace. Each
language's executable cells use that language's runtime. Ordinary code fences
only show source. Python built-ins need no import; standard-library modules and
third-party packages have separate namespaces and loading requirements.

````quarto
```{python}
import math
import statistics

def square(x):
    return x * x

print(math.sqrt(9))
print(statistics.mean([2, 4, 6]))
```

```{python}
square(5)
```
````

The output includes **3.0**, **4**, and **25**. Python functions remain available
to later Python cells in the same render. See the
[Python built-in reference](https://docs.python.org/3.12/library/functions.html),
[math module](https://docs.python.org/3.12/library/math.html), and
[statistics module](https://docs.python.org/3.12/library/statistics.html).

````quarto
```{r}
square <- function(x) x * x
sqrt(9)
mean(c(2, 4, 6))
```

```{r}
square(5)
```
````

R displays **3**, **4**, and **25**, with its usual console prefixes. Functions
are available to later R cells. The upstream
[base-package reference](https://stat.ethz.ch/R-manual/R-patched/library/base/html/00Index.html)
and [statistics-package reference](https://stat.ethz.ch/R-manual/R-patched/library/stats/html/00Index.html)
list a much larger library; online manuals can describe a newer R release than
the pinned browser runtime. The [webR 0.6.0 reference](https://docs.r-wasm.org/webr/v0.6.0/)
describes the browser runtime.

Python and R have independent namespaces and do not exchange function
definitions. Every render starts fresh sessions. Compatible additional packages
can supply functions, but they are not all built in or available offline. The
[Quarto guide](formats/quarto.md) documents package loading, disabled execution,
90-second deadlines, unsupported interactive input and output limitations.

## Displaying a function is different from running it

```asciimath-formulas
sqrt(9)
f(x) = x^2
f(5)
```

This AsciiMath example displays the three expressions. It does **not** produce
3 or 25, store a definition, or call a custom function. The same distinction
applies to TeX math in Markdown. Beancount's fixed ledger operations and plain
text also do not become general expression evaluators.

Function names, argument order, list syntax, unit rules and rounding conventions
vary by engine. A matching name in two rows is not a guarantee of interchangeable
source. Use the examples on this page with their selected formats, and consult
the [feature comparison and glossary](format-comparison.md) for the wider format
capabilities.
