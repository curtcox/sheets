import LZString from "../vendor/lz-string.js";
import { decompressSource } from "./compression.js";
import { HashBinDocuments } from "./hashbin.js";
import { validateProfile } from "./compatibility-profiles.js";
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
  const profile = url.searchParams.has("profile")
    ? validateProfile(url.searchParams.get("profile"), format)
    : undefined;
  const settings = { format, view, ...(profile ? { profile } : {}) };
  const cid = HashBinDocuments.cid(url.hash);
  if (cid) return { ...settings, cid, kind: "hashbin" };
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
    return { ...settings, src, kind: "source" };
  }
  const example = url.searchParams.get("example");
  return {
    ...settings,
    ...(example ? { example, kind: "example" } : { kind: "empty" }),
  };
}
export function writeURL(
  input,
  { src = "", format = "auto", view = "split", cid = null, profile },
) {
  validateProfile(profile, format);
  const url = new URL(input);
  for (const key of [
    "compressed",
    "example",
    "format",
    "view",
    "profile",
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
  if (profile) url.searchParams.set("profile", profile);
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
export function readOverrides(input) {
  const url = new URL(input),
    state = readURL(url);
  return Object.fromEntries(
    ["format", "view", "profile"]
      .filter((key) => url.searchParams.has(key))
      .map((key) => [key, state[key]]),
  );
}
