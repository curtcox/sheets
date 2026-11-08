import{writeURL}from'./fragment-config.js';
export const buildShareLink=(url,snapshot)=>writeURL(url,snapshot);
export{ShareClient,ShareError}from'../vendor/fragment-kit-v0.3.5/src/index.js';
