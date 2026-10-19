// R code runs in webR's own worker. Keep its controller outside a wrapper
// worker: this also lets cancellation close the interpreter directly in WebKit.
const base = "https://webr.r-wasm.org/v0.6.0/";
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
  } = {},
) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    let webR,
      settled = false,
      timer;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      webR?.close();
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
        const { WebR, ChannelType } = await loadRuntime();
        if (settled) return; // An aborted CDN import must never start a late worker.
        webR = new WebR({
          baseUrl: new URL("./workers/", import.meta.url).href,
          channelType: ChannelType.PostMessage,
          interactive: false,
        });
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
