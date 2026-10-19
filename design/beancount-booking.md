# BEAN-2A: exact cost lots and booking

This is a project-owned JavaScript implementation of observed contracts, not a
port or browser distribution of the GPL Python engine. The independent tools are
Beancount 3.2.0 and beanquery 0.2.0, pinned in README and CI. The native source
reference is [booking semantics at 3.2.0](https://github.com/beancount/beancount/tree/3.2.0/beancount/parser).

## Numeric and inventory contracts

- `{amount CURRENCY}` is per-unit; `{{amount CURRENCY}}` divides by the absolute
  unit quantity using the existing 28-significant-digit half-even decimal context.
  A three-unit total of ten yields a recurring unit cost and its native decimal
  residual. Cost weight takes precedence over a price; reports keep native units.
- Cost syntax is fully consumed. A malformed double brace, unsupported combined
  `#` cost or merge marker cannot fall back to a per-unit or uncosted posting.
  Dates and quoted labels (including braces, commas, escaped quotes, semicolons)
  are parsed without treating label punctuation as delimiters/comments.
- Identity is account, unit commodity, unit cost, cost commodity, acquisition
  date and label. Identical positions merge; signed quantities support short
  positions and covers. Zero positions are removed from reported inventories.
  An uncosted movement does not consume a position held at cost.
- Reductions reserve only pre-transaction cost positions. Acquisitions do not
  join candidates until commit. Repeated reductions cannot spend a lot twice.
  A failed booking group commits none of its reservations/postings. Other
  independent weight-currency groups survive, matching native partial reports.
- Match by optional cost amount/commodity, date and label. STRICT rejects more
  than one candidate unless all candidates are emptied exactly. STRICT_WITH_SIZE
  falls back to exact-size candidates, oldest acquisition date first. FIFO/LIFO
  sort acquisition dates; HIFO sorts costs. Stable ties retain insertion order.
  NONE creates explicit signed positions, allowing mixed inventories.
- Default STRICT and file-wide `booking_method`/account `open` overrides are
  explicit. This corrects the earlier implicit FIFO behavior. A user intending
  FIFO can name it; unambiguous existing per-unit examples retain their values.
- Tolerances come from original posting quantities/specifications, before a
  reduction is split or acquires a matched cost. An empty selector must not
  invent a cost tolerance from the matched inventory. No binary numbers enter
  quantities, cost arithmetic, inventories, or reports.

## Evidence and bounds

`scripts/beancount-expected.py` runs native bean-check and bean-query and also
collects native booked cost inventories via loader/Inventory. It imports no app
code. All 22 original validity/balance records remain unchanged. The expanded
48-document corpus checks remaining cost/date/label/quantity positions as well
as validity and balances: total costs, recurring decimals, selectors, dates
that differ from insertion order, different FIFO/LIFO/HIFO results, global and
account overrides, strict full reductions, ambiguous/missing/insufficient lots,
size ties, merged positions, repeated reductions/rollback, independent groups,
short covers, uncosted movements, quoted punctuation and pre-booking tolerances.
Invalid total cost on zero units is a browser diagnostic; the pinned native
loader crashes with decimal division by zero, so it is a unit regression rather
than a native fixture that would abort the independent runner.

Still open: combined costs and merge markers; cost/quantity expressions and
interpolation; automatic commodity inference across several cost commodities;
cost transactions with missing amounts across multiple weight groups; remaining
mixed-inventory edge cases; advanced options; valuation/query/project workflows.
AVERAGE is diagnosed as unsupported (also not implemented for reductions by the
pinned upstream). The ledger and guide retain these as BEAN-01/02/09; BEAN-07/08
resolve only the bounded cost/selector/booking behavior above. Existing report
and sanitizer boundaries, share/source/OAuth envelopes, and the public stage
allowlist are unchanged.
