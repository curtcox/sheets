# Org named bindings and marked rows (ORG-1A)

The target is the documented numeric Org spreadsheet subset. New fixtures are
recalculated by Emacs, not by the JavaScript engine. Local reference review used
Emacs 31.1 / Org 9.8.7; CI runs its installed Emacs independently and rejects
changes to the committed values. The runner now extracts tables using Org's own
structure and serializes explicit JSON arrays, so source-block examples cannot
be mistaken for active tables or association lists.

Primary references are [advanced table features](https://orgmode.org/manual/Advanced-features.html)
and [named references](https://orgmode.org/manual/References.html), plus the
installed org-table.el implementations of table analysis, name substitution,
constant lookup and global recalculation.

## Supported contract

- The first `!` row provides column aliases. The first occurrence of a duplicate
  column name wins. Aliases work on the right side, including row-qualified
  references and range endpoints; column targets remain numeric, as in the native
  stored-formula interface.
- `^` names fields on the immediately preceding physical data line; `_` names
  the following one. Neither crosses a horizontal separator. Named fields can be
  assignment targets. Later duplicate field names win.
- Named field values are snapshots taken before the pass, not live references to
  cells updated earlier in the same pass. This detail is independently checked.
- `$` rows supply numeric parameters; later duplicate parameters win. File-wide
  CONSTANTS keywords apply regardless of their position; later definitions win.
  Lookup order is column alias, named-field snapshot, table parameter, file
  constant. Names are case-sensitive.
- Decimal/scientific finite JavaScript numeric values are supported; overflow and nonzero underflow are diagnosed. The existing mathjs number precision remains. Expression-valued or
  string constants/parameters and inherited PROP_ constants remain unsupported;
  their diagnostics do not fall back to a lower-precedence value.
- If any calculation marker exists, only #/* rows receive column formulas,
  including marked rows before an hline. Explicit field targets may update an
  unmarked row. Metadata rows are protected from column formulas. Ordinary tables
  retain their documented first-header-separator rule.
- The Org AST owns active table/keyword discovery. SRC, EXAMPLE, EXPORT and COMMENT
  blocks do not install constants or run formulas. Literal blocks are escaped in
  the preview; COMMENT blocks are omitted. Quoted formula arguments are shielded
  from reference substitution.

The source editor is unchanged by recalculation. Copied recalculated source keeps
metadata and literal blocks; downloads/shares retain exact editor text, and
rendered exports contain the calculated preview. No user function API is added.

## Evidence

The nine new fixtures in tests/fixtures/org cover named columns, named fields,
named ranges, constants, precedence/snapshots, duplicates, case/scientific numbers,
marked rows across hlines and literal blocks. The three original numeric reference
documents remain unchanged. tests/unit/org-bindings.test.js adds diagnostics,
quoted strings, protected rows and unsupported-target cases; browser coverage
checks actual rendering, copies, exports, exact-source sharing, gallery and docs.

## Remaining differences

Stored formulas still execute in their documented source order. Native column/
field priority, duplicate target handling and full dependency order are the next
ORG-1B audit; this slice does not claim whole-document native parity. Same-document
remote tables, iteration, more numeric Calc modes/functions, property/external
constants, nonnumeric bindings, global %-format parameters and exact display-width
alignment remain separate work. Preview tables retain metadata cells; this is not
the complete Org HTML export layout. Native Babel/Lisp is not implemented.
