// A DOM-free subset of Emacs Calc as used by Org table formulas. It follows
// calc.el/calc-misc.el/calc-math.el: exact integers, decimal floats rounded to
// calc-internal-prec digits, Calc operator precedence, org-calc-default-modes
// and Calc's float display. Symbolic algebra, units, dates, intervals and complex
// numbers are rejected with diagnostics rather than approximated.
import Decimal from "../../../vendor/decimal.js";

const MAX_DIGITS = 10000,
  MAX_NODES = 1000,
  MAX_DEPTH = 200,
  MAX_LENGTH = 4000;
const sym = (name) => ({ t: "sym", name });
const NAN = { t: "nan" };
const int = (v) => ({ t: "int", v });
const isZero = (x) =>
  (x.t === "int" && x.v === 0n) || (x.t === "float" && x.m === 0n);
const numdigs = (m) => (m < 0n ? -m : m).toString().length;
const abs = (v) => (v < 0n ? -v : v);
const gcd = (a, b) => {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
const fail = (message) => {
  throw new Error(message);
};
function checkInt(v) {
  if (numdigs(v) > MAX_DIGITS)
    fail(`Integer result exceeds ${MAX_DIGITS} digits.`);
  return int(v);
}

// --- Calc float primitives (calc.el math-make-float/math-scale-rounding) ---
function scaleRounding(a, n) {
  if (n >= 0) return a * 10n ** BigInt(n);
  if (a < 0n) return -scaleRounding(-a, n);
  return (a / 10n ** BigInt(-1 - n) + 5n) / 10n;
}
function makeFloat(mant, exp, prec) {
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
const frac = (n, d) => {
  if (d === 0n) fail("Division by zero.");
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d);
  [n, d] = [n / g, d / g];
  return d === 1n ? int(n) : { t: "frac", n, d };
};
function toFloat(x, prec) {
  if (x.t === "int") return makeFloat(x.v, 0, prec);
  if (x.t === "frac")
    return divFloat(makeFloat(x.n, 0, prec), makeFloat(x.d, 0, prec), prec);
  return x;
}
function addFloat(a, b, prec) {
  let ediff = a.e - b.e;
  if (ediff >= 0) {
    if (ediff >= prec + prec) return a;
    return makeFloat(b.m + a.m * 10n ** BigInt(ediff), b.e, prec);
  }
  ediff = -ediff;
  if (ediff >= prec + prec) return b;
  return makeFloat(a.m + b.m * 10n ** BigInt(ediff), a.e, prec);
}
const mulFloat = (a, b, prec) => makeFloat(a.m * b.m, a.e + b.e, prec);
function divFloat(a, b, prec) {
  if (b.m === 0n) fail("Division by zero.");
  const ldiff = Math.max(prec + 1 - (numdigs(a.m) - numdigs(b.m)), 0);
  return makeFloat((a.m * 10n ** BigInt(ldiff)) / b.m, a.e - b.e - ldiff, prec);
}
const normalize = (x, prec) =>
  x.t === "float"
    ? makeFloat(x.m, x.e, prec)
    : x.t === "vec"
      ? { t: "vec", items: x.items.map((i) => normalize(i, prec)) }
      : x;

// Exact rational view used for comparisons and floor/trunc.
const rational = (x) =>
  x.t === "int"
    ? [x.v, 1n]
    : x.t === "frac"
      ? [x.n, x.d]
      : x.e >= 0
        ? [x.m * 10n ** BigInt(x.e), 1n]
        : [x.m, 10n ** BigInt(-x.e)];
function compare(a, b) {
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
const negative = (x) => rational(x)[0] < 0n;

function scalar(x, what) {
  if (x.t === "sym")
    fail(
      `Calc leaves ${x.name} symbolic; Sheets supports numeric results only. Use ;N to treat nonnumeric fields as zero.`,
    );
  if (x.t === "vec") fail(`${what} does not accept a vector here.`);
  return x;
}

export function createCalc(modes = {}) {
  const prec = modes.prec ?? 12,
    deg = (modes.angle ?? "deg") === "deg",
    preferFrac = !!modes.frac;
  // math-with-extra-prec: evaluate at prec+2, then normalize at prec.
  const extra = (fn) => normalize(fn(prec + 2), prec);

  function add(a, b, p = prec) {
    if (a.t === "sym" || b.t === "sym") return a.t === "sym" ? a : b;
    if (a.t === "nan" || b.t === "nan") return NAN;
    if (a.t === "vec" || b.t === "vec") return vectorOp(a, b, add, p, "+");
    a = scalar(a, "+");
    b = scalar(b, "+");
    if (a.t === "int" && b.t === "int") return checkInt(a.v + b.v);
    if (a.t !== "float" && b.t !== "float") {
      const [an, ad] = rational(a),
        [bn, bd] = rational(b);
      return frac(an * bd + bn * ad, ad * bd);
    }
    return addFloat(toFloat(a, p), toFloat(b, p), p);
  }
  function neg(a) {
    if (a.t === "int") return int(-a.v);
    if (a.t === "frac") return { t: "frac", n: -a.n, d: a.d };
    if (a.t === "float") return { t: "float", m: -a.m, e: a.e };
    if (a.t === "vec") return { t: "vec", items: a.items.map(neg) };
    return a;
  }
  const sub = (a, b, p = prec) => add(a, neg(b), p);
  function mul(a, b, p = prec) {
    if (a.t === "sym" || b.t === "sym") return a.t === "sym" ? a : b;
    if (a.t === "nan" || b.t === "nan") return NAN;
    if (a.t === "vec" && b.t === "vec") {
      if (a.items.length !== b.items.length)
        fail("Vector lengths do not match.");
      return a.items.reduce(
        (sum, item, i) => add(sum, mul(item, b.items[i], p), p),
        int(0n),
      );
    }
    if (a.t === "vec" || b.t === "vec") return vectorOp(a, b, mul, p, "*");
    a = scalar(a, "*");
    b = scalar(b, "*");
    if (a.t === "int" && b.t === "int") return checkInt(a.v * b.v);
    if (a.t !== "float" && b.t !== "float") {
      const [an, ad] = rational(a),
        [bn, bd] = rational(b);
      return frac(an * bn, ad * bd);
    }
    return mulFloat(toFloat(a, p), toFloat(b, p), p);
  }
  function div(a, b, p = prec) {
    if (a.t === "sym" || b.t === "sym") return a.t === "sym" ? a : b;
    if (a.t === "nan" || b.t === "nan") return NAN;
    if (a.t === "vec" && b.t !== "vec")
      return { t: "vec", items: a.items.map((i) => div(i, b, p)) };
    if (b.t === "vec") fail("Division by a vector is unsupported.");
    a = scalar(a, "/");
    b = scalar(b, "/");
    if (isZero(b)) fail("Division by zero.");
    if (isZero(a))
      return b.t === "float" && a.t !== "float" ? toFloat(a, p) : a;
    if (a.t === "int" && b.t === "int") {
      if (a.v % b.v === 0n) return int(a.v / b.v);
      return preferFrac
        ? frac(a.v, b.v)
        : divFloat(makeFloat(a.v, 0, p), makeFloat(b.v, 0, p), p);
    }
    if (a.t !== "float" && b.t !== "float") {
      const [an, ad] = rational(a),
        [bn, bd] = rational(b);
      const q = frac(an * bd, ad * bn);
      return q.t === "frac" && !preferFrac ? toFloat(q, p) : q;
    }
    return divFloat(toFloat(a, p), toFloat(b, p), p);
  }
  function vectorOp(a, b, op, p, name) {
    if (a.t === "vec" && b.t === "vec") {
      if (a.items.length !== b.items.length)
        fail("Vector lengths do not match.");
      if (name === "*") fail("Vector products are unsupported.");
      return { t: "vec", items: a.items.map((x, i) => op(x, b.items[i], p)) };
    }
    return a.t === "vec"
      ? { t: "vec", items: a.items.map((x) => op(x, b, p)) }
      : { t: "vec", items: b.items.map((y) => op(a, y, p)) };
  }
  function trunc(a) {
    if (a.t === "int") return a;
    const [n, d] = rational(a);
    return int(n / d);
  }
  function floor(a) {
    if (a.t === "int") return a;
    const [n, d] = rational(a),
      q = n / d;
    return int(n < 0n && q * d !== n ? q - 1n : q);
  }
  const ceil = (a) => neg(floor(neg(a)));
  function round(a) {
    if (a.t === "int") return a;
    if (negative(a)) return neg(round(neg(a)));
    return floor(
      add(a, a.t === "float" ? { t: "float", m: 5n, e: -1 } : frac(1n, 2n)),
    );
  }
  const integerValued = (x) =>
    x.t === "int" || (x.t === "float" && rational(x)[1] === 1n);
  function ipow(a, n, p) {
    if (n < 0n) return ipow(div(int(1n), a, p), -n, p);
    if (a.t === "int" && numdigs(a.v) * Number(n) > MAX_DIGITS * 1.1)
      fail(`Integer result exceeds ${MAX_DIGITS} digits.`);
    let result = int(1n),
      base = a;
    while (n > 0n) {
      if (n & 1n) result = mul(result, base, p);
      n >>= 1n;
      if (n) base = mul(base, base, p);
    }
    return result;
  }
  function nthRoot(a, n) {
    if (a.t !== "int" || a.v < 0n) return null;
    const guess = BigInt(Math.round(Number(a.v) ** (1 / Number(n))));
    for (const r of [guess - 1n, guess, guess + 1n])
      if (r >= 0n && r ** n === a.v) return int(r);
    return null;
  }
  function pow(a, b) {
    if (a.t === "sym" || b.t === "sym") return a.t === "sym" ? a : b;
    if (a.t === "nan" || b.t === "nan") return NAN;
    if (a.t === "vec" && b.t !== "vec")
      return { t: "vec", items: a.items.map((x) => pow(x, b)) };
    a = scalar(a, "^");
    b = scalar(b, "^");
    if (isZero(a)) {
      if (!negative(b) && !isZero(b))
        return b.t === "float" ? toFloat(a, prec) : a;
      if (b.t === "int" && b.v === 0n) return int(1n);
      fail("Calc leaves this power of zero undefined.");
    }
    const isFloatOne = (x) => x.t === "float" && x.m === 1n && x.e === 0;
    if (isInt(a, 1) || isInt(b, 1) || isFloatOne(a) || isFloatOne(b)) return a;
    if (isZero(b))
      return a.t === "float" || b.t === "float"
        ? { t: "float", m: 1n, e: 0 }
        : int(1n);
    const isFloatTen = a.t === "float" && a.m === 1n && a.e === 1;
    if (b.t === "int")
      return isFloatTen
        ? makeFloat(1n, Number(b.v), prec)
        : extra((p) => ipow(a, b.v, p));
    // math-pow-fancy: quarter-integer exponents use exact/float square roots.
    if ([1, 2, 3].includes(quarter(b))) {
      const root = sqrt(b.t === "float" ? toFloat(a, prec) : a);
      return pow(root, mul(int(2n), b));
    }
    if (b.t === "frac" && b.d <= 10n) {
      const root = nthRoot(a, b.d);
      if (root) return extra((p) => ipow(root, b.n, p));
    }
    if ((isInt(a, 10) || isFloatTen) && integerValued(b))
      return makeFloat(1n, Number(rational(b)[0]), prec);
    if (negative(a))
      fail("Calc returns a complex number; complex results are unsupported.");
    return extra((p) =>
      expRaw(toFloat(mul(b, lnRaw(toFloat(a, p), p), p), p), p),
    );
  }
  // calc-arith.el math-quarter-integer.
  function quarter(x) {
    if (x.t === "int") return 0;
    if (negative(x)) {
      const q = quarter(neg(x));
      return q === null ? null : 4 - q;
    }
    if (x.t === "frac")
      return x.d === 2n ? 2 : x.d === 4n ? Number(x.n % 4n) : null;
    if (x.e >= 0) return 0;
    if (x.e === -1) return x.m % 10n === 5n ? 2 : null;
    if (x.e === -2) {
      const r = x.m % 100n;
      return r === 25n ? 1 : r === 75n ? 3 : null;
    }
    return null;
  }
  function sqrt(a) {
    if (a.t === "nan") return a;
    a = scalar(a, "sqrt");
    if (isZero(a)) return a;
    if (negative(a))
      fail(
        "Calc returns an imaginary square root; complex results are unsupported.",
      );
    const isqrt = (v) => {
      if (v < 2n) return v;
      let x = BigInt(Math.floor(Math.sqrt(Number(v))));
      while (x * x > v) x--;
      while ((x + 1n) * (x + 1n) <= v) x++;
      return x;
    };
    if (a.t === "int") {
      const r = isqrt(a.v);
      if (r * r === a.v) return int(r);
    }
    if (a.t === "frac") {
      const n = isqrt(a.n),
        d = isqrt(a.d);
      if (n * n === a.n && d * d === a.d) return frac(n, d);
    }
    // math-sqrt-float: one extra digit around math-sqrt-raw.
    const p = prec + 1;
    return normalize(sqrtRaw(toFloat(a, prec), p), prec);
  }
  // --- Calc's raw transcendental layer (calc-math.el). At working precision
  // up to math-emacs-precision (16), Calc rounds the argument, calls the native
  // Emacs double function and reads its shortest printed result back. ---
  const FLOAT = (m, e = 0) => ({ t: "float", m: BigInt(m), e });
  const ZERO = FLOAT(0),
    ONE = FLOAT(1);
  const fromJs = (r, p) => {
    const [mantissa, e] = r.toExponential().split("e"),
      [i, f = ""] = mantissa.split(".");
    return makeFloat(BigInt(i + f), Number(e) - f.length, p);
  };
  function emacsFn(fn, x, p) {
    if (p > 16) return null;
    const xpon = x.e + (x.m === 0n ? 0 : numdigs(x.m)) - 1;
    if (xpon < -322 || xpon > 307) return null;
    const r = fn(Number(formatFloat(x.m, x.e, "float", p, p)));
    return Number.isFinite(r) ? fromJs(r, p) : null;
  }
  const D = (p) =>
    Decimal.clone({ precision: p, rounding: Decimal.ROUND_HALF_UP });
  // Series fallback for precisions above a native double.
  function series(name, x, p, ...rest) {
    const C = D(p),
      d = new C(`${x.m}e${x.e}`)[name](...rest);
    if (!d.isFinite()) fail("Calc result is not finite.");
    const [m, e = "0"] = d.toExponential().split("e"),
      [i, f = ""] = m.split(".");
    return makeFloat(BigInt(i + f), Number(e) - f.length, p);
  }
  const PI =
    "314159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196";
  const pi = (p) => makeFloat(BigInt(PI), 1 - PI.length, p);
  // math-defcache constants: computed at prec+4, then normalized.
  const cached = (fn) => (p) => {
    const v = fn(p + 4);
    return makeFloat(v.m, v.e, p);
  };
  const twoPi = cached((q) => mulFloat(pi(q), FLOAT(2), q)),
    piOver2 = cached((q) => mulFloat(pi(q), FLOAT(5, -1), q)),
    piOver4 = cached((q) => mulFloat(pi(q), FLOAT(25, -2), q)),
    piOver180 = cached((q) => divFloat(pi(q), FLOAT(18, 1), q));
  const less = (a, b) => compare(a, b) < 0;
  const nearlyZero = (a, b, p) =>
    a.m === 0n || numdigs(a.m) + a.e <= 1 + (numdigs(b.m) + b.e) - p;
  function sinRaw(x, p, orgx = x) {
    if (x.m < 0n) return neg(sinRaw(neg(x), p, orgx));
    if (less(FLOAT(7), x)) {
      const two = twoPi(p);
      return sinRaw(sub(x, mul(floor(div(x, two, p)), two, p), p), p, orgx);
    }
    return sinRaw2(x, p, orgx);
  }
  function sinRaw2(x, p, orgx) {
    const xmpo2 = sub(piOver2(p), x, p);
    if (xmpo2.m < 0n) return neg(sinRaw2(sub(x, pi(p), p), p, orgx));
    if (less(piOver4(p), x)) return cosRaw2(xmpo2, p, orgx);
    if (less(x, neg(piOver4(p))))
      return neg(cosRaw2(add(piOver2(p), x, p), p, orgx));
    if (nearlyZero(x, orgx, p - 1)) return ZERO;
    return emacsFn(Math.sin, x, p) ?? series("sin", x, p);
  }
  function cosRaw2(x, p, orgx) {
    if (nearlyZero(x, orgx, p - 1)) return ONE;
    return emacsFn(Math.cos, x, p) ?? series("cos", x, p);
  }
  const cosRaw = (x, p) => sinRaw(sub(piOver2(p), x, p), p, x);
  function expRaw(x, p) {
    if (x.m === 0n) return ONE;
    return emacsFn(Math.exp, x, p) ?? series("exp", x, p);
  }
  function lnRaw(x, p) {
    if (compare(x, int(1n)) === 0) return ZERO;
    return emacsFn(Math.log, x, p) ?? series("ln", x, p);
  }
  function sqrtRaw(x, p) {
    return emacsFn(Math.sqrt, x, p) ?? series("sqrt", x, p);
  }
  function arctanRaw(x, p) {
    if (x.m < 0n) return neg(arctanRaw(neg(x), p));
    if (x.m === 0n) return x;
    return emacsFn(Math.atan, x, p) ?? series("atan", x, p);
  }
  function arctan2Raw(y, x, p) {
    if (isZero(y))
      return negative(x)
        ? pi(p)
        : x.t === "float" || y.t === "float"
          ? ZERO
          : int(0n);
    if (isZero(x)) return negative(y) ? neg(piOver2(p)) : piOver2(p);
    const t = arctanRaw(divFloat(toFloat(y, p), toFloat(x, p), p), p);
    if (!negative(x)) return t;
    return negative(y) ? sub(t, pi(p), p) : add(t, pi(p), p);
  }
  const arcsinRaw = (x, p) =>
    arctan2Raw(x, sqrtRaw(sub(ONE, mulFloat(x, x, p), p), p), p);
  const toRadians = (x, p) => (deg ? mul(x, piOver180(p), p) : x);
  const fromRadians = (x, p) => (deg ? div(x, piOver180(p), p) : x);
  function real(x, name) {
    if (x.t === "nan") return x;
    return scalar(x, name);
  }
  const isInt = (x, v) => x.t === "int" && x.v === BigInt(v);
  const outOfUnit = (x) => compare(x, int(1n)) > 0 || compare(x, int(-1n)) < 0;
  const functions = {
    sin(x) {
      x = real(x, "sin");
      if (x.t === "nan") return x;
      if (x.t === "int" && (deg ? x.v % 90n === 0n : x.v === 0n))
        return int([0n, 1n, 0n, -1n][Number((((x.v / 90n) % 4n) + 4n) % 4n)]);
      return extra((p) => sinRaw(toRadians(toFloat(x, p), p), p));
    },
    cos(x) {
      x = real(x, "cos");
      if (x.t === "nan") return x;
      if (x.t === "int" && (deg ? x.v % 90n === 0n : x.v === 0n))
        return int([1n, 0n, -1n, 0n][Number((((x.v / 90n) % 4n) + 4n) % 4n)]);
      return extra((p) => cosRaw(toRadians(toFloat(x, p), p), p));
    },
    tan(x) {
      x = real(x, "tan");
      if (x.t === "nan") return x;
      if (x.t === "int" && (deg ? x.v % 180n === 0n : x.v === 0n))
        return int(0n);
      return extra((p) => {
        const r = toRadians(toFloat(x, p), p),
          s = sinRaw(r, p),
          c = cosRaw(r, p);
        if (c.m === 0n) fail("Division by zero.");
        return divFloat(s, c, p);
      });
    },
    arcsin(x) {
      x = real(x, "arcsin");
      if (x.t === "nan" || isInt(x, 0)) return x;
      if (deg && (isInt(x, 1) || isInt(x, -1)))
        return int(isInt(x, 1) ? 90n : -90n);
      if (outOfUnit(x))
        fail("Calc returns a complex number; complex results are unsupported.");
      return extra((p) => fromRadians(arcsinRaw(toFloat(x, p), p), p));
    },
    arccos(x) {
      x = real(x, "arccos");
      if (x.t === "nan") return x;
      if (isInt(x, 1)) return int(0n);
      if (deg && (isInt(x, 0) || isInt(x, -1)))
        return int(isInt(x, 0) ? 90n : 180n);
      if (outOfUnit(x))
        fail("Calc returns a complex number; complex results are unsupported.");
      return extra((p) =>
        fromRadians(sub(piOver2(p), arcsinRaw(toFloat(x, p), p), p), p),
      );
    },
    arctan(x) {
      x = real(x, "arctan");
      if (x.t === "nan" || isInt(x, 0)) return x;
      if (deg && (isInt(x, 1) || isInt(x, -1)))
        return int(isInt(x, 1) ? 45n : -45n);
      return extra((p) => fromRadians(arctanRaw(toFloat(x, p), p), p));
    },
    arctan2(y, x) {
      y = real(y, "arctan2");
      x = real(x, "arctan2");
      if (y.t === "nan" || x.t === "nan") return NAN;
      return extra((p) =>
        fromRadians(arctan2Raw(toFloat(y, p), toFloat(x, p), p), p),
      );
    },
    sinh(x) {
      x = real(x, "sinh");
      if (x.t === "nan" || isInt(x, 0)) return x;
      return extra((p) => {
        const e = expRaw(toFloat(x, p), p);
        return mul(add(e, div(int(-1n), e, p), p), FLOAT(5, -1), p);
      });
    },
    cosh(x) {
      x = real(x, "cosh");
      if (x.t === "nan") return x;
      if (isInt(x, 0)) return int(1n);
      return extra((p) => {
        const e = expRaw(toFloat(x, p), p);
        return mul(add(e, div(int(1n), e, p), p), FLOAT(5, -1), p);
      });
    },
    tanh(x) {
      x = real(x, "tanh");
      if (x.t === "nan" || isInt(x, 0)) return x;
      return extra((p) => {
        const e = normalize(expRaw(toFloat(x, p + 2), p + 2), p),
          m = div(int(1n), e, p);
        return div(sub(e, m, p), add(e, m, p), p);
      });
    },
    sqrt,
    exp(x) {
      x = real(x, "exp");
      if (x.t === "nan") return x;
      if (isInt(x, 0)) return int(1n);
      return extra((p) => expRaw(toFloat(x, p), p));
    },
    ln(x) {
      x = real(x, "ln");
      if (x.t === "nan") return x;
      if (isZero(x)) fail("Logarithm of zero.");
      if (isInt(x, 1)) return int(0n);
      if (negative(x))
        fail(
          "Calc returns a complex logarithm; complex results are unsupported.",
        );
      return extra((p) => lnRaw(toFloat(x, p), p));
    },
    log10(x) {
      x = real(x, "log10");
      if (x.t === "nan") return x;
      if (compare(x, int(1n)) === 0) return x.t === "float" ? ZERO : int(0n);
      if (x.t === "int" && x.v > 0n) {
        const s = x.v.toString();
        if (/^10*$/.test(s)) return int(BigInt(s.length - 1));
      }
      if (x.t === "frac" && x.n === 1n && /^10*$/.test(x.d.toString()))
        return int(-BigInt(x.d.toString().length - 1));
      if (isZero(x)) fail("Logarithm of zero.");
      if (negative(x))
        fail(
          "Calc returns a complex logarithm; complex results are unsupported.",
        );
      return extra((p) => {
        const xf = toFloat(x, p);
        if (xf.m === 1n) return makeFloat(BigInt(xf.e), 0, p);
        // ln of the mantissa in [1, 10) uses Calc's series, not the native fn.
        const xdigs = numdigs(xf.m) - 1,
          ln10 = series("ln", FLOAT(10), p);
        return add(
          divFloat(series("ln", FLOAT(xf.m, -xdigs), p), ln10, p),
          makeFloat(BigInt(xf.e + xdigs), 0, p),
          p,
        );
      });
    },
    log(x, b) {
      if (b === undefined) return functions.ln(x);
      x = real(x, "log");
      b = real(b, "log");
      if (x.t === "nan" || b.t === "nan") return NAN;
      if (isInt(b, 10) || (b.t === "float" && b.m === 1n && b.e === 1))
        return functions.log10(x);
      if (isZero(x) || isZero(b)) fail("Logarithm of zero.");
      if (compare(b, int(1n)) === 0) fail("Logarithm base one.");
      if (compare(x, int(1n)) === 0) return b.t === "float" ? ZERO : int(0n);
      if (x.t !== "float" && b.t !== "float" && !negative(x) && !negative(b)) {
        const exact = integerLog(x, b);
        if (exact !== null) return exact;
      }
      if (negative(x) || negative(b))
        fail(
          "Calc returns a complex logarithm; complex results are unsupported.",
        );
      return extra((p) =>
        div(lnRaw(toFloat(x, p), p), lnRaw(toFloat(b, p), p), p),
      );
    },
    abs: (x) => (x.t === "nan" ? x : negative(scalar(x, "abs")) ? neg(x) : x),
    floor: (x) => (x.t === "nan" ? x : floor(scalar(x, "floor"))),
    ceil: (x) => (x.t === "nan" ? x : ceil(scalar(x, "ceil"))),
    trunc: (x) => (x.t === "nan" ? x : trunc(scalar(x, "trunc"))),
    round(x, digits) {
      if (x.t === "nan") return x;
      x = scalar(x, "round");
      if (digits === undefined) return round(x);
      digits = scalar(digits, "round");
      if (!integerValued(digits)) fail("round() digits must be an integer.");
      const n = Number(rational(digits)[0]);
      if (n <= 0 && x.t === "int") return x;
      if (Math.abs(n) > 1000) fail("round() digits are out of range.");
      // math-round: scf(round(scf(a, n)), -n).
      const scale = int(10n ** BigInt(Math.abs(n))),
        rounded = round(mulScale(x, n));
      return n >= 0 ? div(rounded, scale) : mul(rounded, scale);
    },
    min: (...args) => extreme(args, -1, "min"),
    max: (...args) => extreme(args, 1, "max"),
    fact: (x) => factorial(x, 1n),
    vsum: (...args) =>
      normalize(
        flatten(args).reduce((s, x) => add(s, x, prec + 2), int(0n)),
        prec,
      ),
    vprod: (...args) =>
      normalize(
        flatten(args).reduce((s, x) => mul(s, x, prec + 2), int(1n)),
        prec,
      ),
    vcount: (...args) => int(BigInt(flatten(args, true).length)),
    vmean(...args) {
      const items = flatten(args);
      if (!items.length) fail("vmean() needs at least one value.");
      return extra((p) =>
        div(
          items.reduce((s, x) => add(s, x, p), int(0n)),
          int(BigInt(items.length)),
          p,
        ),
      );
    },
    vmedian(...args) {
      const items = flatten(args).map((x) => scalar(x, "vmedian"));
      if (!items.length) fail("vmedian() needs at least one value.");
      if (items.some((x) => x.t === "nan")) fail("vmedian() cannot sort nan.");
      items.sort(compare);
      const half = Math.floor(items.length / 2);
      return items.length % 2
        ? items[half]
        : div(add(items[half - 1], items[half]), int(2n));
    },
    vmax: (...args) => vextreme(args, 1, "vmax"),
    vmin: (...args) => vextreme(args, -1, "vmin"),
    vvar: (...args) => variance(args, false),
    vpvar: (...args) => variance(args, true),
    vsdev: (...args) => sqrt(variance(args, false)),
    vpsdev: (...args) => sqrt(variance(args, true)),
  };
  function mulScale(x, n) {
    // calcFunc-scf: scale by a power of ten, keeping exact rationals exact.
    if (x.t === "float") return { t: "float", m: x.m, e: x.e + n };
    const [num, den] = rational(x);
    return n >= 0
      ? frac(num * 10n ** BigInt(n), den)
      : frac(num, den * 10n ** BigInt(-n));
  }
  function integerLog(x, b) {
    let [xn, xd] = rational(x),
      [bn, bd] = rational(b),
      sign = 1n;
    if (xn < xd) {
      [xn, xd] = [xd, xn];
      sign = -sign;
    }
    if (bn < bd) {
      [bn, bd] = [bd, bn];
      sign = -sign;
    }
    let pn = bn,
      pd = bd;
    for (let k = 1n; k <= 4000n; k++) {
      if (pn === xn && pd === xd) return int(sign * k);
      if (pn * xd > xn * pd) break;
      pn *= bn;
      pd *= bd;
    }
    // Calc also recognizes an integer root relation (b = x^k).
    let qn = xn,
      qd = xd;
    for (let k = 1n; k <= 4000n; k++) {
      if (qn === bn && qd === bd) return div(int(sign), int(k));
      if (qn * bd > bn * qd) break;
      qn *= xn;
      qd *= xd;
    }
    return null;
  }
  function extreme(args, sign, name) {
    if (!args.length) fail(`${name}() needs at least one value.`);
    let best = null;
    for (let x of args) {
      if (x.t === "nan") return NAN;
      x = scalar(x, name);
      if (!best || compare(x, best) * sign > 0) best = x;
    }
    return best;
  }
  function vextreme(args, sign, name) {
    const items = flatten(args);
    if (!items.length)
      fail(
        `${name}() of no values is infinite in Calc; infinities are unsupported.`,
      );
    return normalize(extreme(items, sign, name), prec);
  }
  function variance(args, population) {
    const items = flatten(args);
    if (items.length < (population ? 1 : 2))
      fail(
        population
          ? "Population variance needs at least one value."
          : "Sample variance needs at least two values.",
      );
    return extra((p) => {
      const mean = div(
        items.reduce((s, x) => add(s, x, p), int(0n)),
        int(-BigInt(items.length)),
        p,
      );
      const squares = items.map((x) => {
        const d = add(x, mean, p);
        return mul(d, d, p);
      });
      return div(
        squares.reduce((s, x) => add(s, x, p), int(0n)),
        int(BigInt(population ? items.length : items.length - 1)),
        p,
      );
    });
  }
  function factorial(x, step) {
    if (x.t === "nan" || x.t === "sym") return x;
    x = scalar(x, "!");
    if (x.t !== "int" || x.v < 0n)
      fail("Factorials are supported for nonnegative integers only.");
    if (x.v > 3000n) fail("Factorial argument is too large.");
    let result = 1n;
    for (let k = x.v; k > 1n; k -= step) result *= k;
    return checkInt(result);
  }
  function flatten(args, keepSymbols = false) {
    const out = [];
    for (const arg of args)
      for (const item of arg.t === "vec" ? arg.items : [arg]) {
        if (item.t === "vec") out.push(...flatten([item], keepSymbols));
        else out.push(keepSymbols ? item : scalar(item, "This function"));
      }
    return out;
  }
  function mod(a, b) {
    if (a.t === "sym" || b.t === "sym") return a.t === "sym" ? a : b;
    if (a.t === "nan" || b.t === "nan") return NAN;
    a = scalar(a, "%");
    b = scalar(b, "%");
    if (isZero(a)) return a;
    if (isZero(b)) fail("Division by zero.");
    if (a.t === "int" && b.t === "int" && a.v >= 0n && b.v > 0n)
      return int(a.v % b.v);
    return sub(a, mul(floor(div(a, b)), b));
  }
  function idiv(a, b) {
    if (a.t === "sym" || b.t === "sym") return a.t === "sym" ? a : b;
    a = scalar(a, "\\");
    b = scalar(b, "\\");
    if (isZero(b)) fail("Division by zero.");
    return floor(div(a, b));
  }
  const binary = {
    "+": add,
    "-": sub,
    "*": mul,
    "/": div,
    "%": mod,
    "\\": idiv,
    "^": pow,
  };
  return {
    binary: (op, a, b) => binary[op](a, b),
    neg,
    percent: (x) => div(x, int(100n)),
    factorial,
    functions,
    normalize: (x) => normalize(x, prec),
  };
}

const aliases = {
  asin: "arcsin",
  acos: "arccos",
  atan: "arctan",
  atan2: "arctan2",
  sum: "vsum",
  mean: "vmean",
  median: "vmedian",
  prod: "vprod",
  ceiling: "ceil",
};

// --- Parser: calc-aent.el math-read-expr-level with
// calc-multiplication-has-precedence (Org's Emacs default). ---
const INFIX = {
  "^": [201, 200],
  "**": [201, 200],
  "*": [196, 195],
  "2x": [196, 195],
  "/": [190, 191],
  "%": [190, 191],
  "\\": [190, 191],
  "+": [180, 181],
  "-": [180, 181],
  "<": [160, 161],
  ">": [160, 161],
  "<=": [160, 161],
  ">=": [160, 161],
  "=": [160, 161],
  "==": [160, 161],
  "!=": [160, 161],
};
const comparisons = new Set(["<", ">", "<=", ">=", "=", "==", "!="]);
function tokenize(source) {
  if (source.length > MAX_LENGTH) fail("Formula is too long.");
  const tokens = [],
    pattern =
      /\s+|(\uE000(\d+)\uE001)|((?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)|([A-Za-z][A-Za-z0-9]*)|(\*\*|!!|<=|>=|==|!=|[-+*/%\\^!(),\[\]<>=])/y;
  let at = 0;
  while (at < source.length) {
    pattern.lastIndex = at;
    const m = pattern.exec(source);
    if (!m)
      fail(`Unsupported Calc syntax near "${source.slice(at, at + 12)}".`);
    at = pattern.lastIndex;
    if (m[1]) tokens.push({ type: "ref", value: Number(m[2]) });
    else if (m[3]) tokens.push({ type: "number", value: m[3] });
    else if (m[4]) tokens.push({ type: "name", value: m[4] });
    else if (m[5]) tokens.push({ type: "op", value: m[5] });
  }
  return tokens;
}
export function parseCalc(source) {
  const tokens = tokenize(source);
  let i = 0,
    nodes = 0,
    depth = 0;
  const peek = () => tokens[i],
    isOp = (v) => tokens[i]?.type === "op" && tokens[i].value === v;
  const node = (n) => {
    if (++nodes > MAX_NODES) fail("Formula is too complex.");
    return n;
  };
  const startsFactor = (t) =>
    t && (t.type !== "op" || ["(", "[", "-", "+"].includes(t.value));
  function level(minPrec) {
    if (++depth > MAX_DEPTH) fail("Formula nesting is too deep.");
    let x = factor(),
      first = true;
    for (;;) {
      const t = peek();
      let op = null,
        lp,
        rp;
      if (t?.type === "op") {
        if (t.value === "!" || t.value === "!!") {
          if (210 < minPrec) break;
          i++;
          x = node({ type: "fact", step: t.value === "!" ? 1n : 2n, arg: x });
          continue;
        }
        if (t.value === "%" && !startsFactor(tokens[i + 1])) {
          if (1100 < minPrec) break;
          i++;
          x = node({ type: "percent", arg: x });
          continue;
        }
        if (INFIX[t.value]) [op, lp, rp] = [t.value, ...INFIX[t.value]];
        else if (t.value === "(" || t.value === "[")
          [op, lp, rp] = ["2x", ...INFIX["2x"]];
      } else if (t) [op, lp, rp] = ["2x", ...INFIX["2x"]];
      if (!op || lp < minPrec) break;
      if (op !== "2x") i++;
      const y = level(rp);
      if (comparisons.has(op)) {
        if (op === "=") op = "==";
        // calc-prog.el math-composite-inequalities: parentheses start a new
        // level, so (3>2)>1 compares a Boolean rather than forming an interval.
        if (!first && x.type === "compare") {
          if ((op === "==" || op === "!=") && x.op === op)
            x = node({ ...x, args: [...x.args, y] });
          else if (
            (["<", "<="].includes(op) && ["<", "<="].includes(x.op)) ||
            ([">", ">="].includes(op) && [">", ">="].includes(x.op))
          )
            x = node({
              type: "between",
              ops: [x.op, op],
              args: [...x.args, y],
            });
          else fail("Invalid mixed Calc comparison chain; use parentheses.");
        } else x = node({ type: "compare", op, args: [x, y] });
      } else
        x = node({
          type: "binary",
          op: op === "2x" ? "*" : op === "**" ? "^" : op,
          args: [x, y],
        });
      first = false;
    }
    depth--;
    return x;
  }
  function factor() {
    const t = tokens[i++];
    if (!t) fail("Incomplete Calc formula.");
    if (t.type === "number") return node({ type: "number", value: t.value });
    if (t.type === "ref") return node({ type: "ref", index: t.value });
    if (t.type === "name") {
      if (isOp("(")) {
        i++;
        const args = [];
        if (!isOp(")"))
          for (;;) {
            args.push(level(0));
            if (isOp(",")) {
              i++;
              continue;
            }
            break;
          }
        if (!isOp(")")) fail(`Missing ) after ${t.value}(...).`);
        i++;
        return node({ type: "call", name: t.value, args });
      }
      return node({ type: "symbol", name: t.value });
    }
    if (t.value === "-") return node({ type: "neg", arg: level(197) });
    if (t.value === "+") return level(197);
    if (t.value === "(") {
      const x = level(0);
      if (isOp(","))
        fail(
          "Calc reads (a, b) as a complex number; complex values are unsupported.",
        );
      if (!isOp(")")) fail("Missing ).");
      i++;
      return x;
    }
    if (t.value === "[") {
      const items = [];
      if (!isOp("]"))
        for (;;) {
          items.push(level(0));
          if (isOp(",")) {
            i++;
            continue;
          }
          break;
        }
      if (!isOp("]")) fail("Missing ].");
      i++;
      return node({ type: "vector", items });
    }
    fail(`Unexpected ${t.value} in Calc formula.`);
  }
  const tree = level(0);
  if (i < tokens.length) fail(`Unexpected ${tokens[i].value} in Calc formula.`);
  return tree;
}

const arity = (name) =>
  name === "arctan2"
    ? [2, 2]
    : name === "log" || name === "round"
      ? [1, 2]
      : name === "min" || name === "max" || name.startsWith("v")
        ? [0, Infinity]
        : [1, 1];

function readNumber(text, prec) {
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
function numberText(text) {
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
export function evaluateCalc(expression, refs, modes) {
  const calc = createCalc(modes),
    cache = new Map();
  const parseText = (text) => {
    try {
      return parseCalc(text);
    } catch (error) {
      fail(
        `Field value "${text}" is not a supported Calc number: ${error.message}`,
      );
    }
  };
  const blank = (text) => !/\S/.test(text);
  const fieldTree = (text) =>
    blank(text)
      ? {
          type: "value",
          value: !modes.keepEmpty || modes.numbers ? int(0n) : NAN,
        }
      : parseText(modes.numbers ? numberText(text) : text);
  // Org substitutes all referenced field text before Calc parses the formula.
  // Check syntax in both branches, but defer evaluation until a value is needed.
  const trees = refs.map((ref) =>
    "constant" in ref
      ? parseText(ref.constant)
      : "field" in ref
        ? fieldTree(ref.field)
        : {
            type: "vector",
            items: ref.range
              .filter((t) => modes.keepEmpty || !blank(t))
              .map(fieldTree),
          },
  );
  function reference(index) {
    if (cache.has(index)) return cache.get(index);
    const value = evaluate(trees[index]);
    cache.set(index, value);
    return value;
  }
  const numeric = (value, what) => {
    scalar(value, what);
    if (value.t === "nan")
      fail(`${what} needs a real numeric value; Calc leaves nan unresolved.`);
    return value;
  };
  let comparisonWork = 0;
  function testComparison(op, a, b) {
    if (++comparisonWork > 10000) fail("Calc comparison work limit exceeded.");
    const order = compare(numeric(a, "Comparison"), numeric(b, "Comparison"));
    return {
      "<": order < 0,
      ">": order > 0,
      "<=": order <= 0,
      ">=": order >= 0,
      "==": order === 0,
      "!=": order !== 0,
    }[op];
  }
  function evaluate(n) {
    switch (n.type) {
      case "value":
        return n.value;
      case "number":
        return readNumber(n.value, modes.prec);
      case "ref":
        return reference(n.index);
      case "symbol":
        return n.name === "nan" ? NAN : sym(n.name);
      case "neg":
        return calc.neg(evaluate(n.arg));
      case "percent":
        return calc.percent(evaluate(n.arg));
      case "fact":
        return calc.factorial(evaluate(n.arg), n.step);
      case "binary":
        return calc.binary(n.op, evaluate(n.args[0]), evaluate(n.args[1]));
      case "compare": {
        const args = n.args.map(evaluate);
        let result = true;
        // Equality chains require all equal; != chains require all distinct.
        if (n.op === "!=") {
          for (let i = 0; i < args.length && result; i++)
            for (let j = i + 1; j < args.length && result; j++)
              result = testComparison(n.op, args[i], args[j]);
        } else
          for (let j = 1; j < args.length && result; j++)
            result = testComparison(n.op, args[0], args[j]);
        return int(result ? 1n : 0n);
      }
      case "between": {
        const [a, b, c] = n.args.map(evaluate);
        const left = testComparison(n.ops[0], a, b),
          right = testComparison(n.ops[1], b, c);
        return int(left && right ? 1n : 0n);
      }
      case "vector":
        return { t: "vec", items: n.items.map(evaluate) };
      case "call": {
        if (n.name === "if") {
          if (n.args.length !== 3)
            fail("if() has the wrong number of arguments.");
          const condition = numeric(evaluate(n.args[0]), "if() condition");
          return evaluate(n.args[isZero(condition) ? 2 : 1]);
        }
        const fn = Object.hasOwn(calc.functions, n.name)
          ? calc.functions[n.name]
          : null;
        if (!fn)
          fail(
            aliases[n.name]
              ? `Emacs Calc does not define ${n.name}(); Org would leave it unevaluated. Use ${aliases[n.name]}().`
              : `Unsupported Calc function ${n.name}(); Org would leave it unevaluated.`,
          );
        const args = n.args.map(evaluate),
          [least, most] = arity(n.name);
        if (args.length < least || args.length > most)
          fail(`${n.name}() has the wrong number of arguments.`);
        return fn(...args);
      }
    }
  }
  const result = calc.normalize(evaluate(parseCalc(expression)));
  if (result.t === "sym") scalar(result);
  if (result.t === "vec")
    result.items.forEach((i) => i.t === "sym" && scalar(i));
  return result;
}

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
function formatFloat(mant, exp, kind, figs, prec) {
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
