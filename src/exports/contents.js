import { encodeQr, qrPng } from '../../vendor/fragment-kit-v0.4.3/src/index.js';
import { sanitize } from '../sanitize.js';

// Compose in a detached tree, then let captureSnapshot sanitize every output.
export async function exportContents(preview, state, { contents, qrURL, signal }) {
  const root = document.createElement('div');
  if (contents !== 'source') root.append(...preview.cloneNode(true).childNodes);
  if (contents === 'source' || contents === 'both') {
    const heading = document.createElement('h2');
    heading.textContent = 'Sheet source';
    const pre = document.createElement('pre');
    pre.textContent = state.src;
    root.append(heading, pre);
  }
  if (qrURL) {
    const qr = encodeQr(qrURL);
    if (!qr) throw Error('This link is too long for a QR code. Make a short URL or save to HashBin first.');
    if (qr.version > 20) throw Error('This QR code is too dense for a reliable printout. Make a short URL or save to HashBin first.');
    const blob = await qrPng(qr);
    signal?.throwIfAborted();
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const footer = document.createElement('footer');
    footer.className = 'export-qr';
    const img = document.createElement('img');
    img.src = data; img.alt = 'QR code: reopen this sheet in Sheets';
    img.width = img.height = 180;
    const link = document.createElement('a');
    link.href = qrURL; link.textContent = 'Reopen this sheet in Sheets';
    footer.append(img, link);
    root.append(footer);
  }
  root.innerHTML = sanitize(root.innerHTML);
  return root;
}
