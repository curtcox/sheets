import { readFile, readdir, writeFile } from "node:fs/promises";
const [directory, mode] = process.argv.slice(2);
const result = {},
  rejected = {};
for (const file of (await readdir(directory)).sort())
  if (file.endsWith(".expected"))
    result[file.replace(/\.expected$/, "")] = JSON.parse(
      await readFile(`${directory}/${file}`, "utf8"),
    );
  else if (file.endsWith(".rejected"))
    rejected[file.replace(/\.rejected$/, "")] = JSON.parse(
      await readFile(`${directory}/${file}`, "utf8"),
    );
for (const [expected, values] of [
  ["tests/fixtures/org/reference.json", result],
  ["tests/fixtures/org/rejections.json", rejected],
]) {
  if (mode === "--check") {
    if (
      JSON.stringify(JSON.parse(await readFile(expected, "utf8"))) !==
      JSON.stringify(values)
    ) {
      console.error(
        "Emacs reference fixture drift:",
        JSON.stringify(values, null, 2),
      );
      process.exitCode = 1;
    }
  } else await writeFile(expected, JSON.stringify(values, null, 2) + "\n");
}
console.log(
  `Org reference: ${Object.keys(result).length} documents and ${Object.keys(rejected).length} rejections checked with Emacs.`,
);
