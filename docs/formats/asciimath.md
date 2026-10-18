# AsciiMath

[AsciiMath](https://asciimath.org/) is a compact plain-text math notation. Sheets translates it with [asciimath2tex](https://github.com/christianp/asciimath2tex) 1.5.0, then renders TeX as MathML with Temml.

Use it for teaching notes and formulas when you prefer `sqrt(x)` to TeX commands.
Select **AsciiMath** explicitly for a formula list, especially when short input
such as `x^2` has no strong detection signal. Source downloads use `.am`.
[Open the starter example](../../index.html?example=asciimath-basic&format=asciimath).

## Formula lists and mixed documents

A document without Markdown structure is one display formula per nonempty line:

```text
sqrt(9) = 3
sum_(i=1)^n i = n(n+1)/2
```

With Markdown structure, `$…$`, `$$…$$`, and `asciimath` fences contain AsciiMath. Prose uses the shared Markdown pipeline. Each formula has a **Show TeX** disclosure for inspecting the translation.

For mixed prose, start with a Markdown heading and mark the formulas explicitly:

````text
# A sequence

The first term is $a_1 = 1$.

```asciimath
sum_(i=1)^n i = n(n+1)/2
```
````

A heading, list, link, table, quote, fence, or dollar delimiter switches the
document into mixed Markdown mode. Unmarked lines in that mode are prose, rather
than one formula per line. Dollar-delimited math uses **AsciiMath**, not TeX.

## Syntax reference

| Write | Meaning |
| --- | --- |
| `x^2`, `a_1` | Superscript and subscript |
| `sqrt(x)`, `root(3)(x)` | Square root and indexed root |
| `(a+b)/c` | A fraction with a grouped numerator |
| `sum_(i=1)^n i` | A summation with lower/upper limits |
| `alpha`, `theta`, `oo` | Greek symbols and infinity |
| `[(1,2),(3,4)]` | A matrix |

## Behavior and limits

Supported expressions follow the upstream translator, including roots, sums, matrices, limits, Greek names, and operators. This is rendering, not numerical evaluation. The translator is permissive about incomplete input; an unfinished formula may still produce MathML instead of a diagnostic. Explicit fences are the strongest Auto detection signal.

For example, `sqrt(9) = 3` displays the equality you wrote; Sheets does not prove
it or fill in the answer. Use **Show TeX** when grouping looks wrong. To calculate
with variables or units, choose Numbat or Calca instead. Mixed documents inherit
Markdown tables, links, and Mermaid diagrams. Math renders locally and is included
in rendered HTML exports. See the [feature comparison and glossary](../format-comparison.md).

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.
