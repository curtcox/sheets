import { parseDelimited, tableSource } from './import-table.js';
import { fetchPicture, makeAttachment, pictureURL, imageDataURL } from './attachments.js';
import { htmlTableRows, tablePicture, preparePicture, pictureSource } from './picture-import.js';

export function setupInsertion({ container, sourcePane, getFormat, fingerprint, capture, insert }) {
  const button = document.createElement('button'); button.id = 'insert-content'; button.textContent = 'Insert'; container.append(button);
  const dialog = document.createElement('dialog'); dialog.id = 'insert-dialog';
  dialog.innerHTML = `<div class="dialog-heading"><h2>Insert a table or picture</h2><button type="button" id="insert-close" aria-label="Close insertion">×</button></div>
    <label>Content <select id="insert-kind"><option value="table">Table (CSV or copied cells)</option><option value="picture">Picture</option></select></label>
    <div id="insert-table-options">
      <label>CSV file <input id="insert-file" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values"></label>
      <label>CSV or tab-separated text<textarea id="insert-text" rows="6" spellcheck="false"></textarea></label>
      <label>Separator <select id="insert-delimiter"><option value=",">Comma</option><option value=";">Semicolon</option><option value="tab">Tab</option></select></label>
      <label><input id="insert-header" type="checkbox" checked> First row is a header</label>
      <label>Insert as <select id="insert-as"><option value="editable">Editable table</option><option value="picture">Picture</option></select></label>
      <p class="subtle">Imported values do not include spreadsheet formulas or live connections. Multiline cells become spaces in Org. Markdown supplies an empty header when needed. Table pictures use the preview's simple formatting.</p>
    </div>
    <div id="insert-picture-options" hidden>
      <label>Picture file <input id="insert-picture-file" type="file" accept="image/png,image/jpeg,image/webp"></label>
      <label>Hosted picture URL or HashBin/256t CID<input id="insert-url" type="text" placeholder="https://…"></label>
      <label>Storage <select id="insert-storage"><option value="linked">Keep linked (hosted pictures)</option><option value="included">Include in document</option></select></label>
      <p class="subtle">Files and clipboard pictures are included. Linked pictures need a connection. Including a hosted picture needs its host to allow browser access; HashBin/256t payloads are verified. PNG, JPEG and WebP only.</p>
    </div>
    <div id="insert-image-details" hidden>
      <label><input id="insert-resize" type="checkbox"> Resize local picture to fit (up to 1,600 pixels, WebP)</label>

      <label>Alternative text<input id="insert-alt" type="text" maxlength="1000"></label>
      <label>Caption<input id="insert-caption" type="text" maxlength="2000"></label>
      <label>Display width<input id="insert-width" type="number" min="80" max="1600" value="640"></label>
    </div>
    <p id="insert-status" role="status"></p><div id="insert-preview" class="import-preview"></div>
    <div class="dialog-actions"><button id="insert-confirm" class="primary">Insert editable table</button></div>`;
  document.body.append(dialog);
  const $ = id => dialog.querySelector('#' + id);
  let before, position, rows, generation = 0, clipboardRows, clipboardPicture, controller, clipboardNotice = '';
  const delimiter = () => $('insert-delimiter').value === 'tab' ? '\t' : $('insert-delimiter').value;
  const isTable = () => $('insert-kind').value === 'table';
  const isPicture = () => !isTable() || $('insert-as').value === 'picture';
  function refresh() {
    generation++; controller?.abort();
    rows = undefined; $('insert-preview').replaceChildren(); $('insert-confirm').disabled = true;
    $('insert-table-options').hidden = !isTable(); $('insert-picture-options').hidden = isTable(); $('insert-image-details').hidden = !isPicture();
    $('insert-confirm').textContent = isPicture() ? 'Insert picture' : 'Insert editable table';
    try {
      if (!['org','gfm'].includes(getFormat())) throw Error('Choose Org or Markdown before inserting content.');
      if (isTable()) {
        rows = clipboardRows || parseDelimited($('insert-text').value, delimiter());
        const table = document.createElement('table');
        rows.slice(0, 12).forEach((row, i) => { const tr = table.insertRow(); row.forEach(value => { const cell = document.createElement(i === 0 && $('insert-header').checked ? 'th' : 'td'); cell.textContent = value; tr.append(cell); }); });
        $('insert-preview').append(table);
        $('insert-status').textContent = `${rows.length} rows × ${rows[0].length} columns · preview shows up to 12 rows`;
      } else {
        const file = $('insert-picture-file').files[0] || clipboardPicture;
        if (!file) pictureURL($('insert-url').value);
        $('insert-status').textContent = file ? `${file.name || 'Clipboard picture'} · ${file.size.toLocaleString()} bytes · included in document` : 'Hosted picture · ' + ($('insert-storage').value === 'linked' ? 'kept linked' : 'included after download');
      }
      $('insert-status').textContent += clipboardNotice;
      $('insert-confirm').disabled = false;
    } catch (error) { $('insert-status').textContent = error.message; }
  }
  function open(text = '', sep = ',', { html, picture } = {}) {
    before = fingerprint(); position = capture(); controller?.abort(); clipboardRows = undefined; clipboardPicture = picture; clipboardNotice = '';
    $('insert-kind').value = picture && !text && !html ? 'picture' : 'table'; $('insert-as').value = 'editable';
    $('insert-text').value = text; $('insert-delimiter').value = sep === '\t' ? 'tab' : sep;
    for (const id of ['insert-file','insert-picture-file','insert-url','insert-alt','insert-caption']) $(id).value = '';
    $('insert-storage').value = 'linked';
    if (html) try { clipboardRows = htmlTableRows(html); } catch (error) {
      if (text?.includes('\t')) clipboardNotice = ' · Clipboard layout could not be preserved; using tab-separated values. Choose Picture to use a supplied screenshot.';
      if (!text?.includes('\t')) { $('insert-kind').value = 'picture'; if (!picture) { refresh(); dialog.showModal(); $('insert-status').textContent = error.message + ' Use CSV or a screenshot instead.'; return; } }
    }
    refresh(); dialog.showModal();
  }
  button.onclick = () => open();
  $('insert-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { generation++; controller?.abort(); });
  for (const id of ['insert-kind','insert-text','insert-delimiter','insert-header','insert-as','insert-picture-file','insert-url','insert-storage','insert-resize','insert-alt','insert-caption','insert-width']) $(id).addEventListener('input', () => {
    if (id === 'insert-text' || id === 'insert-delimiter') clipboardRows = undefined;
    if (id === 'insert-picture-file' || id === 'insert-url') clipboardPicture = undefined;
    if (id === 'insert-url') $('insert-picture-file').value = '';
    refresh();
  });
  $('insert-file').onchange = async () => {
    const file = $('insert-file').files[0], job = ++generation;
    if (!file) return;
    rows = undefined; $('insert-confirm').disabled = true; $('insert-status').textContent = 'Reading table…';
    try {
      if (file.size > 512 * 1024) throw Error('Table exceeds 512 KiB.');
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (job !== generation || !dialog.open) return;
      clipboardRows = undefined; $('insert-text').value = text; $('insert-delimiter').value = /\.tsv$/i.test(file.name) ? 'tab' : ','; refresh();
    } catch (error) { if (job === generation) $('insert-status').textContent = error.message; }
  };
  $('insert-confirm').onclick = async () => {
    const job = ++generation; controller?.abort(); controller = new AbortController();
    const signal = controller.signal;
    $('insert-confirm').disabled = true;
    try {
      if (before !== fingerprint()) throw Error('Document changed. Close Insert and try again.');
      let text, additions = [];
      if (!isPicture()) text = tableSource(rows, getFormat(), $('insert-header').checked);
      else {
        const format = getFormat(), alt = $('insert-alt').value, caption = $('insert-caption').value, width = $('insert-width').value;
        const file = $('insert-picture-file').files[0] || clipboardPicture;
        let src;
        if (!isTable() && !file && $('insert-storage').value === 'linked') {
          src = pictureURL($('insert-url').value);
          // Verify HashBin payloads before insertion, including inline CIDs. Ordinary HTTPS links need no CORS fetch.
          if (/^https:\/\/256t.us\//.test(src)) await fetchPicture(src, { signal });
        } else {
          const bytes = isTable() ? clipboardPicture ? await preparePicture(clipboardPicture,$('insert-resize').checked) : await tablePicture(rows,$('insert-header').checked)
            : file ? await preparePicture(file,$('insert-resize').checked) : await fetchPicture($('insert-url').value,{ signal });
          signal.throwIfAborted();
          const entry = await makeAttachment(bytes,signal); additions = [entry]; src = 'sheets-asset:' + entry.id;
          $('insert-status').textContent = `Including ${bytes.length.toLocaleString()} bytes. Pictures travel in project files and links; plain source downloads contain references only.`;
          const img = document.createElement('img'); img.src = imageDataURL(entry); img.alt = alt;
          await img.decode(); signal.throwIfAborted(); $('insert-preview').replaceChildren(img);
        }
        text = pictureSource({ src, format, alt, caption, width });
      }
      signal.throwIfAborted();
      if (job !== generation || before !== fingerprint()) throw Error('Document changed. Close Insert and try again.');
      insert('\n\n' + text + '\n\n', position, additions); dialog.close();
    } catch (error) { if (job === generation && dialog.open) { $('insert-status').textContent = error.message; $('insert-confirm').disabled = false; } }
  };
  const accept = (event, data) => {
    if (!['org','gfm'].includes(getFormat())) return;
    const text = data?.getData('text/plain') || '', html = data?.getData('text/html') || '';
    const picture = [...(data?.files || [])].find(file => /^image\/(png|jpeg|webp)$/.test(file.type));
    const tableFile = [...(data?.files || [])].find(file => /\.(csv|tsv)$/i.test(file.name));
    const sample = text.trim().split(/\r?\n/).slice(0,2);
    const counts = sample.map(line => line.split(',').length);
    const tabular = text.includes('\t') || (sample.length === 2 && counts[0] > 1 && counts[0] === counts[1]);
    if (!picture && !tableFile && !/<table[\s>]/i.test(html) && !tabular) return;
    event.preventDefault(); event.stopPropagation();
    open(text, text.includes('\t') ? '\t' : ',', { html: /<table[\s>]/i.test(html) ? html : undefined, picture });
    if (tableFile) { const transfer = new DataTransfer(); transfer.items.add(tableFile); $('insert-file').files = transfer.files; $('insert-file').dispatchEvent(new Event('change')); }
  };
  sourcePane.addEventListener('paste', event => accept(event,event.clipboardData), true);
  sourcePane.addEventListener('dragover', event => { if (event.dataTransfer.types.includes('Files')) event.preventDefault(); });
  sourcePane.addEventListener('drop', event => accept(event,event.dataTransfer), true);
  return { open };
}
