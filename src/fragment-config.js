import * as kit from '../vendor/fragment-kit-v0.3.5/src/index.js';
import settings from '../fragment-kit.config.json' with {type:'json'};
import {profiles,validateProfile} from './compatibility-profiles.js';
import {parseProjectFile,serializeProjectFile,validateProjectDocument} from './project-state.js';
import {sheetsDocument} from './sheets-document.js';
import{detect}from'./formats/registry.js';
export const config=kit.createConfig(settings);
export const formats=['gfm','asciimath','numbat','calcfile','org','calca','hurmet','beancount','quarto','text'];
export const views=['split','source','preview'];
export const SOURCE_FRAGMENT_THRESHOLD=7000;
// JSON escaping can expand a legacy 5 MiB source up to sixfold in memory.
// Transport, decompression, source and saved payloads retain their original limits.
export const normalizationMaxBytes=config.maxBytes*6+8192;
export const type={type:'sheets',settingsKeys:['format','profile','view'],fileName:'sheet.json',contentType:'application/json',
 normalize(value){
  const src=kit.bounded(value?.src,config.maxBytes),options=value.sheets?{...value,...value.sheets}:value;
  const format=!value.sheets&&options.format==='auto'&&formats.includes(options.type)?options.type:options.format==='auto'||formats.includes(options.format)?options.format:formats.includes(options.type)?options.type:'auto';
  const view=views.includes(options.view)?options.view:'split',profile=validateProfile(options.profile,format);
  const project=options.inputSnapshot===undefined&&options.attachments===undefined?undefined:validateProjectDocument({src,type:format,view,profile,inputSnapshot:options.inputSnapshot,attachments:options.attachments});
  return {src,sheets:{format,view,...profile?{profile}:{},...project?.inputSnapshot?{inputSnapshot:project.inputSnapshot}:{},...project?.attachments?{attachments:project.attachments}:{}}};
 },
 isDefault:doc=>doc.sheets.format==='auto'&&doc.sheets.view==='split'&&!doc.sheets.profile&&!doc.sheets.inputSnapshot&&!doc.sheets.attachments,
 parseLegacy(text){let value;try{value=JSON.parse(text);}catch{return undefined;}if(value?.format==='sheets-document'){const doc=sheetsDocument.parse(text);return value.sheets?.format?type.normalize({src:doc.src,sheets:{...doc,format:value.sheets.format}}):type.normalize(doc);}return type.normalize({src:text});}
};
export const toDocument=value=>type.normalize(value.sheets?value:{src:value.src,sheets:{...value,format:value.format??value.type??'auto'}});
export const fromDocument=value=>{const doc=type.normalize(value);return{src:doc.src,type:doc.sheets.format==='auto'?null:doc.sheets.format,view:doc.sheets.view,...doc.sheets.profile?{profile:doc.sheets.profile}:{},...doc.sheets.inputSnapshot?{inputSnapshot:doc.sheets.inputSnapshot}:{},...doc.sheets.attachments?{attachments:doc.sheets.attachments}:{}};};
export const serializeLegacy=value=>{
 const doc=toDocument(value),effective=doc.sheets.format==='auto'?(profiles.find(profile=>profile.id===doc.sheets.profile)?.format??detect(doc.src)):doc.sheets.format;
 const legacy=JSON.parse(sheetsDocument.serialize({...fromDocument(doc),type:effective}));
 return kit.bounded(JSON.stringify({...legacy,sheets:{format:doc.sheets.format}}),config.maxBytes);
};
const writer=(doc,{url,compress,run})=>{
 if(run===false)url.searchParams.set('run','0');
 const options=doc.sheets;if(formats.includes(options.format))url.searchParams.set('format',options.format);
 if(options.profile)url.searchParams.set('profile',options.profile);if(options.view!=='split')url.searchParams.set('view',options.view);
 if(options.inputSnapshot!==undefined||options.attachments!==undefined)url.hash='project='+compress(serializeProjectFile(fromDocument(doc)));
 else {const encoded=compress(doc.src);url.searchParams.set('compressed',encoded);if(url.href.length>SOURCE_FRAGMENT_THRESHOLD){url.searchParams.delete('compressed');url.hash='src='+encoded;}}
 return url.href;
};
export function decompressSource(value){if(value.length>1_000_000)throw Error('Shared source is too large.');try{return kit.decompress(value,config.maxBytes);}catch(error){if(error.message.includes('Document exceeds'))throw Error('Shared source exceeds 5 MiB.');throw error;}}
const core=kit.createUrlState({config:{...config,maxBytes:normalizationMaxBytes},type,decompress:decompressSource,legacyWriter:writer,legacyReaders:[(url,{decompress})=>{
 if(!url.hash.startsWith('#project='))return;const raw=url.hash.slice(9);
 if(raw.length>1_000_000)throw Error('Shared project is too large.');const text=decompress(raw);
 if(kit.compress(text)!==raw)throw Error('The shared project could not be decompressed.');
 const project=parseProjectFile(text);if(url.searchParams.has('format')&&![project.type,'auto'].includes(url.searchParams.get('format')))throw Error('Portable snapshots require Org format.');
 return type.normalize(project);
}]});
function query(input){const url=new URL(input),format=formats.includes(url.searchParams.get('format'))?url.searchParams.get('format'):'auto',view=views.includes(url.searchParams.get('view'))?url.searchParams.get('view'):'split',profile=url.searchParams.has('profile')?validateProfile(url.searchParams.get('profile'),format):undefined;return{format,view,...profile?{profile}:{}};}
export const urlState={...core,build:(value,options)=>core.build(toDocument(value),options),parse(input){const intent=core.parse(input),url=new URL(input);if(!intent.doc)return intent;
 const changes=Object.fromEntries(Object.entries(query(input)).filter(([key])=>url.searchParams.has(key)));
 if(url.searchParams.has('profile')&&!Object.hasOwn(changes,'profile'))changes.profile=undefined;
 return{...intent,doc:type.normalize({src:intent.doc.src,sheets:{...intent.doc.sheets,...changes}})};
}};
export function readURL(input){
 const intent=urlState.parse(input),defaults=query(input);
 if(intent.kind==='source'){const {src,sheets}=intent.doc;return{src,...sheets,kind:new URL(input).hash.startsWith('#project=')?'project':'source'};}
 if(intent.kind==='cid')return{...defaults,cid:intent.cid,kind:'hashbin'};
 if(intent.kind==='example')return{...defaults,example:intent.id,kind:'example'};
 if(intent.kind==='none')return{...defaults,kind:'empty'};
 return{...defaults,...intent};
}
export function writeURL(input,{src='',format='auto',view='split',cid=null,profile,inputSnapshot,attachments,run}={}){
 const doc=type.normalize({src,format,view,profile,inputSnapshot,attachments});
 if(cid&&kit.isCID(cid)){const url=new URL(core.build(doc,{url:input,run}).href);url.searchParams.delete('compressed');url.hash=cid;return url.href;}
 return core.build(doc,{url:input,run}).href;
}
export function readOverrides(input){const url=new URL(input),state=readURL(url);return Object.fromEntries(['format','view','profile'].filter(key=>url.searchParams.has(key)).map(key=>[key,state[key]]));}
export const HashBinDocuments={...core.documents,MAX_BYTES:config.maxBytes,serialize:value=>sheetsDocument.serialize(value.sheets?fromDocument(value):value),parse:text=>fromDocument(core.documents.parse(text)),...Object.fromEntries(['bytes','encode64','decode64','cidLength','isCID'].map(key=>[key,kit[key]])),cid:value=>kit.cid(value,config.allowedHosts),link(input,cid){const url=new URL(input);for(const key of ['example','doc','compressed','src','raw','url','code','state','error','error_description'])url.searchParams.delete(key);url.hash='';if(!kit.isCID(cid))throw Error('HashBin returned an invalid CID.');url.hash=cid;return url.href;}};
export function publishTransactions(storage,clientId=config.hashbinClientId){if(!storage)return;const current=kit.createStorage({prefix:config.storagePrefix,storage}),owned=key=>key.startsWith('hashbin:publish:'+clientId+':');return{getItem(key){const value=current.getItem(key);if(value!=null||!owned(key))return value;try{return storage.getItem(key);}catch{return null;}},setItem:(key,value)=>current.setItem(key,value),removeItem(key){current.removeItem(key);if(owned(key))try{storage.removeItem(key);}catch{}}};}
export{ShareClient}from'../vendor/fragment-kit-v0.3.5/src/index.js';
