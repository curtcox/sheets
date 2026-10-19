import { test } from "node:test";
import assert from "node:assert/strict";
import { renderQuarto } from "../../src/formats/quarto/index.js";

const cell = (language, source) =>
  `\n\n\`\`\`{${language}}\n${source}\n\`\`\`\n`;
test("Quarto routes interleaved languages in order and renders their results in document order", async () => {
  const source =
    cell("r", "r1") +
    cell("python", "py1") +
    cell("r", "r2") +
    cell("python", "py2");
  const result = await renderQuarto(source, {
    executeR: async (cells) => {
      assert.deepEqual(
        cells.map((c) => c.source),
        ["r1", "r2"],
      );
      return { outputs: [{ stdout: "R first" }, { text: "R second" }] };
    },
    executePython: async (cells) => {
      assert.deepEqual(
        cells.map((c) => c.source),
        ["py1", "py2"],
      );
      return {
        outputs: [{ stdout: "Python first" }, { text: "Python second" }],
      };
    },
  });
  assert.match(
    result.html,
    /R first[\s\S]*Python first[\s\S]*R second[\s\S]*Python second/,
  );
  assert.deepEqual(result.diagnostics, []);
});
test("Quarto skips disabled R and Python jobs without loading a runtime", async () => {
  const unexpected = () =>
    assert.fail("Disabled cells must not start an interpreter");
  for (const execute of ["false", "\n  enabled: false", "\n  eval: false"])
    await renderQuarto(
      `---\nexecute: ${execute}\n---\n` +
        cell("r", "stop('R')") +
        cell("python", "raise Exception()"),
      { executeR: unexpected, executePython: unexpected },
    );
  await renderQuarto(
    cell("r", "#| eval: false\nstop('R')") +
      cell("python", "#| eval: false\nraise Exception()"),
    { executeR: unexpected, executePython: unexpected },
  );
});
test("Quarto R cell options override defaults and keep hidden output out of the document", async () => {
  const result = await renderQuarto(
    "---\nexecute:\n  echo: false\n  eval: false\n---\n" +
      cell(
        "r",
        "#| eval: true\n#| label: fig-r\n#| fig-cap: R <plot>\nplot(1:3)",
      ) +
      cell("r", "#| eval: true\n#| output: false\ncat('secret')") +
      cell("r", "stop('skipped')"),
    {
      executeR: async (cells) => {
        assert.equal(cells.length, 2);
        assert.equal(cells[0].source, "plot(1:3)");
        return {
          outputs: [
            {
              stdout: "result <img onerror='bad'>",
              images: ["data:image/png;base64,AAAA"],
            },
            { stdout: "HIDDEN", images: ["HIDDEN IMAGE"] },
          ],
        };
      },
    },
  );
  assert.ok(result.html.includes('id="fig-r"'));
  assert.ok(result.html.includes('src="data:image/png;base64,AAAA"'));
  assert.ok(result.html.includes("R &lt;plot&gt;"));
  assert.ok(result.html.includes("&lt;img onerror="));
  for (const text of ["HIDDEN", "plot(1:3)", "stop('skipped')"])
    assert.ok(!result.html.includes(text));
});
test("Quarto reports R errors at their cell line and continues through mixed-language output", async () => {
  const source =
    cell("r", "stop('bad')") + cell("python", "2+2") + cell("r", "1+1");
  const result = await renderQuarto(source, {
    executeR: async () => ({
      outputs: [
        { error: "R failed", stdout: "Before error" },
        { stdout: "R continued" },
      ],
    }),
    executePython: async () => ({ outputs: [{ text: "4" }] }),
  });
  assert.deepEqual(result.diagnostics, [{ line: 4, message: "R failed" }]);
  assert.match(
    result.html,
    /R failed[\s\S]*Before error[\s\S]*4[\s\S]*R continued/,
  );
});
test("Quarto runtime failures produce one diagnostic per affected cell and preserve other languages", async () => {
  const source = cell("r", "1+1") + cell("python", "2+2") + cell("r", "3+3");
  const result = await renderQuarto(source, {
    executeR: async () => {
      throw new Error("R could not start: unavailable");
    },
    executePython: async () => ({ outputs: [{ text: "Python survived" }] }),
  });
  assert.equal(result.diagnostics.length, 2);
  assert.ok(
    result.diagnostics.every((d) => d.message.startsWith("R could not start")),
  );
  assert.ok(result.html.includes("Python survived"));
});
test("Quarto propagates R cancellation without rendering an error result", async () => {
  await assert.rejects(
    renderQuarto(cell("r", "repeat {}"), {
      executeR: async () => {
        throw new DOMException("Cancelled", "AbortError");
      },
    }),
    { name: "AbortError" },
  );
});

test("Quarto structurally nests callouts across cells and resolves forward image/div figures", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../fixtures/quarto/structure.qmd", import.meta.url),
    "utf8",
  );
  const result = await renderQuarto(source, {
    executePython: () => assert.fail("Execution is disabled"),
  });
  assert.deepEqual(result.diagnostics, []);
  assert.match(
    result.html,
    /aside class="callout callout-note"[\s\S]*aside class="callout callout-tip"[\s\S]*language-python[\s\S]*<\/aside>\s*<\/aside>/,
  );
  assert.match(result.html, /href="#fig-icon">Figure 1/);
  assert.match(result.html, /href="#fig-panel">Figure 2/);
  assert.match(
    result.html,
    /<figure id="fig-icon"><img[^>]*alt="Sheets icon"><figcaption>Sheets icon<\/figcaption><\/figure>/,
  );
  assert.match(
    result.html,
    /<figure id="fig-panel">[\s\S]*<figcaption>A panel caption\.<\/figcaption>/,
  );
  assert.match(result.html, /@fig-code \{#fig-code\}/);
  assert.equal((result.html.match(/<aside/g) || []).length, 2);
});

test("Quarto diagnoses duplicate, absent and unavailable figure targets at original lines", async () => {
  const result = await renderQuarto(
    "---\nexecute: false\n---\nSee @fig-absent.\n\n![First](a.svg){#fig-same}\n\n![Second](b.svg){#fig-same}\n\n```{r}\n#| label: fig-skipped\nplot(1)\n```\n\n@fig-same and @fig-skipped\n",
  );
  assert.deepEqual(
    result.diagnostics.map(({ line, column, message }) => [
      line,
      column,
      message,
    ]),
    [
      [4, 4, "Unresolved figure reference: fig-absent."],
      [8, 16, "Duplicate figure label fig-same; first declared on line 6."],
      [
        11,
        3,
        "Figure fig-skipped has no visible plot output; references remain unresolved.",
      ],
      [15, 14, "Unresolved figure reference: fig-skipped."],
    ],
  );
  assert.equal((result.html.match(/id="fig-same"/g) || []).length, 1);
  assert.match(result.html, /href="#fig-same">Figure 1/);
  assert.ok(!result.html.includes('href="#fig-skipped"'));
});

test("Quarto ignores structural syntax in verbatim, escapes, links, math and raw HTML", async () => {
  const result = await renderQuarto(
    "`@fig-code {#fig-code}`\n\n\\@fig-escaped\n\n[Literal @fig-link](https://example.com/@fig-url)\n\n<code>@fig-html</code>\n\n<div>\n::: {.callout-note}\n@fig-raw\n```{python}\nnever_execute()\n```\n</div>\n\n    ::: {.callout-tip}\n    @fig-indent\n\n$@fig-math$\n",
    {
      executePython: () =>
        assert.fail("Literal fence inside HTML must not execute"),
    },
  );
  assert.deepEqual(result.diagnostics, []);
  assert.equal((result.html.match(/<aside/g) || []).length, 0);
  assert.ok(!result.html.includes('href="#fig-'));
});

test("Quarto balances divs at Markdown container boundaries and reports malformed fences", async () => {
  const result = await renderQuarto(
    "> ::: {.callout-note}\n> Inside\n\nOutside\n\n:::\n\n::: {.callout-tip}\nUnclosed\n",
  );
  assert.deepEqual(
    result.diagnostics.map((d) => [d.line, d.message]),
    [
      [1, "Unclosed fenced div; closed at its container boundary."],
      [6, "Closing fenced div has no matching opener."],
      [8, "Unclosed fenced div; closed at its container boundary."],
    ],
  );
  assert.match(
    result.html,
    /Inside<\/p>\s*<\/aside>\s*<\/blockquote>\s*<p>Outside/,
  );
});

test("Quarto validates block/flow/quoted YAML keys with exact lines and columns", async () => {
  const result = await renderQuarto(
    '---\n"title": [wrong]\nexecute: {echo: false, eval: "false", cache: true}\nformat: pdf\ntoc: true\n---\n\n```{python}\n#| eval: false\n#| "fig-cap": [wrong]\n#| cache: true\n#| output: "false"\nprint(1)\n```',
  );
  assert.deepEqual(
    result.diagnostics.map((d) => [d.line, d.column]),
    [
      [2, 1],
      [3, 23],
      [3, 38],
      [4, 0],
      [5, 0],
      [10, 4],
      [11, 3],
      [12, 3],
    ],
  );
  assert.match(result.diagnostics[1].message, /YAML boolean/);
  assert.match(result.diagnostics[2].message, /Unsupported cell option: cache/);
  assert.equal(result.html, ""); // Valid echo:false still applies despite other unsupported options.
});

test("Quarto handles invalid YAML, aliases and duplicate keys without losing source locations", async () => {
  for (const [source, line] of [
    ["---\nexecute:\n  eval: [\n---\nText", 3],
    ["```{r}\n#| eval: false\n#| eval: true\n1+1\n```", 3],
  ]) {
    const { diagnostics } = await renderQuarto(source, {
      executeR: async () => ({ outputs: [] }),
    });
    assert.equal(diagnostics.length, 1);
    assert.equal(diagnostics[0].line, line);
  }
  const result = await renderQuarto(
    "---\nexecute: &off {eval: false, echo: false}\nunsupported: *off\n---\n```{r}\n1+1\n```",
  );
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].line, 3);
  assert.equal(result.html, "");
});

test("Quarto retains later #| code comments, shields nested example fences, and supports quoted cells", async () => {
  const source =
    '~~~text\n```{r}\nstop("literal")\n```\n~~~\n\n> ```{python}\n> #| echo: false\n> print(1)\n> #| this is a code comment\n> ```';
  const result = await renderQuarto(source, {
    executeR: () => assert.fail("Example fence must stay literal"),
    executePython: async (cells) => {
      assert.equal(cells.length, 1);
      assert.equal(cells[0].source, "print(1)\n#| this is a code comment");
      return { outputs: [{ text: "1" }] };
    },
  });
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, /<blockquote>\s*<pre class="cell-output">1/);
});

test("Quarto gives a multi-plot cell one target and numbers visible figures in document order", async () => {
  const result = await renderQuarto(
    "@fig-plots and @fig-last\n\n```{r}\n#| label: fig-plots\nplot(1)\n```\n\n![Last](last.svg){#fig-last}",
    {
      executeR: async () => ({
        outputs: [
          { images: ["data:image/png;base64,AA", "data:image/png;base64,BB"] },
        ],
      }),
    },
  );
  assert.deepEqual(result.diagnostics, []);
  assert.equal((result.html.match(/id="fig-plots"/g) || []).length, 1);
  assert.match(result.html, /href="#fig-last">Figure 2/);
  assert.match(
    result.html,
    /<figure id="fig-plots"><img[\s\S]*<img[\s\S]*<\/figure>/,
  );
});

test("Quarto documents unsupported attributes and invalid figure labels instead of silently accepting them", async () => {
  const result = await renderQuarto(
    "::: {.callout-note collapse=true}\nA note\n:::\n\n![Caption](x.svg){#fig- width=80%}\n\nInline ![small](x.svg){#fig-inline} text\n\n```{r label}\n#| eval: false\n#| label: bad id\n1\n```",
  );
  assert.deepEqual(
    result.diagnostics.map((d) => d.line),
    [1, 5, 5, 7, 9, 11],
  );
  assert.match(
    result.diagnostics[0].message,
    /Unsupported attribute: collapse/,
  );
  assert.ok(!result.html.includes('id="fig-"'));
});

test("Quarto references report original list, quote and table rows, and Mermaid IDs share one document", async () => {
  const result = await renderQuarto(
    "> See @fig-quote.\n\n- See @fig-list.\n\n| A | B |\n|---|---|\n| @fig-table | @fig-other |\n\n```mermaid\ngraph LR\n A-->B\n```\n\n```{r}\n#| eval: false\n1\n```\n\n```mermaid\ngraph LR\n C-->D\n```",
  );
  assert.deepEqual(
    result.diagnostics.map((d) => [d.line, d.column]),
    [
      [1, 6],
      [3, 6],
      [7, 2],
      [7, 15],
    ],
  );
  assert.deepEqual(result.mermaid, [
    "graph LR\n A-->B\n",
    "graph LR\n C-->D\n",
  ]);
  assert.match(result.html, /data-mermaid="0"[\s\S]*data-mermaid="1"/);
});

test("Quarto document disable gates cannot be overridden by cells, while valid cell booleans override defaults", async () => {
  for (const execute of ["false", "{enabled: false, eval: true}"]) {
    const result = await renderQuarto(
      `---\nexecute: ${execute}\n---\n\n` +
        cell("python", "#| eval: true\nprint(1)"),
      { executePython: () => assert.fail("Document disabled execution") },
    );
    assert.deepEqual(result.diagnostics, []);
  }
  const result = await renderQuarto(
    "---\nexecute: {eval: false, echo: false, output: false}\n---\n" +
      cell("r", "#| eval: true\n#| echo: true\n#| output: true\n1+1"),
    { executeR: async () => ({ outputs: [{ text: "2" }] }) },
  );
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, /language-r[^]*1\+1[^]*cell-output[^]*2/);
});

test("Quarto maps repeated references and escaped table pipes to original UTF-16 columns", async () => {
  const result = await renderQuarto(
    "| A | B |\r\n|---|---|\r\n| a\\|b 😀 @fig-lost | a\\|b 😀 @fig-lost |\r\n\r\n> 😀 @fig-quote\r\n",
  );
  assert.deepEqual(
    result.diagnostics.map((d) => [d.line, d.column]),
    [
      [3, 10],
      [3, 30],
      [5, 5],
    ],
  );
});

test("Quarto executable language names require an exact boundary", async () => {
  const result = await renderQuarto(
    cell("ruby", "puts 'Ruby'") +
      cell("pythonista", "not_python()") +
      cell("rust", "fn main() {}"),
    {
      executeR: () => assert.fail("Not an R cell"),
      executePython: () => assert.fail("Not a Python cell"),
    },
  );
  assert.deepEqual(result.diagnostics, []);
  assert.match(result.html, /Ruby/);
  assert.match(result.html, /not_python/);
});
