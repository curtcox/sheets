/** Project-owned lot matching. Native tools are test oracles, never a runtime. */
import { D, zero } from "./decimal.js";
const methods = new Set([
  "STRICT",
  "STRICT_WITH_SIZE",
  "FIFO",
  "LIFO",
  "HIFO",
  "NONE",
]);
export function bookingMethod(value) {
  if (!methods.has(value))
    throw new Error(
      `Unsupported booking method ${value}. Use ${[...methods].join(", ")}.`,
    );
  return value;
}
const validDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;

/** Fully consume annotations: unsupported syntax must never become a unit cost. */
export function annotations(tail, quantity, amount) {
  let rest = tail,
    costSpec,
    price;
  if (rest.startsWith("{")) {
    const total = rest.startsWith("{{"),
      close = total ? "}}" : "}";
    // Braces inside a quoted lot label do not close the cost specification.
    let quoted = false,
      escaped = false,
      end = -1;
    for (let i = total ? 2 : 1; i < rest.length; i++) {
      const c = rest[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (c === "\\" && quoted) {
        escaped = true;
        continue;
      }
      if (c === '"') quoted = !quoted;
      if (!quoted && rest.startsWith(close, i)) {
        end = i;
        break;
      }
    }
    if (end < 0) throw new Error("Unclosed cost specification.");
    let fields = rest.slice(total ? 2 : 1, end).trim();
    rest = rest.slice(end + close.length).trim();
    costSpec = {};
    while (fields) {
      const a = amount(fields);
      let consumed;
      if (a) {
        if (costSpec.currency)
          throw new Error("Duplicate cost amount or commodity.");
        if (a.number.lt(0)) throw new Error("Cost must not be negative.");
        costSpec.number = a.number;
        costSpec.currency = a.currency;
        fields = a.tail;
      } else if ((consumed = /^\d{4}-\d{2}-\d{2}(?=\s*(?:,|$))/.exec(fields))) {
        if (costSpec.date || !validDate(consumed[0]))
          throw new Error("Invalid or duplicate lot date.");
        costSpec.date = consumed[0];
        fields = fields.slice(consumed[0].length).trim();
      } else if ((consumed = /^"(?:[^"\\]|\\.)*"/.exec(fields))) {
        if (costSpec.label !== undefined)
          throw new Error("Duplicate lot label.");
        costSpec.label = JSON.parse(consumed[0]);
        fields = fields.slice(consumed[0].length).trim();
      } else if (
        (consumed = /^[A-Z][A-Z0-9._'-]*(?=\s*(?:,|$))/.exec(fields))
      ) {
        if (costSpec.currency) throw new Error("Duplicate cost commodity.");
        costSpec.currency = consumed[0];
        fields = fields.slice(consumed[0].length).trim();
      } else
        throw new Error(
          "Unsupported cost syntax; use a cost amount, commodity, date, or quoted label.",
        );
      if (fields) {
        if (!fields.startsWith(",") || !fields.slice(1).trim())
          throw new Error("Invalid cost separator.");
        fields = fields.slice(1).trim();
      }
    }
    if (total) {
      if (costSpec.number === undefined || quantity.isZero())
        throw new Error(
          "Total cost requires an amount and a nonzero quantity.",
        );
      costSpec.number = costSpec.number.div(quantity.abs());
    }
  }
  if (rest.startsWith("@")) {
    const total = rest.startsWith("@@"),
      a = amount(rest.slice(total ? 2 : 1).trim());
    if (!a || a.tail || a.number.lt(0))
      throw new Error("Invalid posting price.");
    price = { number: a.number, currency: a.currency, total };
    rest = "";
  }
  if (rest) throw new Error("Unsupported posting annotation.");
  return { ...(costSpec ? { costSpec } : {}), ...(price ? { price } : {}) };
}
export const lotKey = (p) => `${p.account}\0${p.currency}`;
const sameCost = (a, b) =>
  a.currency === b.currency &&
  a.number.eq(b.number) &&
  a.date === b.date &&
  a.label === b.label;
export function applyLot(p, lots) {
  if (!p.cost || p.number.isZero()) return;
  const key = lotKey(p),
    row = lots.get(key) || [];
  if (!lots.has(key)) lots.set(key, row);
  const existing = row.find((lot) => sameCost(lot, p.cost));
  if (existing) existing.quantity = existing.quantity.plus(p.number);
  else row.push({ quantity: p.number, ...p.cost });
}
export function costCurrency(p, lots) {
  if (!p.costSpec) return p.price?.currency ?? p.currency;
  if (p.costSpec.currency) return p.costSpec.currency;
  const currencies = new Set(
    (lots.get(lotKey(p)) || [])
      .filter((l) => !l.quantity.isZero())
      .map((l) => l.currency),
  );
  if (currencies.size !== 1)
    throw new Error(
      "Cannot determine a single cost commodity; specify it in the lot selector.",
    );
  return [...currencies][0];
}
/** Book reductions against pre-transaction inventory, with local reduction reservations.
 * Acquisitions in this transaction do not become candidates until it is committed.
 */
export function bookLots(postings, lots, accounts, date) {
  const local = new Map(
    [...lots].map(([key, row]) => [key, row.map((l) => ({ ...l }))]),
  );
  const booked = [];
  for (const p of postings) {
    if (!p.costSpec) {
      booked.push(p);
      continue;
    }
    const spec = p.costSpec,
      inventory = (local.get(lotKey(p)) || []).filter(
        (l) => !l.quantity.isZero(),
      );
    const method = accounts.get(p.account)?.booking ?? "STRICT";
    const opposite = inventory.filter((l) => l.quantity.times(p.number).lt(0));
    if (method !== "NONE" && opposite.length) {
      let candidates = opposite.filter(
        (l) =>
          (spec.number === undefined || l.number.eq(spec.number)) &&
          (!spec.currency || l.currency === spec.currency) &&
          (!spec.date || l.date === spec.date) &&
          (!spec.label || l.label === spec.label),
      );
      const requested = p.number.abs(),
        available = candidates.reduce((n, l) => n.plus(l.quantity.abs()), zero);
      if (!candidates.length)
        throw Object.assign(
          new Error("No position matches the cost lot selector."),
          { line: p.line },
        );
      if (available.lt(requested))
        throw Object.assign(
          new Error("Not enough matching cost lots to reduce."),
          { line: p.line },
        );
      if (method === "STRICT" || method === "STRICT_WITH_SIZE") {
        if (candidates.length > 1 && !available.eq(requested)) {
          const sized =
            method === "STRICT_WITH_SIZE"
              ? candidates
                  .filter((l) => l.quantity.abs().eq(requested))
                  .sort((a, b) => a.date.localeCompare(b.date))
              : [];
          if (!sized.length)
            throw Object.assign(
              new Error(
                "Ambiguous cost lot matches; specify cost, date, label, or a booking method.",
              ),
              { line: p.line },
            );
          candidates = [sized[0]];
        }
      } else
        candidates.sort((a, b) =>
          method === "HIFO"
            ? b.number.cmp(a.number)
            : (method === "LIFO" ? -1 : 1) * a.date.localeCompare(b.date),
        );
      let remaining = requested;
      for (const lot of candidates) {
        if (remaining.isZero()) break;
        const used = D.min(remaining, lot.quantity.abs()),
          number = p.number.lt(0) ? used.negated() : used;
        const { quantity, ...cost } = lot;
        booked.push({ ...p, number, cost });
        lot.quantity = lot.quantity.plus(number);
        remaining = remaining.minus(used);
      }
    } else {
      if (spec.number === undefined || !spec.currency)
        throw Object.assign(
          new Error(
            "An acquisition requires a complete cost amount and commodity; cost interpolation is unsupported.",
          ),
          { line: p.line },
        );
      booked.push({
        ...p,
        cost: {
          number: spec.number,
          currency: spec.currency,
          date: spec.date ?? date,
          label: spec.label ?? null,
        },
      });
    }
  }
  return booked;
}
