// Exact integers, rationals and Calc decimal floats (calc.el math-make-float,
// math-scale-rounding) shared by the Org Calc parser, evaluator and printer.
export const MAX_DIGITS = 10000,
  MAX_NODES = 1000,
  MAX_DEPTH = 200;
export const MAX_CALC_LENGTH = 4000;
export const sym = (name) => ({ t: "sym", name });
export const NAN = { t: "nan" };
export const int = (v) => ({ t: "int", v });
export const isZero = (x) =>
  (x.t === "int" && x.v === 0n) || (x.t === "float" && x.m === 0n);
export const numdigs = (m) => (m < 0n ? -m : m).toString().length;
export const abs = (v) => (v < 0n ? -v : v);
const gcd = (a, b) => {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
export const fail = (message) => {
  throw new Error(message);
};
export function checkInt(v) {
  if (numdigs(v) > MAX_DIGITS)
    fail(`Integer result exceeds ${MAX_DIGITS} digits.`);
  return int(v);
}

// --- Calc float primitives (calc.el math-make-float/math-scale-rounding) ---
export function scaleRounding(a, n) {
  if (n >= 0) return a * 10n ** BigInt(n);
  if (a < 0n) return -scaleRounding(-a, n);
  return (a / 10n ** BigInt(-1 - n) + 5n) / 10n;
}
export function makeFloat(mant, exp, prec) {
  if (mant === 0n) return { t: "float", m: 0n, e: 0 };
  const ldiff = prec - numdigs(mant);
  if (ldiff < 0) {
    mant = scaleRounding(mant, ldiff);
    exp -= ldiff;
  }
  while (mant % 10n === 0n) {
    mant /= 10n;
    exp++;
  }
  if (Math.abs(exp) > 1000000) fail("Calc float exponent is out of range.");
  return { t: "float", m: mant, e: exp };
}
export const frac = (n, d) => {
  if (d === 0n) fail("Division by zero.");
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d);
  [n, d] = [n / g, d / g];
  return d === 1n ? int(n) : { t: "frac", n, d };
};
export function toFloat(x, prec) {
  if (x.t === "int") return makeFloat(x.v, 0, prec);
  if (x.t === "frac")
    return divFloat(makeFloat(x.n, 0, prec), makeFloat(x.d, 0, prec), prec);
  return x;
}
export function addFloat(a, b, prec) {
  let ediff = a.e - b.e;
  if (ediff >= 0) {
    if (ediff >= prec + prec) return a;
    return makeFloat(b.m + a.m * 10n ** BigInt(ediff), b.e, prec);
  }
  ediff = -ediff;
  if (ediff >= prec + prec) return b;
  return makeFloat(a.m + b.m * 10n ** BigInt(ediff), a.e, prec);
}
export const mulFloat = (a, b, prec) => makeFloat(a.m * b.m, a.e + b.e, prec);
export function divFloat(a, b, prec) {
  if (b.m === 0n) fail("Division by zero.");
  const ldiff = Math.max(prec + 1 - (numdigs(a.m) - numdigs(b.m)), 0);
  return makeFloat((a.m * 10n ** BigInt(ldiff)) / b.m, a.e - b.e - ldiff, prec);
}
export const normalize = (x, prec) =>
  x.t === "float"
    ? makeFloat(x.m, x.e, prec)
    : x.t === "vec"
      ? { t: "vec", items: x.items.map((i) => normalize(i, prec)) }
      : x;

// Exact rational view used for comparisons and floor/trunc.
export const rational = (x) =>
  x.t === "int"
    ? [x.v, 1n]
    : x.t === "frac"
      ? [x.n, x.d]
      : x.e >= 0
        ? [x.m * 10n ** BigInt(x.e), 1n]
        : [x.m, 10n ** BigInt(-x.e)];
export function compare(a, b) {
  // Compare magnitudes before aligning decimal exponents. This keeps a test
  // such as 1e1000000 > 1 from allocating a million-digit power of ten.
  const parts = (x) =>
    x.t === "float" ? [x.m, 1n, x.e] : [...rational(x), 0];
  const [an, ad, ae] = parts(a),
    [bn, bd, be] = parts(b),
    l = an * bd,
    r = bn * ad;
  const sign = (v) => (v < 0n ? -1 : v > 0n ? 1 : 0);
  if (sign(l) !== sign(r)) return sign(l) < sign(r) ? -1 : 1;
  if (l === 0n) return 0;
  const lm = numdigs(abs(l)) + ae,
    rm = numdigs(abs(r)) + be;
  if (lm !== rm) return (lm < rm ? -1 : 1) * sign(l);
  const left = ae > be ? l * 10n ** BigInt(ae - be) : l,
    right = be > ae ? r * 10n ** BigInt(be - ae) : r;
  return left < right ? -1 : left > right ? 1 : 0;
}
export const negative = (x) => rational(x)[0] < 0n;

export function scalar(x, what) {
  if (x.t === "sym")
    fail(
      `Calc leaves ${x.name} symbolic; Sheets supports numeric results only. Use ;N to treat nonnumeric fields as zero.`,
    );
  if (x.t === "vec") fail(`${what} does not accept a vector here.`);
  return x;
}
