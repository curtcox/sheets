import{writeFile,rm,readdir,stat}from'node:fs/promises';
import path from'node:path';
import{generateOffline}from'../vendor/fragment-kit-v0.3.4/tools/offline-assets.mjs';
import{publicAssets}from'./public-assets.mjs';
export async function offlineManifest(root,check=false){
 const files=[];
 async function walk(relative){const file=path.join(root,relative);if((await stat(file)).isDirectory()){for(const name of(await readdir(file)).sort())await walk(relative+'/'+name);}else files.push(relative);}
 for(const entry of publicAssets){
  if(entry==='vendor'){for(const name of(await readdir(path.join(root,'vendor'))).sort()){
   if(name==='fragment-kit-v0.3.4'){for(const file of ['src','vendor','LICENSE','manifest.json'])await walk('vendor/'+name+'/'+file);}
   else await walk('vendor/'+name);
  }}else await walk(entry);
 }
 const temporary=path.join(root,'.offline-build.json');
 try{await writeFile(temporary,JSON.stringify({prefix:'sheets-offline',files}));return await generateOffline(temporary,check);}
 finally{await rm(temporary,{force:true});}
}
