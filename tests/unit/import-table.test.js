import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDelimited, tableSource } from '../../src/import-table.js';
test('CSV preserves text, quoted separators, quotes, multiline and blank fields', () => {
  assert.deepEqual(parseDelimited('\uFEFFID,Name,Note,Value\r\n001,"A, B","say ""yes""\nnext",\r\n002,C,,1.00\r\n'), [['ID','Name','Note','Value'],['001','A, B','say "yes"\nnext',''],['002','C','','1.00']]);
  assert.deepEqual(parseDelimited('a\tb\n1\t2','\t'), [['a','b'],['1','2']]);
  assert.deepEqual(parseDelimited('a;b\n1;2',';'), [['a','b'],['1','2']]);
  assert.deepEqual(parseDelimited('a,b\n1'), [['a','b'],['1','']]);
});
test('malformed and oversized tables are rejected', () => {
  for (const text of ['"open','a,"x"junk','a,b"c','']) assert.throws(() => parseDelimited(text));
  assert.throws(() => parseDelimited('x'.repeat(524289)), /512 KiB/);
  assert.throws(() => parseDelimited(Array(1002).fill('x').join('\n')), /1,000 rows/);
});
test('table source escapes markup and preserves nonnumeric lexemes', () => {
  const rows = [['ID','value'],['001','<img src=x onerror=alert(1)>|$x']];
  assert.match(tableSource(rows,'gfm'), /001/);
  assert.match(tableSource(rows,'gfm'), /&lt;img/);
  assert.match(tableSource(rows,'org'), /\\vert\{\}/);
  assert.equal(tableSource([['a','b']],'org',false), '| a | b |');
  assert.match(tableSource([['a','b']],'gfm',false), /^\|  \|  \|\n\| ---/);
});
