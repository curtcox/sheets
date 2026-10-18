# Beancount core subset

Sheets has its own permissively licensed JavaScript engine for a core [Beancount](https://beancount.github.io/) subset. No GPL WASM engine or Python Beancount runtime is shipped to browsers.

```text
2026-01-01 open Assets:Bank USD
2026-01-01 open Equity:Opening USD
2026-01-02 * "Opening balance"
  Assets:Bank 1000 USD
  Equity:Opening
2026-01-03 balance Assets:Bank 1000 USD
```

Supported directives are `option`, `open`, `close`, `commodity`, transactions (`*`, `!`, `txn`), `balance`, `pad`, `price`, `note`, and `event`. Transactions support tags, links, metadata, and one inferred missing posting amount. Postings can carry simple per-unit `{cost}` lots or `@`/`@@` prices. Cost lots use FIFO when reduced. Metadata and informational directives are retained; price directives are not used to revalue reports.

The preview includes **Diagnostics**, **Balance sheet**, **Income statement**, **Trial balance**, and an **Account journal**, grouped by account. Balances retain native commodities. Transaction balancing uses cost or price weights; displayed holdings retain their original quantities. There is no consolidated reporting currency or automatic price valuation.

Diagnostics cover unbalanced transactions, failed assertions, unsupported includes/plugins, missing or closed accounts, restricted commodities, unmatched lots, and unused pads. A pad supplies the difference at its next assertion and balances the source account. A balance directive observes the start of its date, before that day's transactions.

Known gaps: advanced booking methods and lot selectors, total-cost syntax, tolerances and rounding rules, inventory interpolation across multiple missing commodities, advanced options, includes, and plugins. Arithmetic uses JavaScript numbers with a fixed `1e-8` transaction tolerance, rather than Beancount's exact Decimal and inferred tolerances. Error reports remain visible alongside partial balances; they do not certify a ledger.

Fixtures are checked independently with pinned `bean-check` and `bean-query` tools in CI. Auto detects dated account directives and transaction flags. Extensions are `.bean` and `.beancount` when a filename is available.
