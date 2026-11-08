import { captureSnapshot } from "./snapshot.js";
import { exportTargets, exportSnapshot } from "./registry.js";
import { downloadFile } from "../export-document.js";
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
}) {
  const dialog = document.createElement("dialog");
  dialog.className = "export-dialog";
  dialog.setAttribute("aria-labelledby", "export-title");
  dialog.innerHTML =
    '<form method="dialog"><header><h2 id="export-title">Export document</h2><button aria-label="Close exports">Close</button></header></form><p>Exports capture the current results. Keep a portable project to edit calculations again in Sheets.</p><label>Format <select id="export-target"></select></label><label id="export-values-label" hidden><input id="export-values" type="checkbox"> Values-only snapshot (no working formulas)</label><div id="export-google-settings" hidden><label>Google OAuth web client ID <input id="export-google-client" type="text" autocomplete="off" placeholder="…apps.googleusercontent.com"></label><p>A website owner must configure this client for the current website. <a href="docs.html?page=exports">Setup and import instructions</a>.</p></div><p id="export-fidelity"></p><p><a href="docs.html?page=exports">Export support and limitations</a></p><p id="export-status" role="status" aria-live="polite"></p><div id="export-result"></div><footer><button id="export-go">Download</button><button id="export-cancel" hidden>Cancel export</button></footer>';
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
    { id: "google-import", label: "Google Docs — download Word for import" },
    { id: "google", label: "Google Docs — create in Drive" },
    { id: "pages", label: "Pages Online — open editable page" },
  ];
  for (const t of targets) {
    const option = document.createElement("option");
    option.value = t.id;
    option.textContent = t.label;
    target.append(option);
  }
  let snapshot,
    controller,
    busy = false,
    ready = false;
  const identity = () =>
    `${getRevision()}:${preview.querySelector('[role="tab"][aria-selected="true"]')?.dataset.report || ""}`;
  const finish = () => {
    busy = false;
    target.disabled = false;
    go.disabled = !ready;
    $("export-cancel").hidden = true;
  };
  function choice() {
    const id = target.value,
      book = ["xlsx", "ods"].includes(id);
    $("export-values-label").hidden = !book;
    $("export-google-settings").hidden = id !== "google" || !!configuredClient;
    go.textContent =
      id === "pages"
        ? "Open in Pages"
        : id === "google"
          ? "Create Google Doc"
          : "Download";
    const text = book
      ? "Working formulas: Org arithmetic, cell/range references, named inputs, comparisons, IF and numeric aggregates. Unsupported formulas block export. Excel floating-point precision and dependency recalculation can differ. Select values-only explicitly to flatten calculations."
      : id === "html" || id === "pages"
        ? "Static HTML preserves math and diagrams. Included pictures are embedded; linked pictures still need the network. Pages opens with scripts disabled."
        : id === "docx" || id.startsWith("google")
          ? "Editable prose and tables. Equations become readable text, diagrams become pictures, and linked images use descriptions. Google receives the document only when you choose Create Google Doc."
          : id === "md"
            ? "Evaluated GFM Markdown. Equations use dollar delimiters; diagrams become descriptions. Complex tables and styling may be flattened."
            : "Evaluated text; pictures and equations use descriptions. Formatting and interactive controls are flattened.";
    $("export-fidelity").textContent = text;
    if (id === "google") {
      go.disabled = true;
      status.textContent = "Loading Google sign-in…";
      loadGoogleIdentity()
        .then(() => {
          if (target.value === "google" && !busy) {
            go.disabled = !ready;
            status.textContent = "";
          }
        })
        .catch((e) => {
          status.textContent = e.message;
        });
    } else {
      go.disabled = !ready;
      status.textContent = "";
    }
  }
  target.onchange = choice;
  button.onclick = () => {
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
  };
  $("export-cancel").onclick = () => controller?.abort();
  dialog.addEventListener("close", () => controller?.abort());
  go.onclick = async () => {
    if (busy || !ready) return;
    controller?.abort();
    controller = new AbortController();
    const signal = AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(target.value === "google" ? 300000 : 30000),
      ]),
      before = identity();
    busy = true;
    go.disabled = true;
    target.disabled = true;
    $("export-cancel").hidden = false;
    status.textContent = "Preparing export…";
    $("export-result").replaceChildren();
    try {
      snapshot = captureSnapshot(
        preview,
        getState(),
        getResult(),
        getRevision(),
      );
      const id = target.value;
      const check = () => {
        signal.throwIfAborted();
        if (!ready || before !== identity())
          throw Error(
            "Document or selected report changed. Export the new results again.",
          );
      };
      if (id === "pages") {
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
      // Request Google consent during the click gesture, before async conversion.
      const token =
        id === "google"
          ? await googleToken($("export-google-client").value.trim(), {
              signal,
            })
          : null;
      check();
      let prepared = snapshot;
      if (["docx", "google-import", "google"].includes(id))
        prepared = await prepareWordMedia(snapshot, signal);
      const file = await exportSnapshot(
        prepared,
        id.startsWith("google") ? "docx" : id,
        { signal, valuesOnly: $("export-values").checked },
      );
      check();
      if (id === "google") {
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
        status.textContent =
          id === "google-import"
            ? "Word file downloaded. Upload it to Drive, then open with Google Docs."
            : "Export downloaded.";
      }
      if (file.diagnostics.length) {
        const p = document.createElement("p");
        p.textContent = [...new Set(file.diagnostics)].join(" ");
        $("export-result").append(p);
      }
    } catch (e) {
      status.textContent = signal.aborted
        ? "Export cancelled or timed out. If an upload had started, check Drive before retrying."
        : e.message;
    } finally {
      finish();
    }
  };
  return {
    update(value) {
      ready = value;
      button.disabled = !value;
      if (!value) {
        controller?.abort();
        go.disabled = true;
      } else if (!busy) go.disabled = false;
    },
  };
}
