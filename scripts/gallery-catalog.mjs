import fs from'node:fs/promises';
const examples=JSON.parse(await fs.readFile('examples/catalog.json','utf8'));
const catalog=await Promise.all(examples.map(async example=>({...example,tags:[example.format,example.kind],document:{src:await fs.readFile(example.path,'utf8'),format:example.format,...example.profile?{profile:example.profile}:{}}})));
const source='// Generated from the app-owned examples.\nexport const catalog='+JSON.stringify(catalog,null,2)+';\n';
if(process.argv.includes('--check')){if(await fs.readFile('src/gallery-catalog.js','utf8')!==source)throw Error('Gallery catalog is stale.');}else await fs.writeFile('src/gallery-catalog.js',source);
console.log(catalog.length+' gallery documents current.');
