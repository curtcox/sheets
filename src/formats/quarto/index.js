import { plugin } from "../registry.js";
import { parseQuarto } from "./parse.js";
import { renderMarkdown } from "../gfm/markdown.js";
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
  let figureCount = 0;
  const labels = new Map(),
    mermaid = [];
  for (const p of parts) {
    if (p.options?.label?.startsWith("fig-"))
      labels.set(p.options.label, ++figureCount);
    if (p.kind === "prose")
      for (const m of p.source.matchAll(/\{#(fig-[\w-]+)\}/g))
        labels.set(m[1], ++figureCount);
  }
  let html = metadata.title ? `<h1>${e(metadata.title)}</h1>` : "";
  if (metadata.author || metadata.date)
    html += `<p class="document-meta">${e([metadata.author, metadata.date].filter(Boolean).join(" · "))}</p>`;
  for (const part of parts) {
    if (part.kind === "prose") {
      const prose = part.source
        .replace(
          /^:::\s*\{\.callout-(note|warning|tip|important|caution)[^}]*\}\s*$/gm,
          '<aside class="callout callout-$1">',
        )
        .replace(/^:::\s*$/gm, "</aside>")
        .replace(
          /\{#(fig-[\w-]+)\}/g,
          (_, label) => `<span id="${e(label)}"></span>`,
        )
        .replace(/@(fig-[\w-]+)/g, (_, label) =>
          labels.has(label)
            ? `[Figure ${labels.get(label)}](#${label})`
            : `@${label}`,
        );
      const result = renderMarkdown(prose);
      const offset = mermaid.length;
      html += result.html.replace(
        /data-mermaid="(\d+)"/g,
        (_, n) => `data-mermaid="${Number(n) + offset}"`,
      );
      mermaid.push(...result.mermaid);
      continue;
    }
    const options = { ...defaults, ...part.options },
      output = outputs.get(part);
    if (options.echo !== false)
      html += `<pre><code class="language-${e(part.language)}">${e(part.source)}</code></pre>`;
    if (!supported.has(part.language)) {
      html += `<p class="notice">${e(part.language)}: not executed in the browser.</p>`;
      continue;
    }
    if (output?.error) {
      diagnostics.push({ line: part.line, message: output.error });
      html += `<pre class="error">${e(output.error)}</pre>`;
    }
    if (options.output === false) continue;
    if (output?.stdout || output?.text || output?.stderr)
      html += `<pre class="cell-output">${e([output.stdout, output.text, output.stderr].filter(Boolean).join("\n"))}</pre>`;
    if (output?.html) html += output.html;
    for (const svg of [
      ...(output?.figures || []),
      ...(output?.images || []).map(
        (url) => `<img src="${e(url)}" alt="R plot">`,
      ),
    ])
      html += `<figure${options.label ? ` id="${e(options.label)}"` : ""}>${svg}${options["fig-cap"] ? `<figcaption>${e(options["fig-cap"])}</figcaption>` : ""}</figure>`;
  }
  return { html, diagnostics, mermaid };
}
export default plugin("quarto", renderQuarto);
