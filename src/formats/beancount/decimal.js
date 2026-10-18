import Decimal from "../../../vendor/decimal.js";

// Match the pinned Python reference's decimal context without changing mathjs.
export const D = Decimal.clone({
  precision: 28,
  rounding: Decimal.ROUND_HALF_EVEN,
});
export const zero = new D(0);
export function decimal(text) {
  const literal = String(text).replaceAll(",", "");
  if (
    !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(literal) ||
    literal.replace(/\D/g, "").length > 256
  )
    throw new Error("Expected a decimal amount with at most 256 digits.");
  return new D(literal);
}
export const scale = (text) => String(text).split(".")[1]?.length || 0;
export const canonical = (value) => (value.isZero() ? "0" : value.toFixed());
export function plain(value) {
  if (D.isDecimal(value)) return canonical(value);
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, plain(v)]),
    );
  return value;
}
export function precisionOptions(entries, error) {
  const config = {
    multiplier: new D("0.5"),
    defaults: new Map(),
    fromCost: false,
  };
  for (const { name, value, line } of entries) {
    try {
      if (name === "tolerance_multiplier") {
        const n = decimal(value);
        if (n.lt(0)) throw new Error("Tolerance must not be negative.");
        config.multiplier = n;
      } else if (name === "inferred_tolerance_default") {
        const m = /^(\*|[A-Z][A-Z0-9._'-]*):([\d.]+)$/.exec(value);
        if (!m) throw new Error("Expected a commodity:tolerance pair.");
        config.defaults.set(m[1], decimal(m[2]));
      } else if (name === "infer_tolerance_from_cost")
        config.fromCost = /^(?:1|true|yes)$/i.test(value);
      else if (name === "account_rounding")
        throw new Error(
          "Automatic rounding-account postings are not implemented.",
        );
    } catch (e) {
      error(line, `Invalid ${name}: ${e.message}`);
    }
  }
  return config;
}
export function tolerances(postings, config) {
  const values = new Map(config.defaults),
    costs = new Map();
  const maximum = (currency, n) =>
    values.set(currency, D.max(values.get(currency) ?? zero, n));
  for (const p of postings) {
    if (p.number === undefined || !p.scale) continue;
    const tolerance = new D(10).pow(-p.scale).times(config.multiplier);
    maximum(p.currency, tolerance);
    if (config.fromCost)
      for (const price of [p.cost, p.price]) {
        if (!price) continue;
        const unitPrice = price.total
          ? p.number.isZero()
            ? zero
            : price.number.div(p.number.abs())
          : price.number;
        const n = D.min(tolerance.times(unitPrice), "0.5");
        costs.set(price.currency, (costs.get(price.currency) ?? zero).plus(n));
      }
  }
  for (const [currency, n] of costs) maximum(currency, n);
  return (currency) => values.get(currency) ?? values.get("*") ?? zero;
}
export function quantizeInferred(number, tolerance) {
  if (tolerance.isZero()) return number;
  const quantum = tolerance.times(2);
  if (quantum.sd() >= 5) return number;
  const exponent = quantum.e - quantum.sd() + 1;
  if (exponent <= 0) return number.toDecimalPlaces(-exponent);
  const step = new D(10).pow(exponent);
  return number.div(step).toDecimalPlaces(0).times(step);
}
