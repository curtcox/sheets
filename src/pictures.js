import { verifyAttachments, imageDataURL, fetchPicture, makeAttachment } from './attachments.js';
import { cid } from '../vendor/fragment-kit-v0.3.5/src/core/cid.js';
import { sanitize } from './sanitize.js';

// Resolve app-owned references before the final sanitization boundary. No raw HTML insertion.
export async function resolvePictures(html, attachments = [], signal) {
  const checked = await verifyAttachments(attachments, signal), entries = new Map(checked.map(entry => [entry.id,entry]));
  html = html.replace(/src="sheets-asset:([\w-]+)"/g, (_, id) => entries.has(id) ? `src="${imageDataURL(entries.get(id))}"` : 'alt="Missing included picture"');
  return html.replace(/src="(https:\/\/(?:256t.us|hashbin.org)\/[^"]+)"/g, (match, url) => cid(url) ? `data-hosted-picture="${url}"` : match);
}
export async function resolveHostedPictures(preview, signal) {
  await Promise.all([...preview.querySelectorAll('img[data-hosted-picture]')].map(async img => {
    try {
      const bytes = await fetchPicture(img.getAttribute('data-hosted-picture'), { signal });
      const entry = await makeAttachment(bytes, signal);
      signal?.throwIfAborted();
      const wrapper = document.createElement('div');
      const clone = img.cloneNode(); clone.src = imageDataURL(entry);
      wrapper.innerHTML = sanitize(clone.outerHTML);
      if (img.isConnected) img.replaceWith(wrapper.firstElementChild);
    } catch (error) {
      if (signal?.aborted) return;
      const message = document.createElement('span'); message.className = 'error';
      message.textContent = `Picture unavailable: ${error.message}`;
      if (img.isConnected) img.replaceWith(message);
    }
  }));
}
