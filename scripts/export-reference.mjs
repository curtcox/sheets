// Generate a real app workbook for an independent reader and LibreOffice oracle.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { recalculateOrg } from '../src/formats/org/engine.js';
import { workbookBytes } from '../src/exports/workbook.js';
const directory=process.argv[2];
if(!directory)throw Error('Supply an output directory.');
await mkdir(directory,{recursive:true});
const src=await readFile('tests/fixtures/exports/model.org','utf8');
const result=await workbookBytes({title:'Export model',state:{src,type:'org'},model:[],workbook:recalculateOrg(src).workbook},'xlsx',{});
await writeFile(directory+'/export-model.xlsx',new Uint8Array(result.bytes));
