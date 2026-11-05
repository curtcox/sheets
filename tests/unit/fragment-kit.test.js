import test from'node:test';
import assert from'node:assert/strict';
import{computeCID}from'../../vendor/fragment-kit-v0.3.4/src/core/cid.js';
import{serializeLegacy,urlState,readURL}from'../../src/fragment-config.js';
import{HashBinStore}from'../../src/hashbin.js';
const memory=()=>{const data=new Map();return{data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};};
test('legacy writers retain Auto, profiles and literal envelope-looking source',()=>{
 const value={src:'{"format":"sheets-document","version":99,"src":"literal text"}',format:'auto',type:'text',view:'preview'};
 assert.equal(readURL(urlState.build(value,{url:'https://sheets.hashbin.page/'}).href).src,value.src);
 const saved=JSON.parse(serializeLegacy(value));assert.equal(saved.format,'sheets-document');assert.equal(saved.sheets.format,'auto');assert.equal(saved.src,value.src);
});
test('pre-kit redirect transactions verify original bytes and restore Auto exactly',async()=>{
 const snapshot={src:'# Original document',type:'gfm',format:'auto',view:'preview'};
 const payload=JSON.stringify({src:snapshot.src,view:snapshot.view,type:snapshot.type,version:1,format:'sheets-document'}),cid=await computeCID(payload),transactionStorage=memory();
 const key='hashbin:publish:public:old';transactionStorage.setItem(key,JSON.stringify({bytes:Buffer.from(payload).toString('base64url')}));
 const store=new HashBinStore({clientId:'public',transactionStorage,loadSDK:async()=>({HashBinClient:class{
  constructor(options){this.options=options;}
  async handlePublishCallback(){assert.ok(this.options.transactionStorage.getItem(key));this.options.transactionStorage.removeItem(key);return{cid,clientState:{snapshot}};}
 }})});
 assert.deepEqual(await store.published('#hashbin_publish=old'),{cid,snapshot});assert.equal(transactionStorage.data.size,0);
});
test('consumer snapshot adaptation enters Publish synchronously after initialization',async()=>{
 const snapshot={src:'# A note',type:'gfm',format:'auto',view:'split'},payload=serializeLegacy(snapshot),cid=await computeCID(payload);let entered=false;
 const store=new HashBinStore({clientId:'public',loadSDK:async()=>({HashBinClient:class{
  publish(content,{clientState}){entered=true;assert.equal(content,payload);assert.equal(clientState.snapshot.sheets.format,'auto');return Promise.resolve({cid});}
 }})});
 await store.init();const pending=store.publish(payload,snapshot);assert.equal(entered,true);assert.equal((await pending).cid,cid);
});
