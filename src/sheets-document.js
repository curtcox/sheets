// Consumer-owned Sheets v1/v2/v3 schemas; the shared kit owns transport.
import {bytes} from '../vendor/fragment-kit-v0.3.5/src/core/bytes.js';
import {validateProfile} from './compatibility-profiles.js';
import {validateProjectDocument} from './project-state.js';
export const sheetsDocument={MAX_BYTES:5*1024*1024,bytes,
  serialize({ src, type, view = "split", profile, inputSnapshot }) {
    if (
      typeof src !== "string" ||
      ![
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
      ].includes(type)
    )
      throw new Error("Choose a format before saving.");
    validateProfile(profile, type);
    const project = inputSnapshot === undefined ? undefined : validateProjectDocument({ src, type, view, profile, inputSnapshot });
    const payload = JSON.stringify({
      format: "sheets-document",
      version: project ? 3 : profile ? 2 : 1,
      type,
      src,
      view,
      ...(profile ? { profile } : {}),
      ...(project ? { inputSnapshot: project.inputSnapshot } : {}),
    });
    if (this.bytes(payload).length > this.MAX_BYTES)
      throw new Error("Source exceeds the 5 MiB HashBin limit.");
    return payload;
  },
  parse(text) {
    if (this.bytes(text).length > this.MAX_BYTES)
      throw new Error("Saved source exceeds the 5 MiB limit.");
    let doc;
    try {
      doc = JSON.parse(text);
    } catch {
      /* Plain source. */
    }
    if (doc?.format !== "sheets-document")
      return { src: text, type: null, view: "split" };
    if (![1, 2, 3].includes(doc.version))
      throw new Error("Unsupported saved document version.");
    if (typeof doc.src !== "string")
      throw new Error("Saved document has no source.");
    if (doc.version === 3) return validateProjectDocument(doc);
    const type = [
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
    ].includes(doc.type)
      ? doc.type
      : null;
    if (doc.version === 2 && (!type || typeof doc.profile !== "string"))
      throw new Error(
        "Saved document version 2 needs a format and compatibility profile.",
      );
    const profile =
      doc.version === 2 ? validateProfile(doc.profile, type) : undefined;
    return {
      src: doc.src,
      type,
      view: ["split", "source", "preview"].includes(doc.view)
        ? doc.view
        : "split",
      ...(profile ? { profile } : {}),
    };
  },
};
