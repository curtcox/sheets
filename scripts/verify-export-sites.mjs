// Read-only live smoke checks. Downloads stay in Playwright's temporary storage;
// this script never signs in, uploads, saves to HashBin or publishes a page.
import { chromium, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { writeURL } from '../src/url-state.js';
import { unzipSync, strFromU8 } from '../vendor/fflate.js';
import * as XLSX from '../vendor/xlsx.js';

const sites = process.argv.slice(2);
if (!sites.length) sites.push('https://sheets.hashbin.page/', 'https://curtcox.github.io/sheets/');
const src = '#+TITLE: Deployment export check\n#+CONSTANTS: rate=2\n\nLive export 日本語 😀\n\n| Item | Qty | Price | Total |\n|---+---+---+---|\n| café | 3 | 4 | 0 |\n#+TBLFM: $4=$2*$3*$rate\n';
const browser = await chromium.launch();
let failed = false;
try {
  for (const base of sites) {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const report = { site: base, assets: {}, downloads: {}, gaps: [] };
    try {
      for (const path of ['docs/exports.md', 'src/exports/ui.js']) {
        const response = await context.request.get(new URL(path, base).href);
        report.assets[path] = response.status();
        if (!response.ok()) report.gaps.push(`${path}: HTTP ${response.status()}`);
      }
      await page.goto(writeURL(base, { src, format: 'org' }));
      await expect(page.locator('#render-status')).toHaveText(/^(Ready|\d+ diagnostic)/);
      await expect(page.locator('#preview')).toContainText('24');
      await page.locator('#more-toggle').click();
      await page.locator('#download-menu summary').click();
      if (!await page.locator('#export-open').count()) {
        report.gaps.push('Export dialog is absent; only legacy download actions are deployed.');
      } else {
        await page.locator('#export-open').click();
        const modern = !!await page.locator('#export-destination').count();
        report.currentDialog = modern;
        if (!modern) report.gaps.push('Old export dialog: no independent contents/destination, export QR or appearance controls.');
        report.targets = await page.locator('#export-target option').evaluateAll(nodes => nodes.map(n => n.value));
        for (const id of ['txt', 'md', 'rtf', 'docx', 'xlsx', 'ods', ...(!modern ? ['google-import'] : [])]) {
          await page.locator('#export-target').selectOption(id);
          const pending = page.waitForEvent('download');
          await page.locator('#export-go').click();
          const download = await pending, bytes = await readFile(await download.path());
          if (['xlsx', 'ods'].includes(id)) {
            const wb = XLSX.read(bytes, { type: 'buffer' });
            expect(wb.Sheets['Table 1'].D2.v).toBe(24);
            expect(wb.Sheets['Table 1'].D2.f).toContain('Inputs');
            expect(wb.Sheets.Inputs.B2.v).toBe(2);
          } else if (['docx', 'google-import'].includes(id)) {
            const xml = strFromU8(unzipSync(bytes)['word/document.xml']);
            expect(xml).toContain('日本語 😀');
            expect(xml).toContain('24');
          } else expect(bytes.toString()).toContain('24');
          report.downloads[id] = { filename: download.suggestedFilename(), bytes: bytes.length, verified: true };
        }
        await page.evaluate(() => { window.open = () => null; });
        if (modern) {
          await page.locator('#export-target').selectOption('html');
          await page.locator('#export-destination').selectOption('pages');
        } else await page.locator('#export-target').selectOption('pages');
        await page.locator('#export-go').click();
        const link = page.locator('#export-result a');
        await expect(link).toHaveAttribute('href', /^https:\/\/pages.hashbin.page\/\?run=0/);
        const receiver = await context.newPage();
        await receiver.goto(await link.getAttribute('href'));
        await expect.poll(() => receiver.evaluate(() => window.pagesApp?.getProject().files[0].text)).toContain('Deployment export check');
        await expect(receiver.locator('#auto-refresh')).not.toBeChecked();
        report.pagesHandoff = 'Imported source verified; auto-run disabled';
      }
    } catch (error) {
      report.gaps.push(error.message);
    } finally {
      failed ||= report.gaps.length > 0;
      console.log(JSON.stringify(report, null, 2));
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (failed) process.exitCode = 1;
