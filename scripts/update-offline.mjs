import{offlineManifest}from'./offline-assets.mjs';
console.log((await offlineManifest('.',process.argv.includes('--check'))).version);
