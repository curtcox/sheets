import { parseCalc, MAX_CALC_LENGTH } from "./calc.js";

const reference = String.raw`(?:@(?:[+-]?\d+|[<>]|[IVX]+)(?:\$(?:[+-]?\d+|[<>]))?|\$(?:[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)?|[+-]?\d+|[<>]))`;
const ranges = new RegExp(`${reference}\\.\\.${reference}`, "g");
const references = new RegExp(reference, "g");
const placeholder = "\uE0000\uE001";
export const PRECEDENCE_HINT = "Calc multiplies before dividing: a/b*c means a/(b*c). Add parentheses to make the intended grouping explicit.";

// Inspect formula syntax once, never substituted cell data or evaluated values.
// A malformed/unsupported expression keeps its normal calculation diagnostic.
export function hasDivisionProduct(expression) {
  if (expression.length > MAX_CALC_LENGTH || /^\s*'/.test(expression)) return false;
  const masked = expression
    .replace(/\bremote\s*\(([^(),]*),([^()]*)\)/g, placeholder)
    .replace(ranges, placeholder)
    .replace(references, placeholder);
  let found = false;
  try {
    parseCalc(masked, { onDivisionProduct: () => { found = true; } });
  } catch { /* Hints do not diagnose or repair unsupported syntax. */ }
  return found;
}

export function formulaPrecedenceHints(formula, line) {
  for (const part of formula.split("::")) {
    const match = /^\s*([^=]+)=(.*)$/.exec(part);
    if (!match) continue;
    const split = match[2].lastIndexOf(";"),
      expression = split < 0 ? match[2] : match[2].slice(0, split);
    if (hasDivisionProduct(expression))
      return [{ line, severity: "info", message: PRECEDENCE_HINT }];
  }
  return [];
}
