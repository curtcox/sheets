import{test}from'node:test';
import assert from'node:assert/strict';
import{mkdtemp,readdir,readFile,rm,appendFile,stat}from'node:fs/promises';
import{tmpdir}from'node:os';
import{createHash}from'node:crypto';
import{offlineManifest}from'../../scripts/offline-assets.mjs';
import{stage,served}from'../../scripts/stage.mjs';
test('Pages stage contains only public runtime assets and verifies the final commit bytes',async()=>{
 const directory=await mkdtemp(tmpdir()+'/sheets-stage-');
 try{
  await stage(directory,'abc1234');assert.deepEqual((await readdir(directory)).sort(),served.slice().sort());
  const html=await readFile(directory+'/index.html','utf8');assert.ok(html.includes('sheets-editor-v1'));assert.ok(html.includes('abc1234'));assert.ok(!html.includes('__COMMIT_SHA__'));
  const manifest=await offlineManifest(directory);
  assert.ok(manifest.assets.some(path=>path.endsWith('.wasm')));
  assert.ok(manifest.assets.some(path=>path.includes('/licenses/')));
  assert.ok(manifest.assets.includes('examples/covers/gfm-basic.png'));
  assert.ok(manifest.assets.includes('gallery/covers/gfm-basic.png'));
  for(const path of manifest.assets){
   assert.ok(!/[?#]|(?:^|\/)\.\.(?:\/|$)/.test(path));
   assert.ok(!/vendor\/fragment-kit-v0\.4\.3\/(?:testing|tools|docs)\//.test(path));
   assert.equal(manifest.hashes[path],createHash('sha256').update(await readFile(directory+'/'+path)).digest('hex'));
  }
  for(const path of ['tests','scripts','vendor/fragment-kit-v0.4.3/testing','vendor/fragment-kit-v0.4.3/tools'])assert.equal(await stat(directory+'/'+path).then(()=>true,()=>false),false);
  assert.match(await readFile(directory+'/sw.js','utf8'),/fragment-kit-v0.4.3\/src\/offline\/sw-core.js/);
  await appendFile(directory+'/sw.js','\n// Worker-only release change.\n');assert.notEqual((await offlineManifest(directory)).version,manifest.version);
 }finally{await rm(directory,{recursive:true,force:true});}
});
