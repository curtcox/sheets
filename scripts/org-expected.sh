#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
SHEETS_ORG_OUTPUT="$work" emacs --batch -Q -l scripts/org-expected.el
SHEETS_ORG_OUTPUT="$work" emacs --batch -Q -l scripts/org-html-expected.el
node scripts/org-reference.mjs "$work" "${1:-}"
