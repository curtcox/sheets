import { readFile, readdir, writeFile } from "node:fs/promises";
const [directory, mode] = process.argv.slice(2);
const result = {};
for (const file of (await readdir(directory)).sort())
  if (file.endsWith(".expected"))
    result[file.replace(/\.expected$/, "")] = JSON.parse(
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
  `Org reference: ${Object.keys(result).length} documents checked with Emacs.`,
);
