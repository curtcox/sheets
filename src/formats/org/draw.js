// In-cell bars from org-table.el: orgtbl-ascii-draw and its two Unicode
// variants, the formulas orgtbl-ascii-plot inserts. These three calls are the
// only Emacs Lisp formulas Sheets evaluates. Arguments may be literal numbers,
// literal strings or field references, substituted the way
// org-table-make-reference substitutes them for Lisp formulas.
import { elispNumber } from "./calc.js";

const FUNCTIONS = {
  "orgtbl-ascii-draw": { most: 5, characters: null },
  "orgtbl-uc-draw-grid": { most: 4, characters: " ▏▎▍▌▋▊▉" },
  "orgtbl-uc-draw-cont": { most: 4, characters: " ▏▎▍▌▋▊▉█" },
};
const DEFAULT_CHARACTERS = " .:;c!lhVHW";
export const DRAW_MAX_LENGTH = 1000;

// An Emacs error inside the formula: Org writes #ERROR into the field.
class LispError extends Error {}
const lispFail = (message) => {
  throw new LispError(message);
};
const unsupported = (message) => {
  throw new Error(message);
};

export const isLispFormula = (expression) => /^\s*'/.test(expression);

// The mode suffix as org-table-eval-formula reads it for a Lisp formula. Calc
// modes do not affect Lisp; durations, ;L and printf formats are unsupported.
export function lispModes(raw, globalFormat) {
  const modes = { numbers: false };
  if (raw === null || raw === undefined) return modes;
  let fmt = ((globalFormat ?? "") + raw).replace(/[pnfse]-?\d+/g, "");
  for (const c of fmt.match(/[tTUNLEDRFSu]/g) || []) {
    if ("tTU".includes(c)) unsupported(`Duration mode ;${c} is unsupported in in-cell bar formulas.`);
    if (c === "L") unsupported("Literal mode ;L is unsupported in in-cell bar formulas; use ;N or none.");
    if (c === "N") modes.numbers = true;
  }
  if (/\S/.test(fmt.replace(/[tTUNLEDRFSu]/g, "")))
    unsupported("A printf format on an in-cell bar formula is unsupported; Emacs would format the bar as a number.");
  return modes;
}

// Elisp reader syntax for numbers. "1." reads as the integer 1.
function readLispNumber(token) {
  if (/^[-+]?\d+\.?$/.test(token)) return { int: BigInt(token.replace(/\.$/, "")) };
  if (/^[-+]?(?:\d*\.\d+(?:e[-+]?\d+)?|\d+(?:\.\d*)?e[-+]?\d+)$/i.test(token))
    return { float: Number(token) };
  return null;
}

function tokens(text) {
  const out = [],
    pattern = /\s*(?:"((?:[^"\\]|\\.)*)"|([^\s()"]+))/y;
  text = text.trimEnd();
  while (pattern.lastIndex < text.length) {
    const match = pattern.exec(text);
    if (!match)
      unsupported("In-cell bar arguments must be literal numbers, strings or field references.");
    if (match[1] !== undefined) out.push({ string: match[1].replace(/\\(.)/g, "$1") });
    else out.push({ atom: match[2] });
  }
  return out;
}

// Parse `'(name args…)` into the function name and argument tokens.
export function parseDraw(expression) {
  const match = /^\s*'\(\s*([^\s()]+)((?:[^()"]|"(?:[^"\\]|\\.)*")*)\)\s*$/.exec(expression);
  if (!match || !FUNCTIONS[match[1]])
    unsupported("Emacs Lisp formulas are unsupported, except orgtbl-ascii-draw, orgtbl-uc-draw-grid and orgtbl-uc-draw-cont.");
  return { name: match[1], args: tokens(match[2]) };
}

const isReference = (atom) =>
  /^(?:@(?:[+-]?\d+|[<>])\$(?:[+-]?\d+|[<>])|\$(?:[+-]?\d+|[<>])|\$[A-Za-z][A-Za-z0-9_]*)$/.test(atom);

// Each argument becomes an Elisp value: {int}, {float} or {string}.
// `resolve(ref)` returns {field: text} or, for a file constant, {constant: text}.
function argument(token, resolve, modes) {
  if (token.string !== undefined) return { string: token.string };
  const number = readLispNumber(token.atom);
  if (number) return number;
  if (!isReference(token.atom))
    unsupported(`In-cell bar argument ${token.atom} is unsupported; use a literal number, string or field reference.`);
  const value = resolve(token.atom);
  if (value.constant !== undefined) {
    // Org substitutes constant text into the formula before reading it.
    const literal = readLispNumber(value.constant.trim());
    if (!literal) lispFail(`constant ${token.atom} is not a number`);
    return literal;
  }
  return modes.numbers ? elispNumber(value.field) : { string: value.field };
}

const isNumber = (value) => value.int !== undefined || value.float !== undefined;
const toFloat = (value) => (value.int !== undefined ? Number(value.int) : value.float);

// Elisp `round` on a float: ties go to the even integer.
function roundEven(x) {
  if (!Number.isFinite(x)) lispFail("the bar length overflowed");
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

function ceiling(value) {
  if (value.int !== undefined) return Number(value.int);
  if (!Number.isFinite(value.float)) lispFail("the width overflowed");
  return Math.ceil(value.float);
}

export function evaluateDraw(expression, resolve, modes) {
  const { name, args } = parseDraw(expression),
    spec = FUNCTIONS[name];
  const values = args.map((token) => argument(token, resolve, modes));
  if (values.length < 3 || values.length > spec.most)
    lispFail(`${name} takes 3 to ${spec.most} arguments`);
  const [raw, min, max, width = null, characterArg] = values;
  if (!isNumber(raw) && raw.string === undefined) lispFail("the value is not a number or string");
  if (!isNumber(min) || !isNumber(max))
    lispFail(`min and max must be numbers${modes.numbers ? "" : "; field arguments are strings unless the formula ends with ;N"}`);
  const cells = width === null ? 12 : isNumber(width) ? ceiling(width) : lispFail("the width must be a number");
  let characters = spec.characters ?? DEFAULT_CHARACTERS;
  if (characterArg !== undefined) {
    if (characterArg.string === undefined) lispFail("the characters must be a string");
    characters = characterArg.string;
  }
  characters = [...characters];
  const len = characters.length - 1,
    value = raw.string !== undefined ? toFloat(elispNumber(raw.string)) : toFloat(raw),
    span =
      min.int !== undefined && max.int !== undefined
        ? Number(max.int - min.int)
        : toFloat(max) - toFloat(min),
    relative = (value - toFloat(min)) / span;
  if (span === 0) lispFail("min and max are equal");
  const steps = roundEven(relative * cells * len);
  if (steps < 0) return "too small";
  if (steps > cells * len) return "too large";
  if (len === 0) lispFail("division by zero: characters needs at least two characters");
  const whole = Math.trunc(steps / len),
    remainder = steps - whole * len;
  if (whole < 0 || remainder < 0 || remainder > len) lispFail("the characters string is empty");
  if (whole > DRAW_MAX_LENGTH)
    unsupported(`In-cell bars longer than ${DRAW_MAX_LENGTH} characters are not drawn.`);
  // Org trims the field when it aligns the table.
  return (characters[len].repeat(whole) + characters[remainder]).trim();
}

export { LispError };
