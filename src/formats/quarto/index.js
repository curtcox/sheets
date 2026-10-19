import { plugin } from "../registry.js";
import { parseQuarto } from "./parse.js";
import { runWorker } from "../../worker-client.js";
import { runR } from "../../webr-client.js";
import { escapeHTML as e } from "../../util.js";
export async function renderQuarto(
  src,
  { signal, executePython, executeR } = {},
) {
  const parsed = parseQuarto(src),
    { metadata, parts, diagnostics } = parsed;
  const defaults = typeof metadata.execute === "object" ? metadata.execute : {};
  const supported = new Set(["python", "r"]);
  const executable = parts.filter(
    (p) =>
      p.kind === "cell" &&
      supported.has(p.language) &&
      metadata.execute !== false &&
      defaults.enabled !== false &&
      (p.options.eval ?? defaults.eval) !== false,
  );
  const outputs = new Map();
  // Each language retains document order and its own interpreter. Both jobs share
  // the render's AbortSignal; neither language can read the other's variables.
  await Promise.all(
    [
      [
        "python",
        executePython ||
          ((cells) =>
            runWorker(
              new URL("../../workers/pyodide.worker.js", import.meta.url),
              { cells },
              { signal, timeout: 90000 },
            )),
      ],
      ["r", executeR || ((cells) => runR(cells, { signal, timeout: 90000 }))],
    ].map(async ([language, execute]) => {
      const cells = executable.filter((p) => p.language === language);
      if (!cells.length) return;
      try {
        const result = await execute(cells);
        cells.forEach((cell, i) => outputs.set(cell, result.outputs[i]));
      } catch (error) {
        if (error.name === "AbortError") throw error;
        // One diagnostic at each affected cell, without duplicating the first one.
        cells.forEach((cell) => outputs.set(cell, { error: error.message }));
      }
    }),
  );
  parsed.resolveFigures(outputs);
  let html = metadata.title ? `<h1>${e(metadata.title)}</h1>` : "";
  if (metadata.author || metadata.date)
    html += `<p class="document-meta">${e([metadata.author, metadata.date].filter(Boolean).join(" · "))}</p>`;
  parsed.md.renderer.rules.quarto_cell = (tokens, i) => {
    const part = tokens[i].meta;
    let html = "";
    const options = { ...defaults, ...part.options },
      output = outputs.get(part);
    if (options.echo !== false)
      html += `<pre><code class="language-${e(part.language)}">${e(part.source)}</code></pre>`;
    if (!supported.has(part.language)) {
      html += `<p class="notice">${e(part.language)}: not executed in the browser.</p>`;
      return html;
    }
    if (output?.error) {
      diagnostics.push({ line: part.line, message: output.error });
      html += `<pre class="error">${e(output.error)}</pre>`;
    }
    if (options.output === false) return html;
    if (output?.stdout || output?.text || output?.stderr)
      html += `<pre class="cell-output">${e([output.stdout, output.text, output.stderr].filter(Boolean).join("\n"))}</pre>`;
    if (output?.html) html += output.html;
    const figures = [
      ...(output?.figures || []),
      ...(output?.images || []).map(
        (url) => `<img src="${e(url)}" alt="R plot">`,
      ),
    ];
    if (figures.length)
      html += `<figure${part.target ? ` id="${e(options.label)}"` : ""}>${figures.join("")}${options["fig-cap"] ? `<figcaption>${e(options["fig-cap"])}</figcaption>` : ""}</figure>`;
    return html;
  };
  html += parsed.md.renderer.render(
    parsed.tokens,
    parsed.md.options,
    parsed.env,
  );
  diagnostics.sort(
    (a, b) => a.line - b.line || (a.column ?? 0) - (b.column ?? 0),
  );
  return { html, diagnostics, mermaid: parsed.mermaid };
}
export default plugin("quarto", renderQuarto);
