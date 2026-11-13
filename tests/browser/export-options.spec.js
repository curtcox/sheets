import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { writeURL } from '../../src/url-state.js';
import { openMore } from './ui.js';
import { mockHashBin } from './hashbin-mock.js';
import { unzipSync, strFromU8 } from '../../vendor/fflate.js';
const source = '# Export options\n\n| Name | Value |\n|---|---|\n| A | 12 |\n| B | 24 |\n\n<script>bad()</script>';
async function open(page) {
  await page.goto(writeURL('http://127.0.0.1:4173/', {src:source, format:'gfm'}));
  await expect(page.locator('#render-status')).toHaveText(/^(Ready|\d+ diagnostic)/);
  await openMore(page);
  await page.locator('#download-menu summary').click();
  await page.locator('#export-open').click();
}
async function download(page) {
  const pending = page.waitForEvent('download');
  await page.locator('#export-go').click();
  const file = await pending;
  return readFile(await file.path());
}
async function decode(page, html) {
  return page.evaluate(async html => {
    const root = new DOMParser().parseFromString(html, 'text/html');
    const src = root.querySelector('.export-qr img').src;
    const { QrScanner } = await import('/vendor/fragment-kit-v0.4.3/src/index.js');
    return new QrScanner({BarcodeDetector:null}).fromImage(new Blob([Uint8Array.from(atob(src.split(",")[1]), c => c.charCodeAt(0))], {type:"image/png"}));
  }, html);
}
test('contents, format and destination are independent and invalid combinations explain the constraint', async ({page}) => {
  await open(page);
  await page.locator('#export-contents').selectOption('source');
  let html = (await download(page)).toString();
  expect(html).toContain('&lt;script&gt;bad()&lt;/script&gt;');
  expect(html).not.toContain('<table>');
  await page.locator('#export-contents').selectOption('both');
  html = (await download(page)).toString();
  expect(html).toContain('<table>');
  expect(html).toContain('Sheet source');
  await page.locator('#export-destination').selectOption('google');
  await expect(page.locator('#export-go')).toBeDisabled();
  await expect(page.locator('#export-combination')).toContainText('Choose Word');
  await expect(page.locator('#export-target')).toHaveValue('html');
  await expect(page.locator('#export-contents')).toHaveValue('both');
  await page.locator('#export-destination').selectOption('download');
  await page.locator('#export-target').selectOption('native');
  await page.locator('#export-contents').selectOption('source');
  expect((await download(page)).toString()).toBe(source);
});
test('print timestamp is optional, retained on reopen, and does not affect HTML downloads', async ({page}) => {
  await open(page);
  const timestamp = page.getByRole('checkbox', {name:'Include timestamp in print header'});
  await expect(timestamp).toBeHidden();
  await page.locator('#export-destination').selectOption('print');
  await expect(timestamp).toBeChecked();
  // Replace the iframe's native print method before its srcdoc finishes loading.
  await page.evaluate(() => {
    const append = document.body.append.bind(document.body);
    globalThis.printCalls = 0;
    document.body.append = (...nodes) => {
      append(...nodes);
      for (const node of nodes) if (node.className === 'export-print-frame') {
        node.addEventListener('load', () => {
          node.contentWindow.print = () => { globalThis.printCalls++; };
        });
      }
    };
  });
  for (const [checked, calls] of [[true, 1], [false, 2], [true, 3]]) {
    await timestamp.setChecked(checked);
    await page.locator('#export-go').click();
    await expect.poll(() => page.evaluate(() => globalThis.printCalls)).toBe(calls);
    const frame = page.frameLocator('.export-print-frame');
    await expect(frame.locator('article')).toContainText('Export options');
    const css = await frame.locator('style').textContent();
    expect(css.includes('@top-left{content:""}')).toBe(!checked);
  }
  await timestamp.uncheck();
  await page.getByRole('button', {name:'Close exports'}).click();
  await openMore(page);
  await page.locator('#download-menu summary').click();
  await page.locator('#print-preview').click();
  await expect(timestamp).not.toBeChecked();
  await page.locator('#export-destination').selectOption('download');
  await expect(timestamp).toBeHidden();
  expect((await download(page)).toString()).not.toContain('@top-left{content:""}');
  await page.locator('#export-destination').selectOption('print');
  await expect(timestamp).not.toBeChecked();
});
test('shortening is prompted, QR decodes correctly, and appearance is optional in HTML and Word', async ({page, context}) => {
  await page.route('https://api.allorigins.win/get?*', route => route.fulfill({json:{contents:'https://is.gd/exportTest'}}));
  await open(page);
  await page.locator('#export-qr').check();
  await expect(page.locator('#export-qr-help')).toContainText('Make a short URL');
  await page.locator('#export-go').click();
  await expect(page.locator('#export-status')).toContainText('Make a short URL');
  await page.locator('#export-shorten').click();
  await expect(page.locator('#export-qr-help')).toContainText('ready');
  const html = (await download(page)).toString();
  expect(await decode(page, html)).toBe('https://is.gd/exportTest');
  const saved = await context.newPage();
  await saved.setContent(html);
  expect(await saved.locator('tr').nth(2).evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(250, 251, 248)');
  await saved.emulateMedia({media:'print'});
  expect(await saved.locator('article').evaluate(el => getComputedStyle(el).printColorAdjust)).toBe('exact');
  await page.locator('#export-appearance').uncheck();
  await saved.setContent((await download(page)).toString());
  expect(await saved.locator('tr').nth(2).evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await page.locator('#export-appearance').check();
  await page.locator('#export-target').selectOption('docx');
  const zip = unzipSync(await download(page));
  expect(strFromU8(zip['word/document.xml'])).toContain('FAFBF8');
  expect(Object.keys(zip).some(key => key.startsWith('word/media/') && key.endsWith('.png'))).toBe(true);
});
test('HashBin save returns to export with a QR that reloads the saved sheet', async ({page, context}) => {
  const hashbin = await mockHashBin(page);
  await open(page);
  await page.locator('#export-qr').check();
  await page.locator('#export-save').click();
  await expect(page.locator('#hashbin-confirm')).toBeEnabled();
  expect(hashbin.saves.length).toBe(0);
  await page.locator('#hashbin-confirm').click();
  await expect(page.locator('.export-dialog')).toBeVisible();
  await expect(page.locator('#export-qr-link')).toHaveValue('saved');
  const href = await decode(page, (await download(page)).toString());
  expect(new URL(href).hash).toBe('#'+hashbin.last.cid);
  await page.getByRole('button', {name:'Close exports'}).click();
  await page.goto(href);
  await expect(page.locator('#render-status')).toHaveText(/^(Ready|\d+ diagnostic)/);
  expect(await page.evaluate(() => ace.edit('editor').getValue())).toBe(source);
  await page.evaluate(() => ace.edit('editor').setValue('# Changed', -1));
  await expect(page.locator('#render-status')).toHaveText(/^Ready/);
  await openMore(page); await page.locator('#download-menu summary').click(); await page.locator('#export-open').click();
  await page.locator('#export-qr').check();
  await page.locator('#export-qr-link').selectOption('saved');
  await page.locator('#export-go').click();
  await expect(page.locator('#export-status')).toContainText('Save this sheet');
});

test('HashBin destination saves only after review and returns to a printable reload QR', async ({page}) => {
  const hashbin = await mockHashBin(page);
  await open(page);
  await page.locator('#export-target').selectOption('project');
  await page.locator('#export-contents').selectOption('project');
  await page.locator('#export-destination').selectOption('hashbin');
  await page.locator('#export-go').click();
  await expect(page.locator('#hashbin-confirm')).toBeEnabled();
  expect(hashbin.saves).toHaveLength(0);
  await page.locator('#hashbin-confirm').click();
  await expect(page.locator('.export-dialog')).toBeVisible();
  await expect(page.locator('#export-destination')).toHaveValue('print');
  await expect(page.locator('#export-target')).toHaveValue('html');
  await expect(page.locator('#export-qr')).toBeChecked();
  expect(hashbin.saves).toHaveLength(1);
});

test('a short link made in Share is reused in export for the same sheet', async ({page}) => {
  await page.route('https://api.allorigins.win/get?*', route => route.fulfill({json:{contents:'https://is.gd/sharedTest'}}));
  await open(page);
  await page.getByRole('button', {name:'Close exports'}).click();
  await page.locator('#share').click();
  await page.getByRole('button', {name:'Shorten link', exact:true}).click();
  await expect(page.locator('#share-link')).toHaveValue('https://is.gd/sharedTest');
  await page.keyboard.press('Escape');
  await openMore(page);
  await page.locator('#download-menu summary').click();
  await page.locator('#export-open').click();
  await page.locator('#export-qr').check();
  await expect(page.locator('#export-qr-help')).toContainText('ready');
  expect(await decode(page, (await download(page)).toString())).toBe('https://is.gd/sharedTest');
});

test('a blocked-popup HashBin redirect restores export choices and the saved reload QR', async ({page}) => {
  const hashbin = await mockHashBin(page);
  await open(page);
  await hashbin.mode('redirect');
  await page.locator('#export-contents').selectOption('both');
  await page.locator('#export-qr').check();
  await page.locator('#export-save').click();
  await expect(page.locator('#hashbin-confirm')).toBeEnabled();
  await page.locator('#hashbin-confirm').click();
  await expect(page.locator('.export-dialog')).toBeVisible();
  await expect(page.locator('#export-contents')).toHaveValue('both');
  await expect(page.locator('#export-qr-link')).toHaveValue('saved');
  const href = await decode(page, (await download(page)).toString());
  expect(new URL(href).hash).toBe('#'+hashbin.last.cid);
});
