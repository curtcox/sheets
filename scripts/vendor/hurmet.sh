#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
revision=24abefdaecbc84a10e628326a235391db41caf83
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
git clone https://github.com/ronkok/Hurmet.git "$work/source"
git -C "$work/source" checkout "$revision"
npm install --prefix "$work/source" --ignore-scripts --no-audit --no-fund
node scripts/vendor/build-hurmet.mjs "$work/source" "$revision"
