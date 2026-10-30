#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# The fixtures were recorded with this Org; org-plot output differs between releases.
# SHEETS_ORG_LISP names an unpacked Org release to load instead of Emacs's own.
org=9.8.7
emacs=(emacs --batch -Q)
[[ -n "${SHEETS_ORG_LISP:-}" ]] && emacs+=(-L "$SHEETS_ORG_LISP")
found=$("${emacs[@]}" --eval '(progn (require (quote org)) (princ (org-version)))')
if [[ "$found" != "$org" ]]; then
  echo "Org $found found; the fixtures need Org $org. Unpack https://elpa.gnu.org/packages/org-$org.tar.lz and set SHEETS_ORG_LISP to its directory." >&2
  exit 1
fi
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
SHEETS_ORG_OUTPUT="$work" "${emacs[@]}" -l scripts/org-expected.el
SHEETS_ORG_OUTPUT="$work" "${emacs[@]}" -l scripts/org-html-expected.el
node scripts/org-plot-pasted.mjs "$work/pasted"
TZ=UTC SHEETS_ORG_OUTPUT="$work" "${emacs[@]}" -l scripts/reference/org-plot.el
node scripts/org-reference.mjs "$work" "${1:-}"
