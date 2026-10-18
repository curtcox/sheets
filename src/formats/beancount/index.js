import { plugin } from "../registry.js";
import { evaluateBeancount } from "./engine.js";
import { escapeHTML as e } from "../../util.js";
export function renderBeancount(src) {
  const result = evaluateBeancount(src);
  const reports = [
    ["errors", "Diagnostics"],
    ["balance", "Balance sheet"],
    ["income", "Income statement"],
    ["trial", "Trial balance"],
    ["journal", "Account journal"],
  ];
  const balances = (predicate) =>
    `<table><thead><tr><th>Account</th><th>Amount</th><th>Commodity</th></tr></thead><tbody>${Object.entries(
      result.balances,
    )
      .filter(([a]) => predicate(a))
      .flatMap(([a, values]) =>
        Object.entries(values).map(
          ([c, n]) =>
            `<tr><td>${e(a)}</td><td>${e(n)}</td><td>${e(c)}</td></tr>`,
        ),
      )
      .join("")}</tbody></table>`;
  const panes = {
    errors: result.diagnostics.length
      ? `<ul class="diagnostics">${result.diagnostics.map((d) => `<li>Line ${d.line}: ${e(d.message)}</li>`).join("")}</ul>`
      : '<p class="success">The ledger balances. No errors found.</p>',
    balance: balances((a) => /^(Assets|Liabilities|Equity):/.test(a)),
    income: balances((a) => /^(Income|Expenses):/.test(a)),
    trial: balances(() => true),
    journal: `<table><thead><tr><th>Date</th><th>Account</th><th>Narration</th><th>Change</th><th>Balance</th></tr></thead><tbody>${result.journal
      .slice()
      .sort(
        (a, b) =>
          a.account.localeCompare(b.account) || a.date.localeCompare(b.date),
      )
      .map(
        (p) =>
          `<tr><td>${e(p.date)}</td><td>${e(p.account)}</td><td>${e([p.payee, p.narration, ...p.tags.map((t) => "#" + t), ...p.links.map((l) => "^" + l)].filter(Boolean).join(" · "))}</td><td>${e(p.number)} ${e(p.currency)}</td><td>${e(p.balance)} ${e(p.currency)}</td></tr>`,
      )
      .join("")}</tbody></table>`,
  };
  return {
    html: `<h1>Ledger reports</h1><div class="report-tabs" role="tablist">${reports.map(([id, label], i) => `<button role="tab" aria-selected="${i === 0}" aria-controls="report-${id}" data-report="${id}">${label}</button>`).join("")}</div>${reports.map(([id, label], i) => `<section id="report-${id}" role="tabpanel" ${i ? "hidden" : ""}><h2>${label}</h2>${panes[id]}</section>`).join("")}`,
    diagnostics: result.diagnostics,
    result,
  };
}
export default plugin("beancount", async (src) => renderBeancount(src));
