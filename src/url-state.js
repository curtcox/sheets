import LZString from "../vendor/lz-string.js";
import { decompressSource } from "./compression.js";
import { HashBinDocuments } from "./hashbin.js";
import { validateProfile } from "./compatibility-profiles.js";
import { parseProjectFile, serializeProjectFile } from "./project-state.js";
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
// Leave headroom below the production host's observed ~8 KiB request limit.
// Fragments never enter the HTTP request; short existing query links stay stable.
export const SOURCE_FRAGMENT_THRESHOLD = 7000;
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
  if (url.hash.startsWith("#project=")) {
    const value = url.hash.slice(9);
    if (value.length > 1_000_000) throw new Error("Shared project is too large.");
    const text = decompressSource(value);
    if (text == null || LZString.compressToEncodedURIComponent(text) !== value)
      throw new Error("The shared project could not be decompressed.");
    const project = parseProjectFile(text);
    if (url.searchParams.has("format") && !["org", "auto"].includes(format))
      throw new Error("Portable snapshots require Org format.");
    return {
      src: project.src, format: "org", view: url.searchParams.has("view") ? view : project.view,
      ...(url.searchParams.has("profile") ? (profile ? { profile } : {}) : project.profile ? { profile: project.profile } : {}),
      inputSnapshot: project.inputSnapshot, kind: "project",
    };
  }
  if (url.hash.startsWith("#src=") || url.searchParams.has("compressed")) {
    const value = url.hash.startsWith("#src=")
      ? url.hash.slice(5)
      : url.searchParams.get("compressed");
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
  { src = "", format = "auto", view = "split", cid = null, profile, inputSnapshot },
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
  if (inputSnapshot !== undefined && format !== "org") throw new Error("Portable snapshots require Org format.");
  if (cid && HashBinDocuments.isCID(cid)) url.hash = cid;
  else if (inputSnapshot !== undefined)
    url.hash = "project=" + LZString.compressToEncodedURIComponent(serializeProjectFile({ src, type: "org", view, profile, inputSnapshot }));
  else {
    const compressed = LZString.compressToEncodedURIComponent(src);
    url.searchParams.set("compressed", compressed);
    if (url.href.length > SOURCE_FRAGMENT_THRESHOLD) {
      url.searchParams.delete("compressed");
      url.hash = `src=${compressed}`;
    }
  }
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
