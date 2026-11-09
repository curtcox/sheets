import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { writeURL } from '../../src/url-state.js';
import { parseProjectFile } from '../../src/project-state.js';
import { unzipSync, strFromU8 } from '../../vendor/fflate.js';
import * as XLSX from '../../vendor/xlsx.js';
import { openMore } from './ui.js';

const source = '# Export audit 日本語 😀\n\n**Bold result** and [Guide](https://example.com/guide).\n\n- First item\n- Second item\n\n| Label | Value |\n|---|---|\n| café | 24 |\n\n$x^2$\n\n![Remote picture](https://example.com/picture.png)\n';
async function open(page, baseURL, src = source, format = 'gfm') {
  await page.route('https://example.com/picture.png', route => route.abort());
  await page.goto(writeURL(new URL('./', baseURL).href, { src, format }));
  await expect(page.locator('#render-status')).toHaveText(/^(Ready|\d+ diagnostic)/);
  await openMore(page);
  await page.locator('#download-menu summary').click();
  await page.locator('#export-open').click();
}
async function download(page, target) {
  await page.locator('#export-target').selectOption(target);
  const pending = page.waitForEvent('download');
  await page.locator('#export-go').click();
  const file = await pending;
  return { name: file.suggestedFilename(), bytes: await readFile(await file.path()) };
}

test('document targets preserve Unicode and substantive editable content', async ({ page, baseURL, context }) => {
  await open(page, baseURL);
  const options = await page.locator('#export-target option').evaluateAll(nodes => nodes.map(n => n.value));
  expect(options.sort()).toEqual(['html', 'txt', 'md', 'docx', 'xlsx', 'ods', 'rtf', 'native', 'project'].sort());
  for (const target of ['txt', 'md', 'html', 'docx', 'rtf']) {
    const file = await download(page, target);
    expect(file.name).toMatch(new RegExp('\\.' + target + '$'));
    if (target === 'docx') {
      const zip = unzipSync(file.bytes);
      const xml = strFromU8(zip['word/document.xml']);
      for (const text of ['日本語 😀', 'Bold result', 'First item', 'café', '24', 'Remote picture']) expect(xml).toContain(text);
      expect(xml).toContain('<w:tbl>');
      expect(xml).toContain('<w:b/>');
      expect(xml).toContain('Heading1');
      expect(xml).toContain('<w:numPr>');
      expect(strFromU8(zip['word/_rels/document.xml.rels'])).toContain('https://example.com/guide');
      expect(Object.keys(zip).filter(name => name.startsWith('word/media/'))).toHaveLength(0);
    } else if (target === 'rtf') {
      const rtf = file.bytes.toString();
      expect(rtf).toMatch(/^\{\\rtf1/);
      expect(rtf).toContain('\\u26085?');
      expect(rtf).toContain('\\u-10179?\\u-8704?');
      expect(rtf).toContain('24');
    } else {
      const text = file.bytes.toString();
      expect(text).toContain('日本語 😀');
      expect(text).toContain('24');
      if (target === 'md') {
        expect(text).toContain('**Bold result**');
        expect(text).toContain('[Guide](https://example.com/guide)');
        expect(text).toContain('$');
        expect(text).toContain('https://example.com/picture.png');
      }
      if (target === 'html') {
        const saved = await context.newPage();
        await saved.setContent(text);
        await expect(saved.locator('math')).toHaveCount(1);
        await expect(saved.locator('table')).toContainText('café');
        await expect(saved.locator('script,button')).toHaveCount(0);
        await saved.close();
      }
    }
  }
});

test('XLSX and ODS retain numeric types, formulas, editable inputs and provenance', async ({ page, baseURL }) => {
  const src = '#+TITLE: Workbook audit\n#+CONSTANTS: rate=2\n\nReport 日本語 😀\n\n| Item | Qty | Price | Total |\n|---+---+---+---|\n| café | 3 | 4 | 0 |\n#+TBLFM: $4=$2*$3*$rate\n';
  await open(page, baseURL, src, 'org');
  for (const target of ['xlsx', 'ods']) {
    const file = await download(page, target);
    const wb = XLSX.read(file.bytes, { type: 'buffer' });
    expect(wb.SheetNames).toEqual(['Table 1', 'Inputs', 'Document']);
    expect(wb.Sheets['Table 1'].A2.v).toBe('café');
    expect(wb.Sheets['Table 1'].D2).toMatchObject({ t: 'n', v: 24 });
    expect(wb.Sheets['Table 1'].D2.f).toContain('Inputs');
    expect(wb.Sheets.Inputs.B2).toMatchObject({ t: 'n', v: 2 });
    expect(wb.Sheets.Document.B4.v).toContain('日本語 😀');
    expect(wb.Sheets.Document.B5.v).toBe(src);
    const zip = unzipSync(file.bytes);
    if (target === 'xlsx') expect(strFromU8(zip['xl/workbook.xml'])).toContain('fullCalcOnLoad="1"');
    else expect(strFromU8(zip.mimetype)).toBe('application/vnd.oasis.opendocument.spreadsheet');
  }
});

test('original source and portable project downloads preserve editable state', async ({ page, baseURL }) => {
  const src = '#+TITLE: Editable project 日本語 😀\n\n| 3 | 4 | 0 |\n#+TBLFM: $3=$1*$2\n';
  await open(page, baseURL, src, 'org');
  await page.locator('#export-contents').selectOption('source');
  expect((await download(page, 'native')).bytes.toString()).toBe(src);
  await page.locator('#export-contents').selectOption('project');
  const file = await download(page, 'project');
  expect(file.name).toMatch(/\.sheets\.json$/);
  expect(parseProjectFile(file.bytes.toString())).toMatchObject({ src, type: 'org', view: 'split' });
});

test('Word packages rendered diagrams as PNG and Markdown discloses their flattening', async ({ page, baseURL }) => {
  await open(page, baseURL, '# Diagram report\n\n$x^2$\n\n```mermaid\ngraph LR\n  Start --> Finish\n```');
  const doc = await download(page, 'docx');
  const zip = unzipSync(doc.bytes);
  const pictures = Object.keys(zip).filter(name => /^word\/media\/.*\.png$/.test(name));
  expect(pictures.length).toBeGreaterThan(0);
  expect([...zip[pictures[0]].slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const xml = strFromU8(zip['word/document.xml']);
  expect(xml).toContain('<w:drawing>');
  expect(xml).not.toContain('<m:oMath');
  const md = (await download(page, 'md')).bytes.toString();
  expect(md).toContain('[Diagram:');
  expect(md).toContain('Finish');
  await expect(page.locator('#export-result')).toContainText('diagrams become text descriptions');
});

test('unsupported portable project formats explain the restriction without downloading', async ({ page, baseURL }) => {
  await open(page, baseURL);
  await page.locator('#export-target').selectOption('project');
  await page.locator('#export-contents').selectOption('project');
  let downloads = 0;
  page.on('download', () => downloads++);
  await page.locator('#export-go').click();
  await expect(page.locator('#export-status')).toContainText('Portable projects require Org source');
  expect(downloads).toBe(0);
});

test('Pages handoff contains the sanitized document and disables scripts', async ({ page, baseURL, context }) => {
  await open(page, baseURL);
  await page.evaluate(() => { window.open = () => null; });
  await page.locator('#export-destination').selectOption('pages');
  await page.locator('#export-go').click();
  const link = page.locator('#export-result a');
  await expect(link).toHaveAttribute('href', /^https:\/\/pages.hashbin.page\/\?run=0/);
  const href = await link.getAttribute('href');
  const { decompress } = await import('../../vendor/fragment-kit-v0.3.5/src/index.js');
  const url = new URL(href);
  const envelope = JSON.parse(url.searchParams.has('doc') ? decompress(url.searchParams.get('doc')) : decodeURIComponent(url.hash.slice(1)));
  expect(envelope.pages.entry).toBe('index.html');
  expect(envelope.pages.files[0].text).toContain('日本語 😀');
  expect(envelope.pages.files[0].text).not.toContain('<script');
  if (process.env.SHEETS_VERIFY_LIVE_PAGES === '1') {
    const pages = await context.newPage();
    await pages.goto(href);
    await expect.poll(() => pages.evaluate(() => window.pagesApp?.getProject().files[0].text)).toContain('Export audit');
    await expect(pages.locator('#auto-refresh')).not.toBeChecked();
  }
});
