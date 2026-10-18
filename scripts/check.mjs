import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
async function walk(dir) {
  let files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await walk(p)));
    else if (/\.(?:js|mjs|cjs)$/.test(p)) files.push(p);
  }
  return files;
}
const files = (await Promise.all(["src", "scripts", "tests"].map(walk))).flat();
files.push("playwright.config.js");
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  if (result.status) {
    console.error(result.stderr);
    process.exitCode = 1;
  }
}
if (!process.exitCode) console.log(`Syntax checked ${files.length} scripts.`);
