# Calca-compatible subset

[Calca](https://calca.io/) is a commercial app without a published language specification. Sheets implements a **Calca-compatible subset**, using the behavior shown in its documentation and [mathjs](https://mathjs.org/) 15.2.0. It does not claim full Calca compatibility.

```text
price = 24 =>
tax = 0.08 =>
price * (1 + tax) =>
```

Prose uses the shared Markdown renderer. Lines containing `=>` and lines inside indented or fenced code blocks are evaluated in document order. Results replace existing text after each arrow. Definitions inside code blocks establish variables or user functions, such as `f(x) = x^2`, for later calculations. Only arrow lines display a result.

Numbers, common math functions, units, `in` conversions, matrices, `simplify()`, and `derivative()` are supported. A calculation error appears after its arrow and in editor diagnostics; later lines continue.

Equation solving is out of scope. Arbitrary JavaScript, object access, imports, ranges, and unlisted mathjs functions are rejected. This constrained expression language is not a complete mathjs shell. State resets on each render, and Auto detects arrow lines. See the gallery for functions, matrices, and units.
