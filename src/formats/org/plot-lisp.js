// The Emacs Lisp values org-plot reads from #+PLOT: options, and the error
// text Emacs reports for them, shared by the org-plot emulation modules.

/** org-table-to-lisp's 'hline row marker. */
export const HLINE = null;

/** A Lisp symbol read from an option value. Strings stay JavaScript strings. */
export const sym = (name) => ({ sym: name });
export const symbolName = (value) => (value && typeof value === "object" && "sym" in value ? value.sym : undefined);
function readAtom(token) {
  if (/^[+-]?\d+\.?$/.test(token)) return Number.parseInt(token, 10);
  if (/^[+-]?(?:\d*\.\d+|\d+(?:\.\d*)?e[+-]?\d+)$/i.test(token)) return Number(token);
  if (token === "nil") return null;
  if (/^['`,#?[\]()"\\]/.test(token)) throw new Error(`Cannot read the option value ${token}.`);
  return sym(token);
}
function readString(body) {
  return body.replace(/\\(.)/gs, (_, c) => ({ n: "\n", t: "\t", r: "\r", s: " ", e: "\x1b", a: "\x07", f: "\f", "\n": "" })[c] ?? c);
}
/** `read-from-string` for the value shapes org-plot's option regexp can capture. */
export function readLisp(text) {
  if (!text) throw new Error("End of file during parsing");
  if (text.startsWith('"')) return readString(text.slice(1, -1));
  if (text.startsWith("(")) {
    const items = [];
    for (const m of text.slice(1, -1).matchAll(/"((?:[^"\\]|\\.)*)"|([^\s"]+)/g))
      items.push(m[1] !== undefined ? readString(m[1]) : readAtom(m[2]));
    return items.length ? items : null;
  }
  // read-from-string reads only the first expression of an atom token.
  return readAtom(text.split(/(?=[("'])/)[0] || text);
}

export const wrongType = (predicate, value) => new Error(`Wrong type argument: ${predicate}, ${lispText(value)}`);
export const stringName = (value) => (typeof value === "string" ? value : symbolName(value));
export const lispText = (value) =>
  Array.isArray(value) ? `(${value.map(lispText).join(" ")})` : value === null ? "nil" : typeof value === "object" ? value.sym : String(value);

/** Normalize Lisp values to the JSON the Emacs harness writes. */
export function lispJSON(value) {
  if (Array.isArray(value)) return value.map(lispJSON);
  if (value && typeof value === "object") return value.sym;
  return value;
}
