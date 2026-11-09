import { executionProgress } from "./execution-progress.js";
/** A fresh worker per render makes cancellation and interpreter reset deterministic. */
export function runWorker(
  url,
  payload,
  {
    signal,
    timeout = 20_000,
    onProgress,
    label = "Calculation",
    initial = "Calculating",
    WorkerClass = globalThis.Worker,
    createWorker = () => new WorkerClass(url, { type: "module" }),
  } = {},
) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = createWorker();
    const progress = executionProgress({ label, timeout, onProgress, initial });
    let settled = false;
    let timer;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      progress.stop();
      signal?.removeEventListener("abort", abort);
      worker.terminate();
      fn(value);
    };
    const abort = () =>
      finish(reject, new DOMException("Rendering cancelled", "AbortError"));
    signal?.addEventListener("abort", abort, { once: true });
    worker.onmessage = ({ data }) => {
      if (settled) return;
      if (data.type === "sheets:progress") {
        progress.update(data.stage);
        return;
      }
      data.error
        ? finish(reject, new Error(data.error))
        : finish(resolve, data);
    };
    worker.onerror = (event) =>
      finish(reject, new Error(event.message || "Worker failed to start."));
    timer = setTimeout(() => finish(reject, progress.error()), timeout);
    worker.postMessage(payload);
  });
}
