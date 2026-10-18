# AsciiMath

[AsciiMath](https://asciimath.org/) is a compact plain-text math notation. Sheets translates it with [asciimath2tex](https://github.com/christianp/asciimath2tex) 1.5.0, then renders TeX as MathML with Temml.

A document without Markdown structure is one display formula per nonempty line:

```text
sqrt(9) = 3
sum_(i=1)^n i = n(n+1)/2
```

With Markdown structure, `$…$`, `$$…$$`, and `asciimath` fences contain AsciiMath. Prose uses the shared Markdown pipeline. Each formula has a **Show TeX** disclosure for inspecting the translation.

Supported expressions follow the upstream translator, including roots, sums, matrices, limits, Greek names, and operators. This is rendering, not numerical evaluation. The translator is permissive about incomplete input; an unfinished formula may still produce MathML instead of a diagnostic. Explicit fences are the strongest Auto detection signal.
