import { fileName } from "./downloads.js";
import { escapeHTML } from "./util.js";
import { sanitize } from "./sanitize.js";

const exportStyles = `
:root{font-family:system-ui,sans-serif;color:#243b39;background:white;font-size:16px}
body{max-width:900px;margin:40px auto;padding:0 24px;line-height:1.75;overflow-wrap:anywhere}
h1,h2,h3{line-height:1.3}h1{font-size:2em}a{color:#176f61}img,svg{max-width:100%;height:auto}
table{border-collapse:collapse;width:100%;margin:20px 0;font-size:.9em}td,th{border:1px solid #dfe5e0;padding:8px 12px;text-align:left}th{background:#f2f6ef}
.org-table-scroll{max-width:100%;overflow-x:auto;margin:20px 0}.org-table-scroll table{margin:0;overflow-wrap:normal;word-break:normal}
.org-table-scroll td,.org-table-scroll th{white-space:nowrap}.org-table-scroll .org-table-wrap{white-space:normal}
[align="center"]{text-align:center}[align="right"]{text-align:right}
pre{background:#f5f7f3;padding:16px;white-space:pre-wrap;overflow:auto;border-radius:6px}code{font-family:ui-monospace,monospace;font-size:.9em}
blockquote,.markdown-alert,.callout{border-left:3px solid #7cb99c;padding:4px 18px;margin:20px 0;background:#f1f7ef}
.display-math{overflow:auto;padding:15px 0}math{font-size:1.1em}.asciimath-formula details{font-size:.8em;color:#6c7c77}
.result-line{display:grid;grid-template-columns:28px minmax(0,1fr) minmax(0,1fr);gap:12px;border-bottom:1px solid #dfe5e0;padding:10px 0;font-family:monospace;font-size:.85em}.result-line code,.result-line output{white-space:pre-wrap}.result-line output{color:#176f61}.line-number{color:#6c7c77}
.error,.math-error,.diagnostics{color:#a74438}.notice{background:#fff7e7;padding:12px}.success{color:#176f61}figure{margin:24px 0}figcaption{font-size:.9em;text-align:center}
@page{margin:18mm}@media print{body{max-width:none;margin:0;padding:0;font-size:11pt}.org-table-scroll{overflow:visible}pre,figure,tr{break-inside:avoid}h1,h2,h3{break-after:avoid}}
`;
/** Capture the current, sanitized preview, including completed diagrams and the selected report. */
export function htmlDownload(
  preview,
  { title = "Sheet", baseURL = location.href } = {},
) {
  const clone = preview.cloneNode(true);
  clone
    .querySelectorAll('button,[role="tablist"],[hidden]')
    .forEach((element) => element.remove());
  for (const element of clone.querySelectorAll("[href],[src]")) {
    for (const attr of ["href", "src"]) {
      const value = element.getAttribute(attr);
      if (!value || value.startsWith("#")) continue;
      try {
        element.setAttribute(attr, new URL(value, baseURL).href);
      } catch {
        element.removeAttribute(attr);
      }
    }
  }
  const html = sanitize(clone.innerHTML);
  const document = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https: http:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escapeHTML(title)}</title><style>${exportStyles}</style></head><body><article class="document">${html}</article></body></html>\n`;
  return {
    name: fileName(title, ".html"),
    blob: new Blob([document], { type: "text/html;charset=utf-8" }),
  };
}
export function downloadFile({ name, blob }) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Keep the URL alive long enough for browsers to hand the Blob to their download manager.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
