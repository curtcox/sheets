import { readFile, writeFile } from "node:fs/promises";
import { renderMarkdown } from "../src/formats/gfm/markdown.js";
export function specExamples(text) {
  const examples = [];
  let section = "";
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,6} /.test(lines[i])) section = lines[i].replace(/^#+ /, "");
    if (!/^`{32} example(?:\s|$)/.test(lines[i])) continue;
    const flags = lines[i].slice(40).trim().split(/\s+/).filter(Boolean);
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
      flags,
      source: input.join("\n") + "\n",
      expected: expected.join("\n") + "\n",
    });
  }
  return examples;
}
export async function readExamples() {
  return specExamples(
    await readFile(
      new URL("../tests/fixtures/gfm-spec.txt", import.meta.url),
      "utf8",
    ),
  );
}
export async function conformance() {
  const examples = await readExamples();
  const audit = JSON.parse(
    await readFile(
      new URL("../tests/fixtures/gfm-audit.json", import.meta.url),
      "utf8",
    ),
  );
  const classified = new Map();
  for (const group of audit.groups)
    for (const id of group.examples) {
      if (classified.has(id) || !examples[id - 1])
        throw new Error(`Invalid/duplicate GFM audit ID ${id}`);
      classified.set(id, group.id);
    }
  if (
    audit.originalFailures.length !== 90 ||
    audit.originalFailures.some((id) => !classified.has(id))
  )
    throw new Error("The original 90 deviations must all be classified.");
  const metric = (raw) => {
    const failures = examples
      .filter((example) => {
        // The source corpus explicitly opts into extensions. The two task-list
        // examples are marked disabled upstream; keep measuring both here.
        const extensions =
          example.section === "Task list items (extension)"
            ? ["tasklist"]
            : example.flags;
        return (
          renderMarkdown(
            example.source,
            raw ? { presentation: false, extensions } : {},
          ).html !== example.expected
        );
      })
      .map(({ id, section }) => {
        if (!classified.has(id))
          throw new Error(
            `Unclassified ${raw ? "raw" : "production"} GFM failure ${id}`,
          );
        return { id, section, classification: classified.get(id) };
      });
    return {
      passed: examples.length - failures.length,
      failed: failures.length,
      failures,
    };
  };
  return {
    upstream: "github/cmark-gfm@0.29.0.gfm.13/test/spec.txt",
    total: examples.length,
    raw: metric(true),
    production: metric(false),
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
    `GFM exact HTML: raw ${report.raw.passed}/${report.total}; production ${report.production.passed}/${report.total}. All deviations classified; browser sanitization is measured separately.`,
  );
}
