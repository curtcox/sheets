import { catalog, detect, loadFormat } from "./formats/registry.js";
import { readURL, writeURL, readOverrides } from "./url-state.js";
import {
  profiles,
  validateProfile,
  resolveDocument,
} from "./compatibility-profiles.js";
import { RenderScheduler } from "./render-scheduler.js";
import { setPreview, sanitize } from "./sanitize.js";
import { setupViews } from "./view-modes.js";
import { HashBinDocuments, HashBinStore } from "./hashbin.js";
import { HashBinPanel } from "./hashbin-panel.js";
import { ShareClient } from "./share-links.js";
import { loadExample } from "./examples.js";
import { setupOffline } from "./offline.js";
import { acePath } from "./ace-path.js";
import { loadEditorMode } from "./editor-modes.js";
import { sourceTitle, sourceDownload } from "./downloads.js";
import { htmlDownload, downloadFile } from "./export-document.js";
import { optionalStorage } from "./util.js";
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
  renderController;
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
  onChange: () => persist(),
  onResize: () => editor?.resize(),
});
const selectedType = (src = getSource()) =>
  format.value === "auto"
    ? profiles.find((item) => item.id === currentProfile)?.format || detect(src)
    : format.value;
function updateProfileControls() {
  $("profile-controls").hidden = selectedType() !== "calca";
  $("profile").value = currentProfile || "";
  $("profile-help").textContent = currentProfile
    ? "Calca fences, indented code, and standalone arrows calculate. Source files contain text only; reselect this mode when reusing them."
    : "Legacy evaluates every code fence. Structured blocks keep other languages, formulas, and diagrams literal.";
}
const snapshot = () => ({
  src: getSource(),
  type: selectedType(),
  format: format.value,
  view: view.getView(),
  ...(currentProfile ? { profile: currentProfile } : {}),
});
const fingerprint = () => JSON.stringify(snapshot());
function updateDownloadOptions(ready = false) {
  const extension =
    catalog.find((item) => item.id === selectedType())?.extensions[0] || ".txt";
  $("download-source").textContent = `Source (${extension})`;
  $("download-html").disabled = !ready;
  $("print-preview").disabled = !ready;
}
function persist() {
  clearTimeout(persistTimer);
  const url = writeURL(location.href, { ...snapshot(), cid: currentCID });
  history.replaceState(null, "", url);
  navigationURL = url;
  $("url-notice").textContent =
    url.length > 8192 ? "Long link · save to HashBin for easier sharing" : "";
  $("source-size").textContent =
    `${getSource().length.toLocaleString()} characters`;
}
const scheduler = new RenderScheduler({
  async render(src, { signal }) {
    renderController?.abort();
    renderController = new AbortController();
    const combined = AbortSignal.any([signal, renderController.signal]);
    const profile = currentProfile;
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
    return {
      ...(await plugin.render(src, {
        signal: combined,
        profile,
      })),
      signal: combined,
    };
  },
  async onResult(result) {
    currentResult = result;
    setPreview(preview, result.html);
    editor?.session.setAnnotations(
      (result.diagnostics || []).map((d) => ({
        row: Math.max(0, d.line - 1),
        column: 0,
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
    if (status === "done") persist();
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
  getSnapshot: snapshot,
  getFingerprint: fingerprint,
  onLoad(doc, cid, overrides = {}) {
    const resolved = resolveDocument(doc, overrides);
    sourceRevision++;
    currentCID = cid;
    setSource(doc.src);
    format.value = resolved.format;
    currentProfile = resolved.profile;
    view.setView(resolved.view, false);
    updateProfileControls();
    persist();
    scheduler.schedule(getSource(), {}, true);
  },
  onSaved(cid) {
    currentCID = cid;
    persist();
  },
});
$("hashbin-save").disabled = !clientId;
$("hashbin-config").textContent = clientId
  ? "Public documents load without signing in."
  : "Saving needs a registered HashBin client ID. Public CIDs can still be loaded.";
$("hashbin-open").onclick = () => {
  $("hashbin-panel").hidden = !$("hashbin-panel").hidden;
  editor?.resize();
};
$("hashbin-panel-close").onclick = () => {
  $("hashbin-panel").hidden = true;
  editor?.resize();
};
function changed() {
  if (setting) return;
  sourceRevision++;
  currentCID = null;
  panel.cancelLoad();
  renderController?.abort();
  scheduler.schedule(getSource());
  $("source-size").textContent =
    `${getSource().length.toLocaleString()} characters`;
  clearTimeout(persistTimer);
  persistTimer = setTimeout(persist, 300);
}
if (editor) editor.session.on("change", changed);
else $("source-fallback").addEventListener("input", changed);
format.onchange = () => {
  currentProfile = undefined;
  updateProfileControls();
  changed();
};
$("profile").onchange = () => {
  currentProfile = $("profile").value || undefined;
  if (currentProfile) format.value = "calca";
  updateProfileControls();
  changed();
};
$("cancel-render").onclick = () => {
  updateDownloadOptions(false);
  scheduler.cancel();
  renderController?.abort();
  $("render-status").textContent =
    "Cancelled · edit the source to render again";
  $("cancel-render").hidden = true;
  preview.setAttribute("aria-busy", "false");
};
preview.addEventListener("click", async (event) => {
  const reference = event.target.closest('a[href^="#"]');
  if (reference) {
    // The fragment can hold a HashBin CID. References scroll within the preview
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
  if (event.key === "Escape") {
    $("download-menu").open = false;
    $("download-menu").querySelector("summary").focus();
  }
});
const share = new ShareClient();
$("share").onclick = () => {
  persist();
  $("share-url").value = location.href;
  $("share-status").textContent = "";
  $("share-dialog").showModal();
};
$("share-close").onclick = () => $("share-dialog").close();
$("share-dialog").addEventListener("close", () => {
  share.cancel();
  $("shorten-link").disabled = false;
});
$("copy-link").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("share-url").value);
    $("share-status").textContent = "Link copied.";
  } catch {
    $("share-url").select();
    $("share-status").textContent =
      "Press Ctrl+C or ⌘C to copy the selected link.";
  }
};
$("shorten-link").onclick = async () => {
  $("shorten-link").disabled = true;
  $("share-status").textContent = "Shortening…";
  const url = $("share-url").value,
    result = await share.shorten({ long: url, fallback: url });
  if (result) {
    $("share-url").value = result.url;
    $("share-status").textContent =
      result.error?.message || "Short link ready.";
  }
  $("shorten-link").disabled = false;
};
$("commit").textContent = $("commit").textContent.startsWith("__")
  ? "local"
  : $("commit").textContent;
const starter =
  "# Notes that do the math\n\nA sheet is a small document with a little more power. Write on the left; see the result on the right.\n\n## Start with an idea\n\n| Item | Quantity | Unit cost |\n| :--- | ---: | ---: |\n| Notebooks | 12 | $4 |\n| Pencils | 24 | $1 |\n| Good ideas | ∞ | Free |\n\nThe area of a circle is $A = \\pi r^2$.\n\n> [!TIP]\n> Choose a calculation format above to turn expressions into answers. Visit the **[gallery](gallery.html)** for examples in all nine formats.\n\n- [x] Write something useful\n- [ ] Make it calculate\n- [ ] Share the link\n";
async function restore() {
  navigationURL = location.href;
  updateDownloadOptions(false);
  const revision = ++sourceRevision;
  try {
    const callback = await store.callback(location.search);
    if (revision !== sourceRevision) return;
    if (callback?.error) {
      $("hashbin-panel").hidden = false;
      $("hashbin-status").textContent = callback.error;
    }
    if (callback?.snapshot) {
      const doc = callback.snapshot;
      setSource(doc.src);
      format.value = doc.format || doc.type || "auto";
      currentProfile = validateProfile(doc.profile, format.value);
      view.setView(doc.view, false);
      updateProfileControls();
      currentCID = null;
      if (callback.error) {
        $("hashbin-panel").hidden = false;
        $("hashbin-status").textContent = callback.error;
      }
      persist();
      scheduler.schedule(getSource(), {}, true);
      return;
    }
    const state = readURL(location.href);
    format.value = state.format;
    currentProfile = state.profile;
    view.setView(state.view, false);
    if (state.kind === "hashbin") {
      await panel.load(state.cid, readOverrides(location.href));
      return;
    }
    if (state.kind === "example") {
      const example = await loadExample(state.example);
      if (revision !== sourceRevision) return;
      setSource(example.src);
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
    scheduler.schedule(getSource(), {}, true);
  } catch (error) {
    if (revision === sourceRevision) {
      $("render-status").textContent = error.message;
      preview.textContent = error.message;
    }
  }
}
// Document anchors (footnotes and Quarto figures) do not reload interpreters.
function navigateFromURL() {
  if (location.hash && !HashBinDocuments.cid(location.hash)) return;
  if (navigationURL === location.href) return;
  panel.cancelLoad();
  scheduler.cancel();
  renderController?.abort();
  restore();
}
window.addEventListener("popstate", navigateFromURL);
window.addEventListener("hashchange", navigateFromURL);
await restore();
setupOffline({ beforeReload: persist });
