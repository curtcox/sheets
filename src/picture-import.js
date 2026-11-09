import { ATTACHMENT_LIMITS, checkImageDimensions } from './attachments.js';
import { validateRows } from './import-table.js';
import { escapeHTML } from './util.js';

export function htmlTableRows(html) {
  if (new TextEncoder().encode(html).length > 512 * 1024) throw Error('Clipboard table exceeds 512 KiB.');
  // A template is inert: scripts never execute and remote image resources are not installed.
  const template = document.createElement('template'); template.innerHTML = html;
  const table = template.content.querySelector('table');
  if (!table) throw Error('Clipboard does not contain a table.');
  if (template.content.querySelectorAll('table').length !== 1 || table.querySelector('[rowspan]:not([rowspan="1"]),[colspan]:not([colspan="1"])')) throw Error('Merged cells or multiple tables need a picture, or copy a rectangular cell range.');
  return validateRows([...table.rows].map(row => [...row.cells].map(cell => {
    cell.querySelectorAll('script,style,iframe,object,template').forEach(node => node.remove());
    cell.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
    return cell.textContent;
  })));
}
export async function preparePicture(file, resize = false) {
  if (file.size > 8 * 1024 * 1024) throw Error('Choose an image smaller than 8 MiB.');
  checkImageDimensions(new Uint8Array(await file.arrayBuffer()));
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > ATTACHMENT_LIMITS.pixels) throw Error('Picture exceeds 16 million pixels. Resize it in the source app first.');
    if (!resize && file.size <= ATTACHMENT_LIMITS.bytes) return new Uint8Array(await file.arrayBuffer());
    if (!resize) throw Error('Picture exceeds 256 KiB. Select Resize to fit, or use a hosted link.');
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1,Math.round(bitmap.width * scale)); canvas.height = Math.max(1,Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .85));
    if (!blob || blob.size > ATTACHMENT_LIMITS.bytes) throw Error('Resized picture still exceeds 256 KiB. Reduce its dimensions in the source app.');
    return new Uint8Array(await blob.arrayBuffer());
  } finally { bitmap.close(); }
}
export async function tablePicture(rows, header) {
  rows = validateRows(rows);
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'); ctx.font = '14px sans-serif';
  const widths = rows[0].map((_, col) => Math.min(320, Math.max(80, ...rows.map(row => Math.max(...row[col].split('\n').map(line => ctx.measureText(line).width)) + 20))));
  const wrap = (text, width) => text.split('\n').flatMap(line => {
    const lines = []; let current = '';
    for (const char of line) { if (ctx.measureText(current + char).width > width - 20 && current) { lines.push(current); current = ''; } current += char; }
    lines.push(current); return lines;
  });
  const cells = rows.map(row => row.map((value, col) => wrap(value,widths[col]))), heights = cells.map(row => Math.max(...row.map(cell => cell.length)) * 20 + 16);
  canvas.width = widths.reduce((a,b) => a+b,0); canvas.height = heights.reduce((a,b) => a+b,0);
  if (canvas.width > 4000 || canvas.height > 8000 || canvas.width * canvas.height > ATTACHMENT_LIMITS.pixels) throw Error('This table is too large for a picture. Select fewer cells or insert an editable table.');
  ctx.fillStyle = 'white'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.font = '14px sans-serif'; ctx.textBaseline = 'top';
  let y = 0;
  cells.forEach((row,i) => { let x = 0; row.forEach((lines,j) => {
    ctx.fillStyle = i === 0 && header ? '#e6f1eb' : 'white'; ctx.fillRect(x,y,widths[j],heights[i]);
    ctx.strokeStyle = '#a9bdb3'; ctx.strokeRect(x+.5,y+.5,widths[j]-1,heights[i]-1);
    ctx.fillStyle = '#243b39'; lines.forEach((line,k) => ctx.fillText(line,x+10,y+8+k*20)); x += widths[j];
  }); y += heights[i]; });
  const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png'));
  if (!blob) throw Error('Could not create table picture.');
  return preparePicture(blob);
}
export function pictureSource({ src, format, alt = '', caption = '', width = 640 }) {
  width = Math.max(80, Math.min(1600, Number(width) || 640));
  if (format === 'org') {
    const label = alt.replace(/[\[\]\r\n]/g,' '), text = caption.replace(/[\r\n]/g,' ');
    return `${text ? '#+CAPTION: ' + text + '\n' : ''}#+ATTR_HTML: :width ${width}\n[[${src.startsWith('sheets-asset:') ? src : 'sheets-image:' + src}][${label}]]`;
  }
  if (format !== 'gfm') throw Error('Choose Org or Markdown to insert a picture.');
  return `<figure><img src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" width="${width}" referrerpolicy="no-referrer">${caption ? '<figcaption>' + escapeHTML(caption) + '</figcaption>' : ''}</figure>`;
}
