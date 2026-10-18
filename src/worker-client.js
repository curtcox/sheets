/** A fresh worker per render makes cancellation and interpreter reset deterministic. */
export function runWorker(
  url,
  payload,
  { signal, timeout = 20_000, WorkerClass = globalThis.Worker } = {},
) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = new WorkerClass(url, { type: "module" });
    let timer;
    const finish = (fn, value) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      worker.terminate();
      fn(value);
    };
    const abort = () =>
      finish(reject, new DOMException("Rendering cancelled", "AbortError"));
    signal?.addEventListener("abort", abort, { once: true });
    worker.onmessage = ({ data }) =>
      data.error
        ? finish(reject, new Error(data.error))
        : finish(resolve, data);
    worker.onerror = (event) =>
      finish(reject, new Error(event.message || "Worker failed to start."));
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
    worker.postMessage(payload);
  });
}
