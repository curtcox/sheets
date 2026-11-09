// Python and R cells run in HashBin SDK sandboxes: a worker inside an opaque-origin iframe,
// so code from a shared document cannot reach this origin's storage, service worker or pages.
// The frame inherits its parent's Content-Security-Policy, so that lists the bootstrap's hash.
/** Pinned so a later SDK change cannot reach this app; upgrade deliberately. */
export const HASHBIN_SDK_URL = "https://hashbin.org/sdk/v0.4.0/hashbin.js";

let sdk;
export function loadHashBinSDK() {
  sdk ||= import(HASHBIN_SDK_URL);
  sdk.catch(() => (sdk = null));
  return sdk;
}

const workers = new URL("./workers/", import.meta.url);

// A same-origin host page with its own policy creates the sandbox and relays its messages.
// Removing the host frame ends the sandbox and its worker.
function hostedSandbox(source, { signal, readyTimeout = 15000 } = {}) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    const channel = new MessageChannel();
    const worker = {
      onmessage: null,
      onerror: null,
      postMessage: (data, transfer = []) =>
        channel.port1.postMessage(data, transfer),
      terminate() {
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        removeEventListener("message", ready);
        channel.port1.close();
        frame.remove();
      },
    };
    const fail = (error) => {
      worker.terminate();
      reject(error);
    };
    const abort = () => fail(new DOMException("Rendering cancelled", "AbortError"));
    const timer = setTimeout(() => fail(new Error(
      `R sandbox host did not become ready within ${readyTimeout / 1000} seconds. It may be blocked by the site's security policy or a failed download. Reload to retry; if it persists, report this startup failure.`,
    )), readyTimeout);
    signal?.addEventListener("abort", abort, { once: true });
    channel.port1.onmessage = (event) =>
      event.data?.type === "sheets:sandbox:error"
        ? worker.onerror?.({ message: event.data.message, preventDefault() {} })
        : worker.onmessage?.(event);
    frame.hidden = true;
    frame.title = "Code sandbox host";
    frame.src = new URL("sandbox-host.html", workers).href;
    // WebKit can fire the frame's load event before its module script listens, so wait for it.
    const ready = (event) => {
      if (
        event.source !== frame.contentWindow ||
        event.data?.type !== "sheets:sandbox:ready"
      )
        return;
      removeEventListener("message", ready);
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      frame.contentWindow.postMessage(
        { type: "sheets:sandbox:start", source, base: workers.href },
        location.origin,
        [channel.port2],
      );
      resolve(worker);
    };
    addEventListener("message", ready);
    document.body.append(frame);
  });
}

/**
 * Starts a classic worker script from src/workers/ in a fresh sandbox, after `prefix`.
 * `allowEval` runs it under sandbox-host.html's policy, which allows eval, not this page's.
 */
export async function startSandbox(
  name,
  { prefix = "", signal, allowEval = false, readyTimeout, loadSDK = loadHashBinSDK } = {},
) {
  const [sdk, source] = await Promise.all([
    allowEval ? null : loadSDK(),
    fetch(new URL(name, workers), { signal }).then((response) => {
      if (!response.ok) throw new Error(`${name} is unavailable.`);
      return response.text();
    }),
  ]);
  signal?.throwIfAborted();
  if (allowEval) return hostedSandbox(prefix + source, { signal, readyTimeout });
  return sdk.createSandbox({ source: prefix + source, base: workers.href });
}
