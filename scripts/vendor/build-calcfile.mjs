import { build } from "esbuild";
import { mkdir, cp, writeFile } from "node:fs/promises";
const [source, revision] = process.argv.slice(2);
const dir = `vendor/calcfile@${revision.slice(0, 12)}`;
await mkdir(dir, { recursive: true });
await build({
  entryPoints: [`${source}/packages/core/src/index.ts`],
  outfile: `${dir}/core.mjs`,
  nodePaths: [`${process.cwd()}/node_modules`],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  legalComments: "linked",
});
await cp(`${source}/LICENSE`, `${dir}/LICENSE`);
await cp(
  `${source}/fixtures/conformance/calcfile-v0.1.json`,
  `${dir}/calcfile-v0.1.json`,
);
await mkdir("vendor/calcfile", { recursive: true });
await writeFile(
  "vendor/calcfile/core.mjs",
  `export * from '../calcfile@${revision.slice(0, 12)}/core.mjs';\n`,
);
