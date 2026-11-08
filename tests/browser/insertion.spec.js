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

test('CSV picture travels in links, exports and portable files for Markdown and Org', async ({ page, context }) => {
  for (const format of ['gfm','org']) {
    await page.goto('/?format='+format); await ready(page);
    await page.evaluate(format => SheetsOnline.setSource(format === 'org' ? '* Pictures\n' : '# Pictures\n'),format);
    await page.locator('#insert-content').click(); await page.locator('#insert-text').fill('ID,Value\n001,1.00');
    await page.locator('#insert-as').selectOption('picture'); await page.locator('#insert-alt').fill('Imported budget'); await page.locator('#insert-caption').fill('A CSV snapshot');
    await page.locator('#insert-confirm').click();
    await expect(page.locator('#insert-dialog')).not.toBeVisible();
    await expect(page.locator('#preview img')).toHaveAttribute('alt','Imported budget');
    await expect(page.locator('#preview figcaption')).toHaveText('A CSV snapshot');
    await expect.poll(() => page.evaluate(() => document.querySelector('#preview img')?.naturalWidth || 0)).toBeGreaterThan(0);
    await page.waitForTimeout(500);
    const fresh = await context.newPage(); await fresh.goto(page.url()); await ready(fresh);
    await expect(fresh.locator('#preview img')).toHaveAttribute('src',/^data:image\/png;base64,/);
    await fresh.close();
    const html = await page.evaluate(async () => { const {htmlDownload}=await import('/src/export-document.js');return htmlDownload(document.querySelector('#preview')).blob.text(); });
    expect(html).toContain('data:image/png;base64,'); expect(html).not.toContain('sheets-asset:');
    const project = await page.evaluate(async () => { const {projectDownload}=await import('/src/downloads.js');return projectDownload(SheetsOnline.snapshot()).blob.text(); });
    expect(JSON.parse(project).attachments).toHaveLength(1);
    await page.getByRole('button',{name:'More',exact:true}).click(); await page.locator('#download-menu summary').click();
    await page.locator('#project-file').setInputFiles({name:'pictures.sheets.json',mimeType:'application/json',buffer:Buffer.from(project)});
    await expect(page.locator('#project-status')).toContainText('opened');
  }
});

test('HTML clipboard tables stay inert and clipboard pictures open the insertion choice', async ({ page }) => {
  await page.goto('/?format=gfm'); await ready(page);
  await page.evaluate(() => {
    const data = new DataTransfer(); data.setData('text/html','<table><tr><td>001</td><td><img src="https://invalid.invalid/x" onerror="window.pwned=true">safe<script>window.pwned=true</script></td></tr></table>');
    document.querySelector('#source-pane').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
  });
  await expect(page.locator('#insert-preview')).toContainText('001'); await expect(page.locator('#insert-preview')).toContainText('safe');
  expect(await page.evaluate(()=>window.pwned)).toBeUndefined(); await page.locator('#insert-confirm').click();
  await expect(page.locator('#preview')).toContainText('safe');
});

test('HashBin pictures verify content and distinguish saved documents from image bytes', async ({ page }) => {
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9S8AAAAASUVORK5CYII=','base64');
  const {makeAttachment}=await import('../../src/attachments.js'); const entry=await makeAttachment(bytes);
  await page.route('https://256t.us/'+entry.id,route=>route.fulfill({body:bytes,contentType:'application/octet-stream'}));
  await page.goto('/?format=gfm'); await ready(page);
  await page.locator('#insert-content').click(); await page.locator('#insert-kind').selectOption('picture');
  await page.locator('#insert-url').fill('https://hashbin.org/#'+entry.id); await page.locator('#insert-alt').fill('HashBin pixel');
  await page.locator('#insert-confirm').click(); await expect(page.locator('#insert-dialog')).not.toBeVisible();
  await expect(page.locator('#preview img')).toHaveAttribute('src',/^data:image\/png/);
  expect(await page.evaluate(()=>SheetsOnline.getSource())).toContain('https://256t.us/'+entry.id);
});

test('pasted screenshot is bundled, undo/redo keeps bytes, mobile insertion fits, and reopening needs no picture host', async ({ page }) => {
  const {readFile}=await import('node:fs/promises');
  const project=JSON.parse(await readFile(new URL('../../examples/gfm/bundled-report.sheets.json',import.meta.url),'utf8'));
  const entry=project.attachments[0];
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?format=gfm'); await ready(page);
  await page.evaluate(entry=>{
    const bytes=Uint8Array.from(atob(entry.data.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
    const data=new DataTransfer(); data.items.add(new File([bytes],'chart.png',{type:'image/png'}));
    document.querySelector('#source-pane').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
  },entry);
  await expect(page.locator('#insert-kind')).toHaveValue('picture');
  expect(await page.locator('#insert-dialog').evaluate(el=>el.getBoundingClientRect().right<=innerWidth)).toBe(true);
  await page.locator('#insert-alt').fill('Pasted chart'); await page.locator('#insert-confirm').click();
  await expect(page.locator('#insert-dialog')).not.toBeVisible();
  await page.getByRole('tab',{name:'Preview',exact:true}).click();
  await expect(page.locator('#preview img')).toHaveAttribute('alt','Pasted chart');
  await page.evaluate(()=>SheetsOnline.editor.undo()); await expect(page.locator('#preview img')).toHaveCount(0);
  await page.evaluate(()=>SheetsOnline.editor.redo()); await expect(page.locator('#preview img')).toHaveCount(1);
  await page.context().setOffline(true);
  await page.evaluate(()=>SheetsOnline.setSource(SheetsOnline.getSource()+'\nOffline edit.'));
  await expect(page.locator('#preview')).toContainText('Offline edit.');
  await expect.poll(()=>page.locator('#preview img').evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
  await page.context().setOffline(false);
  await page.evaluate(()=>SheetsOnline.setSource('All pictures removed.'));
  await page.locator('#format').selectOption('text');
  await expect(page.locator('#format')).toHaveValue('text');
  await expect(page.locator('#preview')).toContainText('All pictures removed.');
});
