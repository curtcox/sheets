#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
revision=b11ecb44e4a558e3b55879e70266fae714e774d5
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
git clone https://github.com/peetzweg/calcfile.git "$work/source"
git -C "$work/source" checkout "$revision"
node scripts/vendor/build-calcfile.mjs "$work/source" "$revision"
