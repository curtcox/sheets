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
import { setPreview, sanitize } from "./sanitize.js";
import { setupViews } from "./view-modes.js";
import { HashBinDocuments, HashBinStore } from "./hashbin.js";
import { HashBinPanel } from "./hashbin-panel.js";
import { ShareClient } from "./share-links.js";
import { loadExample } from "./examples.js";
import { setupOffline } from "./offline.js";
import { acePath } from "./ace-path.js";
import { loadEditorMode } from "./editor-modes.js";
import { sourceTitle, sourceDownload, projectDownload } from "./downloads.js";
import { parseProjectFile } from "./project-state.js";
import { verifyInputSnapshot, SNAPSHOT_LIMITS } from "./input-snapshot.js";
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
  currentInputSnapshot,
  projectOpenController,
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
});
const fingerprint = () => JSON.stringify(snapshot());
function updateDownloadOptions(ready = false) {
  const extension =
    catalog.find((item) => item.id === selectedType())?.extensions[0] || ".txt";
  $("download-source").textContent = `Source (${extension})`;
  $("download-html").disabled = !ready;
  $("print-preview").disabled = !ready;
  $("download-project").hidden = selectedType() !== "org";
  $("project-download-help").hidden = selectedType() !== "org";
  $("download-project").disabled = !ready || !currentResult?.inputsReady || !currentResult?.inputPayloads;
  preview.querySelectorAll("[data-action=copy-org]").forEach((button) => {
    button.disabled = !ready;
  });
}
function persist() {
  clearTimeout(persistTimer);
  $("source-size").textContent = `${getSource().length.toLocaleString()} characters`;
  let url;
  try {
    url = writeURL(location.href, { ...snapshot(), cid: currentCID });
    if (currentInputSnapshot) readURL(url);
  } catch (error) {
    $("url-notice").textContent = `Current edits cannot be shared: ${error.message} Download source before reloading.`;
    $("share").disabled = true;
    return null;
  }
  $("share").disabled = false;
  history.replaceState(null, "", url);
  navigationURL = url;
  const backup = currentInputSnapshot ? "Portable project" : "Source";
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
        inputSnapshot,
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
    currentInputSnapshot = resolved.inputSnapshot;
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
  projectOpenController?.abort();
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
  if (currentProfile)
    format.value = profiles.find((item) => item.id === currentProfile).format;
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
preview.addEventListener("keydown", (event) => {
  const area = event.target.closest(".org-table-scroll");
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
    await verifyInputSnapshot(doc.inputSnapshot, doc.src, controller.signal);
    controller.signal.throwIfAborted();
    if (before !== fingerprint()) throw new Error("Document changed while opening the snapshot; choose the file again.");
    const url = writeURL(location.href, { ...doc, format: "org" });
    readURL(url); // Reject a file that cannot survive the editor's URL round-trip.
    panel.cancelLoad(); scheduler.cancel(); renderController?.abort();
    sourceRevision++;
    history.pushState(null, "", url);
    currentInputSnapshot = doc.inputSnapshot;
    currentCID = null; currentProfile = doc.profile; format.value = "org";
    setSource(doc.src); view.setView(doc.view, false);
    updateProfileControls(); persist(); scheduler.schedule(getSource(), {}, true);
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
  if (event.key === "Escape") {
    $("download-menu").open = false;
    $("download-menu").querySelector("summary").focus();
  }
});
const share = new ShareClient();
$("share").onclick = () => {
  if (!persist()) return;
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
  projectOpenController?.abort();
  navigationURL = location.href;
  updateDownloadOptions(false);
  const revision = ++sourceRevision;
  try {
    // A redirect save returns here; its snapshot restores the document either way.
    const published = await store.published(location.hash);
    if (revision !== sourceRevision) return;
    if (published) {
      $("hashbin-panel").hidden = false;
      $("hashbin-status").textContent = published.error || "Saved to HashBin.";
      history.replaceState(null, "", location.pathname + location.search);
    }
    if (published?.snapshot) {
      const doc = published.snapshot;
      setSource(doc.src);
      format.value = doc.format || doc.type || "auto";
      currentProfile = validateProfile(doc.profile, format.value);
      currentInputSnapshot = doc.inputSnapshot;
      view.setView(doc.view, false);
      updateProfileControls();
      currentCID = published.cid || null;
      persist();
      scheduler.schedule(getSource(), {}, true);
      return;
    }
    const state = readURL(location.href);
    format.value = state.format;
    currentProfile = state.profile;
    currentInputSnapshot = state.inputSnapshot;
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
  if (
    location.hash &&
    !location.hash.startsWith("#src=") &&
    !location.hash.startsWith("#project=") &&
    !HashBinDocuments.cid(location.hash)
  )
    return;
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
setupOffline({ beforeReload: persist });
