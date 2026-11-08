import { catalog, detect, loadFormat } from "./formats/registry.js";
import {
  readURL,
  writeURL,
  readOverrides,
  SOURCE_FRAGMENT_THRESHOLD,
} from "./url-state.js";
import {
  profiles,
  CALCA_SCOPES,
  ASCIIMATH_FORMULAS,
  ASCIIMATH_PROSE,
  validateProfile,
  resolveDocument,
} from "./compatibility-profiles.js";
import { RenderScheduler } from "./render-scheduler.js";
import { setPreview, updatePreview, sanitize } from "./sanitize.js";
import { applyControlEdit, controlText, shiftControls } from "./controls.js";
import { setupViews } from "./view-modes.js";
import { HashBinDocuments, HashBinStore } from "./hashbin.js";
import { HashBinPanel } from "./hashbin-panel.js";
import {config,urlState,type,toDocument} from './fragment-config.js';
import {LocalDrafts,createStorage,compactShell,createShell,mountMobileTabs,createShareDialog,createQrDialog} from '../vendor/fragment-kit-v0.3.5/src/index.js';
import { loadExample } from "./examples.js";
import { setupOffline } from "./offline.js";
import { acePath } from "./ace-path.js";
import { loadEditorMode } from "./editor-modes.js";
import { sourceTitle, sourceDownload, projectDownload } from "./downloads.js";
import { parseProjectFile } from "./project-state.js";
import { verifyInputSnapshot, SNAPSHOT_LIMITS } from "./input-snapshot.js";
import { htmlDownload, downloadFile } from "./export-document.js";
import { verifyAttachments, validateAttachments } from "./attachments.js";
import { resolvePictures, resolveHostedPictures } from "./pictures.js";
import { setupInsertion } from "./insert-content.js";
import { optionalStorage } from "./util.js";
const byId=id=>document.getElementById(id);
const oldHeader=document.querySelector('.site-header'),brand=oldHeader.querySelector('.brand'),shareButton=byId('share');
const shell=createShell({config});shell.header.querySelector('.fk-brand').replaceChildren(...brand.childNodes);
shell.header.querySelector('.fk-more').id='more-toggle';
const renderButton=document.createElement('button');renderButton.id='render-now';renderButton.textContent='Render once';renderButton.hidden=true;shell.drawer.body.append(renderButton);
const qrButton=document.createElement('button');qrButton.id='qr';qrButton.textContent='QR';
shareButton.textContent='Share';shell.toolbar.append(shareButton,qrButton,document.querySelector('.format-control'));
shell.drawer.body.append(document.querySelector('.view-toggle'),byId('download-menu'),byId('hashbin-panel'));document.querySelector('.view-toggle').hidden=true;
oldHeader.remove();document.querySelector('.toolbar').remove();
byId('render-status').setAttribute('data-fk-primary-status','');compactShell({header:shell.header,status:document.querySelector('.statusbar')});
for(const id of ['hashbin-cid','hashbin-load','hashbin-save','hashbin-status','hashbin-dialog','share-dialog','offline-dialog'])byId(id)?.remove();
byId('hashbin-panel').hidden=false;byId('hashbin-panel-close').remove();
const drafts=new LocalDrafts({storage:createStorage({prefix:config.storagePrefix}),key:'draft',serialize:value=>JSON.stringify(toDocument(value)),parse:text=>type.normalize(JSON.parse(text))});
let autoRun=true,mobileTabs,qrSave=false,workspaceReady=false;
const elements = new Map(
  [...document.querySelectorAll("[id]")].map((element) => [
    element.id,
    element,
  ]),
);
const $ = (id) => elements.get(id),
  format = $("format"),
  preview = $("preview");
for (const item of catalog) {
  const option = document.createElement("option");
  option.value = item.id;
  option.textContent = item.label;
  format.append(option);
}
let persistTimer;
let navigationURL = location.href;
let editor,
  setting = false,
  sourceRevision = 0,
  currentResult = null,
  currentCID = null,
  currentType = "gfm",
  currentProfile,
  currentInputSnapshot,
  currentAttachments,
  projectOpenController,
  renderController,
  currentControls = [],
  controlGesture = null,
  controlEditing = false;
if (globalThis.ace) {
  ace.config.set("basePath", acePath);
  editor = ace.edit("editor");
  editor.setOptions({
    fontSize: 14,
    showPrintMargin: false,
    wrap: true,
    useWorker: false,
    tabSize: 2,
    scrollPastEnd: 0.5,
  });
  editor.renderer.setPadding(20);
  editor.renderer.setScrollMargin(18, 18, 18, 18);
  editor.textInput.getElement().setAttribute("aria-label", "Document source");
  $("source-fallback").hidden = true;
} else {
  $("editor").hidden = true;
  $("source-fallback").style.display = "block";
}
document.body.append($('project-file'));
const getSource = () =>
  editor ? editor.getValue() : $("source-fallback").value;
const setSource = (src) => {
  setting = true;
  if (editor) editor.setValue(src, -1);
  else $("source-fallback").value = src;
  setting = false;
};
const view = setupViews({
  workspace: $("workspace"),
  divider: $("divider"),
  onChange: mode => {mobileTabs?.select(mode==='split'?'split':mode==='preview'?1:0);if(!setting)saveDraft(true);persist();},
  onResize: () => editor?.resize(),
});
function applyView(mode,notify=true){view.setView(mode,notify);mobileTabs?.select(mode==='split'?'split':mode==='preview'?1:0);}
for(const button of document.querySelectorAll('button[data-view]')){const action=button.onclick;button.onclick=event=>{shell.drawer.dialog.close();const result=action(event);mobileTabs?.select(button.dataset.view==='split'?'split':button.dataset.view==='preview'?1:0);return result;};}
const selectedType = (src = getSource()) =>
  format.value === "auto"
    ? profiles.find((item) => item.id === currentProfile)?.format || detect(src)
    : format.value;
function updateProfileControls() {
  format.disabled = !!currentInputSnapshot;
  $("project-controls").hidden = !currentInputSnapshot;
  const type = selectedType(),
    ascii = type === "asciimath",
    org = type === "org";
  $("profile-controls").hidden = !profiles.some((item) => item.format === type);
  $("profile-label").textContent = org
    ? "Org calculation"
    : ascii
      ? "AsciiMath mode"
      : "Calca blocks";
  const choices = [
    { id: "", label: ascii ? "Auto" : "Legacy" },
    ...profiles.filter((item) => item.format === type),
  ];
  $("profile").replaceChildren(
    ...choices.map(({ id, label }) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = label;
      return option;
    }),
  );
  $("profile").value = currentProfile || "";
  $("profile-help").textContent = org
    ? currentProfile
      ? "Columns calculate row by row before protected field formulas, using Emacs target order. Links and saved documents preserve this mode; source files contain text only."
      : "Legacy applies assignments in source order. Choose Emacs order explicitly to migrate; the source stays unchanged."
    : ascii
      ? currentProfile === ASCIIMATH_FORMULAS
        ? "Each nonempty line is a formula, even when it resembles Markdown. Links and saved documents preserve this mode; source files contain text only."
        : currentProfile === ASCIIMATH_PROSE
          ? "Prose stays prose. Mark formulas with dollar delimiters or asciimath fences. Links and saved documents preserve this mode; source files contain text only."
          : "Auto chooses formula lines or mixed prose from the document's structure. Select an explicit mode to keep that choice while editing."
      : currentProfile === CALCA_SCOPES
        ? "Definitions belong to headings and descendants; repeated definitions become constraints. Source files contain text only; reselect this mode when reusing them."
        : currentProfile
          ? "Calca fences, indented code, and standalone arrows calculate. Source files contain text only; reselect this mode when reusing them."
          : "Legacy evaluates every code fence. Structured blocks keep other languages, formulas, and diagrams literal.";
}
const snapshot = () => ({
  src: getSource(),
  type: selectedType(),
  format: format.value,
  view: view.getView(),
  ...(currentProfile ? { profile: currentProfile } : {}),
  ...(currentInputSnapshot ? { inputSnapshot: currentInputSnapshot } : {}),
  ...(currentAttachments ? { attachments: currentAttachments.filter(entry => getSource().includes("sheets-asset:" + entry.id)) } : {}),
});
function saveDraft(edit=false){drafts.attempt(snapshot(),edit);}
const fingerprint = () => JSON.stringify(snapshot());
function updateDownloadOptions(ready = false) {
  const extension =
    catalog.find((item) => item.id === selectedType())?.extensions[0] || ".txt";
  $("download-source").textContent = `Source (${extension})`;
  $("download-html").disabled = !ready;
  $("print-preview").disabled = !ready;
  $("download-project").hidden = selectedType() !== "org" && !currentAttachments;
  $("project-download-help").hidden = selectedType() !== "org" && !currentAttachments;
  $("download-project").disabled = !ready || (selectedType() === "org" && (!currentResult?.inputsReady || !currentResult?.inputPayloads));
  preview.querySelectorAll("[data-action=copy-org]").forEach((button) => {
    button.disabled = !ready;
  });
}
function persist() {
  clearTimeout(persistTimer);
  $("source-size").textContent = `${getSource().length.toLocaleString()} characters`;
  let url;
  try {
    url = writeURL(location.href, { ...snapshot(), cid: currentCID, run:autoRun });
    if (currentInputSnapshot || currentAttachments) readURL(url);
  } catch (error) {
    $("url-notice").textContent = `Current edits cannot be shared: ${error.message} Download source before reloading.`;
    $("share").disabled = true;
    return null;
  }
  $("share").disabled = false;
  history.replaceState(null, "", url);
  navigationURL = url;
  const backup = currentInputSnapshot || currentAttachments ? "Portable project" : "Source";
  $("url-notice").textContent =
    url.split("#", 1)[0].length > SOURCE_FRAGMENT_THRESHOLD
      ? `Long address · remove extra query parameters; use Download → ${backup} for a separate copy.`
      : url.length > SOURCE_FRAGMENT_THRESHOLD
        ? `Long link · some apps may truncate it. Use Download → ${backup} or save to HashBin for a separate copy.`
        : "";
  $("source-size").textContent =
    `${getSource().length.toLocaleString()} characters`;
  return url;
}
const scheduler = new RenderScheduler({
  async render(src, { signal }) {
    renderController?.abort();
    renderController = new AbortController();
    const combined = AbortSignal.any([signal, renderController.signal]);
    const profile = currentProfile;
    const inputSnapshot = currentInputSnapshot;
    const attachments = snapshot().attachments;
    currentType = selectedType(src);
    validateProfile(profile, currentType);
    updateProfileControls();
    const meta = catalog.find((f) => f.id === currentType);
    $("detected").textContent =
      format.value === "auto" ? `→ ${meta.label}` : "";
    $("format-docs").href = `docs.html?page=formats/${currentType}`;
    const plugin = await loadFormat(currentType);
    combined.throwIfAborted();
    if (editor) {
      const mode = await loadEditorMode(ace, plugin.aceMode);
      combined.throwIfAborted();
      editor.session.setMode(mode);
    }
    const result = await plugin.render(src, {
        signal: combined,
        profile,
        inputSnapshot,
      });
    return { ...result, html: await resolvePictures(result.html, attachments, combined), signal: combined };
  },
  async onResult(result) {
    currentResult = result;
    currentControls = result.controls || [];
    // Keep a control the reader is dragging or typing in alive across renders.
    if (preview.querySelector("[data-control]"))
      updatePreview(
        preview,
        result.html,
        (input) =>
          input.dataset.control === controlGesture ||
          (input === document.activeElement && input.type === "text"),
      );
    else setPreview(preview, result.html);
    await resolveHostedPictures(preview, result.signal);
    result.signal.throwIfAborted();
    editor?.session.setAnnotations(
      (result.diagnostics || []).map((d) => ({
        row: Math.max(0, d.line - 1),
        column: d.column ?? 0,
        text: d.message,
        type: d.severity || "error",
      })),
    );
    if (result.mermaid?.length) {
      const { renderDiagrams } = await import("./formats/gfm/markdown.js");
      await renderDiagrams(preview, result.mermaid, {
        signal: result.signal,
        sanitize,
      });
    }
  },
  onStatus(status, detail) {
    updateDownloadOptions(status === "done");
    const busy = status === "rendering";
    preview.setAttribute("aria-busy", busy);
    $("cancel-render").hidden = !busy;
    if (status === "error") {
      $("render-status").textContent = `Error: ${detail.message}`;
      setPreview(preview, `<p class="error"></p>`);
      preview.firstElementChild.textContent = detail.message;
    } else
      $("render-status").textContent =
        status === "waiting"
          ? "Waiting for edits…"
          : busy
            ? "Rendering…"
            : detail?.length
              ? `${detail.length} diagnostic${detail.length === 1 ? "" : "s"} · ${catalog.find((f) => f.id === currentType)?.label}`
              : `Ready · ${catalog.find((f) => f.id === currentType)?.label}`;
    if (status === "done") {
      // Browsers throttle history updates; a dragged slider renders many times.
      if (controlGesture) {
        clearTimeout(persistTimer);
        persistTimer = setTimeout(persist, 300);
      } else persist();
    }
  },
});
setupInsertion({
  container: shell.toolbar, sourcePane: $('source-pane'), getFormat: selectedType, fingerprint,
  capture: () => editor ? editor.getSelectionRange().clone() : { start: $('source-fallback').selectionStart, end: $('source-fallback').selectionEnd },
  insert(text, position, additions = []) {
    const attachments = additions.length ? [...(currentAttachments || []), ...additions.filter(entry => !currentAttachments?.some(item => item.id === entry.id))] : currentAttachments;
    const source = getSource();
    const start = editor ? editor.session.doc.positionToIndex(position.start) : position.start;
    const end = editor ? editor.session.doc.positionToIndex(position.end) : position.end;
    const next = source.slice(0,start) + text + source.slice(end);
    const included = attachments?.filter(entry => next.includes("sheets-asset:" + entry.id));
    if (included) validateAttachments(included);
    readURL(writeURL(location.href, { ...snapshot(), cid: null, format: selectedType(), src: next, attachments: included }));
    currentAttachments = attachments;
    if (additions.length && format.value === "auto") format.value = selectedType();
    if (editor) { editor.session.markUndoGroup(); editor.session.replace(position, text); editor.session.markUndoGroup(); editor.focus(); }
    else { $('source-fallback').setRangeText(text, position.start, position.end, 'end'); changed(); }
  },
});
const clientId = document.querySelector("meta[name=hashbin-client-id]").content;
const store = new HashBinStore({
  clientId,
  redirectUri: new URL("index.html", location.href).href,
  storage: optionalStorage("localStorage"),
  transactionStorage: optionalStorage("sessionStorage"),
});
const panel = new HashBinPanel({
  store,
  container: $('hashbin-panel'),
  getSnapshot: snapshot,
  getFingerprint: fingerprint,
  onLoad(doc, cid, overrides = {}) {
    const resolved = resolveDocument(doc, overrides);
    sourceRevision++;drafts.opened();
    currentCID = cid;
    setSource(doc.src);
    format.value = resolved.format;
    currentProfile = resolved.profile;
    currentInputSnapshot = resolved.inputSnapshot;
    currentAttachments = resolved.attachments;
    applyView(resolved.view, false);
    updateProfileControls();
    persist();
    if(autoRun)scheduler.schedule(getSource(), {}, true);
  },
  onSaved(cid) {
    currentCID = cid;
    persist();
    if(qrSave){qrSave=false;panel.dialog.close();qr.open(HashBinDocuments.link(location.href,cid));}
  },
});
panel.dialog.addEventListener('close',()=>{qrSave=false;});
for(const element of $('hashbin-panel').querySelectorAll('[id]'))elements.set(element.id,element);
$("hashbin-save").disabled = false;
$("hashbin-config").textContent = clientId
  ? "Public documents load without signing in."
  : "Saving needs a registered HashBin client ID. Public CIDs can still be loaded.";
function changed() {
  if (setting) return;
  saveDraft(true);sourceRevision++;
  projectOpenController?.abort();
  currentCID = null;
  panel.cancelLoad();
  renderController?.abort();
  if(autoRun)scheduler.schedule(getSource(), {}, controlEditing);else{scheduler.cancel();$('render-status').textContent='Edited — press Render.';}
  $("source-size").textContent =
    `${getSource().length.toLocaleString()} characters`;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(persist, 300);
}
if (editor) editor.session.on("change", changed);
else $("source-fallback").addEventListener("input", changed);
format.onchange = () => {
  if (currentAttachments && !["org", "gfm"].includes(selectedType())) {
    if (snapshot().attachments.length) { format.value = currentType; $("render-status").textContent = "Pictures require Org or Markdown. Remove included pictures before switching formats."; return; }
    currentAttachments = undefined;
  }
  currentProfile = undefined;
  updateProfileControls();
  changed();
};
$("profile").onchange = () => {
  currentProfile = $("profile").value || undefined;
  if (currentProfile)
    format.value = profiles.find((item) => item.id === currentProfile).format;
  updateProfileControls();
  changed();
};
/** Write a preview control's value into the source; `live` gestures share one undo step. */
function writeControl(input, live) {
  const id = input.dataset.control,
    control = currentControls.find((item) => item.id === id),
    error = [...preview.querySelectorAll("[data-control-error]")].find(
      (node) => node.dataset.controlError === id,
    );
  if (!control) return;
  let text, next;
  try {
    text = controlText(
      control,
      input.type === "checkbox" ? input.checked : input.value,
    );
    if (text !== control.edit.text)
      next = applyControlEdit(getSource(), control.edit, text);
  } catch (problem) {
    input.setAttribute("aria-invalid", "true");
    if (error) error.textContent = problem.message;
    return;
  }
  input.removeAttribute("aria-invalid");
  if (error) error.textContent = "";
  const output = [...preview.querySelectorAll("[data-control-output]")].find(
    (node) => node.dataset.controlOutput === id,
  );
  if (output) output.textContent = text;
  const continuing = controlGesture === id;
  controlGesture = live ? id : null;
  if (next === undefined) return;
  controlEditing = true;
  try {
    if (editor) {
      const { Range } = ace.require("ace/range"),
        session = editor.session,
        { line, column, length } = control.edit;
      if (continuing) session.mergeUndoDeltas = true;
      else session.markUndoGroup();
      session.replace(
        new Range(line - 1, column, line - 1, column + length),
        text,
      );
      if (!live) session.markUndoGroup();
    } else {
      $("source-fallback").value = next;
      changed();
    }
  } finally {
    controlEditing = false;
  }
  currentControls = shiftControls(currentControls, control.edit, text);
}
preview.addEventListener("input", (event) => {
  const input = event.target.closest?.("input[data-control]");
  if (input && input.type !== "text") writeControl(input, true);
});
preview.addEventListener("change", (event) => {
  const input = event.target.closest?.("input[data-control]");
  if (!input) return;
  if (input.type === "text") writeControl(input, false);
  else if (controlGesture === input.dataset.control) {
    controlGesture = null;
    editor?.session.markUndoGroup();
    persist();
  }
});
$("cancel-render").onclick = () => {
  updateDownloadOptions(false);
  scheduler.cancel();
  renderController?.abort();
  $("render-status").textContent =
    "Cancelled · edit the source to render again";
  $("cancel-render").hidden = true;
  preview.setAttribute("aria-busy", "false");
};
preview.addEventListener("keydown", (event) => {
  const field = event.target.closest?.("input[data-control][type=text]");
  if (field && event.key === "Enter") {
    event.preventDefault();
    writeControl(field, false);
    return;
  }
  const area = event.target.closest(".org-table-scroll, .chart-scroll");
  if (
    event.target !== area ||
    !["ArrowLeft", "ArrowRight"].includes(event.key) ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    area.scrollWidth <= area.clientWidth
  )
    return;
  // Native horizontal keyboard scrolling varies across browser engines.
  event.preventDefault();
  area.scrollLeft += event.key === "ArrowRight" ? 40 : -40;
});
preview.addEventListener("click", async (event) => {
  const reference = event.target.closest('a[href^="#"]');
  if (reference) {
    // The fragment can hold a CID or source. References scroll within the preview
    // without replacing any part of the document address.
    event.preventDefault();
    try {
      const id = decodeURIComponent(reference.getAttribute("href").slice(1));
      preview
        .querySelector(`#${CSS.escape(id)}`)
        ?.scrollIntoView({ block: "start" });
    } catch {
      /* Malformed references leave the document address intact. */
    }
    return;
  }
  const report = event.target.closest("[data-report]");
  if (report) {
    preview
      .querySelectorAll("[role=tab]")
      .forEach((b) => b.setAttribute("aria-selected", b === report));
    preview
      .querySelectorAll("[role=tabpanel]")
      .forEach((p) => (p.hidden = p.id !== `report-${report.dataset.report}`));
  }
  if (event.target.closest("[data-action=copy-org]"))
    try {
      await navigator.clipboard.writeText(currentResult.recalculatedSource);
      $("render-status").textContent = "Recalculated Org source copied.";
    } catch {
      $("render-status").textContent =
        "Clipboard unavailable. Allow clipboard access and retry.";
    }
});
$("download-source").onclick = () => {
  downloadFile(sourceDownload(getSource(), selectedType()));
  $("download-menu").open = false;
};
$("download-project").onclick = () => {
  if ($("download-project").disabled) return;
  try {
    downloadFile(projectDownload(snapshot(), currentResult.inputPayloads));
    $("download-menu").open = false;
  } catch (error) {
    $("project-status").hidden = false;
    $("project-status").textContent = error.message;
  }
};
$("open-project").onclick = () => $("project-file").click();
$("project-file").onchange = async () => {
  const file = $("project-file").files[0];
  $("project-file").value = "";
  if (!file) return;
  projectOpenController?.abort();
  const controller = projectOpenController = new AbortController(), before = fingerprint();
  $("project-status").hidden = false;
  $("project-status").textContent = "Checking project snapshot…";
  try {
    if (file.size > SNAPSHOT_LIMITS.document) throw new Error("Portable project JSON exceeds 5 MiB.");
    const bytes = await file.slice(0, SNAPSHOT_LIMITS.document + 1).arrayBuffer();
    controller.signal.throwIfAborted();
    const doc = parseProjectFile(new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes));
    if (doc.inputSnapshot) await verifyInputSnapshot(doc.inputSnapshot, doc.src, controller.signal);
    await verifyAttachments(doc.attachments, controller.signal);
    controller.signal.throwIfAborted();
    if (before !== fingerprint()) throw new Error("Document changed while opening the snapshot; choose the file again.");
    const url = writeURL(location.href, { ...doc, format: doc.type });
    readURL(url); // Reject a file that cannot survive the editor's URL round-trip.
    panel.cancelLoad(); scheduler.cancel(); renderController?.abort();
    sourceRevision++;
    history.pushState(null, "", url);
    currentInputSnapshot = doc.inputSnapshot;
    currentAttachments = doc.attachments;
    currentCID = null; currentProfile = doc.profile; format.value = doc.type;
    setSource(doc.src); applyView(doc.view, false);
    updateProfileControls(); persist(); if(autoRun)scheduler.schedule(getSource(), {}, true);
    $("project-status").textContent = "Project snapshot opened. Back restores the previous document.";
    $("download-menu").open = false;
  } catch (error) {
    $("project-status").textContent = controller.signal.aborted ? "Snapshot opening cancelled because the document changed." : error.message;
  } finally {
    if (projectOpenController === controller) projectOpenController = null;
  }
};
$("project-detach").onclick = () => {
  history.pushState(null, "", location.href);
  currentInputSnapshot = undefined;
  updateProfileControls(); changed();
  persist();
};
$("download-html").onclick = () => {
  if ($("download-html").disabled) return;
  const title =
    preview.querySelector("h1")?.textContent || sourceTitle(getSource());
  downloadFile(htmlDownload(preview, { title }));
  $("download-menu").open = false;
};
$("print-preview").onclick = () => {
  if ($("print-preview").disabled) return;
  $("download-menu").open = false;
  window.print();
};
document.addEventListener("click", (event) => {
  if (!$("download-menu").contains(event.target))
    $("download-menu").open = false;
});
$("download-menu").addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $("download-menu").open) {
    event.preventDefault();event.stopPropagation();$("download-menu").open = false;
    $("download-menu").querySelector("summary").focus();
  }
});
for(const id of ['download-source','download-project','open-project','download-html','print-preview']){const button=$(id),action=button.onclick;button.onclick=event=>{shell.drawer.dialog.close();return action(event);};}
const share=createShareDialog({urlState,getSnapshot:snapshot,onSave:()=>panel.openSave()});
shareButton.onclick=()=>{share.open();byId('share-run').checked=autoRun;byId('share-run').dispatchEvent(new Event('change'));};
const qr=createQrDialog({config,urlState,onLoad:outcome=>openLinked(outcome.kind==='cid'?HashBinDocuments.link(location.href,outcome.cid):outcome.href),onSave:()=>{qrSave=true;qr.dialog.close();return panel.openSave();}});
qrButton.onclick=()=>qr.open(urlState.build(snapshot(),{run:autoRun}).href);
renderButton.onclick=()=>scheduler.schedule(getSource(),{},true);
mobileTabs=mountMobileTabs({desktop:true,container:document.querySelector('.fk-toolbar'),panels:[{label:'Code',panel:$('source-pane')},{label:'Preview',panel:$('preview-pane')}],onChange:index=>{const next=index===-1?'split':index===1?'preview':'source';if(next!==view.getView())view.setView(next,workspaceReady);editor?.resize();}});
mobileTabs.select(view.getView()==='split'?'split':view.getView()==='preview'?1:0);
drafts.mount(shell.drawer.body,async doc=>{
 const checked=type.normalize(doc),state=checked.sheets,revision=sourceRevision;if(state.inputSnapshot)await verifyInputSnapshot(state.inputSnapshot,checked.src);await verifyAttachments(state.attachments);if(revision!==sourceRevision)throw Error('Document changed while checking this draft. Resume it again.');panel.cancelLoad();scheduler.cancel();renderController?.abort();sourceRevision++;
 currentCID=null;currentProfile=state.profile;currentInputSnapshot=state.inputSnapshot;currentAttachments=state.attachments;format.value=state.format;setSource(checked.src);setting=true;applyView(state.view,false);setting=false;
 updateProfileControls();persist();if(autoRun)scheduler.schedule(getSource(),{},true);
},doc=>doc.src);
function openLinked(href){panel.cancelLoad();scheduler.cancel();renderController?.abort();const incoming=new URL(href),local=new URL(location.href);local.search=incoming.search;local.hash=incoming.hash;history.pushState(null,'',local);return restore();}
$("commit").textContent = $("commit").textContent.startsWith("__")
  ? "local"
  : $("commit").textContent;
const starter =
  "# Notes that do the math\n\nA sheet is a small document with a little more power. Write on the left; see the result on the right.\n\n## Start with an idea\n\n| Item | Quantity | Unit cost |\n| :--- | ---: | ---: |\n| Notebooks | 12 | $4 |\n| Pencils | 24 | $1 |\n| Good ideas | ∞ | Free |\n\nThe area of a circle is $A = \\pi r^2$.\n\n> [!TIP]\n> Choose a calculation format above to turn expressions into answers. Visit the **[gallery](gallery.html)** for examples in all nine formats.\n\n- [x] Write something useful\n- [ ] Make it calculate\n- [ ] Share the link\n";
async function restore() {
  projectOpenController?.abort();
  navigationURL = location.href;
  updateDownloadOptions(false);
  const revision = ++sourceRevision;drafts.opened();autoRun=new URL(location.href).searchParams.get('run')!=='0';renderButton.hidden=autoRun;
  try {
    // A redirect save returns here; its snapshot restores the document either way.
    const published = await store.published(location.hash);
    if (revision !== sourceRevision) return;
    if (published) {
      $("hashbin-panel").hidden = false;shell.drawer.open();
      $("hashbin-status").textContent = published.error || "Saved to HashBin.";
      history.replaceState(null, "", location.pathname + location.search);
    }
    if (published?.snapshot) {
      const doc = published.snapshot;
      setSource(doc.src);
      format.value = doc.format || doc.type || "auto";
      currentProfile = validateProfile(doc.profile, format.value);
      currentInputSnapshot = doc.inputSnapshot;
      currentAttachments = doc.attachments;
      applyView(doc.view, false);
      updateProfileControls();
      currentCID = published.cid || null;
      persist();
      if(autoRun)scheduler.schedule(getSource(), {}, true);
      return;
    }
    const state = readURL(location.href);
    format.value = state.format;
    currentProfile = state.profile;
    currentInputSnapshot = state.inputSnapshot;
    currentAttachments = state.attachments;
    applyView(state.kind==='empty'&&!new URL(location.href).searchParams.has('view')&&matchMedia('(max-width:767px)').matches?'source':state.view, false);
    if (state.kind === "hashbin") {
      await panel.load(state.cid, readOverrides(location.href));
      return;
    }
    if (state.kind === "example") {
      const example = await loadExample(state.example);
      if (revision !== sourceRevision) return;
      setSource(example.src);
      currentAttachments = example.attachments;
      if (state.format === "auto" && !state.profile)
        format.value = example.format;
      if (!state.profile)
        currentProfile =
          format.value === example.format
            ? validateProfile(example.profile, format.value)
            : undefined;
    } else setSource(state.src ?? starter);
    updateProfileControls();
    currentCID = null;
    persist();
    if(autoRun)scheduler.schedule(getSource(), {}, true);
  } catch (error) {
    if (revision === sourceRevision) {
      $("render-status").textContent = error.message;$("hashbin-status").textContent=error.message;
      preview.textContent = error.message;
    }
  }
}
// Document anchors (footnotes and Quarto figures) do not reload interpreters.
function navigateFromURL() {
  if(location.hash&&preview.querySelector('a[href="'+CSS.escape(location.hash)+'"]')&&!location.hash.startsWith('#src=')&&!location.hash.startsWith('#project=')&&!HashBinDocuments.cid(location.hash))return;
  if (navigationURL === location.href) return;
  panel.cancelLoad();
  scheduler.cancel();
  renderController?.abort();
  restore();
}
window.addEventListener("popstate", navigateFromURL);
window.addEventListener("hashchange", navigateFromURL);
store.retireLegacyTokens().catch(() => {
  /* Retried on the next load. */
});
await restore();
workspaceReady=true;document.body.dataset.ready='true';
globalThis.SheetsOnline={editor,getSource,snapshot,setSource:src=>{setSource(src);changed();},openURL:openLinked,panel};
setupOffline({beforeReload:persist,container:shell.drawer.body,status:shell.offlineStatus});
