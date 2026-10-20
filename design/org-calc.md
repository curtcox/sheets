# Org Calc arithmetic and modes (ORG-1C)

## Defect

Org evaluates `#+TBLFM` formulas with Emacs Calc using `org-calc-default-modes`:
degree angles, `calc-internal-prec` 12, `calc-float-format (float 8)` and no
fraction preference. Sheets previously evaluated formulas with JavaScript/mathjs
numbers in radians, 12 significant display digits, ordinary precedence and mathjs
function names. It silently ignored mode letters other than `N` and `%.Nf`, and
it skipped nonnumeric range entries. The ORG-09 reproducer, checked with Emacs
31.1 / Org 9.8.7:

| Formula | Emacs | Sheets before |
| --- | --- | --- |
| `sin(30)` | `0.5` | `-0.988031624093` |
| `1/3` | `0.33333333` | `0.333333333333` |
| `2^0.5` | `1.4142136` | `1.41421356237` |
| `10/4*2` | `1.25` | `5` |
| `2.5*2` | `5.` | `5` |
| `1/3;%.10f` | `0.3333333300` | `0.3333333333` |

## Implementation

`src/formats/org/calc.js` is a DOM-free Calc subset following the installed
`calc.el`, `calc-aent.el`, `calc-arith.el`, `calc-misc.el`, `calc-math.el`,
`calc-stat.el` and `org-table.el` sources:

- **Parsing:** `math-standard-opers` with `calc-multiplication-has-precedence`
  (Emacs' default): `^` 201/200, unary minus 197, `*` and implicit
  multiplication 196/195, `/ % \` 190/191, `+ -` 180/181, postfix `!`, `!!` and
  percent.
- **Numbers:** exact BigInt integers, Calc decimal floats (mantissa/exponent)
  rounded with `math-scale-rounding`, and Calc's truncate-then-round division.
  Exact fractions appear only in `F` mode. Results are bounded at 10,000 integer
  digits and a 1,000,000 float exponent.
- **Transcendental functions:** `math-with-extra-prec` evaluates at prec+2.
  At working precision up to `math-emacs-precision` (16), Calc formats the
  argument, calls the native Emacs double function and reads its shortest
  printed result. Sheets does the same with JavaScript `Math`, preceded by Calc's
  own argument reduction (`math-sin-raw`, `math-sin-raw-2`,
  `math-nearly-zerop-float`) and cached constants computed at prec+4. Higher `p`
  modes use decimal.js series in place of Calc's series. Calc's exact special
  cases (`sin(90)`, `arcsin(1)`, `log10(1000)`, `log(8,2)`, perfect square roots
  and quarter-integer powers) are reproduced.
- **Display:** `math-format-number` for `float`, `fix`, `sci` and `eng` formats,
  with default `calc-display-sci-high` 0 and `calc-display-sci-low` -3.
- **Org modes:** `org-table-eval-formula`'s parser. The suffix starts at the last
  semicolon. `[pnfse]N` letters are removed first, then `tTUNLEDRFSu`; the
  remainder is the printf format. The table `%` parameter is prepended only when
  a suffix exists. printf follows Elisp `format` on `(string-to-number ev)`: it
  formats the displayed text with C rounding (exact binary value, ties to even).
- **References:** `org-table-make-reference`. Field text is parsed as Calc input.
  An empty field is `0`, or `nan` with `E` (unless `N` is also set). Ranges drop
  empty fields unless `E` is set. `N` applies Elisp `string-to-number` and
  `number-to-string`. Symbolic values propagate through arithmetic so that
  `vcount` counts them, as Emacs does. They are rejected when a numeric result or
  argument is required.

The calculation applies to Legacy and `org-emacs-v1` alike. Profiles preserve
scheduling semantics, not incorrect arithmetic (PLAN.md Phase 11 item 5).

## Evidence

- `tests/fixtures/org/calc-modes.org` and `calc-arithmetic.org` are compared with
  `scripts/org-expected.sh` (Emacs batch) and checked in both calculation modes
  by `tests/unit/org-order.test.js`. All 20 earlier reference documents keep
  their recorded values.
- `tests/unit/org-calc.test.js` covers parsing, modes, printf, bounds and
  diagnostics. The browser suite renders the new reference documents.
- During development, a differential harness compared 484 hand-written and 1,200
  generated formulas with Emacs. Every formula that Sheets evaluates matched. The
  differences are deliberate diagnostics: symbolic results, complex numbers,
  infinities, out-of-range exponents, a suffix containing a duration letter, and
  huge-argument trigonometry at `p` above 16, where Calc's own result is
  numerically meaningless.

## Remaining differences

Symbolic algebra, complex numbers, infinities, units, dates, strings, durations
(`T`, `t`, `U`), symbolic mode `S`, unit mode `u`, matrix products beyond vector
dot products, and functions outside the documented list report diagnostics and
retain the cell. Emacs would write symbolic text or `#ERROR`. Calc series at
`p` above 16 are replaced by correctly rounded decimal.js results, which can
differ in the last internal digit.
