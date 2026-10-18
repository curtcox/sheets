import LZString from "../vendor/lz-string.js";
import { decompressSource } from "./compression.js";
import { HashBinDocuments } from "./hashbin.js";
export const formats = [
  "gfm",
  "asciimath",
  "numbat",
  "calcfile",
  "org",
  "calca",
  "hurmet",
  "beancount",
  "quarto",
  "text",
];
export const views = ["split", "source", "preview"];
export function readURL(input) {
  const url = new URL(input);
  const format = formats.includes(url.searchParams.get("format"))
    ? url.searchParams.get("format")
    : "auto";
  const view = views.includes(url.searchParams.get("view"))
    ? url.searchParams.get("view")
    : "split";
  const cid = HashBinDocuments.cid(url.hash);
  if (cid) return { format, view, cid, kind: "hashbin" };
  if (url.searchParams.has("compressed")) {
    const value = url.searchParams.get("compressed");
    if (value.length > 1_000_000)
      throw new Error("Shared source is too large.");
    const src = decompressSource(value);
    if (
      src == null ||
      (value &&
        LZString.compressToEncodedURIComponent(src) !==
          value.replaceAll(" ", "+"))
    )
      throw new Error("The shared source could not be decompressed.");
    if (new TextEncoder().encode(src).length > 5 * 1024 * 1024)
      throw new Error("Shared source exceeds 5 MiB.");
    return { format, view, src, kind: "source" };
  }
  const example = url.searchParams.get("example");
  return {
    format,
    view,
    ...(example ? { example, kind: "example" } : { kind: "empty" }),
  };
}
export function writeURL(
  input,
  { src = "", format = "auto", view = "split", cid = null },
) {
  const url = new URL(input);
  for (const key of [
    "compressed",
    "example",
    "format",
    "view",
    "code",
    "state",
    "error",
    "error_description",
    "raw",
    "url",
  ])
    url.searchParams.delete(key);
  url.hash = "";
  if (formats.includes(format)) url.searchParams.set("format", format);
  if (views.includes(view) && view !== "split")
    url.searchParams.set("view", view);
  if (cid && HashBinDocuments.isCID(cid)) url.hash = cid;
  else
    url.searchParams.set(
      "compressed",
      LZString.compressToEncodedURIComponent(src),
    );
  return url.href;
}
