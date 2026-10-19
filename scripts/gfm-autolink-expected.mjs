// This oracle executes the pinned native engine, never the Sheets renderer.
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const binary = process.env.CMARK_GFM || "cmark-gfm";
const version = spawnSync(binary, ["--version"], { encoding: "utf8" });
if (
  version.error ||
  version.status ||
  !/cmark-gfm 0\.29\.0\.gfm\.13\b/.test(version.stdout)
)
  throw new Error(
    "Set CMARK_GFM to the native cmark-gfm 0.29.0.gfm.13 executable.",
  );
const path = new URL("../tests/fixtures/gfm-autolinks.json", import.meta.url);
const fixture = JSON.parse(await readFile(path, "utf8"));
for (const example of fixture.cases) {
  const result = spawnSync(binary, ["--unsafe", "-e", "autolink"], {
    input: example.source,
    encoding: "utf8",
  });
  if (result.error || result.status)
    throw new Error(result.stderr || "cmark-gfm failed");
  if (process.argv.includes("--check")) {
    if (result.stdout !== example.expected)
      throw new Error(`Native GFM fixture changed: ${example.id}`);
  } else example.expected = result.stdout;
}
if (!process.argv.includes("--check"))
  await writeFile(path, JSON.stringify(fixture, null, 2) + "\n");
console.log(
  `${fixture.cases.length} autolink fixtures ${process.argv.includes("--check") ? "checked against" : "recorded from"} native cmark-gfm 0.29.0.gfm.13.`,
);
