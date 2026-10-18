# Beancount core subset

Sheets has its own permissively licensed JavaScript engine for a core [Beancount](https://beancount.github.io/) subset. No GPL WASM engine or Python Beancount runtime is shipped to browsers.

Use it to inspect a small ledger, understand double-entry postings, or review
supported balances and transactions. Select **Beancount**, or start with dated
account/transaction directives for Auto detection. Downloads use `.bean`; the
extension helper also recognizes `.beancount`.
[Open the starter example](../../index.html?example=beancount-basic&format=beancount).

## Start with a balanced transaction

```text
2026-01-01 open Assets:Bank USD
2026-01-01 open Equity:Opening USD
2026-01-02 * "Opening balance"
  Assets:Bank 1000 USD
  Equity:Opening
2026-01-03 balance Assets:Bank 1000 USD
```

The missing amount on `Equity:Opening` is inferred as **-1000 USD**, balancing the
bank posting. Open accounts before using them, indent postings under their
transaction, and leave at most one amount to infer. The balance assertion checks
the bank's expected quantity at the start of January 3.

## Reading the reports

Use the report selector in the preview to change what you inspect:

| Report | Use it to inspect |
| --- | --- |
| Diagnostics | Invalid or unsupported directives, transaction imbalances, assertion failures, and account/lot problems |
| Balance sheet | Asset, liability, and equity account balances |
| Income statement | Income and expense balances |
| Trial balance | Account balances across the ledger, separated by commodity |
| Account journal | Transaction postings grouped by account |

The reports are views of the current source, rather than a query console. A
rendered HTML export or printout keeps only the currently selected report; the
source download retains the entire ledger. Correct diagnostics before treating
partial report output as a reliable balance.

## Directive and posting reference

| Syntax | Meaning |
| --- | --- |
| `2026-01-01 open Assets:Bank USD` | Open an account, optionally restricting commodities |
| `2026-01-02 * "Opening balance"` | Start a cleared transaction; `!` and `txn` are also supported |
| `Assets:Bank 1000 USD` indented below a transaction | Post a commodity quantity to an account |
| `2026-01-03 balance Assets:Bank 1000 USD` | Assert an expected balance at the start of that date |
| `{10 USD}` after a quantity | Attach a supported per-unit cost lot |
| `@ 10 USD` or `@@ 20 USD` after a quantity | Supply a unit or total transaction price |
| `#tag`, `^link`, or indented `key: "value"` | Retain transaction tags, links, or metadata |

## Supported subset and limits

Supported directives are `option`, `open`, `close`, `commodity`, transactions (`*`, `!`, `txn`), `balance`, `pad`, `price`, `note`, and `event`. Transactions support tags, links, metadata, and one inferred missing posting amount. Postings can carry simple per-unit `{cost}` lots or `@`/`@@` prices. Cost lots use FIFO when reduced. Metadata and informational directives are retained; price directives are not used to revalue reports.

The preview includes **Diagnostics**, **Balance sheet**, **Income statement**, **Trial balance**, and an **Account journal**, grouped by account. Balances retain native commodities. Transaction balancing uses cost or price weights; displayed holdings retain their original quantities. There is no consolidated reporting currency or automatic price valuation.

Diagnostics cover unbalanced transactions, failed assertions, unsupported includes/plugins, missing or closed accounts, restricted commodities, unmatched lots, and unused pads. A pad supplies the difference at its next assertion and balances the source account. A balance directive observes the start of its date, before that day's transactions.

Amounts retain their decimal input values. Arithmetic uses a 28-significant-digit,
half-even decimal context, matching the pinned Python reference context. Reports
and journals preserve the resulting decimal text instead of converting through
binary numbers or rounding every quantity to eight decimal places. Numeric
literals are bounded at 256 digits.

Transaction tolerances are inferred separately for each commodity from the decimal
places written in posting quantities; integer quantities contribute no inferred
tolerance. The coarsest fractional precision wins, multiplied by the default 0.5.
Supported options are `tolerance_multiplier`, repeatable
`inferred_tolerance_default` commodity/default pairs, and
`infer_tolerance_from_cost`. Cost/price contributions are capped as in the reference.
Balance assertions infer their own tolerance or accept an explicit override such
as `0.00 ~ 0.005 USD`. Precision settings are nonnegative. A tolerance accepts a
residual; it does not rewrite the quantities you entered.

For example, this quantity exceeds binary floating-point integer precision, but
its fractional digits are kept in the reports:

```text
2026-01-01 open Assets:Bank USD
2026-01-01 open Equity:Opening USD
2026-01-02 * "Exact quantity"
  Assets:Bank 9007199254740993.0000000001 USD
  Equity:Opening -9007199254740993.0000000001 USD
```

Known gaps: advanced booking methods and lot selectors, total-cost syntax,
inventory interpolation across multiple missing commodities, other advanced
options (including automatic rounding-account postings), includes, and plugins.
An attempted `account_rounding` option produces an unsupported-setting diagnostic.
Error reports remain visible alongside partial balances; they do not certify a ledger.

Fixtures are checked independently with pinned `bean-check` and `bean-query` tools in CI. Auto detects dated account directives and transaction flags. Extensions are `.bean` and `.beancount` when a filename is available.

The source editor highlights dates, directives, accounts, amounts, commodities, tags, links, strings, and metadata. Semicolon comments stay separate from quoted text. Highlighting is a lexical aid; rendering diagnostics report evaluation errors.

An unbalanced entry often means a missing counter-posting, an incorrect sign, or
a cost/price weight that differs from the holding quantity. A failed assertion is
a separate check and does not rewrite earlier transactions. Ledger evaluation is
local and works with offline files installed. See the
[feature comparison and glossary](../format-comparison.md) for commodities,
postings, assertions, and the distinction from physical units.

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.

<!-- compatibility:start -->
## Tracked compatibility status

These entries share the [central limitations ledger](../limitations.md). “Needs detailed audit” means the disclosure is recorded, while its complete upstream case coverage is still being developed.

| ID | Status | Area |
| --- | --- | --- |
| BEAN-01 | Needs detailed audit | This is a project-owned core JavaScript engine, not Python Beancount or a full query environment |
| BEAN-02 | Needs detailed audit | Transactions infer at most one missing posting amount |
| BEAN-03 | Needs detailed audit | Price directives are retained but do not revalue reports |
| BEAN-04 | Resolved | Decimal arithmetic and precision tolerances |
| BEAN-05 | Needs detailed audit | Balance assertions observe the start of their date, before that day's transactions |
| BEAN-06 | Known gap | Decimal resource bounds and remaining rounding options |
<!-- compatibility:end -->
