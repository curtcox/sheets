import { parseDelimited, tableSource } from './import-table.js';

export function setupInsertion({ container, sourcePane, getFormat, fingerprint, capture, insert }) {
  const button = document.createElement('button');
  button.id = 'insert-content'; button.textContent = 'Insert'; container.append(button);
  const dialog = document.createElement('dialog'); dialog.id = 'insert-dialog';
  dialog.innerHTML = `<div class="dialog-heading"><h2>Insert a table</h2><button type="button" id="insert-close" aria-label="Close insertion">×</button></div>
    <p>Choose CSV or paste rows copied from a spreadsheet. Insert into an Org or Markdown document.</p>
    <label>CSV file <input id="insert-file" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values"></label>
    <label>CSV or tab-separated text<textarea id="insert-text" rows="6" spellcheck="false"></textarea></label>
    <label>Separator <select id="insert-delimiter"><option value=",">Comma</option><option value=";">Semicolon</option><option value="tab">Tab</option></select></label>
    <label><input id="insert-header" type="checkbox" checked> First row is a header</label>
    <p id="insert-status" role="status"></p><div id="insert-preview" class="import-preview"></div>
    <p class="subtle">Values stay text until you add calculations. Multiline cells become spaces in Org. Markdown uses an empty header when no header is selected.</p>
    <div class="dialog-actions"><button id="insert-confirm" class="primary">Insert editable table</button></div>`;
  document.body.append(dialog);
  const $ = id => dialog.querySelector('#' + id);
  let before, position, rows, generation = 0;
  const delimiter = () => $('insert-delimiter').value === 'tab' ? '\t' : $('insert-delimiter').value;
  function refresh() {
    rows = undefined; $('insert-preview').replaceChildren(); $('insert-confirm').disabled = true;
    try {
      rows = parseDelimited($('insert-text').value, delimiter());
      const table = document.createElement('table');
      rows.slice(0, 12).forEach((row, i) => { const tr = table.insertRow(); row.forEach(value => { const cell = document.createElement(i === 0 && $('insert-header').checked ? 'th' : 'td'); cell.textContent = value; tr.append(cell); }); });
      $('insert-preview').append(table);
      $('insert-status').textContent = `${rows.length} rows × ${rows[0].length} columns · preview shows up to 12 rows`;
      $('insert-confirm').disabled = !['org', 'gfm'].includes(getFormat());
      if ($('insert-confirm').disabled) $('insert-status').textContent += ' · Choose Org or Markdown first.';
    } catch (error) { $('insert-status').textContent = error.message; }
  }
  function open(text = '', sep = ',') {
    before = fingerprint(); position = capture(); generation++;
    $('insert-text').value = text; $('insert-delimiter').value = sep === '\t' ? 'tab' : sep;
    $('insert-file').value = ''; refresh(); dialog.showModal();
  }
  button.onclick = () => open();
  $('insert-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => generation++);
  for (const id of ['insert-text', 'insert-delimiter', 'insert-header']) $(id).addEventListener('input', refresh);
  $('insert-file').onchange = async () => {
    const file = $('insert-file').files[0], job = ++generation;
    if (!file) return;
    try {
      if (file.size > 512 * 1024) throw Error('Table exceeds 512 KiB.');
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (job !== generation || !dialog.open) return;
      $('insert-text').value = text; if (/\.tsv$/i.test(file.name)) $('insert-delimiter').value = 'tab'; refresh();
    } catch (error) { $('insert-status').textContent = error.message; }
  };
  $('insert-confirm').onclick = () => {
    try {
      if (before !== fingerprint()) throw Error('Document changed. Close Insert and try again.');
      insert('\n\n' + tableSource(rows, getFormat(), $('insert-header').checked) + '\n\n', position);
      dialog.close();
    } catch (error) { $('insert-status').textContent = error.message; }
  };
  sourcePane.addEventListener('paste', event => {
    const text = event.clipboardData?.getData('text/plain');
    if (!text?.includes('\t') || !text.includes('\n') || !['org', 'gfm'].includes(getFormat())) return;
    event.preventDefault(); event.stopPropagation(); open(text, '\t');
  }, true);
  return { open };
}
