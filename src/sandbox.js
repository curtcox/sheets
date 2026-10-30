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
function hostedSandbox(source) {
  const frame = document.createElement("iframe");
  const channel = new MessageChannel();
  const worker = {
    onmessage: null,
    onerror: null,
    postMessage: (data, transfer = []) =>
      channel.port1.postMessage(data, transfer),
    terminate() {
      removeEventListener("message", ready);
      channel.port1.close();
      frame.remove();
    },
  };
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
    frame.contentWindow.postMessage(
      { type: "sheets:sandbox:start", source, base: workers.href },
      location.origin,
      [channel.port2],
    );
  };
  addEventListener("message", ready);
  document.body.append(frame);
  return worker;
}

/**
 * Starts a classic worker script from src/workers/ in a fresh sandbox, after `prefix`.
 * `allowEval` runs it under sandbox-host.html's policy, which allows eval, not this page's.
 */
export async function startSandbox(
  name,
  { prefix = "", signal, allowEval = false, loadSDK = loadHashBinSDK } = {},
) {
  const [sdk, source] = await Promise.all([
    allowEval ? null : loadSDK(),
    fetch(new URL(name, workers), { signal }).then((response) => {
      if (!response.ok) throw new Error(`${name} is unavailable.`);
      return response.text();
    }),
  ]);
  signal?.throwIfAborted();
  if (allowEval) return hostedSandbox(prefix + source);
  return sdk.createSandbox({ source: prefix + source, base: workers.href });
}
