import{test,expect}from'@playwright/test';
import fs from'node:fs';
const corpus=JSON.parse(fs.readFileSync('tests/fixtures/legacy-kit-corpus.json','utf8'));
for(const entry of corpus.cases.filter(entry=>entry.kind==='source'||entry.kind==='example'))test('harvested legacy URL: '+entry.label,async({page})=>{
 const legacy=new URL(entry.href),url=new URL('http://127.0.0.1:4173/');url.search=legacy.search;url.hash=legacy.hash;
 await page.goto(url.href);await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 await expect.poll(()=>page.evaluate(()=>SheetsOnline.getSource())).toBe(entry.src??corpus.example.source);
});
