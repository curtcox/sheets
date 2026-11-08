import { redirectSnapshots } from './publish-mock.js';
import { readFile } from 'node:fs/promises';
import { linkFromFile } from '../../scripts/link.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeAttachment, validateAttachments, verifyAttachments, fetchPicture, pictureURL, imageDataURL } from '../../src/attachments.js';
import { parseProjectFile, serializeProjectFile } from '../../src/project-state.js';
import { writeURL, readURL } from '../../src/url-state.js';
import { HashBinDocuments } from '../../src/hashbin.js';
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9S8AAAAASUVORK5CYII=', 'base64'));
test('included pictures round-trip via project files, URLs and HashBin without replacing numeric inputs', async () => {
  const attachment = await makeAttachment(png);
  for (const type of ['gfm','org']) {
    const doc = { src: type === 'org' ? `[[sheets-asset:${attachment.id}][pixel]]` : `<img src="sheets-asset:${attachment.id}" alt="pixel">`, type, view:'preview', attachments:[attachment] };
    assert.deepEqual(parseProjectFile(serializeProjectFile(doc)),doc);
    assert.deepEqual(HashBinDocuments.parse(HashBinDocuments.serialize(doc)),doc);
    assert.deepEqual(readURL(writeURL('https://example.org/',{...doc,format:type})).attachments,doc.attachments);
    assert.equal(await verifyAttachments(doc.attachments).then(a=>a.length),1);
    assert.match(imageDataURL(attachment), /^data:image\/png;base64,/);
  }
});
test('picture validation rejects malformed types, duplicate ids, oversized and changed content', async () => {
  const attachment = await makeAttachment(png);
  assert.throws(()=>validateAttachments([attachment,attachment]),/Duplicate/);
  assert.throws(()=>validateAttachments([{...attachment,mime:'image/svg+xml'}]),/type/);
  assert.throws(()=>validateAttachments([{...attachment,data:'!'}]),/Malformed/);
  const changed = { ...attachment, data: attachment.data.slice(0,-1) + (attachment.data.at(-1) === 'A' ? 'B' : 'A') };
  await assert.rejects(()=>verifyAttachments([changed]));
  await assert.rejects(()=>makeAttachment(new TextEncoder().encode('{"format":"sheets-document"}')), /not image payloads/);
});
test('hosted pictures accept HashBin/256t URLs and inline CIDs and verify bytes', async () => {
  const attachment = await makeAttachment(png);
  for (const input of [attachment.id, `https://hashbin.org/#${attachment.id}`, `https://256t.us/${attachment.id}`]) {
    assert.equal(pictureURL(input),`https://256t.us/${attachment.id}`);
    assert.deepEqual(await fetchPicture(input,{fetchSource:async()=>new Response(png)}),png);
  }
  await assert.rejects(()=>fetchPicture(attachment.id,{fetchSource:async()=>new Response(new Uint8Array(png.length))}),/hash/);
  for (const input of ['javascript:alert(1)','file:///tmp/a.png','http://example.org/a.png','https://user:pass@example.org/a.png']) assert.throws(()=>pictureURL(input));
  const controller = new AbortController();controller.abort();await assert.rejects(()=>fetchPicture(attachment.id,{signal:controller.signal,fetchSource:async()=>new Response(png)}));
});

test('picture projects survive CLI and approval/cancellation redirect snapshots', async () => {
  const doc = parseProjectFile(await readFile(new URL('../../examples/gfm/bundled-report.sheets.json',import.meta.url),'utf8'));
  for (const restored of await redirectSnapshots(doc)) assert.deepEqual(restored,doc);
  const {url} = await linkFromFile('examples/gfm/bundled-report.sheets.json');
  assert.deepEqual(readURL(url).attachments,doc.attachments);
});

test('dimension bombs are rejected before a picture can be included', async () => {
  const huge = png.slice(); new DataView(huge.buffer).setUint32(16,100000);
  new DataView(huge.buffer).setUint32(20,100000);
  await assert.rejects(()=>makeAttachment(huge), /16 million/);
});
