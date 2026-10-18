import { mkdir, cp, rm, readFile, writeFile } from "node:fs/promises";
export const served = [
  "index.html",
  "gallery.html",
  "docs.html",
  "docs",
  "src",
  "vendor",
  "examples",
  ".nojekyll",
];
export async function stage(
  destination = "_site",
  sha = process.env.GITHUB_SHA?.slice(0, 7) || "local",
) {
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  for (const file of served)
    await cp(file, `${destination}/${file}`, { recursive: true });
  const html = await readFile(`${destination}/index.html`, "utf8");
  await writeFile(
    `${destination}/index.html`,
    html.replaceAll("__COMMIT_SHA__", sha),
  );
}
if (process.argv[1] === new URL(import.meta.url).pathname) await stage();
