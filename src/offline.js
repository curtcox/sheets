const base = new URL("../", import.meta.url);
const workerURL = new URL("sw.js", base);
const prefix = `sheets-offline:${base.pathname}:`;
export function watchOfflineUpdates(beforeReload = () => {}) {
  if (!("serviceWorker" in navigator)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (
      reloading ||
      !navigator.serviceWorker.controller?.scriptURL.startsWith(workerURL.href)
    )
      return;
    reloading = true;
    beforeReload();
    location.reload();
  });
}
function workerStatus(worker) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      channel.port1.close();
      reject(
        new Error("Offline storage did not respond. Retry while connected."),
      );
    }, 5000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      channel.port1.close();
      resolve(event.data);
    };
    worker.postMessage({ type: "STATUS" }, [channel.port2]);
  });
}
export async function setupOffline({ beforeReload } = {}) {
  watchOfflineUpdates(beforeReload);
  const dialog = document.getElementById("offline-dialog"),
    open = document.getElementById("offline-open"),
    status = document.getElementById("offline-status"),
    enable = document.getElementById("offline-enable"),
    remove = document.getElementById("offline-remove"),
    update = document.getElementById("offline-update");
  open.onclick = () => {
    document.getElementById("download-menu").open = false;
    dialog.showModal();
  };
  document.getElementById("offline-close").onclick = () => dialog.close();
  let registration;
  async function refresh() {
    update.hidden = !registration?.waiting;
    remove.hidden = !registration;
    remove.disabled = Boolean(registration?.installing);
    enable.disabled = Boolean(registration?.installing);
    const ready =
      registration?.active && (await workerStatus(registration.active)).ready;
    open.textContent = ready ? "Offline access ✓" : "Offline access…";
    enable.textContent = registration?.active
      ? "Check for updates"
      : "Download offline files";
    status.textContent = registration?.waiting
      ? "Updated offline files are ready. Reload to use them."
      : registration?.installing
        ? "Downloading offline files…"
        : ready
          ? "Offline files are ready in this browser."
          : "Download the app for offline use in this browser.";
  }
  function watch(worker) {
    if (!worker) return;
    worker.addEventListener("statechange", async () => {
      if (worker.state === "redundant") {
        await refresh().catch(() => {});
        enable.disabled = false;
        status.textContent =
          "Offline download failed. Check your connection or browser storage, then retry.";
      } else if (["installed", "activated"].includes(worker.state))
        await refresh().catch((error) => (status.textContent = error.message));
    });
  }
  function observe() {
    watch(registration.installing);
    registration.addEventListener("updatefound", () => {
      watch(registration.installing);
      refresh().catch(() => {});
    });
  }
  if (!isSecureContext || !("serviceWorker" in navigator)) {
    status.textContent =
      "Offline storage needs HTTPS and service worker support.";
    return;
  }
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (
      event.data?.channel !== "sheets-offline" ||
      event.source?.scriptURL !== workerURL.href
    )
      return;
    if (event.data.type === "progress")
      status.textContent = `Downloading offline files… ${event.data.complete} / ${event.data.total}`;
    if (event.data.type === "error")
      status.textContent =
        "Offline download failed. Check your connection or browser storage, then retry.";
  });
  enable.onclick = async () => {
    enable.disabled = true;
    status.textContent = "Preparing offline files…";
    try {
      if (!registration) {
        registration = await navigator.serviceWorker.register(workerURL, {
          scope: base.href,
          updateViaCache: "none",
        });
        observe();
      } else await registration.update();
      await refresh();
    } catch (error) {
      enable.disabled = false;
      status.textContent = `Offline files could not be downloaded. ${error.message}`;
    }
  };
  update.onclick = () =>
    registration?.waiting?.postMessage({ type: "ACTIVATE" });
  remove.onclick = async () => {
    remove.disabled = true;
    try {
      await registration?.unregister();
      await Promise.all(
        (await caches.keys())
          .filter((name) => name.startsWith(prefix))
          .map((name) => caches.delete(name)),
      );
      registration = null;
      await refresh();
      status.textContent = "Offline files removed from this browser.";
    } catch (error) {
      status.textContent = `Offline files could not be removed. ${error.message}`;
    } finally {
      remove.disabled = false;
    }
  };
  try {
    const existing = await navigator.serviceWorker.getRegistration(base.href);
    if (existing?.scope === base.href) {
      registration = existing;
      observe();
    }
    await refresh();
  } catch {
    status.textContent = "Offline storage is unavailable in this browser.";
    enable.disabled = true;
  }
}
