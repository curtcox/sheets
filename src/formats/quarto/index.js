import { plugin } from "../registry.js";
import { parseQuarto } from "./parse.js";
import { runWorker } from "../../worker-client.js";
import { runR } from "../../webr-client.js";
import { escapeHTML as e } from "../../util.js";
import { cellOptions } from "./cell-options.js";
export async function renderQuarto(
  src,
  { signal, executePython, executeR } = {},
) {
  const parsed = parseQuarto(src),
    { metadata, parts, diagnostics } = parsed;
  const defaults = typeof metadata.execute === "object" ? metadata.execute : {};
  for (const part of parts) part.execution = cellOptions(metadata, part);
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
        let stopped = false;
        cells.forEach((cell, i) => {
          const output = stopped ? { skipped: true } : result.outputs[i];
          outputs.set(cell, output);
          if (output?.error && cell.execution.error === false) stopped = true;
        });
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
    const options = part.execution,
      output = outputs.get(part);
    if (output?.error)
      diagnostics.push({ line: part.line, message: output.error });
    if (options.include === false) return "";
    if (options.echo !== false)
      html += `<pre><code class="language-${e(part.language)}">${e(part.source)}</code></pre>`;
    if (!supported.has(part.language)) {
      html += `<p class="notice">${e(part.language)}: not executed in the browser.</p>`;
      return html;
    }
    if (output?.error) {
      html += `<pre class="error">${e(output.error)}</pre>`;
    }
    if (output?.skipped)
      return (
        html +
        `<p class="notice">Not executed because an earlier ${e(part.language === "r" ? "R" : "Python")} cell stopped this session.</p>`
      );
    if (options.output === false) return html;
    if (part.language === "r") {
      if (options.warning !== false && output?.warnings?.length)
        html += `<pre class="cell-output cell-warning">${e(output.warnings.join("\n"))}</pre>`;
      if (output?.stderr && options.warning !== false)
        html += `<pre class="cell-output cell-message">${e(output.stderr)}</pre>`;
    }
    const stderr =
      part.language === "python" && options.warning !== false
        ? output?.stderr
        : "";
    if (output?.stdout || output?.text || stderr)
      html += `<pre class="cell-output">${e([output?.stdout, output?.text, stderr].filter(Boolean).join("\n"))}</pre>`;
    if (output?.html) html += output.html;
    const figures = [
      ...(output?.figures || []).map((svg) => {
        if (options["fig-alt"] === undefined) return svg;
        const alt = options["fig-alt"];
        return svg.replace(/<svg\b([^>]*)>/i, (_, attrs) => {
          attrs = attrs.replace(
            /\s+(?:role|aria-label|aria-hidden)\s*=\s*(?:"[^"]*"|'[^']*')/gi,
            "",
          );
          return `<svg${attrs}${alt ? ` role="img" aria-label="${e(alt)}"` : ' aria-hidden="true"'}>`;
        });
      }),
      ...(output?.images || []).map(
        (url) =>
          `<img src="${e(url)}" alt="${e(options["fig-alt"] ?? options["fig-cap"] ?? "R plot")}"${options.figureSize ? ` width="${Math.round(options.figureSize.width * 96)}" height="${Math.round(options.figureSize.height * 96)}"` : ""}>`,
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
