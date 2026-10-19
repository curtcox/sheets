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

Prose uses the shared Markdown renderer. Calculations run in document order and
replace existing text after each arrow in the preview. Definitions inside
calculation blocks establish variables or user functions, such as `f(x) = x^2`,
for later calculations. Only arrow lines display a result.

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
not execute unless they have an arrow or are in a calculation block.

## Choose the block rules

The **Calca blocks** control offers three modes. Existing links without a profile
and version-1 saved documents use **Legacy**, which evaluates every fenced or
indented code block. This preserves their original behavior, including calculation
diagnostics from literal language, math, or diagram fences.

Choose **Structured blocks** to calculate only indented code blocks, fences
explicitly labelled `calca`, and standalone arrow expressions in paragraphs.
Other fences, including unlabelled fences, display their contents without
calculation. TeX math and Mermaid keep their usual Markdown rendering. Inline
code/math, links, headings, and HTML are not treated as arrow expressions.
Backtick and tilde fences, longer delimiters, lists, and blockquotes follow the
Markdown parser, and diagnostics retain their original source line numbers.

This complete example opens with Structured blocks selected:

````markdown
# Calculations beside code

```python
print("This is a literal example => no calculation")
```

```calca
price = 24
tax = 0.08
price * (1 + tax) =>
```

```math
A = \pi r^2
```
````

The selected mode is stored in shared links and version-2 HashBin documents.
Switching modes preserves the source and creates a new source link instead of
changing an immutable saved document. Switching formats clears the Calca mode.
Source downloads contain text alone; select the same mode again when reusing
that text. Documentation examples use Structured blocks unless identified as
Scoped definitions. The gallery's units,
matrices, and literal-code example also demonstrates this mode.

Structured blocks are a Sheets Markdown boundary rule, based on Calca's distinction
between annotations and calculations. They do not implement its full input grammar.
Evaluation still runs one line at a time: indentation-based multiline definitions,
named arguments, and multiple statements on one line remain unsupported. Bare
unindented definitions still need an arrow to execute. Legacy and Structured blocks
share the equation and reassignment rules below. Scoped definitions changes those
rules explicitly.

## Scoped definitions

Choose **Scoped definitions** (`calca-scopes-v1`) for immutable definitions and
heading scopes. It includes the Structured blocks boundaries. This mode follows
the public reference's definition/equation distinction and heading availability:
definitions and relations belong to their heading and descendants. Moving to a
sibling or higher heading removes the finished section's bindings. Markdown ATX
and Setext headings count; heading-like text inside code does not.

The first definition of a visible name is retained. Later definitions of that
name become constraints, including in a child section; they do not shadow or
overwrite the inherited definition. Deferred expressions and function free
variables use definitions visible when queried. A query sees earlier statements
only. A bare unbound name displays itself; unresolved compound expressions report
a diagnostic rather than producing a general symbolic answer.

This complete example opens with **Scoped definitions** selected:

````calca-scopes
# Parent

```calca
total = rate*count
rate = 3
count = 4
total =>
```

## Child

```calca
total =>
width^2 = 4
width+1 = 3
width =>
```

# Sibling

```calca
total =>
2+2 =>
```
````

The answers are 12 in the parent and child, 2 for the constrained width, and the
unbound name in the sibling. [Open the equations and scopes gallery example](../../index.html?example=calca-typical&format=calca).

Queries check connected real scalar relations against candidate roots. All
connected constraints must accept a candidate; contradictions produce an explicit
diagnostic rather than a latest-equation fallback. Independent calculations still
run. Reverse linear/quadratic definitions work, but this does not add a general
system solver, symbolic dependency substitution, or function inversion. An
unsupported connected relation reports a diagnostic if it cannot be evaluated at
the candidate. Derived answers are never stored as definitions.

This is a bounded Sheets numeric policy informed by the public reference, not a
licensed-app equivalence claim. Child redefinition rules, deferred dependency
binding, conflict presentation, and Setext support still need native-app
comparison. Numeric relation checks allow 64 machine epsilons of relative error.
For solved unknowns the scale includes arithmetic terms lost to cancellation, so
rounded quadratic roots can be checked against zero; there is no absolute floor.
These checks are numerical, not exact proofs; displayed answers retain 12
significant digits. Cycles report diagnostics, dependency and relation-expansion depth are limited to 32,
each query has a work limit, and a document allows 256 definitions and relations.
Multiline/named/implicit-function definitions and local bindings remain unsupported.

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

In **Legacy** and **Structured blocks**, explicit assignments take priority. Queries look backward for the most recent usable equation; an unsupported or underdetermined relation can be skipped in favor of an earlier usable one. Derived query results are not saved as assignments, so changing a coefficient affects subsequent queries. This is a document-order calculator, not a simultaneous-equation consistency checker. Earlier numeric definitions use their values at assignment time; unresolved definitions use current values when queried. Definitions can be reassigned, and headings do not create scopes; these behaviors differ from Calca.

Equation solving requires real numeric coefficients. Symbolic answers, unit-valued equations, general simultaneous systems, function inversion, higher powers, unknowns in denominators, and transcendental equations are unsupported. Keep unknown names distinct from mathjs built-in constants and units (for example, use `tempC` rather than the unit `celsius`). Functions use `f(x) = ...` syntax, so that line defines a function rather than an equation to invert.

Each expression is limited to 4,000 characters and 1,000 syntax nodes; Legacy and Structured blocks allow 256 equations per document; Scoped definitions counts definitions and relations together. Solving also bounds definition depth and expansion work. Arbitrary JavaScript, object access, imports, ranges, and unlisted mathjs functions are rejected. This constrained expression language is not a complete mathjs shell. State resets on each render, and Auto detects arrow lines. See the gallery for equations, functions, matrices, and units.

## Choosing and troubleshooting calculations

Use explicit formulas when all inputs are known; use a relation plus an unknown
query when solving. If a name is undefined, move its definition earlier or check
whether the relation belongs to the supported polynomial subset. The supported
function list includes common trigonometric, logarithmic, rounding, statistical,
matrix, and symbolic helpers; it does not expose every mathjs function. Units and
ordinary calculations run locally after offline files are installed. See the
[feature comparison and glossary](../format-comparison.md).

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.

<!-- compatibility:start -->
## Tracked compatibility status

These entries share the [central limitations ledger](../limitations.md). “Needs detailed audit” means the disclosure is recorded, while its complete upstream case coverage is still being developed.

| ID | Status | Area |
| --- | --- | --- |
| CALCA-01 | Needs detailed audit | This is a compatible subset implemented with constrained mathjs, not the original commercial Calca… |
| CALCA-02 | Needs detailed audit | Equation solving supports real scalar linear and quadratic polynomials with numeric coefficients |
| CALCA-03 | Needs detailed audit | Equation selection and bounded connected-constraint checks |
| CALCA-04 | Needs detailed audit | Definition semantics and native-app verification |
| CALCA-05 | Needs detailed audit | Results use floating-point arithmetic with up to 12 significant displayed digits |
| CALCA-06 | Resolved | Calculation and literal Markdown block isolation |
| CALCA-07 | Needs detailed audit | Reserved names and remaining input grammar |
| CALCA-08 | Resolved | Heading-local immutable definitions in an explicit profile |
<!-- compatibility:end -->
