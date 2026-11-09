import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pagesLink } from '../../src/exports/pages.js';
import { decompress } from '../../vendor/fragment-kit-v0.3.5/src/index.js';
const varied = Array.from({ length: 1000 }, (_, i) => createHash('sha256').update(String(i)).digest('hex')).join('');

test('Pages handoff round-trips both query and fragment envelopes', () => {
  for (const html of ['<h1>日本語 😀</h1>', '<p>' + varied.slice(0, 16000) + '</p>']) {
    const url = new URL(pagesLink({ html }));
    assert.equal(url.searchParams.get('run'), '0');
    assert.equal(!!url.hash, html.length > 1000);
    const envelope = JSON.parse(url.hash ? decodeURIComponent(url.hash.slice(1)) : decompress(url.searchParams.get('doc')));
    assert.equal(envelope.src, html);
    assert.deepEqual(envelope.pages.files, [{ name: 'index.html', text: html }]);
  }
});

test('Pages rejects oversized HTML, duplicate envelope bytes and unreliable URLs', () => {
  assert.throws(() => pagesLink({ html: 'x'.repeat(5 * 1024 * 1024 + 1) }), /at most 5 MiB/);
  assert.throws(() => pagesLink({ html: 'x'.repeat(3 * 1024 * 1024) }), /envelope exceeds 5 MiB/);
  assert.throws(() => pagesLink({ html: varied }), /too large for a reliable handoff/);
});
