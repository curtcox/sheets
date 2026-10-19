import { writeURL } from "./url-state.js";
import { CALCA_BLOCKS, CALCA_SCOPES } from "./compatibility-profiles.js";

const block = (language, source) => `\`\`\`${language}\n${source}\n\`\`\`\n`;
const sample = (source, aliases = []) => ({ source, aliases });
// Short examples need complete contexts. Code blocks link their own exact source.
export const syntaxExamples = {
  gfm: [
    sample(
      "# Email links\n\na@b.c_d and a@b.c+notes\n\n`a@b.c_d` stays literal.\n\n[Contact](mailto:a@b.c_d)\n",
    ),
    sample(
      "# Autolink audit\n\nwww._foo.bar.baz\nwww.foo._bar.baz\nwww.foo.bar._baz\nWWW.EXAMPLE.COM\na@b.c1\na@b.c_d\na@b.c+z\n",
    ),
    sample(
      `# Heading
## Subheading
**strong**, *emphasis*, ~~removed~~
[label](https://example.com)
www.commonmark.org/help
![Sheets icon](src/icon.svg)
- [ ] Task
- [x] Done
A footnote[^detail].

[^detail]: Explanation

$x^2$
$$x^2$$
${block("math", "\\sqrt{x}")}
${block("mermaid", "graph LR\n  Measure --> Review")}
> [!NOTE]
> A note.
> [!TIP]
> A tip.
> [!WARNING]
> A warning.
> [!IMPORTANT]
> An important note.
> [!CAUTION]
> A caution.
<hr>
<br>
<img src="src/icon.svg" alt="Sheets icon">
`,
      ["$…$", "$$…$$", "TIP", "WARNING", "IMPORTANT", "CAUTION"],
    ),
  ],
  asciimath: [
    sample(
      "x^2\na_1\nsqrt(x)\nroot(3)(x)\n(a+b)/c\nsum_(i=1)^n i\nalpha\ntheta\noo\n[(1,2),(3,4)]\nsqrt(9) = 3\n",
    ),
    sample(
      "# Mixed prose\n\nInline $sqrt(9) = 3$.\n\n$$sum_(i=1)^n i$$\n\n" +
        block("asciimath", "sum_(i=1)^n i"),
      ["$…$", "$$…$$"],
    ),
  ],
  numbat: [
    sample(
      "dimension SheetSpeed = Length / Time\nlet distance = 120 km\nlet duration = 2 h\ndistance / duration -> km/h\nlet gravity = 9.81 m/s^2\nfn fall(t) = 0.5 * gravity * t^2\nfall(3 s) -> m\nunit sheetstep = 1.7018 m\n2 sheetstep -> m\nsqrt(9)\n1 g\n# A comment\n",
      ["let distance = ..."],
    ),
    sample("let length = 3 m\nlength + 2 s\n", ["3 m + 2 s"]),
  ],
  calcfile: [
    sample("Monthly rent = 1400 EUR\nMonthly rent + 50 EUR\n"),
    sample("100 + 25%\n25% of 100\n"),
    sample("100 + 20\nans * 2\n+ 20\n"),
    sample("# A\n100\n200\nsubtotal\n\n50\ntotal\n# B\n25\ngrand total\n"),
    sample("2 inch to cm\n"),
    sample("@locale de-DE\n1,5 * 2\nround(10,234; 2)\n"),
    sample("// 100 + 200\n"),
    sample("100 EUR in USD\n"),
    sample("100 USD in EUR\n100 EUR in GBP\n100 EUR in JPY\n"),
    sample("100 USD in GBP\n"),
    sample("100 EUR in CHF\n"),
  ],
  org: [
    sample(
      `* Column, field, and relative references
| Quantity | Price | Total |
|----------+-------+-------|
| 3        | 4     | 0     |
| 2        | 7     | 0     |
#+TBLFM: $3=$1*$2;%.2f::@2$3=12::@3$3=@-1$2

* Numeric boundaries and ranges
| 2 | 0 |
| 3 | 0 |
| 4 | 0 |
#+TBLFM: @1$2=@<$1::@2$2=@>$1::@3$2=vsum(@2$1..@>$1)

* Aggregates between horizontal separators
| Value | Result |
|-------+--------|
| 2     | 0      |
| text  | 0      |
| 4     | 0      |
|-------+--------|
| Total | 0      |
#+TBLFM: @>$2=vsum(@I$1..@II$1);N::@2$2=vmean(@I$1..@II$1)::@3$2=vcount(@I$1..@II$1)::@4$2=vmin(@I$1..@II$1)

* More aggregates and column boundaries
| 2 | 0 |
| 3 | 0 |
| 4 | 0 |
#+TBLFM: @1$2=vmax(@1$1..@3$1)::@2$2=vprod(@1$1..@3$1)::@3$2=@3$<+@3$>
`,
      ["vsum(...)", "vmean(...)", "vcount(...)", "@3$2"],
    ),
  ],
  calca: [
    sample(
      block(
        "calca",
        'price = 24 =>\ntax = 0.08 =>\nprice * (1 + tax) =>\nsqrt(9) =>\nf(x) = x^2\nf(5) =>\n2 inch in cm =>\ndet([1, 2; 3, 4]) =>\nsimplify("x + x") =>\nderivative("x^3", "x") =>\n2 + 2 =>',
      ),
      ["simplify()", "derivative()", "f(x) = ..."],
    ),
    sample(block("calca", "tempF = 1.8*tempC + 32\ntempF = 212\ntempC =>")),
    sample(block("calca", "height^2 + 1 = 0\nheight =>"), ["[]"]),
    sample(block("calca", "25 celsius in fahrenheit =>")),
  ],
  hurmet: [
    sample("Set a value: ¢` x = 3 `.\nSquare it: ¢` x^2 = ? `.\n", [
      "¢",
      "= ?",
    ]),
    sample("Set a value: ¢ x = 3 ¢.\nSquare it: ¢ x^2 = ? ¢.\n", ["¢ … ¢"]),
    sample(
      "¢` L = 12 'ft' `\n¢` w = 110 'lbf/ft' `\n¢` M = (w L^2)/8 = ?? lbf-ft `\n",
      ["= ?? unit"],
    ),
    sample("¢¢ x = 3 ¢¢\n\n¢¢ x^2 = ? ¢¢\n", ["¢¢ … ¢¢"]),
    sample("¢`100 'EUR' = ?? USD`\n"),
  ],
  beancount: [
    sample(
      `option "tolerance_multiplier" "0.5"
option "inferred_tolerance_default" "USD:0.001"
option "infer_tolerance_from_cost" "TRUE"
2026-01-01 open Assets:Bank USD
2026-01-01 open Equity:Opening USD
2026-01-02 * "Within assertion tolerance"
  Assets:Bank 0.005 USD
  Equity:Opening -0.005 USD
2026-01-03 balance Assets:Bank 0.00 ~ 0.005 USD
`,
      [
        "tolerance_multiplier",
        "inferred_tolerance_default",
        "infer_tolerance_from_cost",
        "0.00 ~ 0.005 USD",
      ],
    ),
    sample(
      `2026-01-01 open Assets:Bank USD
2026-01-01 open Equity:Opening USD
2026-01-01 open Assets:Stock HOOL
2026-01-01 open Assets:Metal OZT
2026-01-01 open Assets:Token TOKEN
2026-01-01 open Expenses:Fees USD
2026-01-02 * "Opening balance" #tag ^link
  key: "value"
  Assets:Bank 1000 USD
  Equity:Opening
2026-01-03 balance Assets:Bank 1000 USD
2026-01-04 * "Per-unit cost"
  Assets:Stock 2 HOOL {10 USD}
  Assets:Bank -20 USD
2026-01-05 * "Unit price"
  Assets:Metal 2 OZT @ 10 USD
  Assets:Bank -20 USD
2026-01-06 * "Total price"
  Assets:Token 2 TOKEN @@ 20 USD
  Assets:Bank -20 USD
2026-01-07 ! "Pending fee"
  Assets:Bank -1 USD
  Expenses:Fees 1 USD
2026-01-08 txn "Refund"
  Assets:Bank 1 USD
  Expenses:Fees -1 USD
`,
      ["{cost}", "@", "@@"],
    ),
  ],
  quarto: [
    sample(
      `---\ntitle: A small notebook\nauthor: Sheets example\ndate: 2026-10-18\nexecute:\n  echo: false\n---\n\n${block("{python}", "values = [3, 7, 11]\nprint(values)")}\n${block("{python}", "sum(values) / len(values)")}`,
      ["execute:", "echo: false", "print(...)"],
    ),
    sample(
      `---\nexecute: false\n---\n\n${block("{python}", "print('This cell is not executed')")}`,
    ),
    sample(
      block(
        "{python}",
        "#| echo: false\n#| label: fig-demo\n#| fig-cap: A description\nimport matplotlib.pyplot as plt\nplt.plot([1, 2, 3], [2, 4, 3])\nplt.show()",
      ) + "\nSee @fig-demo.\n",
    ),
    sample(block("{python}", "#| eval: false\nraise Exception('Skipped')")),
    sample(
      block("{python}", "#| output: false\nprint('Hidden output')") +
        "\n" +
        block("{python}", "print('Visible output')"),
    ),
    sample(
      block(
        "{r}",
        "measurements <- c(3, 7, 11)\nmean(measurements)\nplot(measurements, type = 'b')",
      ),
    ),
    sample("::: {.callout-note}\nA note about a figure.\n:::\n"),
    sample(block("{julia}", "1 + 1") + "\n" + block("{ojs}", "1 + 1")),
    sample(block("python", "print('Displayed source only')"), ["python"]),
    sample(
      block(
        "{r}",
        '#| eval: false\n# Replace the placeholder package name before enabling this cell.\nwebr::install("package")\nlibrary(package)',
      ),
    ),
    sample(
      block(
        "{r}",
        "#| eval: false\n# Interactive input is unsupported in Sheets.\nreadline()\nmenu()\nbrowser()",
      ),
    ),
  ],
  text: [
    sample(
      "# This is not a heading\n2 + 2 =>\n<strong>This is not HTML</strong>\n$x^2$ is not typeset math\n",
    ),
  ],
};

export function blockExample(page, source, language = "") {
  const format = page.startsWith("formats/") ? page.slice(8) : "text";
  return {
    format,
    src:
      format === "calca" &&
      language !== "calca-scopes" &&
      !/^ {0,3}(?:`{3,}|~{3,})/m.test(source)
        ? block("calca", source.trimEnd())
        : source,
    ...(format === "calca"
      ? { profile: language === "calca-scopes" ? CALCA_SCOPES : CALCA_BLOCKS }
      : {}),
  };
}

export function inlineExample(page, code) {
  if (page === "url-format") {
    if (["?profile=calca-scopes-v1", "calca-scopes-v1"].includes(code))
      return {
        format: "calca",
        src: "# Parent\n\n    value=2\n\n## Child\n\n    value =>\n\n# Sibling\n\n    value =>\n",
        profile: CALCA_SCOPES,
      };
    if (["?profile=calca-blocks-v1", "calca-blocks-v1"].includes(code))
      return {
        format: "calca",
        src: syntaxExamples.calca[0].source,
        profile: CALCA_BLOCKS,
      };
    if (syntaxExamples[code])
      return { format: code, src: syntaxExamples[code][0].source };
    if (code === "?example=<id>")
      return { example: "gfm-basic", format: "gfm" };
    if (code === "#<cid>")
      return { cid: "AAAAAAAIMiArIDIgPT4", format: "calca" };
    if (code.startsWith("?"))
      return { format: "gfm", src: syntaxExamples.gfm[0].source };
  }
  const format = page.startsWith("formats/") ? page.slice(8) : null;
  const candidates = format
    ? [[format, syntaxExamples[format] || []]]
    : Object.entries(syntaxExamples);
  for (const [id, examples] of candidates) {
    const example =
      examples.find(({ aliases }) => aliases.includes(code)) ||
      examples.find(({ source }) => source.includes(code));
    if (example)
      return {
        format: id,
        src: example.source,
        ...(id === "calca" ? { profile: CALCA_BLOCKS } : {}),
      };
  }
  return null;
}

export function exampleURL(base, example) {
  const editor = new URL("index.html", base);
  if (example.example) {
    editor.searchParams.set("example", example.example);
    editor.searchParams.set("format", example.format);
    return editor.href;
  }
  return writeURL(editor, example);
}

export function linkExamples(content, page, base) {
  for (const code of content.querySelectorAll("pre > code")) {
    const link = document.createElement("a");
    link.className = "docs-example-link";
    link.href = exampleURL(
      base,
      blockExample(
        page,
        code.textContent,
        [...code.classList].find((c) => c.startsWith("language-"))?.slice(9),
      ),
    );
    link.textContent = "Open example in editor ↗";
    const paragraph = document.createElement("p");
    paragraph.append(link);
    code.parentElement.after(paragraph);
  }
  for (const code of content.querySelectorAll("code")) {
    if (code.closest("pre, a")) continue;
    const example = inlineExample(page, code.textContent);
    if (!example) continue;
    const link = document.createElement("a");
    link.href = exampleURL(base, example);
    link.title = "Open a complete example in the editor";
    code.before(link);
    link.append(code);
  }
}
