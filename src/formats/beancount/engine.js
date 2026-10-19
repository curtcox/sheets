/** Sheets' permissive Beancount core. Quantities stay separate by commodity. */
import {
  D,
  zero,
  decimal,
  scale,
  canonical,
  plain,
  precisionOptions,
  tolerances,
  quantizeInferred,
} from "./decimal.js";
import {
  annotations,
  bookingMethod,
  costCurrency,
  bookLots,
  applyLot,
} from "./booking.js";
const accountPattern =
  "(?:Assets|Liabilities|Equity|Income|Expenses)(?::[A-Z][A-Za-z0-9-]*)+";
const accountRE = new RegExp(`^(${accountPattern})(?:\\s+|$)(.*)$`);
const numberPattern = "[+-]?(?:\\d[\\d,]*(?:\\.\\d*)?|\\.\\d+)";
const amountRE = new RegExp(`^(${numberPattern})\\s+([A-Z][A-Z0-9._'-]*)`);
const unquote = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value.replace(/^"|"$/g, "");
  }
};
function amount(text) {
  const m = amountRE.exec(text);
  return m
    ? {
        number: decimal(m[1]),
        scale: scale(m[1]),
        currency: m[2],
        tail: text.slice(m[0].length).trim(),
      }
    : null;
}
export function parseBeancount(src) {
  const entries = [],
    diagnostics = [],
    options = {},
    optionEntries = [];
  let entry = null,
    posting = null;
  const error = (line, message) => diagnostics.push({ line, message });
  src.split("\n").forEach((raw, i) => {
    const line = i + 1;
    try {
      // A semicolon inside a quoted narration/lot label is data.
      const text = (
        raw.match(/^(?:"(?:[^"\\]|\\.)*"|[^";])*/)?.[0] || ""
      ).trim();
      if (!text || text.startsWith(";")) return;
      if (/^option\s/.test(text)) {
        const m = /^option\s+"([^"]+)"\s+"([^"]*)"/.exec(text);
        if (m) {
          options[m[1]] = m[2];
          optionEntries.push({ name: m[1], value: m[2], line });
        } else error(line, "Invalid option.");
        return;
      }
      if (/^(?:include|plugin|pushtag|poptag|pushmeta|popmeta)\b/.test(text)) {
        error(line, `${text.split(/\s/)[0]} is unsupported.`);
        return;
      }
      if (/^\s/.test(raw) && entry) {
        if (/^[a-z][\w-]*:/.test(text)) {
          const m = /^([\w-]+):\s*(.*)$/.exec(text);
          (posting || entry).metadata[m[1]] = unquote(m[2]);
          return;
        }
        if (entry.kind !== "transaction") {
          error(line, "Unexpected indented line.");
          return;
        }
        const match = accountRE.exec(text.replace(/^[*!]\s+/, ""));
        if (!match) {
          error(line, "Invalid posting.");
          return;
        }
        const a = amount(match[2]);
        if (match[2] && !a) {
          error(line, "Invalid posting amount.");
          return;
        }
        posting = {
          line,
          account: match[1],
          ...(a
            ? { number: a.number, currency: a.currency, scale: a.scale }
            : {}),
          metadata: {},
        };
        if (a) Object.assign(posting, annotations(a.tail, a.number, amount));
        entry.postings.push(posting);
        return;
      }
      const match = /^(\d{4}-\d{2}-\d{2})\s+(\S+)(?:\s+(.*))?$/.exec(text);
      if (!match) {
        error(line, "Unsupported or invalid directive.");
        entry = null;
        return;
      }
      const [, date, kind, rest = ""] = match;
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
      ) {
        error(line, "Invalid date.");
        return;
      }
      posting = null;
      entry = {
        date,
        kind: ["*", "!", "txn"].includes(kind) ? "transaction" : kind,
        line,
        metadata: {},
        raw: rest,
      };
      if (entry.kind === "transaction") {
        const strings = rest.match(/"(?:[^"\\]|\\.)*"/g) || [];
        entry.payee = strings.length > 1 ? unquote(strings[0]) : "";
        entry.narration = unquote(strings.at(-1) || "");
        entry.flag = kind;
        entry.tags = [...rest.matchAll(/#([\w-]+)/g)].map((m) => m[1]);
        entry.links = [...rest.matchAll(/\^([\w-]+)/g)].map((m) => m[1]);
        entry.postings = [];
      } else {
        const m = accountRE.exec(rest);
        entry.account = m?.[1];
        if (["open", "close", "balance", "pad", "note"].includes(kind) && !m)
          error(line, `Invalid ${kind} account.`);
        if (kind === "balance") {
          const explicit = new RegExp(
            `^(${numberPattern})\\s+~\\s+(${numberPattern})\\s+([A-Z][A-Z0-9._'-]*)$`,
          ).exec(m?.[2] || "");
          entry.amount = explicit
            ? amount(`${explicit[1]} ${explicit[3]}`)
            : amount(m?.[2] || "");
          if (explicit) {
            entry.tolerance = decimal(explicit[2]);
            if (entry.tolerance.lt(0))
              throw new Error("Balance tolerance must not be negative.");
          }
        }
        if (kind === "pad") entry.sourceAccount = m?.[2].trim();
        if (kind === "open") {
          const opened = /^(.*?)(?:\s*("(?:[^"\\]|\\.)*"))?$/.exec(
            m?.[2] || "",
          );
          entry.currencies = opened[1].split(/[, ]+/).filter(Boolean);
          if (entry.currencies.some((c) => !/^[A-Z][A-Z0-9._'-]*$/.test(c)))
            throw new Error("Invalid open commodity or booking declaration.");
          entry.booking = opened[2] ? bookingMethod(unquote(opened[2])) : null;
        }
        if (kind === "commodity") entry.currency = rest.trim();
        if (kind === "price") {
          const p = /^(\S+)\s+(.+)$/.exec(rest);
          entry.currency = p?.[1];
          entry.amount = amount(p?.[2] || "");
        }
        if (
          ![
            "open",
            "close",
            "commodity",
            "balance",
            "pad",
            "price",
            "note",
            "event",
          ].includes(kind)
        )
          error(line, `${kind} is unsupported.`);
      }
      entries.push(entry);
    } catch (e) {
      error(line, e.message);
      if (entry?.kind === "transaction") entry.invalid = true;
      entry = null;
      posting = null;
    }
  });
  return { entries, diagnostics, options, optionEntries };
}
export function evaluateBeancount(src) {
  const result = parseBeancount(src),
    { entries, diagnostics } = result;
  const accounts = new Map(),
    balances = new Map(),
    lots = new Map(),
    journal = [],
    prices = [],
    pads = new Map();
  const error = (line, message) => diagnostics.push({ line, message });
  const config = precisionOptions(result.optionEntries, error);
  let defaultBooking = "STRICT";
  for (const option of result.optionEntries.filter(
    (o) => o.name === "booking_method",
  )) {
    try {
      defaultBooking = bookingMethod(option.value);
    } catch (e) {
      error(option.line, e.message);
    }
  }
  const get = (account, currency) =>
    balances.get(account)?.get(currency) ?? zero;
  function add(account, currency, quantity) {
    if (!balances.has(account)) balances.set(account, new Map());
    const row = balances.get(account);
    row.set(currency, (row.get(currency) ?? zero).plus(quantity));
  }
  function validate(account, currency, line) {
    const state = accounts.get(account);
    if (!state) error(line, `Account ${account} is not open.`);
    else if (state.closed) error(line, `Posting to closed account ${account}.`);
    else if (state.currencies.length && !state.currencies.includes(currency))
      error(line, `${currency} is not allowed in ${account}.`);
  }
  const weight = (p) =>
    p.cost
      ? { currency: p.cost.currency, number: p.number.times(p.cost.number) }
      : p.price
        ? {
            currency: p.price.currency,
            number: p.price.total
              ? p.price.number.times(
                  p.number.isZero() ? 0 : p.number.isNegative() ? -1 : 1,
                )
              : p.number.times(p.price.number),
          }
        : { currency: p.currency, number: p.number };
  function book(txn) {
    if (txn.invalid) return;
    if (txn.postings.some((p) => p.costSpec)) {
      // Resolve weight commodities before booking. Failed groups contribute no
      // postings or lots, as in the native booking pass; other groups can survive.
      const groups = new Map(),
        missing = [];
      try {
        for (const p of txn.postings) {
          if (p.number === undefined) {
            missing.push(p);
            continue;
          }
          const currency = costCurrency(p, lots);
          if (!groups.has(currency)) groups.set(currency, []);
          groups.get(currency).push(p);
        }
        if (missing.length && (missing.length !== 1 || groups.size !== 1))
          throw new Error(
            "Cost transactions require at most one missing amount and one weight commodity when inferring.",
          );
        if (missing.length) [...groups.values()][0].push(...missing);
      } catch (e) {
        error(e.line ?? txn.line, e.message);
        return;
      }
      const tolerance = tolerances(
        txn.postings.map((p) => ({ ...p, cost: p.costSpec })),
        config,
      );
      for (const group of groups.values()) {
        try {
          record(
            { ...txn, postings: bookLots(group, lots, accounts, txn.date) },
            tolerance,
          );
        } catch (e) {
          error(e.line ?? txn.line, e.message);
        }
      }
    } else record(txn);
  }
  function record(txn, inheritedTolerance) {
    if (!txn.postings.length) {
      error(txn.line, "Transaction has no postings.");
      return;
    }
    const missing = txn.postings.filter((p) => p.number === undefined),
      totals = new Map(),
      tolerance = inheritedTolerance ?? tolerances(txn.postings, config);
    for (const p of txn.postings)
      if (p.number !== undefined) {
        const w = weight(p);
        totals.set(w.currency, (totals.get(w.currency) ?? zero).plus(w.number));
      }
    const nonzero = [...totals].filter(([, n]) => !n.isZero());
    const candidate = nonzero.length === 1 ? nonzero[0] : null;
    if (missing.length === 1 && candidate) {
      const [currency, n] = candidate;
      missing[0].currency = currency;
      missing[0].number = quantizeInferred(n.negated(), tolerance(currency));
      totals.set(currency, n.plus(missing[0].number));
    } else if (
      missing.length &&
      !(missing.length === 1 && !nonzero.length && totals.size)
    )
      error(
        txn.line,
        "Cannot infer posting: exactly one missing amount and one balancing commodity are required.",
      );
    for (const [currency, n] of totals)
      if (n.abs().gt(tolerance(currency)))
        error(txn.line, `Unbalanced transaction: ${canonical(n)} ${currency}.`);
    for (const p of txn.postings) {
      if (p.number === undefined) continue;
      validate(p.account, p.currency, p.line);
      add(p.account, p.currency, p.number);
      applyLot(p, lots);
      journal.push({
        date: txn.date,
        line: p.line,
        account: p.account,
        currency: p.currency,
        number: p.number,
        balance: get(p.account, p.currency),
        narration: txn.narration,
        payee: txn.payee,
        tags: txn.tags || [],
        links: txn.links || [],
      });
    }
  }
  const order = { open: 0, balance: 1, pad: 2, transaction: 3, close: 4 };
  for (const e of entries
    .slice()
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (order[a.kind] ?? 2) - (order[b.kind] ?? 2) ||
        a.line - b.line,
    )) {
    switch (e.kind) {
      case "open":
        if (accounts.has(e.account))
          error(e.line, `Account ${e.account} is already open.`);
        else
          accounts.set(e.account, {
            currencies: e.currencies,
            booking: e.booking ?? defaultBooking,
            closed: false,
          });
        break;
      case "close":
        if (!accounts.has(e.account))
          error(e.line, `Account ${e.account} is not open.`);
        else {
          accounts.get(e.account).closed = true;
          for (const [currency, n] of balances.get(e.account) || [])
            if (!n.isZero())
              error(e.line, `Nonzero balance on close: ${n} ${currency}.`);
        }
        break;
      case "transaction":
        book(e);
        break;
      case "pad":
        if (pads.has(e.account) && !pads.get(e.account).used)
          error(pads.get(e.account).line, "Unused pad directive.");
        pads.set(e.account, { ...e, used: false, seen: new Set() });
        break;
      case "balance": {
        if (!e.amount) {
          error(e.line, "Invalid balance assertion.");
          break;
        }
        const { currency, number } = e.amount,
          difference = number.minus(get(e.account, currency)),
          pad = pads.get(e.account),
          tolerance =
            e.tolerance ??
            (e.amount.scale
              ? new D(10).pow(-e.amount.scale).times(config.multiplier).times(2)
              : zero);
        if (pad && !pad.seen.has(currency)) {
          pad.seen.add(currency);
          if (pad.date === e.date)
            error(e.line, "Padding must precede its balance assertion date.");
          else if (difference.abs().gt(tolerance)) {
            pad.used = true;
            book({
              date: pad.date,
              line: pad.line,
              narration: "Padding",
              postings: [
                {
                  line: pad.line,
                  account: e.account,
                  currency,
                  number: difference,
                },
                {
                  line: pad.line,
                  account: pad.sourceAccount,
                  currency,
                  number: difference.negated(),
                },
              ],
            });
          }
        }
        if (get(e.account, currency).minus(number).abs().gt(tolerance))
          error(
            e.line,
            `Balance assertion failed for ${e.account}: expected ${number} ${currency}, got ${get(e.account, currency)}.`,
          );
        break;
      }
      case "price":
        if (!e.amount) error(e.line, "Invalid price.");
        else prices.push(e);
        break;
    }
  }
  for (const pad of pads.values())
    if (!pad.used) error(pad.line, "Unused pad directive.");
  const balancesObject = Object.fromEntries(
    [...balances]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([account, values]) => [
        account,
        Object.fromEntries([...values].sort(([a], [b]) => a.localeCompare(b))),
      ]),
  );
  return plain({
    ...result,
    balances: balancesObject,
    journal,
    lots: Object.fromEntries(
      [...lots]
        .map(([key, row]) => [key, row.filter((l) => !l.quantity.isZero())])
        .filter(([, row]) => row.length),
    ),
    prices,
  });
}
