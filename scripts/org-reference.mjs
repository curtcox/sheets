import { readFile, readdir, writeFile } from "node:fs/promises";
const [directory, mode] = process.argv.slice(2);
const rows = (source) =>
  source
    .split("\n")
    .filter((line) => /^\s*\|/.test(line) && !/^\s*\|[-+:]+\|?\s*$/.test(line))
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((s) => s.trim()),
    );
const result = {};
for (const file of (await readdir(directory)).sort())
  if (file.endsWith(".expected"))
    result[file.replace(/\.expected$/, "")] = rows(
      await readFile(`${directory}/${file}`, "utf8"),
    );
const expected = "tests/fixtures/org/reference.json";
if (mode === "--check") {
  if (
    JSON.stringify(JSON.parse(await readFile(expected, "utf8"))) !==
    JSON.stringify(result)
  ) {
    console.error(
      "Emacs reference fixture drift:",
      JSON.stringify(result, null, 2),
    );
    process.exitCode = 1;
  }
} else await writeFile(expected, JSON.stringify(result, null, 2) + "\n");
console.log(
  `Org reference: ${Object.keys(result).length} numeric tables checked with Emacs.`,
);
