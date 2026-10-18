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
