// Default ledger charts for the Charts report tab. Beancount has no chart
// syntax, so these need none. Amounts stay exact decimals until drawing;
// scripts/beancount-expected.py checks this data against bean-query.
import { D, zero, canonical } from "./decimal.js";
import { chartSVG, chartFigure, CHART_LIMITS } from "../../charts.js";
import { escapeHTML } from "../../util.js";

const DAY = 864e5;
const time = (date) => Date.parse(`${date}T00:00:00Z`);
const iso = (t) => new Date(t).toISOString().slice(0, 10);
export const PERIOD_NAMES = { day: "Daily", week: "Weekly", month: "Monthly" };

/** Daily under 62 days of data, weekly (Monday to Sunday) under 366, else monthly. */
export function ledgerPeriods(first, last) {
  const days = (time(last) - time(first)) / DAY + 1,
    kind = days < 62 ? "day" : days < 366 ? "week" : "month",
    list = [];
  if (kind === "day")
    for (let t = time(first); t <= time(last); t += DAY) list.push({ start: iso(t), end: iso(t), label: iso(t) });
  else if (kind === "week") {
    const monday = time(first) - ((new Date(time(first)).getUTCDay() + 6) % 7) * DAY;
    for (let t = monday; t <= time(last); t += 7 * DAY) list.push({ start: iso(t), end: iso(t + 6 * DAY), label: iso(t) });
  } else {
    let [y, m] = first.split("-").map(Number);
    const stop = last.slice(0, 7);
    for (;;) {
      const start = iso(Date.UTC(y, m - 1, 1));
      if (start.slice(0, 7) > stop) break;
      list.push({ start, end: iso(Date.UTC(y, m, 0)), label: start.slice(0, 7) });
      [y, m] = m === 12 ? [y + 1, 1] : [y, m + 1];
    }
  }
  return { kind, periods: list };
}

/** The operating currency, else the currency used in the most postings. */
export function chartCurrency(result) {
  const option = result.optionEntries?.find((o) => o.name === "operating_currency")?.value.trim();
  if (option) return option;
  const counts = new Map();
  for (const p of result.journal) counts.set(p.currency, (counts.get(p.currency) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] ?? null;
}

const second = (account) => account.split(":").slice(0, 2).join(":");

/**
 * Chart data as canonical decimal strings: period-end Assets and Liabilities
 * balances per currency, Income (sign flipped) and Expenses per period in the
 * chart currency, and second-level Expenses totals over the whole ledger.
 */
export function ledgerChartData(result) {
  const postings = result.journal.filter((p) => p.date).slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (!postings.length) return null;
  const currency = chartCurrency(result),
    { kind, periods } = ledgerPeriods(postings[0].date, postings.at(-1).date),
    worth = postings.filter((p) => /^(Assets|Liabilities):/.test(p.account)),
    flows = postings.filter((p) => /^(Income|Expenses):/.test(p.account));
  const currencies = [...new Set(worth.map((p) => p.currency))].sort((a, b) =>
    a === currency ? -1 : b === currency ? 1 : a < b ? -1 : a > b ? 1 : 0);
  const running = new Map(currencies.map((c) => [c, zero])),
    netWorth = Object.fromEntries(currencies.map((c) => [c, []])),
    income = [],
    expenses = [],
    net = [];
  let w = 0, f = 0;
  for (const period of periods) {
    for (; w < worth.length && worth[w].date <= period.end; w++)
      running.set(worth[w].currency, running.get(worth[w].currency).plus(worth[w].number));
    for (const c of currencies) netWorth[c].push(canonical(running.get(c)));
    let inSum = zero, outSum = zero;
    for (; f < flows.length && flows[f].date <= period.end; f++) {
      if (flows[f].currency !== currency) continue;
      if (flows[f].account.startsWith("Income:")) inSum = inSum.minus(flows[f].number);
      else outSum = outSum.plus(flows[f].number);
    }
    income.push(canonical(inSum));
    expenses.push(canonical(outSum));
    net.push(canonical(inSum.minus(outSum)));
  }
  const totals = new Map();
  for (const p of flows)
    if (p.currency === currency && p.account.startsWith("Expenses:"))
      totals.set(second(p.account), (totals.get(second(p.account)) ?? zero).plus(p.number));
  const ranked = [...totals]
    .filter(([, n]) => !n.isZero())
    .sort(([a, x], [b, y]) => y.comparedTo(x) || (a < b ? -1 : 1));
  const spent = ranked.slice(0, CHART_LIMITS.slices).map(([account, n]) => ({ account, amount: canonical(n) }));
  if (ranked.length > CHART_LIMITS.slices)
    spent.push({
      account: "Other",
      amount: canonical(ranked.slice(CHART_LIMITS.slices).reduce((sum, [, n]) => sum.plus(n), new D(0))),
      count: ranked.length - CHART_LIMITS.slices,
    });
  const omitted = [...new Set(flows.map((p) => p.currency).filter((c) => c !== currency))].sort();
  return { currency, period: kind, periods, netWorth, income, expenses, net, spent, omitted };
}

const grouped = (text) => {
  const [whole, fraction] = text.replace("-", "").split(".");
  return `${text.startsWith("-") ? "-" : ""}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction ? `.${fraction}` : ""}`;
};

/** The Charts tab body: three figures, or a short message without dated postings. */
export function ledgerChartsHTML(result) {
  const data = ledgerChartData(result);
  if (!data) return { html: '<p class="subtle">There are no dated postings to chart yet.</p>', data };
  const { currency, period, periods } = data,
    name = PERIOD_NAMES[period],
    amounts = (values, c) => values.map((v) => `${grouped(v)} ${c}`),
    figures = [];
  const worth = chartSVG({
    kind: "linespoints",
    title: "Net worth",
    x: { type: "time", values: periods.map((p) => time(p.end)), text: periods.map((p) => p.end) },
    y: { label: Object.keys(data.netWorth).length === 1 ? Object.keys(data.netWorth)[0] : "" },
    series: Object.entries(data.netWorth).map(([c, values]) => ({ label: c, values: values.map(Number), text: amounts(values, c) })),
  });
  figures.push(chartFigure({ svg: worth.svg, title: "Net worth", note: `${name} period-end balance of Assets and Liabilities, one line per currency.` }));
  const flow = chartSVG({
    kind: "bar",
    title: "Income and expenses",
    x: { values: periods.map((p) => p.label) },
    y: { label: currency },
    series: [
      { label: "Income", values: data.income.map(Number), text: amounts(data.income, currency) },
      { label: "Expenses", values: data.expenses.map(Number), text: amounts(data.expenses, currency) },
      { label: "Net", line: true, values: data.net.map(Number), text: amounts(data.net, currency) },
    ],
  });
  figures.push(chartFigure({ svg: flow.svg, title: "Income and expenses", note: `${name} totals in ${currency}. Income is shown with its sign flipped; the line is income minus expenses.` }));
  if (data.spent.length) {
    const where = chartSVG({
      kind: "bar",
      horizontal: true,
      title: "Where the money went",
      x: { values: data.spent.map((s) => (s.count ? `Other (${s.count} accounts)` : s.account)) },
      series: [{ label: currency, values: data.spent.map((s) => Number(s.amount)), text: amounts(data.spent.map((s) => s.amount), currency) }],
    });
    figures.push(chartFigure({ svg: where.svg, title: "Where the money went", note: `Expenses by second-level account over the whole ledger, in ${currency}. The largest ${CHART_LIMITS.slices} are shown separately.` }));
  } else figures.push(`<p class="subtle">No ${escapeHTML(currency)} expenses to show where the money went.</p>`);
  const omitted = data.omitted.length
    ? `<p class="chart-omitted subtle">Income and expense charts use ${escapeHTML(currency)} only; ${escapeHTML(data.omitted.join(", "))} postings are left out because Sheets does not convert between commodities.</p>`
    : "";
  return { html: figures.join("") + omitted, data };
}
