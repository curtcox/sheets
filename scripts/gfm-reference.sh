#!/usr/bin/env bash
# Build the exact native oracle independently of the app and its JavaScript deps.
set -euo pipefail
reference_dir=$(mktemp -d "${TMPDIR:-/tmp}/sheets-gfm-reference.XXXXXX")
trap 'rm -rf "$reference_dir"' EXIT
curl --fail --location --silent --show-error \
  https://github.com/github/cmark-gfm/archive/refs/tags/0.29.0.gfm.13.tar.gz \
  -o "$reference_dir/source.tar.gz"
node --input-type=module - "$reference_dir/source.tar.gz" <<'JS'
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=createHash('sha256').update(await readFile(process.argv[2])).digest('hex');
if(hash!=='5abc61798ebd9de5660bc076443c07abad2b8d15dbc11094a3a79644b8ad243a') throw new Error('cmark-gfm archive integrity mismatch');
JS
tar -xzf "$reference_dir/source.tar.gz" -C "$reference_dir"
cmake -S "$reference_dir/cmark-gfm-0.29.0.gfm.13" -B "$reference_dir/build" \
  -DCMAKE_POLICY_VERSION_MINIMUM=3.5 -DCMARK_TESTS=OFF -DCMARK_SHARED=OFF
cmake --build "$reference_dir/build" --parallel 3
CMARK_GFM="$reference_dir/build/src/cmark-gfm" node scripts/gfm-autolink-expected.mjs "$@"
