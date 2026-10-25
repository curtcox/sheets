import { open, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fromExtension } from "../src/formats/registry.js";
import { profiles, validateProfile } from "../src/compatibility-profiles.js";
import { HashBinDocuments } from "../src/hashbin.js";
import {
  formats,
  views,
  readURL,
  writeURL,
  SOURCE_FRAGMENT_THRESHOLD,
} from "../src/url-state.js";

const defaultBase = "https://curtcox.github.io/sheets/index.html";
const help = `Usage: node scripts/link.mjs <file> [options]

Print a source link without uploading, modifying or executing the file.
Requires Node 22 or newer and a UTF-8 source file.

  --format <id>    Override the filename extension; use auto for detection.
  --view <view>    split (default), source, or preview.
  --profile <id>   Explicit compatibility profile; omitted modes stay unchanged.
  --base <url>     Editor URL (default: ${defaultBase}).
  --help, -h       Show this help.
  --              End options, for filenames beginning with a dash.

Values also accept --option=value. Formats: auto, ${formats.join(", ")}.
Profiles: ${profiles.map((p) => p.id).join(", ")}.
Known extensions select their format; unknown extensions use Auto.
Only the URL goes to stdout. Long-link warnings and errors go to stderr.
`;

function argumentsFor(argv) {
  const files = [], options = {};
  let positional = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!positional && arg === "--") {
      positional = true;
    } else if (!positional && ["--help", "-h"].includes(arg)) {
      options.help = true;
    } else if (!positional && arg.startsWith("-")) {
      const equal = arg.indexOf("="),
        key = arg.slice(2, equal < 0 ? undefined : equal);
      if (!arg.startsWith("--") || !["format", "view", "profile", "base"].includes(key))
        throw new Error(`Unknown option ${JSON.stringify(arg)}.`);
      if (Object.hasOwn(options, key)) throw new Error(`Duplicate --${key}.`);
      const value = equal < 0 ? argv[++i] : arg.slice(equal + 1);
      if (!value || value.startsWith("-")) throw new Error(`--${key} requires a value.`);
      options[key] = value;
    } else files.push(arg);
  }
  if (!options.help && files.length !== 1)
    throw new Error("Expected exactly one source file.");
  return { file: files[0], options };
}

async function sourceFromFile(filename) {
  let handle, data;
  try {
    // Reject directories/devices before opening; cap reads even if a file grows.
    const info = await stat(filename);
    if (!info.isFile()) throw new Error("Source must be a regular file.");
    if (info.size > HashBinDocuments.MAX_BYTES)
      throw new Error("Source exceeds the 5 MiB shared-source limit.");
    handle = await open(filename, "r");
    if (!(await handle.stat()).isFile()) throw new Error("Source must be a regular file.");
    const buffer = Buffer.alloc(HashBinDocuments.MAX_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, length);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > HashBinDocuments.MAX_BYTES)
      throw new Error("Source exceeds the 5 MiB shared-source limit.");
    data = buffer.subarray(0, length);
  } catch (error) {
    if (error.code)
      throw new Error(`Cannot read source file ${JSON.stringify(filename)} (${error.code}).`);
    throw error;
  } finally {
    await handle?.close();
  }
  try {
    // Preserve a BOM, CRLF and trailing whitespace; never silently replace bytes.
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(data);
  } catch {
    throw new Error("Source is not valid UTF-8.");
  }
}

export async function linkFromFile(filename, options = {}) {
  const format = options.format ?? fromExtension(filename),
    view = options.view ?? "split",
    profile = options.profile;
  if (format !== "auto" && !formats.includes(format))
    throw new Error(`Unknown format ${JSON.stringify(format)}.`);
  if (!views.includes(view)) throw new Error(`Unknown view ${JSON.stringify(view)}.`);
  if (profile !== undefined && !profiles.some((p) => p.id === profile))
    throw new Error(`Unknown profile ${JSON.stringify(profile)}.`);
  validateProfile(profile, format);
  let base;
  try { base = new URL(options.base ?? defaultBase); } catch { /* Validated below. */ }
  if (!base || !["http:", "https:"].includes(base.protocol) || base.username || base.password)
    throw new Error("--base must be an absolute HTTP(S) editor URL without credentials.");
  const src = await sourceFromFile(filename),
    url = writeURL(base, { src, format, view, profile });
  // Use the reader's canonical checks and both encoded/decoded size limits.
  try {
    if (readURL(url).src !== src) throw new Error("Source did not round-trip.");
  } catch (error) {
    throw new Error(`Generated link cannot be opened: ${error.message}`);
  }
  const warnings = [];
  if (url.length > SOURCE_FRAGMENT_THRESHOLD)
    warnings.push(`Long link (${url.length} characters): source uses a fragment, but browsers and messaging apps may still truncate the complete URL. Keep the source file or use HashBin for a shorter saved link.`);
  if (url.split("#", 1)[0].length > SOURCE_FRAGMENT_THRESHOLD)
    warnings.push("The non-source address is still long and may exceed a server's request limit. Remove extra base-URL parameters.");
  return { url, warnings };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { file, options } = argumentsFor(process.argv.slice(2));
    if (options.help) process.stdout.write(help);
    else {
      const result = await linkFromFile(file, options);
      for (const warning of result.warnings) process.stderr.write(`Warning: ${warning}\n`);
      process.stdout.write(result.url + "\n");
    }
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\nUse --help for usage.\n`);
    process.exitCode = 1;
  }
}
