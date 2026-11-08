import { test, expect } from '@playwright/test';
const ready = page => expect(page.locator('body')).toHaveAttribute('data-ready','true');
test('CSV preview imports literal values, supports undo and survives reload', async ({ page }) => {
  await page.goto('/?format=gfm'); await ready(page);
  await page.evaluate(() => SheetsOnline.setSource('# Imported table\n'));
  await page.locator('#insert-content').click();
  await page.locator('#insert-text').fill('ID,Note,Amount\n001,"A, B",1.00');
  await expect(page.locator('#insert-preview')).toContainText('001');
  await page.locator('#insert-confirm').click();
  await expect(page.locator('#preview')).toContainText('A, B');
  await page.waitForTimeout(500); await page.reload(); await ready(page);
  await expect(page.locator('#preview')).toContainText('001');
  await page.locator('#insert-content').click();
  await page.locator('#insert-text').fill('a,b\n3,4'); await page.locator('#insert-confirm').click();
  await page.evaluate(() => SheetsOnline.editor.undo());
  await expect.poll(() => page.evaluate(() => SheetsOnline.getSource())).not.toContain('| 3 | 4 |');
});
test('changing source while preview is open prevents stale insertion', async ({ page }) => {
  await page.goto('/?format=org'); await ready(page);
  await page.locator('#insert-content').click(); await page.locator('#insert-text').fill('a,b\n1,2');
  await page.evaluate(() => SheetsOnline.setSource('* Newer document'));
  await page.locator('#insert-confirm').click();
  await expect(page.locator('#insert-status')).toContainText('Document changed');
  expect(await page.evaluate(() => SheetsOnline.getSource())).toBe('* Newer document');
});
