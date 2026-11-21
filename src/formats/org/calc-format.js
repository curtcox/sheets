// Reading and printing Calc numbers: Elisp string-to-number, Org formula modes,
// Calc's float display and Elisp (format FMT NUMBER).
import { abs, fail, frac, int, makeFloat, negative, numdigs, scaleRounding } from "./calc-number.js";

export function readNumber(text, prec) {
  const m = /^(\d*)(?:\.(\d*))?(?:[eE]([-+]?\d+))?$/.exec(text);
  if (m[2] === undefined && m[3] === undefined) return int(BigInt(m[1]));
  const digits = (m[1] || "") + (m[2] || "");
  return makeFloat(
    BigInt(digits || "0"),
    Number(m[3] || 0) - (m[2] || "").length,
    prec,
  );
}

// org-table-make-reference with Elisp string-to-number / number-to-string.
export function elispNumber(text) {
  const m = /^[ \t\n\r\f]*([-+]?)(\d*)(?:\.(\d*))?(?:[eE]([-+]?\d+))?/.exec(
    text,
  );
  const [, sign, whole, fraction, exponent] = m;
  const hasDigits = whole || fraction;
  if (hasDigits && (fraction || (exponent !== undefined && hasDigits)))
    return {
      float: Number(`${sign}${whole || 0}.${fraction || 0}e${exponent || 0}`),
    };
  if (whole) return { int: BigInt(sign + whole) };
  return { int: 0n };
}
export function numberText(text) {
  const n = elispNumber(text);
  if (n.int !== undefined) return n.int.toString();
  if (!Number.isFinite(n.float)) fail("Numeric conversion is not finite.");
  return n.float.toExponential();
}

export function parseModes(raw, globalFormat) {
  const modes = {
    prec: 12,
    float: ["float", 8],
    angle: "deg",
    frac: false,
    numbers: false,
    keepEmpty: false,
    printf: null,
  };
  if (raw === null || raw === undefined) return modes;
  let fmt = (globalFormat ?? "") + raw,
    m;
  while ((m = /([pnfse])(-?\d+)/.exec(fmt))) {
    const n = Number(m[2]);
    if (m[1] === "p") {
      if (n < 1 || n > 100)
        fail("Calc precision p must be between 1 and 100 in Sheets.");
      modes.prec = n;
    } else
      modes.float = [{ n: "float", f: "fix", s: "sci", e: "eng" }[m[1]], n];
    fmt = fmt.slice(0, m.index) + fmt.slice(m.index + m[0].length);
  }
  while ((m = /[tTUNLEDRFSu]/.exec(fmt))) {
    const c = m[0];
    if ("tTU".includes(c)) fail(`Duration mode ;${c} is unsupported.`);
    if (c === "S") fail("Symbolic mode ;S is unsupported.");
    if (c === "u") fail("Unit simplification mode ;u is unsupported.");
    if (c === "N") modes.numbers = true;
    if (c === "E") modes.keepEmpty = true;
    if (c === "D") modes.angle = "deg";
    if (c === "R") modes.angle = "rad";
    if (c === "F") modes.frac = true;
    // L only changes Emacs Lisp formulas; Calc formulas ignore it.
    fmt = fmt.slice(0, m.index) + fmt.slice(m.index + 1);
  }
  if (/\S/.test(fmt)) {
    printfSpec(fmt);
    modes.printf = fmt;
  }
  return modes;
}

// Evaluate one formula. refs[i] is {field: text}, {range: [texts]} or
// {constant: text}; formula placeholders are \uE000i\uE001.

export function formatCalc(value, modes) {
  const [kind, figsSetting] = modes.float;
  const prec = modes.prec;
  const text = (x) => {
    if (x.t === "int") return x.v.toString();
    if (x.t === "frac") return `${x.n}:${x.d}`;
    if (x.t === "nan") return "nan";
    if (x.t === "vec") return `[${x.items.map(text).join(", ")}]`;
    return formatFloat(x.m, x.e, kind, figsSetting, prec);
  };
  const ev = text(value);
  return modes.printf ? printf(modes.printf, elispNumber(ev)).trim() : ev;
}

// calc.el math-format-number for decimal floats, default sci-high 0 / sci-low -3.
export function formatFloat(mant, exp, kind, figs, prec) {
  if (mant < 0n) return "-" + formatFloat(-mant, exp, kind, figs, prec);
  if (
    kind === "fix" &&
    ((figs < 0 && (figs = -figs)) || exp + numdigs(mant) > -figs)
  ) {
    let str = scaleRounding(mant, exp + figs).toString();
    if (str.length <= figs) str = "0".repeat(figs + 1 - str.length) + str;
    return figs > 0 ? `${str.slice(0, -figs)}.${str.slice(-figs)}` : `${str}.`;
  }
  if (figs < 0) figs += prec;
  if (figs > 0) {
    const adj = figs - (mant === 0n ? 0 : numdigs(mant));
    if (adj < 0) {
      mant = scaleRounding(mant, adj);
      exp -= adj;
    }
  }
  let str = mant.toString();
  const len = str.length,
    dpos = exp + len;
  if (kind === "float" && dpos <= prec && dpos >= -1) {
    if (dpos === 0) return `0.${str}`;
    if (exp <= 0 && dpos > 0) return `${str.slice(0, dpos)}.${str.slice(dpos)}`;
    if (exp > 0) return `${str}${"0".repeat(exp)}.`;
    return `0.${"0".repeat(-dpos)}${str}`;
  }
  const eadj = exp + len,
    scale = kind === "eng" ? 1 + ((((eadj + 300002) % 3) + 3) % 3) : 1;
  if (scale > str.length) str += "0".repeat(scale - str.length);
  if (scale < str.length) str = `${str.slice(0, scale)}.${str.slice(scale)}`;
  return `${str}e${eadj - scale}`;
}

// --- Elisp (format FMT NUMBER) for Org's printf-style mode suffix ---
function printfSpec(fmt) {
  const specs = [
    ...fmt.matchAll(/%(?:%|([-+ #0]*)(\d+)?(?:\.(\d+))?([a-zA-Z]))/g),
  ].filter((m) => m[0] !== "%%");
  if (specs.length !== 1)
    fail(`Format "${fmt}" must contain exactly one numeric conversion.`);
  if (!"dfeg".includes(specs[0][4]))
    fail(
      `Format conversion %${specs[0][4]} is unsupported; use %d, %f, %e or %g.`,
    );
  return specs[0];
}
function exactDecimal(number) {
  if (number.int !== undefined)
    return { negative: number.int < 0n, digits: abs(number.int), scale: 0 };
  const x = number.float;
  if (!Number.isFinite(x)) fail("Cannot format a non-finite number.");
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, x);
  const hi = view.getUint32(0),
    lo = view.getUint32(4),
    negative = hi >>> 31 === 1,
    biased = (hi >>> 20) & 0x7ff;
  let mantissa = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo),
    e = biased - 1075;
  if (biased) mantissa |= 1n << 52n;
  else e = -1074;
  if (e >= 0) return { negative, digits: mantissa << BigInt(e), scale: 0 };
  return { negative, digits: mantissa * 5n ** BigInt(-e), scale: -e };
}
function roundEven(digits, scale, keep) {
  // Round digits/10^scale to `keep` decimal places, ties to even.
  if (keep >= scale) return digits * 10n ** BigInt(keep - scale);
  const divisor = 10n ** BigInt(scale - keep),
    q = digits / divisor,
    r = digits % divisor,
    twice = r * 2n;
  return twice > divisor || (twice === divisor && q % 2n === 1n) ? q + 1n : q;
}
function fixed(d, places) {
  const s = roundEven(d.digits, d.scale, places)
    .toString()
    .padStart(places + 1, "0");
  return places ? `${s.slice(0, -places)}.${s.slice(-places)}` : s;
}
function exponential(d, places) {
  if (d.digits === 0n) return { mantissa: fixed(d, places), exponent: 0 };
  let exponent = d.digits.toString().length - 1 - d.scale;
  const scaledAt = (e) => roundEven(d.digits, d.scale + e - places, 0);
  let scaled = scaledAt(exponent);
  if (scaled.toString().length > places + 1) scaled = scaledAt(++exponent);
  const s = scaled.toString();
  return {
    mantissa: places ? `${s[0]}.${s.slice(1)}` : s,
    exponent,
  };
}
const expText = (n) =>
  `e${n < 0 ? "-" : "+"}${String(Math.abs(n)).padStart(2, "0")}`;
function printf(fmt, number) {
  const spec = printfSpec(fmt),
    [, flags = "", width, precision, conversion] = spec;
  const d = exactDecimal(number);
  let body;
  if (conversion === "d")
    body = (number.int ?? BigInt(Math.trunc(number.float)))
      .toString()
      .replace("-", "");
  else if (conversion === "f")
    body = fixed(d, precision === undefined ? 6 : Number(precision));
  else if (conversion === "e") {
    const e = exponential(d, precision === undefined ? 6 : Number(precision));
    body = e.mantissa + expText(e.exponent);
  } else {
    const p = precision === undefined ? 6 : Math.max(1, Number(precision));
    const e = exponential(d, p - 1);
    body =
      e.exponent < p && e.exponent >= -4
        ? fixed(d, p - 1 - e.exponent)
        : e.mantissa + expText(e.exponent);
    if (!flags.includes("#") && body.includes("."))
      body = body.replace(/\.?0+(?=e|$)/, "");
  }
  const isNegative =
    conversion === "d"
      ? (number.int ?? BigInt(Math.trunc(number.float))) < 0n
      : d.negative;
  const sign = isNegative ? "-" : flags.includes("+") ? "+" : "";
  let out = sign + body;
  if (width && flags.includes("0") && !flags.includes("-"))
    out = sign + body.padStart(Number(width) - sign.length, "0");
  return (
    fmt.slice(0, spec.index).replace(/%%/g, "%") +
    out +
    fmt.slice(spec.index + spec[0].length).replace(/%%/g, "%")
  );
}
