import{decompress}from'../vendor/fragment-kit-v0.4.3/src/core/compression.js';
export function decompressSource(input,limit=5*1024*1024){try{return decompress(input,limit);}catch(error){if(/exceeds/.test(error.message))throw Error('Shared source exceeds 5 MiB.');return null;}}
