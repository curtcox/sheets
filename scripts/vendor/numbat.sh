#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
root=$PWD
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
git clone https://github.com/sharkdp/numbat.git "$work/source"
git -C "$work/source" checkout 79046422203060e296da41c8c762c506200d2c93
(cd "$work/source/numbat-wasm" && bash build.sh)
mkdir -p "$root/vendor/numbat@1.24.0"
cp "$work/source/numbat-wasm/www/pkg/"{numbat_wasm.js,numbat_wasm_bg.wasm} "$root/vendor/numbat@1.24.0/"
cp "$work/source/"LICENSE* "$root/vendor/numbat@1.24.0/"
node scripts/vendor/licenses.mjs rust "$work/source/numbat-wasm/Cargo.lock" "$root/vendor/numbat@1.24.0/licenses"
