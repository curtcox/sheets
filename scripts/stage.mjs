import{mkdir,cp,rm,readFile,writeFile}from'node:fs/promises';
import{publicAssets,served}from'./public-assets.mjs';
import{offlineManifest}from'./offline-assets.mjs';
export{served};
export async function stage(destination='_site',sha=process.env.GITHUB_SHA?.slice(0,7)||'local'){
 await rm(destination,{recursive:true,force:true});await mkdir(destination,{recursive:true});
 for(const file of publicAssets)await cp(file,destination+'/'+file,{recursive:true,filter:source=>!(source==='vendor/lz-string.js'||/vendor\/fragment-kit-v[0-9]+\.[0-9]+\.[0-9]+\/(?:testing|tools|docs)(?:\/|$)/.test(source)||/vendor\/fragment-kit-v[0-9]+\.[0-9]+\.[0-9]+\/(?:package\.json|CHANGELOG\.md)$/.test(source))});
 const html=await readFile(destination+'/index.html','utf8');await writeFile(destination+'/index.html',html.replaceAll('__COMMIT_SHA__',sha));
 await offlineManifest(destination);
}
if(process.argv[1]===new URL(import.meta.url).pathname)await stage();
