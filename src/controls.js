import { escapeHTML } from "./util.js";

// Preview controls. Engines describe controls as plain data; the DOM only
// carries each control's id. Every write is validated against the descriptor.
export const CONTROL_LIMITS = Object.freeze({ controls: 64, label: 200, text: 1000, steps: 1000000 });
export const CONTROL_KINDS = Object.freeze(["checkbox", "slider", "text"]);
export const INPUT_TYPES = Object.freeze({ checkbox: "checkbox", slider: "range", text: "text" });
const decimalPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
const places = (text) => (/\.(\d*)$/.exec(text)?.[1].length ?? 0);

/** Parse slider bounds; numbers are finite decimals without exponents. */
export function sliderBounds(min, max, step = "1") {
  for (const [name, value] of [["minimum", min], ["maximum", max], ["step", step]])
    if (!decimalPattern.test(value)) throw new Error(`Slider ${name} must be a decimal number.`);
  const [low, high, size] = [min, max, step].map(Number);
  if (!(low < high)) throw new Error("Slider minimum must be less than its maximum.");
  if (!(size > 0)) throw new Error("Slider step must be greater than zero.");
  if ((high - low) / size > CONTROL_LIMITS.steps)
    throw new Error(`A slider can have at most ${CONTROL_LIMITS.steps.toLocaleString("en-US")} steps.`);
  return { min, max, step };
}

/** Snap a browser range value to the declared grid, keeping decimal text exact. */
export function sliderText({ min, max, step }, value) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error("Slider value must be a number.");
  const low = Number(min), size = Number(step), digits = Math.max(places(min), places(step));
  let n = Math.round((Math.min(Math.max(number, low), Number(max)) - low) / size);
  if (low + n * size > Number(max) + size * 1e-9) n--;
  return (low + n * size).toFixed(digits).replace(/^-(0(?:\.0*)?)$/, "$1");
}

/** Convert an input's state to source text, or throw a message for the reader. */
export function controlText(control, value) {
  switch (control.kind) {
    case "checkbox":
      return value ? control.on : control.off;
    case "slider":
      return sliderText(control, value);
    case "text": {
      const text = String(value).trim();
      if (!text) throw new Error("Enter a value.");
      if (text.length > CONTROL_LIMITS.text) throw new Error(`Values are limited to ${CONTROL_LIMITS.text} characters.`);
      if (/[\r\n]/.test(text)) throw new Error("Values must fit on one line.");
      if (control.pattern && !new RegExp(control.pattern, control.patternFlags || "").test(text))
        throw new Error(control.patternMessage || "Unsupported value.");
      return text;
    }
    default:
      throw new Error(`Unsupported control kind ${control.kind}.`);
  }
}

function lineOffset(source, line) {
  let offset = 0;
  for (let current = 1; current < line; current++) {
    offset = source.indexOf("\n", offset) + 1;
    if (!offset) throw new Error("Control line is outside the source.");
  }
  return offset;
}

/**
 * Replace a control's value span. `edit` is {line (one-based), column, length, text},
 * where text is what the span currently holds; a mismatch means the source moved on.
 */
export function applyControlEdit(source, edit, text) {
  const start = lineOffset(source, edit.line) + edit.column;
  if (source.slice(start, start + edit.length) !== edit.text)
    throw new Error("The source changed; wait for the preview to update.");
  return source.slice(0, start) + text + source.slice(start + edit.length);
}

/** Descriptors after an edit, before the next render supplies fresh spans. */
export function shiftControls(controls, edit, text) {
  const delta = text.length - edit.length;
  return controls.map((control) => {
    const other = control.edit;
    if (other.line === edit.line && other.column === edit.column)
      return { ...control, value: text, edit: { ...other, length: text.length, text } };
    if (other.line === edit.line && other.column > edit.column)
      return { ...control, edit: { ...other, column: other.column + delta } };
    return control;
  });
}

export function controlHTML(control) {
  const id = escapeHTML(control.id),
    label = `<span class="sheet-control-label">${escapeHTML(control.label)}</span>`,
    error = `<span class="sheet-control-error" data-control-error="${id}" aria-live="polite"></span>`;
  if (control.kind === "checkbox")
    return `<div class="sheet-control sheet-control-checkbox"><label><input type="checkbox" data-control="${id}"${control.value === control.on ? " checked" : ""}> ${label}</label>${error}</div>`;
  if (control.kind === "slider")
    return `<div class="sheet-control sheet-control-slider"><label>${label} <input type="range" data-control="${id}" min="${escapeHTML(control.min)}" max="${escapeHTML(control.max)}" step="${escapeHTML(control.step)}" value="${escapeHTML(control.value)}"></label> <output data-control-output="${id}">${escapeHTML(control.value)}</output>${error}</div>`;
  return `<div class="sheet-control sheet-control-text"><label>${label} <input type="text" data-control="${id}" value="${escapeHTML(control.value)}" spellcheck="false" autocomplete="off"${control.inputMode ? ` inputmode="${escapeHTML(control.inputMode)}"` : ""}></label>${error}</div>`;
}
