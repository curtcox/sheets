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
files.push("playwright.config.js", "sw.js");
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

if(!process.exitCode){
 const{verifyManifest}=await import('../vendor/fragment-kit-v0.4.3/tools/vendor-sync.mjs');
 const{offlineManifest}=await import('./offline-assets.mjs');
 const{renderGallery}=await import('../vendor/fragment-kit-v0.4.3/tools/render-gallery.mjs');
 await verifyManifest('vendor/fragment-kit-v0.4.3');await offlineManifest('.',true);await renderGallery('gallery.config.mjs',true);
 const catalog=spawnSync(process.execPath,['scripts/gallery-catalog.mjs','--check'],{stdio:'inherit'});if(catalog.status)process.exitCode=1;
}
