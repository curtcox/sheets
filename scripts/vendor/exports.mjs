// One-time export library builds; the deployed application remains buildless.
import { build } from "esbuild";
import { readFile, writeFile, mkdir, readdir, cp, rm } from "node:fs/promises";
import path from "node:path";
const licenses = new Set();
const libraries = {
  docx: "*",
  turndown: "default",
  "turndown-plugin-gfm": "*",
  xlsx: "*",
  fflate: "*",
};
const inventory = [];
for (const [name, kind] of Object.entries(libraries)) {
  const pkg = JSON.parse(
    await readFile(`node_modules/${name}/package.json`, "utf8"),
  );
  const dir = `vendor/${name}@${pkg.version}`;
  await mkdir(dir, { recursive: true });
  const result = await build({
    metafile: true,
    stdin: {
      contents:
        kind === "*"
          ? `export * from '${name}'`
          : `export {default} from '${name}'`,
      resolveDir: process.cwd(),
    },
    outfile: `${dir}/index.js`,
    bundle: true,
    platform: "browser",
    format: "esm",
    target: "es2022",
    minify: true,
    legalComments: "linked",
  });
  for (const input of Object.keys(result.metafile.inputs)) {
    let dir = path.dirname(input);
    while (dir !== ".") {
      try {
        await readFile(path.join(dir, "package.json"));
        licenses.add(dir);
        break;
      } catch {}
      dir = path.dirname(dir);
    }
  }
  await writeFile(
    `vendor/${name}.js`,
    `${kind === "*" ? "export *" : "export {default}"} from './${name}@${pkg.version}/index.js';\n`,
  );
  inventory.push({
    name,
    version: pkg.version,
    license: pkg.license,
    source: pkg.repository,
  });
}
await rm("vendor/export-licenses", { recursive: true, force: true });
for (const dir of licenses) {
  const pkg = JSON.parse(
    await readFile(path.join(dir, "package.json"), "utf8"),
  );
  const destination = `vendor/export-licenses/${pkg.name.replaceAll("/", "__")}@${pkg.version}`;
  await mkdir(destination, { recursive: true });
  for (const file of await readdir(dir))
    if (/^(license|copying|notice|copyright)/i.test(file))
      await cp(path.join(dir, file), path.join(destination, file), {
        recursive: true,
      });
}
await writeFile(
  "vendor/exports.json",
  JSON.stringify(inventory, null, 2) + "\n",
);
