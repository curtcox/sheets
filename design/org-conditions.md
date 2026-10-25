# Numeric Org conditions (ORG-1E)

This resolves the numeric subset requested by field-report item 4 and ORG-10.
The original `$2=if($1>2,10,20)` formula rejected `>` and retained the previous
value. Both Legacy and Emacs order now calculate it. Scheduling and saved
profiles keep their existing meaning; newly supported formula syntax needs no
new compatibility profile.

## Native contract

The independent oracle is Emacs 31.1 / Org 9.8.7, using the existing fixture
runner. The implementation follows `math-standard-opers` in calc.el,
`math-read-expr-level` in calc-aent.el, and the comparison/conditional functions
and `math-composite-inequalities` in calc-prog.el.

- `<`, `>`, `<=`, `>=`, `==` (also `=`) and `!=` share precedence 160/161,
  below arithmetic. Numeric comparison returns the integer 0 or 1. Compare
  integer/fraction/decimal representations at the selected internal precision,
  not JavaScript doubles or rounded display text. A decimal difference beyond
  the internal precision can disappear: `1.0000000000001>1` is 0 by default,
  and 1 with `p20`.
- `if(c,a,b)` requires three arguments. A real scalar zero, including float
  zero, selects b; a nonzero real scalar selects a. Evaluate only the selected
  branch. Thus `if(1,7,1/0)`, `if(1,7,sqrt(-1))`, and
  `if(0,missing(3),7)` all return 7.
- Both branches still parse. Org substitutes references before invoking Calc:
  unknown names and invalid table addresses fail even in an unused branch.
  Parse all referenced field text before selection, but do not evaluate its
  arithmetic until needed. An unused `1/0` field is harmless; an unused
  `bad???` field is not. `N` and `E` retain their established conversion rules.
- Same-direction three-value inequality chains test membership between the
  endpoints; mixed directions/equality are syntax errors. Equality chains test
  all equal, and inequality (`!=`) chains test all distinct, including pairs
  that are not adjacent. Parentheses start a new parse level: `(3>2)>1` is 0,
  while `3>2>1` is 1. Longer inequality chains follow native parser composition:
  `3<2<1<4` is 1 because the first three-value test becomes 0, then 0 is less
  than 4. The guide recommends explicit grouping for complex combinations.

## Bounds and remaining differences

Comparisons check decimal magnitudes before aligning exponents, avoiding a
million-digit allocation for `1e1000000>1`. Formula length, node count, nesting,
precision and numeric-size limits remain. Distinctness chains require pairwise
comparisons; the evaluator stops after 10,000 numeric comparisons. Equality
chains use a linear pass.

This slice does not implement vector comparisons or vector conditions, symbolic
conditions or unresolved comparisons, logical operators, or ternary notation.
An `E` blank condition is nan and gets a diagnostic rather than being treated as
true or false. Existing supported numeric vector results may be selected by a
scalar condition. Unsupported/failed selected calculations keep the old cell
and report its original formula line, rather than writing native symbolic text
or `#ERROR`. Syntactically unsupported expressions remain unsupported even in an
unused branch.

## Evidence

- `calc-conditions.org` covers the operator family, aliases, exact values,
  precedence, chains, grouping, nested conditions, printf, constants and remote
  references. `calc-branches.org` covers lazy branch arithmetic, symbolic and
  unknown function branches, field expressions and blank/N/E handling.
- Reviewed oracle changes only add these two documents to `reference.json`;
  all 22 prior successful documents and four rejection documents are unchanged.
  The unit oracle comparison checks both calculation modes.
- `org-calc.test.js` checks selected errors, malformed fields, unresolved names,
  addresses, condition/vector/nan restrictions, extreme exponents and work bounds.
  Browser tests compare the new reference tables, exercise price edits in both
  modes, share/reopen exact source, retain failed cells, and open the guide example.
- A temporary differential harness compared 887 numeric comparison, conditional,
  parenthesized and chain expressions with native Calc; there were no mismatches.
  This supplements the committed Org fixtures and is not a full Calc claim.
