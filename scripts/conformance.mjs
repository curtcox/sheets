import { readFile, writeFile } from "node:fs/promises";
import { renderMarkdown } from "../src/formats/gfm/markdown.js";
export function specExamples(text) {
  const examples = [];
  let section = "";
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,6} /.test(lines[i])) section = lines[i].replace(/^#+ /, "");
    if (!/^`{32} example(?:\s|$)/.test(lines[i])) continue;
    const input = [],
      expected = [];
    let target = input;
    for (i++; i < lines.length && !/^`{32}$/.test(lines[i]); i++) {
      if (lines[i] === ".") target = expected;
      else target.push(lines[i].replaceAll("→", "\t"));
    }
    examples.push({
      id: examples.length + 1,
      section,
      source: input.join("\n") + "\n",
      expected: expected.join("\n") + "\n",
    });
  }
  return examples;
}
export async function conformance() {
  const examples = specExamples(
    await readFile(
      new URL("../tests/fixtures/gfm-spec.txt", import.meta.url),
      "utf8",
    ),
  );
  const failures = examples
    .filter(
      (example) => renderMarkdown(example.source).html !== example.expected,
    )
    .map(({ id, section }) => ({ id, section }));
  return {
    upstream: "github/cmark-gfm@0.29.0.gfm.13/test/spec.txt",
    total: examples.length,
    passed: examples.length - failures.length,
    failed: failures.length,
    failures,
  };
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const report = await conformance();
  if (process.argv.includes("--record"))
    await writeFile(
      new URL("../tests/fixtures/gfm-conformance.json", import.meta.url),
      JSON.stringify(report, null, 2) + "\n",
    );
  else {
    const recorded = JSON.parse(
      await readFile(
        new URL("../tests/fixtures/gfm-conformance.json", import.meta.url),
        "utf8",
      ),
    );
    if (JSON.stringify(recorded) !== JSON.stringify(report)) {
      console.error(
        "GFM conformance changed. Review and record with --record.",
      );
      process.exitCode = 1;
    }
  }
  console.log(
    `GFM exact HTML conformance: ${report.passed}/${report.total} (${((100 * report.passed) / report.total).toFixed(1)}%). ${report.failed} documented deviations.`,
  );
}
