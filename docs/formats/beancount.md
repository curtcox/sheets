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
| `{10 USD}` after a quantity | Attach a per-unit cost lot |
| `{{20 USD}}` after `2 STOCK` | Total acquisition cost; resolves to 10 USD per unit |
| `{2026-01-02}` or `{"old"}` | Select an existing lot by acquisition date or label |
| `{}` or `{USD}` on a reduction | Let the account booking method choose matching lots |
| `open Assets:Stock STOCK "FIFO"` after a date | Override the default booking method for an account |
| `@ 10 USD` or `@@ 20 USD` after a quantity | Supply a unit or total transaction price |
| `#tag`, `^link`, or indented `key: "value"` | Retain transaction tags, links, or metadata |

## Supported subset and limits

Supported directives are `option`, `open`, `close`, `commodity`, transactions (`*`, `!`, `txn`), `balance`, `pad`, `price`, `note`, and `event`. Transactions support tags, links, metadata, and one inferred missing posting amount. Postings can carry per-unit or total-cost lots, date/label selectors, or `@`/`@@` prices. Cost lots use the booking method selected on the account or by the file-wide `booking_method` option; the default is STRICT. Metadata and informational directives are retained; price directives are not used to revalue reports.

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

## Total costs and lot selection

```text
2026-01-01 open Assets:Stock STOCK "FIFO"
2026-01-01 open Assets:Cash USD
2026-01-02 * "First lot"
  Assets:Stock 2 STOCK {{20 USD, "old"}}
  Assets:Cash
2026-01-03 * "Second lot"
  Assets:Stock 3 STOCK {20 USD, "new"}
  Assets:Cash
2026-01-04 * "Sell three using FIFO cost weights"
  Assets:Stock -3 STOCK {}
  Assets:Cash
```

The first lot costs **10 USD per unit**, rather than 20 USD per unit. The sale
uses the two oldest units and one newer unit: its weight is **-40 USD**, so the
cash posting is inferred as **40 USD**. Holdings finish at **2 STOCK** and
**-40 USD**, still shown in their native commodities. A price annotation does not
replace a lot's cost weight; these reports do not revalue holdings.

Use per-unit `{10 USD}`, total `{{20 USD}}`, cost commodity `{USD}`, date
`{2026-01-02}`, label `{"old"}`, or combinations such as
`{10 USD, 2026-01-02, "old"}`. Empty `{}` specifies no selector. Acquisitions
require an explicit cost amount and commodity; their date defaults to the
transaction date. Identical cost/commodity/date/label positions merge. A total
cost divides by the absolute quantity in the decimal context; a recurring
quotient can leave a tiny decimal residual, just as in the native reference.
Short cost positions and their matching covers use the same rules. Uncosted
postings stay separate from positions held at cost.

| Booking method | Behavior when several lots match |
| --- | --- |
| STRICT (default) | Reject ambiguity, unless the requested reduction empties all matching lots exactly |
| STRICT_WITH_SIZE | Apply STRICT first; otherwise select an exact-size lot, oldest acquisition date first |
| FIFO | Reduce oldest acquisition dates first |
| LIFO | Reduce newest acquisition dates first |
| HIFO | Reduce highest unit cost first, within the resolved cost commodity |
| NONE | Create/merge the explicitly specified signed position without selecting other lots; mixed positive/negative lots are allowed |

Set the file-wide default with `option "booking_method" "FIFO"`, or override it
on an account's `open` directive as above. A date/label/cost selector filters lots
before the method runs. FIFO/LIFO/HIFO ties retain inventory insertion order.
Insufficient or unmatched reductions produce diagnostics. A failed booking group
contributes no postings or inventory changes; independent weight-commodity groups
can still appear in the partial report. Multiple reductions in one transaction
reserve the available lots, while acquisitions become candidates only after that
transaction. Correct every diagnostic before relying on a report.

**Compatibility change:** older Sheets versions silently used FIFO regardless of
booking declarations, and could misread `{{total cost}}` as a per-unit cost.
Omitted methods now use Beancount's STRICT default. Specify FIFO explicitly if
that is the intended policy; a newly rejected ambiguous entry needs an explicit
method or a more precise selector. Existing unambiguous per-unit ledgers retain
their balances.

## Remaining inventory limits

Combined per-unit/total `{10 # 2 USD}` costs, merge markers, cost/quantity
interpolation within a lot, arbitrary arithmetic in amounts, and automatic lot
commodity inference across several cost commodities remain unsupported. A cost
transaction with a missing posting requires one known weight commodity and at
most one missing amount. AVERAGE is not implemented (the pinned native version
also rejects reductions under it); it is diagnosed rather than silently treated
as FIFO. These limits are separate from the supported booking methods and total
costs. Other advanced options (including automatic rounding-account postings),
includes, and plugins remain unsupported. Error reports remain visible alongside
partial balances; they do not certify a ledger. Total costs on zero units produce
a diagnostic; the pinned native loader instead raises a division-by-zero error.

Fixtures are checked independently with pinned `bean-check` and `bean-query` tools in CI. Auto detects dated account directives and transaction flags. Extensions are `.bean` and `.beancount` when a filename is available.

The source editor highlights dates, directives, accounts, amounts, commodities, tags, links, strings, and metadata. Semicolon comments stay separate from quoted text. Highlighting is a lexical aid; rendering diagnostics report evaluation errors.

An unbalanced entry often means a missing counter-posting, an incorrect sign, or
a cost/price weight that differs from the holding quantity. A failed assertion is
a separate check and does not rewrite earlier transactions. Ledger evaluation is
local and works with offline files installed. See the
[feature comparison and glossary](../format-comparison.md) for commodities,
postings, assertions, and the distinction from physical units.

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.

Compare the available libraries and definition syntax in
[built-in and custom functions](../function-comparison.md).

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
| BEAN-07 | Resolved | Per-unit/total costs and date/label lot selectors |
| BEAN-08 | Resolved | Explicit booking policies and ambiguous-reduction rejection |
| BEAN-09 | Known gap | Remaining cost grammar, lot interpolation and booking bounds |
<!-- compatibility:end -->
