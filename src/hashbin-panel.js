import {HashBinPanel as Panel} from '../vendor/fragment-kit-v0.3.4/src/index.js';
import{HashBinDocuments,readOverrides}from'./fragment-config.js';
export class HashBinPanel extends Panel{
 constructor(options){
  const overrides=new Map(),{onLoad}=options;
  super({...options,urlState:{link:HashBinDocuments.link},onLoad:async(doc,cid)=>{await onLoad(doc,cid,overrides.get(cid)??{});options.container?.closest("dialog")?.close();}});
  this.overrides=overrides;this.drawer=options.container?.closest('dialog');
 }
 load(input,overrides={}){
  input=input.trim();const cid=this.store.cid(input);if(cid)this.overrides.set(cid,{...(/^https?:/.test(input)?readOverrides(input):{}),...overrides});
  return super.load(input);
 }
}
