# Calca-compatible subset

[Calca](https://calca.io/) is a commercial app. Sheets implements a **Calca-compatible subset**, based on its [reference](https://calca.io/reference) and examples, using [mathjs](https://mathjs.org/) 15.2.0. It does not claim full Calca compatibility.

Use this format for explanatory notes with calculated answers, reusable formulas,
unit conversions, matrices, and small equations. Select **Calca**, or include `=>`
calculation lines for Auto detection. Source downloads use `.calca`.
[Open the starter example](../../index.html?example=calca-basic&format=calca).

## Start with arrow calculations

```text
price = 24 =>
tax = 0.08 =>
price * (1 + tax) => 25.92
```

Prose uses the shared Markdown renderer. Lines containing `=>` and lines inside indented or fenced code blocks are evaluated in document order. Results replace existing text after each arrow. Definitions inside code blocks establish variables or user functions, such as `f(x) = x^2`, for later calculations. Only arrow lines display a result.

Numbers, common math functions, units, `in` conversions, matrices, `simplify()`, and `derivative()` are supported. A calculation error appears after its arrow and in editor diagnostics; later lines continue.

| Write | Purpose |
| --- | --- |
| `price = 24 =>` | Define a variable and show its value |
| `sqrt(9) =>` | Evaluate a mathematical function |
| `f(x) = x^2` inside a code block | Define a reusable function without displaying an answer |
| `f(5) =>` after that definition | Show the function result, 25 |
| `2 inch in cm =>` | Convert units |
| `det([1, 2; 3, 4]) =>` | Calculate with a matrix |
| `derivative("x^3", "x") =>` | Return a symbolic derivative expression |

Edit the input before the arrow; any old answer after it is replaced **in the
preview**. The editor source is preserved. A source download keeps that source;
rendered HTML keeps the computed preview. Bare assignments in ordinary prose do
not execute unless they have an arrow or are in a code block. Every fenced or
indented code block is treated as calculation input, even when its language label
suggests literal code, math, or a diagram; prefer GFM/Quarto for those fences.

## Equations

Write an equation in a code block, then query its unknown with `=>`:

```calca
2*x + 3 = 11
x => 4
```

Scalar real linear and quadratic polynomials are supported. Both sides may contain the unknown; parentheses, implicit multiplication, constant division, and powers of 0, 1 or 2 work. Other variables must have numeric values or definitions that expand into a supported polynomial. A definition with an unknown is deferred until its value can be calculated. Definitions can also be used in reverse:

```calca
tempF = 1.8*tempC + 32
tempF = 212
tempC => 100

height = 2*width
area = height*width
area = 18
width => [-3, 3]
```

Two real roots appear as a sorted list. A repeated root appears once as a number. No real solutions produce `[]`; an identity produces an "Infinitely many solutions" diagnostic. An expression that depends on multiple or no roots reports a diagnostic instead of choosing a value. Query that variable directly to see its roots. Results use floating-point arithmetic and display up to 12 significant digits.

Explicit assignments take priority. Queries look backward for the most recent usable equation; an unsupported or underdetermined relation can be skipped in favor of an earlier usable one. Derived query results are not saved as assignments, so changing a coefficient affects subsequent queries. This is a document-order calculator, not a simultaneous-equation consistency checker. Earlier numeric definitions use their values at assignment time; unresolved definitions use current values when queried. Definitions can be reassigned, and headings do not create scopes; these behaviors differ from Calca.

Equation solving requires real numeric coefficients. Symbolic answers, unit-valued equations, general simultaneous systems, function inversion, higher powers, unknowns in denominators, and transcendental equations are unsupported. Keep unknown names distinct from mathjs built-in constants and units (for example, use `tempC` rather than the unit `celsius`). Functions use `f(x) = ...` syntax, so that line defines a function rather than an equation to invert.

Each expression is limited to 4,000 characters and 1,000 syntax nodes; each document allows 256 equations. Solving also bounds definition depth and expansion work. Arbitrary JavaScript, object access, imports, ranges, and unlisted mathjs functions are rejected. This constrained expression language is not a complete mathjs shell. State resets on each render, and Auto detects arrow lines. See the gallery for equations, functions, matrices, and units.

## Choosing and troubleshooting calculations

Use explicit formulas when all inputs are known; use a relation plus an unknown
query when solving. If a name is undefined, move its definition earlier or check
whether the relation belongs to the supported polynomial subset. The supported
function list includes common trigonometric, logarithmic, rounding, statistical,
matrix, and symbolic helpers; it does not expose every mathjs function. Units and
ordinary calculations run locally after offline files are installed. See the
[feature comparison and glossary](../format-comparison.md).

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.
