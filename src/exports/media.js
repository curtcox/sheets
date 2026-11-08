// Browser-only media preparation. Converters receive bounded, serializable data.
import { EXPORT_LIMITS } from "./model.js";
export async function prepareWordMedia(snapshot, signal) {
  const copy = structuredClone(snapshot);
  let total = 0;
  async function picture(src, alt, width) {
    signal?.throwIfAborted();
    const image = new Image();
    await new Promise((resolve, reject) => {
      const abort = () => {
        image.src = "";
        reject(signal.reason);
      };
      const done = (fn) => (value) => {
        signal?.removeEventListener("abort", abort);
        fn(value);
      };
      image.onload = done(resolve);
      image.onerror = done(() =>
        reject(Error("Picture could not be decoded.")),
      );
      signal?.addEventListener("abort", abort, { once: true });
      image.src = src;
    });
    signal?.throwIfAborted();
    const naturalWidth = image.naturalWidth || 640,
      naturalHeight = image.naturalHeight || 360;
    if (naturalWidth * naturalHeight > 16_000_000)
      throw Error("Export image exceeds 16 million pixels.");
    const w = Math.min(600, width || naturalWidth),
      h = Math.max(1, Math.round((w * naturalHeight) / naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = Math.min(1600, h);
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/png");
    total += data.length;
    if (total > EXPORT_LIMITS.media)
      throw Error("Export pictures exceed 16 MiB.");
    return {
      type: "image",
      src: data,
      alt,
      width: canvas.width,
      height: canvas.height,
    };
  }
  async function walk(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.type === "svg") {
        const src =
          "data:image/svg+xml;charset=utf-8," + encodeURIComponent(n.svg);
        try {
          nodes[i] = await picture(src, n.alt, 600);
        } catch (e) {
          signal?.throwIfAborted();
          copy.diagnostics.push(`Diagram exported as text: ${e.message}`);
        }
      } else if (
        n.type === "image" &&
        /^data:image\/(png|jpeg|webp);/i.test(n.src)
      )
        nodes[i] = await picture(n.src, n.alt, n.width);
      if (n.children) await walk(n.children);
    }
  }
  await walk(copy.model);
  return copy;
}
