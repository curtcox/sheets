# AsciiMath

[AsciiMath](https://asciimath.org/) is a compact plain-text math notation. Sheets translates it with [asciimath2tex](https://github.com/christianp/asciimath2tex) 1.5.0, then renders TeX as MathML with Temml.

Use it for teaching notes and formulas when you prefer `sqrt(x)` to TeX commands.
Select **AsciiMath**, then choose **Formula list** or **Mixed prose** under **AsciiMath mode** to keep the interpretation fixed while editing. Short input such as `x^2` has no strong format-detection signal. Source downloads use `.am`.
[Open the starter example](../../index.html?example=asciimath-basic&format=asciimath).

## Formula lists and mixed documents

**Formula list** renders one display formula per nonempty line. Markdown-looking lines, including absolute-value bars and leading minus signs, remain formulas:

```asciimath-formulas
sqrt(9) = 3
sum_(i=1)^n i = n(n+1)/2
```

**Mixed prose** keeps unmarked text as prose, even in a short document without headings. `$…$`, `$$…$$`, and `asciimath` fences contain AsciiMath. Prose uses the shared Markdown pipeline. Each formula has a **Show TeX** disclosure for inspecting the translation.

For mixed prose, mark formulas explicitly:

````asciimath-prose
# A sequence

The first term is $a_1 = 1$.

```asciimath
sum_(i=1)^n i = n(n+1)/2
```
````

The default **Auto** mode retains the original heuristic: Markdown structure or dollar delimiters switch the document into mixed prose; otherwise each nonempty line is a formula. Adding a heading can therefore change an Auto document. Explicit Formula list and Mixed prose modes stay selected as you edit. Dollar-delimited math uses **AsciiMath**, not TeX.

Shared links, HashBin version-2 documents, sign-in returns, and offline reloads preserve the selected mode. A mode also pins AsciiMath when the overall Format is Auto. Switching formats clears an incompatible mode. Source downloads contain only text; reselect the mode when reusing a downloaded file. Rendered exports preserve the finished MathML without rerunning the source.

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

Supported expressions follow the upstream translator, including roots, sums, matrices, limits, Greek names, and operators. This is rendering, not numerical evaluation. The translator remains permissive. Sheets warns when its parse tree supplies an empty fraction denominator, subscript, exponent, or required argument, or when a text argument is unfinished. Warnings point to the formula's actual source line and column and keep the translated output and Show TeX available. Translation exceptions and Temml typesetting failures also identify the formula's location; later formulas can still render.

For example, this Formula list keeps the translations visible and warns on the first three lines:

```asciimath-formulas
sqrt(
x/
x^
sqrt(9)
```

These checks are advisory, not a complete validator. Lone operators, one-sided delimiters, mixed interval brackets, quoted/text labels, and one-sided limit signs retain upstream interpretation. Deliberately partial notation may still render; a formula without a warning is not proof of validity or truth. Explicit fences are the strongest Auto format-detection signal.

For example, `sqrt(9) = 3` displays the equality you wrote; Sheets does not prove
it or fill in the answer. Use **Show TeX** when grouping looks wrong. To calculate
with variables or units, choose Numbat or Calca instead. Mixed documents inherit
Markdown tables, links, and Mermaid diagrams, including the [Mermaid charts](gfm.md#charts-from-mermaid)
(`xychart`, `pie` and `radar-beta`) drawn from numbers written in the fence. Math renders locally and is included
in rendered HTML exports. See the [feature comparison and glossary](../format-comparison.md).

The pinned upstream corpus contains **436 cases**. The translator matches **430** recorded TeX strings; four existing differences preserve explicit thin spaces omitted by the expectations, and two nested-matrix cases have malformed JavaScript expectation strings and different grouping. Temml rejects the arrow command produced by `>->>` and `twoheadrightarrowtail` (16 duplicated corpus cases); Sheets now reports that failure explicitly. These are tracked notation gaps, not changes made by selecting a mode. General translator/MathML coverage remains separate work.

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.

Compare the available libraries and definition syntax in
[built-in and custom functions](../function-comparison.md).

<!-- compatibility:start -->
## Tracked compatibility status

These entries share the [central limitations ledger](../limitations.md). “Needs detailed audit” means the disclosure is recorded, while its complete upstream case coverage is still being developed.

| ID | Status | Area |
| --- | --- | --- |
| AM-01 | Known gap | Pinned translator and Temml retain audited notation gaps |
| AM-02 | Resolved | Detectable incomplete formulas now have source-line diagnostics |
| AM-03 | Resolved | Formula list and Mixed prose modes are explicit and shareable |
| AM-04 | Intentional | Mixed prose inherits the Markdown rendering and sanitization limits above. |
| AM-05 | Intentional | Incomplete-input warnings are advisory and preserve permissive notation |
<!-- compatibility:end -->
