import{verify,isCID,cidLength}from'../vendor/fragment-kit-v0.3.4/src/core/cid.js';
export{isCID,cidLength}from'../vendor/fragment-kit-v0.3.4/src/core/cid.js';
export{encode64,decode64}from'../vendor/fragment-kit-v0.3.4/src/core/bytes.js';
export async function verifyCIDBytes(cid,bytes,signal){
 signal?.throwIfAborted();
 if(!isCID(cid)||bytes.byteLength!==cidLength(cid))throw Error('Shared input payload length does not match its CID.');
 try{await verify(cid,bytes);}catch{throw Error(cidLength(cid)>64?'Shared input content hash does not match its CID.':'Shared input content does not match its inline CID.');}
 signal?.throwIfAborted();
}
