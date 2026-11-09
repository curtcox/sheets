import {HashBinStore as Store,createDocuments} from '../vendor/fragment-kit-v0.3.5/src/index.js';
import{config,type,toDocument,normalizationMaxBytes,HashBinDocuments,serializeLegacy,fromDocument,publishTransactions}from'./fragment-config.js';
export{HashBinDocuments};
// HashBin matches callbacks exactly: the hosted app registered its root,
// while the original Pages registration uses index.html.
export function publishRedirectUri(href){
 const url=new URL(href),canonical=new URL(config.canonicalOrigin);
 return url.origin===canonical.origin?canonical.href:new URL('index.html',url).href;
}
export class HashBinStore extends Store{
 constructor(options={}){
  const {storage,transactionStorage,...rest}=options;let session;try{session=globalThis.sessionStorage;}catch{}
  super({config,type,legacyStorage:storage,...rest,transactionStorage:publishTransactions(transactionStorage??session,options.clientId??config.hashbinClientId)});
  this.documents={...createDocuments(type,normalizationMaxBytes),serialize:serializeLegacy};
 }
 publish(payload,snapshot){const doc=toDocument(snapshot);return super.publish(payload,{...snapshot,sheets:snapshot.sheets?doc.sheets:{format:doc.sheets.format}});}
 load=async input=>fromDocument(await super.load(input));
 async published(hash){
  const result=await super.published(hash);if(!result?.snapshot?.sheets)return result;
  const{sheets,...legacy}=result.snapshot;
  if(Object.hasOwn(legacy,'type')||Object.hasOwn(legacy,'format'))return{...result,snapshot:legacy};
  return{...result,snapshot:{...fromDocument(result.snapshot),...(sheets.format==='auto'?{format:'auto'}:{})}};
 }
}
