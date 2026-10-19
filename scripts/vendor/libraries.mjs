// One-time vendoring. The deployed app never resolves npm packages or runs a build.
import { build } from "esbuild";
import { readFile, writeFile, mkdir, cp, readdir } from "node:fs/promises";
import path from "node:path";
const packages = {
  "markdown-it": "default",
  "markdown-it-task-lists": "default",
  "markdown-it-footnote": "default",
  "markdown-it-github-alerts": "default",
  "highlight.js": "default",
  temml: "default",
  dompurify: "default",
  "lz-string": "default",
  "decimal.js": "default",
  asciimath2tex: "default",
  mathjs: "*",
  orga: "*",
  "js-yaml": "*",
  mermaid: "default",
};
const names = {
  "markdown-it": "MarkdownIt",
  "markdown-it-task-lists": "taskLists",
  "markdown-it-footnote": "footnotes",
  "markdown-it-github-alerts": "alerts",
  "highlight.js": "highlight",
  temml: "temml",
  dompurify: "DOMPurify",
  "lz-string": "LZString",
  "decimal.js": "Decimal",
  asciimath2tex: "AsciiMathParser",
  mathjs: "math",
  orga: "orga",
  "js-yaml": "yaml",
  mermaid: "mermaid",
};
let exports = "",
  inventory =
    "# Vendored dependencies\n\nRebuild npm libraries with `npm ci && npm run vendor`. Versions are locked in package-lock.json.\nAll generated bundles are unmodified upstream code compiled to browser ES modules.\nTransitive license notices are in `licenses/` and in esbuild `.LEGAL.txt` files.\n\n| Library | Version | License | Source | Rebuild |\n|---|---|---|---|---|\n";
for (const [name, type] of Object.entries(packages)) {
  const pkg = JSON.parse(
    await readFile(`node_modules/${name}/package.json`, "utf8"),
  );
  const dir = `vendor/${name}@${pkg.version}`;
  await mkdir(dir, { recursive: true });
  await build({
    stdin: {
      contents:
        type === "*"
          ? `export * from '${name}'`
          : `export {default} from '${name}'`,
      resolveDir: process.cwd(),
    },
    outdir: dir,
    entryNames: "index",
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    splitting: true,
    minify: true,
    legalComments: "linked",
    loader: { ".woff2": "file", ".ttf": "file" },
  });
  for (const file of await readdir(`node_modules/${name}`)) {
    if (/^(license|copying|notice)/i.test(file))
      await cp(`node_modules/${name}/${file}`, `${dir}/${file}`, {
        recursive: true,
      });
  }
  await writeFile(
    `vendor/${["highlight.js", "decimal.js"].includes(name) ? name : name + ".js"}`,
    type === "*"
      ? `export * from './${name}@${pkg.version}/index.js';\n`
      : `export {default} from './${name}@${pkg.version}/index.js';\n`,
  );
  exports += `export ${type === "*" ? "* as" : "{ default as"} ${names[name]}${type === "*" ? "" : " }"} from './${name}@${pkg.version}/index.js';\n`;
  let repository =
    typeof pkg.repository === "string"
      ? pkg.repository
      : pkg.repository?.url || pkg.homepage;
  repository = repository
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/^git@github.com:/, "https://github.com/")
    .replace("https://github.com:", "https://github.com/")
    .replace(/\.git$/, "");
  if (!repository.startsWith("https:"))
    repository = "https://github.com/" + repository;
  inventory += `| ${name} | ${pkg.version} | ${pkg.license} | ${repository} | npm run vendor |\n`;
}
const ace = JSON.parse(
  await readFile("node_modules/ace-builds/package.json", "utf8"),
);
const aceDir = `vendor/ace-builds@${ace.version}`;
await mkdir(aceDir, { recursive: true });
for (const name of [
  "ace.js",
  "mode-markdown.js",
  "mode-text.js",
  "mode-python.js",
  "mode-latex.js",
  "theme-tomorrow_night.js",
]) {
  await cp(
    `node_modules/ace-builds/src-min-noconflict/${name}`,
    `${aceDir}/${name}`,
  );
}
await cp("node_modules/ace-builds/LICENSE", `${aceDir}/LICENSE`);
await writeFile(
  "src/ace-path.js",
  `export const acePath = 'vendor/ace-builds@${ace.version}';\n`,
);
await writeFile(
  "index.html",
  (await readFile("index.html", "utf8")).replace(
    /vendor\/ace-builds@[^/]+\/ace\.js/g,
    `${aceDir}/ace.js`,
  ),
);
await cp("node_modules/temml/dist/Temml-Local.css", "vendor/temml.css");
await cp("node_modules/temml/dist/Temml.woff2", "vendor/Temml.woff2");
await cp("node_modules/highlight.js/styles/github.css", "vendor/highlight.css");
await writeFile("vendor/libraries.js", exports);
// Preserve license texts for every npm dependency included in bundles.
async function licenses(root) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const dir = path.join(root, entry.name);
    if (entry.name.startsWith("@")) {
      await licenses(dir);
      continue;
    }
    let pkg;
    try {
      pkg = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
    } catch {
      continue;
    }
    const dest = `vendor/licenses/${pkg.name.replaceAll("/", "__")}@${pkg.version}`;
    for (const file of await readdir(dir))
      if (/^(license|copying|notice)/i.test(file)) {
        await mkdir(dest, { recursive: true });
        await cp(path.join(dir, file), path.join(dest, file), {
          recursive: true,
        });
      }
    try {
      await licenses(path.join(dir, "node_modules"));
    } catch {
      /* No nested dependencies. */
    }
  }
}
await licenses("node_modules");
inventory += `| ace-builds | ${ace.version} | BSD-3-Clause | https://github.com/ajaxorg/ace | npm run vendor |\n`;
await writeFile(
  "vendor/README.md",
  inventory +
    "\nNumbat and Hurmet retain dependency notices in their own `licenses/` directories. Hurmet includes a small build wrapper to expose AST diagnostics and initialize its own Temml global; its source is in `scripts/vendor/build-hurmet.mjs`.\n\nNumbat applies `scripts/vendor/numbat.patch` before building. The bridge exposes parser statement ranges and structured diagnostic labels; the interpreter rules are unchanged.\n\nSource-built engines are documented in `engines.json`; rebuild with `scripts/vendor/{numbat,calcfile,hurmet}.sh`. Pyodide 0.27.7 (MPL-2.0) is loaded on demand from https://cdn.jsdelivr.net/pyodide/v0.27.7/full/.\n\nR is loaded on demand from https://webr.r-wasm.org/v0.6.0/ (webR 0.6.0).\nThe JavaScript loader is MIT; the R/webR distribution binaries are GPL-3.0.\nSee the [upstream licenses](https://github.com/r-wasm/webr/blob/v0.6.0/LICENSE.md)\nand [release sources](https://github.com/r-wasm/webr/releases/tag/v0.6.0).\nThese runtime assets are downloaded from upstream and are not vendored or included\nin the offline app cache. `src/webr-client.js` and its same-origin bootstrap\n`src/workers/webr-worker.js` pin the runtime URLs. The bootstrap creates webR’s\nown worker directly, so cancellation also stops its initial CDN download.\n",
);
