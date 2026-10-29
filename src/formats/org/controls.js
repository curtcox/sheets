import { CONTROL_KINDS, CONTROL_LIMITS, sliderBounds } from "../../controls.js";

// #+SHEETS_CONTROL: <constant> <kind> [<min>..<max>] [step <n>] [label "<text>"]
// Emacs ignores the keyword, so annotated documents calculate identically there.
const namePattern = /^[A-Za-z][A-Za-z0-9_]*$/;
export const ORG_NUMBER = {
  pattern: String.raw`^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$`,
  patternFlags: "i",
  patternMessage: "Enter a decimal number, such as 12.5 or 1e3.",
};

function tokens(text) {
  const result = [];
  for (const match of text.matchAll(/"([^"]*)"|("[^"]*$)|(\S+)/g)) {
    if (match[2] !== undefined) throw new Error("Close the quoted label.");
    result.push(match[1] !== undefined ? { quoted: match[1] } : { word: match[3] });
  }
  return result;
}

function parseControl(value) {
  const [target, kind, ...rest] = tokens(value.trim());
  if (!target?.word || !kind?.word)
    throw new Error('Use SHEETS_CONTROL: <constant> <checkbox|slider|text> [min..max] [step n] [label "text"].');
  const name = target.word, type = kind.word.toLowerCase();
  if (/^[@$]/.test(name)) throw new Error("Table-field controls are not supported yet; control a #+CONSTANTS: value.");
  if (name.includes(".")) throw new Error("Shared inputs are read-only; controls edit this document's #+CONSTANTS: values.");
  if (!namePattern.test(name)) throw new Error(`Invalid constant name ${name}.`);
  if (type === "date") throw new Error("Date controls need Org date arithmetic, which is not supported yet.");
  if (!CONTROL_KINDS.includes(type)) throw new Error(`Unsupported control kind ${kind.word}. Use checkbox, slider or text.`);
  const control = { name, kind: type };
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    const range = /^(.+?)\.\.(.+)$/.exec(token.word || "");
    if (range && control.min === undefined) [control.min, control.max] = [range[1], range[2]];
    else if (token.word?.toLowerCase() === "step" && rest[i + 1]?.word && control.step === undefined)
      control.step = rest[++i].word;
    else if (token.word?.toLowerCase() === "label" && rest[i + 1]?.quoted !== undefined && control.label === undefined) {
      control.label = rest[++i].quoted;
      if (control.label.length > CONTROL_LIMITS.label)
        throw new Error(`Labels are limited to ${CONTROL_LIMITS.label} characters.`);
    } else throw new Error(`Unexpected control option ${token.word ?? `"${token.quoted}"`}.`);
  }
  if (type === "slider") {
    if (control.min === undefined) throw new Error("Slider controls need a range such as 0..100.");
    Object.assign(control, sliderBounds(control.min, control.max, control.step));
  } else if (control.min !== undefined || control.step !== undefined)
    throw new Error(`${type[0].toUpperCase()}${type.slice(1)} controls take no range or step.`);
  return control;
}

/** Locate a constant's value token on its #+CONSTANTS: line; the last one wins, as in bindings. */
function constantSpan(lineText, name) {
  const prefix = /^\s*#\+CONSTANTS:/i.exec(lineText);
  if (!prefix) return null;
  let span = null;
  for (const match of lineText.slice(prefix[0].length).matchAll(/\S+/g))
    if (match[0].startsWith(`${name}=`))
      span = { column: prefix[0].length + match.index + name.length + 1, text: match[0].slice(name.length + 1) };
  return span;
}

export function orgControls(nodes, { constantEntries }, lines, diagnostics) {
  const constants = new Map(constantEntries.map((entry) => [entry.name, entry])),
    controls = [],
    seen = new Set();
  for (const node of nodes.sort((a, b) => a.position.start.line - b.position.start.line)) {
    const line = node.position.start.line;
    try {
      if (controls.length >= CONTROL_LIMITS.controls)
        throw new Error(`A document can declare at most ${CONTROL_LIMITS.controls} controls.`);
      const control = parseControl(node.value || ""), entry = constants.get(control.name);
      if (!entry) throw new Error(`No file constant $${control.name}; controls edit #+CONSTANTS: values.`);
      if (seen.has(control.name)) throw new Error(`Duplicate control for $${control.name}; the first one is used.`);
      if (!entry.valid) throw new Error(`$${control.name} is not a supported numeric constant.`);
      const span = constantSpan(lines[entry.line - 1] || "", control.name);
      if (!span || span.text !== entry.value) throw new Error(`Cannot locate $${control.name} on line ${entry.line}.`);
      if (control.kind === "checkbox" && !["0", "1"].includes(entry.value))
        throw new Error(`Checkbox control $${control.name} needs the value 0 or 1.`);
      if (control.kind === "slider" && !(Number(entry.value) >= Number(control.min) && Number(entry.value) <= Number(control.max)))
        diagnostics.push({ line, severity: "warning", message: `$${control.name} = ${entry.value} is outside the slider range ${control.min}..${control.max}.` });
      seen.add(control.name);
      controls.push({
        id: `org-constant:${control.name}`,
        kind: control.kind,
        label: control.label ?? `$${control.name}`,
        value: entry.value,
        line,
        edit: { line: entry.line, column: span.column, length: span.text.length, text: span.text },
        ...(control.kind === "slider" ? { min: control.min, max: control.max, step: control.step } : {}),
        ...(control.kind === "checkbox" ? { on: "1", off: "0" } : {}),
        ...(control.kind === "text" ? { ...ORG_NUMBER, inputMode: "decimal" } : {}),
      });
    } catch (error) {
      diagnostics.push({ line, message: `SHEETS_CONTROL: ${error.message}` });
    }
  }
  return controls;
}
