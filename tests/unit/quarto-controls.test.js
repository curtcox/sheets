import { test } from "node:test";
import assert from "node:assert/strict";
import { renderQuarto } from "../../src/formats/quarto/index.js";
import { runR } from "../../src/webr-client.js";
const cell = (language, source) =>
  `\n\n\`\`\`{${language}}\n${source}\n\`\`\`\n`;

test("Quarto hidden setup still executes, cannot expose output through echo overrides, and hidden failures remain diagnostics", async () => {
  let count = 0;
  const result = await renderQuarto(
    "---\nexecute:\n  include: false\n  echo: false\n---\n" +
      cell("python", "#| echo: true\nhidden=7") +
      cell("python", "#| include: true\nprint(hidden)"),
    {
      executePython: async (cells) => {
        count = cells.length;
        assert.equal(cells[0].execution.include, false);
        return {
          outputs: [
            {
              stdout: "HIDDEN",
              error: "hidden failure",
              figures: ["HIDDEN PLOT"],
            },
            { stdout: "VISIBLE" },
          ],
        };
      },
    },
  );
  assert.equal(count, 2);
  assert.ok(!result.html.includes("HIDDEN"));
  assert.ok(!result.html.includes("hidden=7"));
  assert.ok(result.html.includes("VISIBLE"));
  assert.deepEqual(result.diagnostics, [
    { line: 9, message: "hidden failure" },
  ]);
});

test("Quarto warning/output switches filter language streams without hiding execution errors", async () => {
  const source =
    cell("r", "#| warning: false\nR1") +
    cell("python", "#| warning: false\nPY1") +
    cell("r", "#| output: false\nR2");
  const result = await renderQuarto(source, {
    executeR: async () => ({
      outputs: [
        {
          stdout: "R OUTPUT",
          stderr: "R HIDDEN MESSAGE",
          warnings: ["R HIDDEN WARNING"],
        },
        {
          stdout: "R HIDDEN OUTPUT",
          stderr: "R HIDDEN MESSAGE",
          warnings: ["R HIDDEN WARNING"],
          error: "ERROR REMAINS",
        },
      ],
    }),
    executePython: async () => ({
      outputs: [{ stdout: "PY OUTPUT", stderr: "PY HIDDEN STDERR" }],
    }),
  });
  for (const text of ["R OUTPUT", "PY OUTPUT", "ERROR REMAINS"])
    assert.ok(result.html.includes(text), text);
  assert.ok(!result.html.includes("HIDDEN"));
  assert.equal(result.diagnostics.length, 1);
});

test("Explicit Quarto error:false marks later same-language cells unexecuted while independent languages render", async () => {
  const result = await renderQuarto(
    cell("r", "#| error: false\nstop()") +
      cell("python", "2+2") +
      cell("r", "later"),
    {
      executeR: async (cells) => {
        assert.equal(cells[0].execution.error, false);
        return { outputs: [{ error: "STOP" }, { stdout: "MUST NOT RENDER" }] };
      },
      executePython: async () => ({ outputs: [{ text: "4" }] }),
    },
  );
  assert.ok(result.html.includes("STOP"));
  assert.ok(result.html.includes(">4<"));
  assert.ok(!result.html.includes("MUST NOT RENDER"));
  assert.ok(result.html.includes("stopped this session"));
  assert.equal(result.diagnostics.length, 1);
});

test("Quarto validates bounded figure inches and Python document-only sizing with original YAML locations", async () => {
  const source =
    '---\nfig-width: 4\nfig-height: "3"\nexecute: {include: "false", warning: false, error: true}\n---\n' +
    cell("python", "#| fig-width: 2\n#| fig-alt: [invalid]\nprint(1)") +
    cell("r", "#| fig-height: 0\n#| include: false\nplot(1)");
  const result = await renderQuarto(source, {
    executePython: async (cells) => {
      assert.deepEqual(cells[0].execution.figureSize, { width: 4, height: 5 });
      assert.equal(cells[0].execution.warning, false);
      return { outputs: [{ stdout: "OK" }] };
    },
    executeR: async (cells) => {
      assert.deepEqual(cells[0].execution.figureSize, { width: 4, height: 5 });
      return { outputs: [] };
    },
  });
  assert.deepEqual(
    result.diagnostics.map((d) => d.line),
    [3, 4, 9, 10, 16],
  );
  assert.match(result.diagnostics[2].message, /document-level only/);
  assert.match(result.diagnostics[4].message, /20 inches/);
});

test("Quarto figure alt is escaped for SVG and PNG, hidden figures cannot become cross-reference targets", async () => {
  const result = await renderQuarto(
    cell("python", "#| fig-alt: 'a \"quote\" <unsafe>'\nplot") +
      cell("r", "#| label: fig-hidden\n#| include: false\nplot") +
      "\n@fig-hidden",
    {
      executePython: async () => ({
        outputs: [
          {
            figures: [
              '<svg width="10" height="20" role="presentation" aria-label="old"></svg>',
            ],
          },
        ],
      }),
      executeR: async () => ({
        outputs: [{ images: ["data:image/png;base64,AAAA"] }],
      }),
    },
  );
  assert.match(
    result.html,
    /role="img" aria-label="a &quot;quote&quot; &lt;unsafe&gt;"/,
  );
  assert.ok(!result.html.includes('aria-label="old"'));
  assert.ok(!result.html.includes('id="fig-hidden"'));
  assert.ok(!result.html.includes('href="#fig-hidden"'));
  assert.equal(result.diagnostics.length, 2);
});

test("R backend preserves typed warnings and uses inch-sized graphics while halting before later code", async () => {
  const captured = [];
  class WebR {
    async init() {}
    close() {}
    Shelter = class {
      async captureR(source, options) {
        captured.push({ source, options });
        return {
          images: [],
          output: [
            {
              type: "warning",
              data: { get: async () => ({ toString: async () => "WARN" }) },
            },
            {
              type: "error",
              data: { get: async () => ({ toString: async () => "STOP" }) },
            },
          ],
        };
      }
      async purge() {}
    };
  }
  const result = await runR(
    [
      {
        source: "bad",
        execution: { error: false, figureSize: { width: 4, height: 3 } },
      },
      { source: "never" },
    ],
    {
      loadRuntime: async () => ({ WebR, ChannelType: { PostMessage: 1 } }),
      start: async () => ({ terminate() {} }),
    },
  );
  assert.equal(captured.length, 1);
  assert.deepEqual(captured[0].options.captureGraphics, {
    width: 288,
    height: 216,
    bg: "white",
  });
  assert.deepEqual(result.outputs[0].warnings, ["warning: WARN"]);
  assert.equal(result.outputs[0].error, "STOP");
});
