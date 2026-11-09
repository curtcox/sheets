// Bounded, DOM-free parsing and source generation for external tables.
export const TABLE_LIMITS = Object.freeze({ bytes: 512 * 1024, rows: 1000, columns: 100, cells: 20000 });
export function parseDelimited(text, delimiter = ',') {
  if (new TextEncoder().encode(text).length > TABLE_LIMITS.bytes) throw Error('Table exceeds 512 KiB.');
  if (![',', ';', '\t'].includes(delimiter)) throw Error('Choose comma, semicolon or tab.');
  text = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const rows = []; let row = [], cell = '', quoted = false, closed = false;
  const field = () => { row.push(cell); cell = ''; closed = false; if (row.length > TABLE_LIMITS.columns) throw Error('Table exceeds 100 columns.'); };
  const line = () => { field(); rows.push(row); row = []; if (rows.length > TABLE_LIMITS.rows) throw Error('Table exceeds 1,000 rows.'); };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else cell += ch;
    } else if (ch === delimiter) field();
    else if (ch === '\n') line();
    else if (ch === '"' && cell === '' && !closed) quoted = true;
    else { if (closed || ch === '"') throw Error('Malformed CSV quoting. Quote fields containing quotes or delimiters.'); cell += ch; }
  }
  if (quoted) throw Error('Unclosed quoted CSV field.');
  if (cell || row.length || closed || (text && !text.endsWith('\n'))) line();
  return validateRows(rows);
}
export function validateRows(rows) {
  if (!rows.length || !rows.some(row => row.some(cell => cell !== ''))) throw Error('The table is empty.');
  const width = Math.max(...rows.map(row => row.length));
  if (rows.length > TABLE_LIMITS.rows || width > TABLE_LIMITS.columns || rows.length * width > TABLE_LIMITS.cells) throw Error('Table exceeds 1,000 rows, 100 columns or 20,000 cells.');
  return rows.map(row => Array.from({ length: width }, (_, i) => String(row[i] ?? '')));
}
export function tableSource(rows, format, header = true) {
  rows = validateRows(rows);
  if (!['org', 'gfm'].includes(format)) throw Error('Choose Org or Markdown before inserting a table.');
  const escape = value => format === 'org'
    ? value.replace(/\\/g, '\\backslash{}').replace(/\|/g, '\\vert{}').replace(/\n/g, ' ')
    : value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\/g, '\\\\').replace(/([|`*_[\]~$])/g, '\\$1').replace(/\n/g, '<br>');
  const lines = rows.map(row => `| ${row.map(escape).join(' | ')} |`);
  if (format === 'org') { if (header) lines.splice(1, 0, '|' + rows[0].map(() => '---').join('+') + '|'); }
  else { if (!header) lines.unshift(`| ${rows[0].map(() => '').join(' | ')} |`); lines.splice(1, 0, `| ${rows[0].map(() => '---').join(' | ')} |`); }
  return lines.join('\n');
}
