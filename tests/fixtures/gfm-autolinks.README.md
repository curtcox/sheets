# Native GFM autolink fixtures

`gfm-autolinks.json` contains native cmark-gfm 0.29.0.gfm.13 HTML, recorded with
`--unsafe -e autolink`. All 57 expected outputs come from the native executable;
the Sheets renderer is never used to generate them. 53 of 57 cases pass; four
intentional native differences are individually explained in `knownDeviations`
and GFM-06: uppercase WWW, numeric email-domain endings, Unicode email hosts,
and keeping raw HTML anchors intact rather than nesting an email link. The two
formerly missing email-domain/prefix cases now pass. Unit tests check every
passing case and the exact retained-policy IDs; CI independently verifies all
recorded native outputs.

Run `bash scripts/gfm-reference.sh --check` to download, checksum, build and check
the pinned native engine (CMake, C compiler and curl required). To deliberately
regenerate the native outputs, omit `--check`. For an already-built engine use
`CMARK_GFM=/absolute/path/to/cmark-gfm node scripts/gfm-autolink-expected.mjs --check`.

Cases covering the three original failures are based on the separately attributed
CC-BY-SA 4.0 GFM corpus in `gfm-spec.txt`; the additional boundary and context
examples are project regression cases. See `design/gfm-autolinks.md` for the
parser alternatives and the distinction between published corpus expectations
and native behavior.
