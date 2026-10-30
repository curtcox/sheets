import { startSandbox } from "./sandbox.js";
// R code runs in webR's worker, inside a HashBin SDK sandbox. Keep its controller
// outside the sandbox: this also lets cancellation close the interpreter directly.
const base = "https://webr.r-wasm.org/v0.6.0/";
// The controller acts on "system" requests from the worker. proxyWorker would start a
// worker from any URL on this origin, and the WebSocket proxies would connect from it,
// so only requests that stay inside webR pass the sandbox boundary.
const SYSTEM_REQUESTS = new Set([
  "setTimeoutWasm",
  "console.log",
  "console.warn",
  "console.error",
  "close",
]);
export function guardWorker(sandbox) {
  const worker = {
    onmessage: null,
    onerror: null,
    postMessage: (data, transfer) => sandbox.postMessage(data, transfer),
    terminate: () => sandbox.terminate(),
  };
  sandbox.onmessage = (event) => {
    const { data } = event;
    if (data?.type === "system" && !SYSTEM_REQUESTS.has(data.data?.type))
      return;
    worker.onmessage?.(event);
  };
  sandbox.onerror = (event) => worker.onerror?.(event);
  return worker;
}
// WebR constructs its worker synchronously with `new Worker()`; give it the sandbox.
function withWorker(worker, create) {
  const NativeWorker = globalThis.Worker;
  globalThis.Worker = function SandboxWorker() {
    return worker;
  };
  try {
    return create();
  } finally {
    globalThis.Worker = NativeWorker;
  }
}
async function png(image) {
  try {
    const canvas = new OffscreenCanvas(image.width, image.height);
    canvas.getContext("2d").drawImage(image, 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/png" });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192)
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return `data:image/png;base64,${btoa(binary)}`;
  } finally {
    image.close();
  }
}

/** A fresh webR interpreter per render, with cancellable startup and execution. */
export function runR(
  cells,
  {
    signal,
    timeout = 90000,
    loadRuntime = () => import(base + "webr.mjs"),
    start = startSandbox,
  } = {},
) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    let webR,
      sandbox,
      settled = false,
      timer;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      webR?.close();
      sandbox?.terminate();
      fn(value);
    };
    const abort = () =>
      finish(reject, new DOMException("Rendering cancelled", "AbortError"));
    signal?.addEventListener("abort", abort, { once: true });
    timer = setTimeout(
      () =>
        finish(
          reject,
          new Error(
            `Calculation exceeded ${timeout / 1000} seconds. Edit the source to try again.`,
          ),
        ),
      timeout,
    );
    void (async () => {
      try {
        const started = start("webr-worker.js", {
          signal,
          allowEval: true,
        }).then((worker) => {
          sandbox = worker;
          if (settled) worker.terminate(); // A late sandbox must never keep running.
          return worker;
        });
        const [{ WebR, ChannelType }, worker] = await Promise.all([
          loadRuntime(),
          started,
        ]);
        if (settled) return;
        webR = withWorker(
          guardWorker(worker),
          () =>
            new WebR({
              baseUrl: new URL("./workers/", import.meta.url).href,
              channelType: ChannelType.PostMessage,
              interactive: false,
            }),
        );
        await webR.init();
        if (settled) return;
        const shelter = await new webR.Shelter(),
          outputs = [];
        for (const cell of cells) {
          if (settled) return;
          try {
            const size = cell.execution?.figureSize;
            const capture = await shelter.captureR(cell.source, {
              withAutoprint: true,
              throwJsException: false,
              captureGraphics: {
                width: size ? size.width * 72 : 640,
                height: size ? size.height * 72 : 400,
                bg: "white",
              },
            });
            if (settled) return;
            const stdout = [],
              stderr = [],
              warnings = [],
              errors = [];
            for (const item of capture.output) {
              if (item.type === "stdout") stdout.push(item.data);
              else if (item.type === "stderr") stderr.push(item.data);
              else {
                const message = await item.data.get("message");
                const text = await message.toString();
                if (item.type === "error") errors.push(text);
                else if (item.type === "warning")
                  warnings.push(`warning: ${text}`);
                else stderr.push(`${item.type}: ${text}`);
              }
            }
            const images = [];
            for (const image of capture.images) images.push(await png(image));
            outputs.push({
              stdout: stdout.join("\n"),
              stderr: stderr.join("\n"),
              images,
              warnings,
              ...(errors.length ? { error: errors.join("\n") } : {}),
            });
            if (
              errors.length &&
              (cell.execution?.error === false ||
                cell.execution?.include === false)
            )
              break;
          } catch (error) {
            if (settled) return;
            outputs.push({ error: error.message });
            if (
              cell.execution?.error === false ||
              cell.execution?.include === false
            )
              break;
          } finally {
            if (!settled) await shelter.purge();
          }
        }
        finish(resolve, { outputs });
      } catch (error) {
        finish(reject, new Error(`R could not start: ${error.message}`));
      }
    })();
  });
}
