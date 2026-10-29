// Writes each tests/fixtures/org-plot document with Sheets' inferred plot
// options pasted into its #+PLOT: lines, so the Emacs harness can confirm
// that the pasted text makes org-plot select the same data.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { pastedOrgPlots } from "../src/formats/org/plot.js";
import { recalculateOrg } from "../src/formats/org/engine.js";

const [directory] = process.argv.slice(2);
const fixtures = new URL("../tests/fixtures/org-plot/", import.meta.url);
await mkdir(directory, { recursive: true });
let count = 0;
for (const name of (await readdir(fixtures)).filter((file) => file.endsWith(".org")).sort()) {
  const src = await readFile(new URL(name, fixtures), "utf8"),
    pasted = pastedOrgPlots(src, recalculateOrg(src).tables);
  if (pasted === src) continue;
  await writeFile(`${directory}/${name.replace(/\.org$/, ".pasted.org")}`, pasted);
  count++;
}
console.log(`org-plot: wrote ${count} documents with pasted inferred options.`);
