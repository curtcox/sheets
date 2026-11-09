import { captureSnapshot } from "./snapshot.js";
import { exportTargets, exportSnapshot } from "./registry.js";
import { downloadFile } from "../export-document.js";
import { exportContents } from "./contents.js";
import { sourceDownload, projectDownload } from "../downloads.js";
import { SheetShareClient, knownShortLink } from "../share-links.js";
import { fileName } from "../downloads.js";
import { pagesLink } from "./pages.js";
import { prepareWordMedia } from "./media.js";
import {
  loadGoogleIdentity,
  googleToken,
  uploadGoogleDoc,
} from "./google-docs.js";
export function setupExports({
  button,
  getState,
  getResult,
  getRevision,
  preview,
  closeDrawer,
  getLink,
  getSavedLink,
  saveToHashBin,
}) {
  const dialog = document.createElement("dialog");
  dialog.className = "export-dialog";
  dialog.setAttribute("aria-labelledby", "export-title");
  dialog.innerHTML =
    `<form method="dialog">
    <header>
    <h2 id="export-title">Export document</h2>
    <button aria-label="Close exports">Close</button>
    </header>
    </form>
    <p>Exports capture the current results. Keep a portable project to edit calculations again in Sheets.</p>
    <label>Format <select id="export-target">
    </select>
    </label>
    <label>Contents <select id="export-contents">
    <option value="rendered">Calculated results / selected report</option>
    <option value="source">Source</option>
    <option value="both">Results and source</option>
    <option value="project">Editable portable project</option>
    </select>
    </label>
    <label>Destination <select id="export-destination">
    <option value="download">Download file</option>
    <option value="print">Print / Save as PDF</option>
    <option value="google">Google Docs</option>
    <option value="pages">Pages Online</option>
    <option value="hashbin">HashBin (save editable sheet)</option>
    </select>
    </label>
    <p id="export-combination" role="status">
    </p>
    <label id="export-appearance-label">
    <input id="export-appearance" type="checkbox" checked> Preserve screen appearance, including alternating row shading</label>
    <p id="export-appearance-help">HTML and print preserve preview styling; Word preserves alternating table shading. QR images are supported in HTML, print/PDF, Word, Markdown, Google Docs and Pages. Other conversions have their own formatting. Print background colors may also need enabling in your browser.</p>
    <label id="export-qr-label">
    <input id="export-qr" type="checkbox"> Embed a QR code to reopen this sheet</label>
    <div id="export-qr-settings" hidden>
    <label>QR link <select id="export-qr-link">
    <option value="sheet">Current sheet link</option>
    <option value="saved">Saved HashBin sheet (256t-backed)</option>
    </select>
    </label>
    <p id="export-qr-help">
    </p>
    <button id="export-shorten" type="button">Make short URL with is.gd</button> <button id="export-save" type="button">Save sheet to HashBin for a reload QR</button>
    <label id="export-long-label">
    <input id="export-long" type="checkbox"> Use the full sheet URL without shortening</label>
    <p>Shortening sends the sheet URL to is.gd through AllOrigins. HashBin shows its price and asks for approval before saving.</p>
    </div>
    <label id="export-values-label" hidden>
    <input id="export-values" type="checkbox"> Values-only snapshot (no working formulas)</label>
    <div id="export-google-settings" hidden>
    <label>Google OAuth web client ID <input id="export-google-client" type="text" autocomplete="off" placeholder="…apps.googleusercontent.com">
    </label>
    <p>A website owner must configure this client for the current website. <a href="docs.html?page=exports">Setup and import instructions</a>.</p>
    </div>
    <p id="export-fidelity">
    </p>
    <p>
    <a href="docs.html?page=exports">Export support and limitations</a>
    </p>
    <p id="export-status" role="status" aria-live="polite">
    </p>
    <div id="export-result">
    </div>
    <footer>
    <button id="export-go">Download</button>
    <button id="export-cancel" hidden>Cancel export</button>
    </footer>`;
  document.body.append(dialog);
  const configuredClient =
    document.querySelector('meta[name="google-client-id"]')?.content || "";
  const $ = (id) => dialog.querySelector("#" + id),
    target = $("export-target"),
    go = $("export-go"),
    status = $("export-status");
  $("export-google-client").value = configuredClient;
  const targets = [
    { id: "html", label: "Rendered HTML" },
    ...exportTargets,
    { id: "native", label: "Original source file" },
    { id: "project", label: "Portable project (.sheets.json)" },
  ];
  for (const t of targets) {
    const option = document.createElement("option");
    option.value = t.id;
    option.textContent = t.label;
    target.append(option);
  }
  const contents = $("export-contents"), destination = $("export-destination");
  const shortener = new SheetShareClient();
  let returningFromSave = false, restoreWhenReady = false;
  const restoreKey = "sheets:export-after-publish";
  const preferenceIds = ["export-target", "export-contents", "export-destination", "export-qr", "export-qr-link", "export-long", "export-appearance", "export-values"];
  const forgetSave = () => { try { sessionStorage.removeItem(restoreKey); } catch {} };
  const qrLink = () => $("export-qr-link").value === "saved" ? getSavedLink() : knownShortLink(getLink()) || getSavedLink() || getLink();
  const qrAllowed = () => !["native", "project", "xlsx", "ods", "txt", "rtf"].includes(target.value) && !["hashbin"].includes(destination.value);
  const combination = () => {
    if ((target.value === "project" || destination.value === "hashbin") && getState().type === "org" && !getResult()?.inputsReady) return "Wait for verified Org inputs before saving a portable project.";
    if (destination.value === "hashbin") return target.value === "project" && contents.value === "project" ? "" : "HashBin saves an editable sheet. Choose Portable project format and Editable portable project contents, to save source, view, calculation mode and included inputs/pictures.";
    if (contents.value === "project" || target.value === "project") return contents.value === "project" && target.value === "project" && destination.value === "download" ? "" : "Portable projects need Portable project format, Editable portable project contents and Download file.";
    if (target.value === "native") return contents.value === "source" && destination.value === "download" ? "" : "Original source files need Source contents and Download file. Choose HTML or Word to include source in a formatted document.";
    if (["xlsx", "ods"].includes(target.value) && contents.value !== "rendered") return "Workbook formats export calculated tables. Choose calculated results, or a document format for source.";
    if (["print", "pages"].includes(destination.value) && target.value !== "html") return "Print and Pages use HTML. Choose Rendered HTML format.";
    if (destination.value === "google" && target.value !== "docx") return "Google Docs imports Word. Choose Word (.docx) format; Download file also supports manual Google Docs import.";
    return "";
  };
  let snapshot,
    controller,
    busy = false,
    ready = false;
  const identity = () =>
    `${JSON.stringify(getState())}:${getRevision()}:${preview.querySelector('[role="tab"][aria-selected="true"]')?.dataset.report || ""}`;
  const finish = () => {
    busy = false;
    for (const control of dialog.querySelectorAll("select,input, #export-shorten, #export-save")) control.disabled = false;
    go.disabled = !ready || !!combination();
    $("export-cancel").hidden = true;
  };
  function choice() {
    const id = target.value, dest = destination.value,
      book = ["xlsx", "ods"].includes(id);
    $("export-values-label").hidden = !book;
    $("export-google-settings").hidden = dest !== "google" || !!configuredClient;
    go.textContent = ({ print: "Print / Save as PDF", pages: "Open in Pages", google: "Create Google Doc", hashbin: "Save to HashBin" })[dest] || "Download";
    $("export-combination").textContent = combination();
    $("export-qr-label").hidden = !qrAllowed();
    $("export-qr-settings").hidden = !qrAllowed() || !$("export-qr").checked;
    const hasShort = !!getSavedLink() || !!knownShortLink(getLink());
    $("export-long-label").hidden = hasShort || $("export-qr-link").value === "saved";
    $("export-qr-help").textContent = $("export-qr-link").value === "saved"
      ? getSavedLink() ? "The QR reopens the saved sheet in Sheets, loading its content from HashBin / 256t." : "Save this sheet to HashBin first to embed its reload QR."
      : hasShort ? "A short reload link is ready for this sheet." : "Make a short URL before embedding the QR, or explicitly choose the full URL. Large codes may require a short URL.";
    $("export-appearance-label").hidden = !["html", "docx"].includes(id);
    const text = book
      ? "Working formulas: Org arithmetic, cell/range references, named inputs, comparisons, IF and numeric aggregates. Unsupported formulas block export. Excel floating-point precision and dependency recalculation can differ. Select values-only explicitly to flatten calculations."
      : id === "html"
        ? "Static HTML preserves math and diagrams. Included pictures are embedded; linked pictures still need the network. Pages opens with scripts disabled."
        : id === "docx"
          ? "Editable prose and tables. Equations become readable text, diagrams become pictures, and linked images use descriptions. Google receives the document only when you choose Create Google Doc."
          : id === "md"
            ? "Evaluated GFM Markdown. Equations use dollar delimiters; diagrams become descriptions. Complex tables and styling may be flattened."
            : "Evaluated text; pictures and equations use descriptions. Formatting and interactive controls are flattened.";
    $("export-fidelity").textContent = text;
    if (dest === "google" && !combination()) {
      go.disabled = true;
      status.textContent = "Loading Google sign-in…";
      loadGoogleIdentity()
        .then(() => {
          if (destination.value === "google" && !busy) {
            go.disabled = !ready || !!combination();
            status.textContent = "";
          }
        })
        .catch((e) => {
          status.textContent = e.message;
        });
    } else {
      go.disabled = !ready || !!combination();
      status.textContent = "";
    }
  }
  for (const control of [target, contents, destination, $("export-qr"), $("export-qr-link")]) control.onchange = choice;
  $("export-shorten").onclick = async () => {
    const link = getLink();
    $("export-shorten").disabled = true;
    status.textContent = "Making short URL…";
    const result = await shortener.shorten({ long: link, fallback: link });
    $("export-shorten").disabled = false;
    if (!result || !dialog.open) return;
    if (link !== getLink()) { status.textContent = "Sheet changed. Make a short URL for the current sheet."; return; }
    if (result.shortened) { choice(); }
    else status.textContent = result.error.message;
  };
  function save() {
    returningFromSave = true;
    // Only UI choices are stored here. The SDK owns document restoration.
    try { sessionStorage.setItem(restoreKey, JSON.stringify(Object.fromEntries(preferenceIds.map(id => [id, $(id).type === "checkbox" ? $(id).checked : $(id).value])))); } catch {}
    dialog.close();
    saveToHashBin();
  }
  $("export-save").onclick = save;
  function open(options = {}) {
    if (options.target) target.value = options.target;
    if (options.destination) destination.value = options.destination;
    if (options.contents) contents.value = options.contents;
    closeDrawer();
    try {
      snapshot = captureSnapshot(
        preview,
        getState(),
        getResult(),
        getRevision(),
      );
      status.textContent = "";
      $("export-result").replaceChildren();
      choice();
      dialog.showModal();
    } catch (e) {
      status.textContent = e.message;
      dialog.showModal();
    }
  }
  button.onclick = () => open();
  $("export-cancel").onclick = () => controller?.abort();
  dialog.addEventListener("close", () => { controller?.abort(); shortener.cancel(); });
  go.onclick = async () => {
    if (busy || !ready || combination()) return;
    if (destination.value === "hashbin") { save(); return; }
    controller?.abort();
    controller = new AbortController();
    const signal = AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(destination.value === "google" ? 300000 : 30000),
      ]),
      before = identity();
    busy = true;
    go.disabled = true;
    for (const control of dialog.querySelectorAll("select,input, #export-shorten, #export-save")) control.disabled = true;
    $("export-cancel").hidden = false;
    status.textContent = "Preparing export…";
    $("export-result").replaceChildren();
    let printFrame;
    try {
      const state = getState(), result = getResult(), id = target.value, dest = destination.value;
      const check = () => {
        signal.throwIfAborted();
        if (!ready || before !== identity())
          throw Error(
            "Document or selected report changed. Export the new results again.",
          );
      };
      if (id === "native" || id === "project") {
        check();
        downloadFile(id === "native" ? sourceDownload(state.src, state.type || state.format) : projectDownload(state, result.inputPayloads));
        status.textContent = "File downloaded.";
        return;
      }
      const useQR = qrAllowed() && $("export-qr").checked;
      if (useQR && $("export-qr-link").value === "saved" && !getSavedLink()) throw Error("Save this sheet to HashBin first.");
      if (useQR && !getSavedLink() && !knownShortLink(getLink()) && !$("export-long").checked) throw Error("Make a short URL or save to HashBin for the QR, or choose Use the full sheet URL.");
      // Request consent before asynchronous media work while the click gesture is active.
      const tokenPromise = dest === "google" ? googleToken($("export-google-client").value.trim(), { signal }) : null;
      // Attach rejection immediately while composing the export.
      tokenPromise?.catch(() => {});
      const root = await exportContents(preview, state, { contents: contents.value, qrURL: useQR ? qrLink() : null, signal });
      check();
      snapshot = captureSnapshot(root, state, result, getRevision(), { appearance: $("export-appearance").checked ? "screen" : "plain" });
      if (dest === "print") {
        document.querySelectorAll(".export-print-frame").forEach(frame => frame.remove());
        const frame = printFrame = document.createElement("iframe");
        frame.title = "Print export";
        frame.className = "export-print-frame";
        document.body.append(frame);
        const loaded = new Promise(resolve => frame.onload = resolve);
        frame.srcdoc = snapshot.html;
        await loaded;
        await Promise.all([...frame.contentDocument.images].map(img => img.decode().catch(() => {})));
        await frame.contentDocument.fonts.ready;
        check();
        frame.contentWindow.addEventListener("afterprint", () => frame.remove(), { once: true });
        frame.contentWindow.print();
        status.textContent = "Print dialog opened. Choose your printer or Save as PDF.";
        return;
      }
      if (dest === "pages") {
        check();
        const href = pagesLink(snapshot);
        const tab = window.open(href, "_blank", "noopener,noreferrer");
        status.textContent =
          "Pages link prepared. If a new tab did not open, use the link below.";
        const a = document.createElement("a");
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "Open exported page in Pages";
        $("export-result").append(a);
        return;
      }
      if (id === "html") {
        check();
        downloadFile({
          name: fileName(snapshot.title, ".html"),
          blob: new Blob([snapshot.html], { type: "text/html;charset=utf-8" }),
        });
        status.textContent = "HTML downloaded.";
        return;
      }
      const token = tokenPromise ? await tokenPromise : null;
      check();
      let prepared = snapshot;
      if (id === "docx")
        prepared = await prepareWordMedia(snapshot, signal);
      const file = await exportSnapshot(
        prepared,
        id,
        { signal, valuesOnly: $("export-values").checked },
      );
      check();
      if (dest === "google") {
        status.textContent = "Creating Google Doc…";
        const href = await uploadGoogleDoc(file.blob, snapshot.title, token, {
          signal,
        });
        // Show a successful external creation even if the source changed during upload.
        const a = document.createElement("a");
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "Open exported Google Doc";
        $("export-result").append(a);
        status.textContent = "Google Doc created from the captured results.";
      } else {
        downloadFile(file);
        status.textContent = "Export downloaded.";
      }
      if (file.diagnostics.length) {
        const p = document.createElement("p");
        p.textContent = [...new Set(file.diagnostics)].join(" ");
        $("export-result").append(p);
      }
    } catch (e) {
      printFrame?.remove();
      status.textContent = signal.aborted
        ? "Export cancelled or timed out. If an upload had started, check Drive before retrying."
        : e.message;
    } finally {
      finish();
    }
  };
  return {
    get awaitingSave() { return returningFromSave; },
    open,
    saved() {
      if (!returningFromSave) return;
      returningFromSave = false;
      forgetSave();
      $("export-qr-link").value = "saved";
      $("export-qr").checked = true;
      if (destination.value === "hashbin") { destination.value = "print"; target.value = "html"; contents.value = "rendered"; }
      open();
    },
    saveClosed() { if (returningFromSave) { returningFromSave = false; forgetSave(); open(); } },
    restoreAfterPublish(cid) {
      try {
        const preferences = JSON.parse(sessionStorage.getItem(restoreKey) || "null");
        forgetSave();
        if (!preferences) return;
        for (const id of preferenceIds) {
          const control = $(id), value = preferences[id];
          if (control.type === "checkbox" && typeof value === "boolean") control.checked = value;
          else if ([...control.options || []].some(option => option.value === value)) control.value = value;
        }
        if (cid) {
          $("export-qr").checked = true;
          $("export-qr-link").value = "saved";
          if (destination.value === "hashbin") { destination.value = "print"; target.value = "html"; contents.value = "rendered"; }
        }
        restoreWhenReady = true;
      } catch { forgetSave(); }
    },
    update(value) {
      ready = value;
      button.disabled = !value;
      if (!value) {
        controller?.abort();
        go.disabled = true;
      } else if (!busy) {
        go.disabled = !!combination();
        if (restoreWhenReady) { restoreWhenReady = false; open(); }
      }
    },
  };
}
