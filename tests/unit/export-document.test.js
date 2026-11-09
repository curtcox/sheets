import { test } from 'node:test';
import assert from 'node:assert/strict';
import { richText } from '../../src/exports/document.js';

test('RTF escapes control syntax and preserves Unicode code units and paragraph boundaries', () => {
  const result = richText({ model: [{ type: 'paragraph', children: [{ type: 'text', text: '日本語 😀 {value} \\path\nNext' }] }] });
  assert.match(result.text, /^\{\\rtf1/);
  assert.ok(result.text.includes('\\u26085?'));
  assert.ok(result.text.includes('\\u-10179?\\u-8704?'));
  assert.ok(result.text.includes('\\{value\\} \\\\path\\par\nNext'));
  assert.ok(result.diagnostics.some(text => /pictures become text/.test(text)));
});
