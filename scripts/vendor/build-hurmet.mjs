import { npmLicenses } from "./licenses.mjs";
import { pathToFileURL } from "node:url";
import { cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const [source, revision] = process.argv.slice(2);
const root = process.cwd(),
  dir = `vendor/hurmet@${revision.slice(0, 12)}`;
await mkdir(dir, { recursive: true });
const { rollup } = await import(
  pathToFileURL(`${source}/node_modules/rollup/dist/es/rollup.js`)
);
const { default: configs } = await import(
  pathToFileURL(`${source}/utils/rollup.hurmet.config.js`)
);
await writeFile(
  `${source}/sheets-entry.js`,
  `import temml from './src/temml.js';
import {md2ast} from './src/md2ast.js';
import {updateCalcs} from './src/updateCalcsForCLI.js';
import {ast2html} from './src/md2html.js';
globalThis.temml = temml;
export {default} from './src/hurmet.js';
export async function renderDocument(source) {
  const ast = await updateCalcs(md2ast(source)), diagnostics=[];
  if (!ast) throw new Error('Hurmet could not calculate the document.');
  function walk(node) {
    if (node?.attrs?.error) {
      const index=source.indexOf(node.attrs.entry || '');
      diagnostics.push({line:source.slice(0, Math.max(0,index)).split('\\n').length, message:String(node.attrs.alt || node.attrs.tex || 'Hurmet calculation error').replace(/<[^>]*>/g, '')});
    }
    for (const child of node?.content || []) walk(child);
  }
  walk(ast);
  return {html:ast2html(ast), diagnostics};
}
`,
);
process.chdir(source);
const bundle = await rollup({
  ...configs[0],
  input: "./sheets-entry.js",
  output: undefined,
});
await bundle.write({ file: path.join(root, dir, "hurmet.mjs"), format: "es" });
await bundle.close();
process.chdir(root);
await cp(`${source}/LICENSE`, `${dir}/LICENSE`);
await cp(`${source}/site/docStyles.min.css`, `${dir}/hurmet.css`);
await writeFile(
  `${dir}/scoped.css`,
  `@scope (.hurmet-document) {\n${await (await import("node:fs/promises")).readFile(`${dir}/hurmet.css`, "utf8")}\n}`,
);
await cp(`${source}/site/Temml.woff2`, `${dir}/Temml.woff2`);
await cp(
  `${source}/site/latinmodernmath.woff2`,
  `${dir}/latinmodernmath.woff2`,
);
await mkdir("vendor/hurmet", { recursive: true });
await writeFile(
  "vendor/hurmet/index.js",
  `export {default,renderDocument} from '../hurmet@${revision.slice(0, 12)}/hurmet.mjs';\n`,
);
await writeFile(
  "vendor/hurmet/style.css",
  `@import '../hurmet@${revision.slice(0, 12)}/scoped.css';\n`,
);

await npmLicenses(`${source}/node_modules`, `${dir}/licenses`);
