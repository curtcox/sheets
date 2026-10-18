#!/usr/bin/env python3
"""Independent bean-check / bean-query fixture oracle. Requires pinned tools in README."""
import csv
import io
import json
import os
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
folder = root / 'tests/fixtures/beancount'
# Prefer commands adjacent to the interpreter (also works in temporary venvs).
bindir = Path(sys.executable).parent
command = lambda name: str(bindir / name) if (bindir / name).exists() else name
result = {}
for file in sorted(folder.glob('*.bean')):
    checked = subprocess.run([command('bean-check'), str(file)], capture_output=True, text=True)
    if checked.returncode not in (0, 1):
        raise RuntimeError(checked.stderr)
    queried = subprocess.run([command('bean-query'), '-q', '-f', 'csv', str(file),
        'SELECT account, currency, sum(number) GROUP BY account, currency ORDER BY account, currency'],
        check=True, capture_output=True, text=True)
    balances = {}
    for row in csv.DictReader(io.StringIO(queried.stdout)):
        balances.setdefault(row['account'], {})[row['currency']] = float(row['sum(number)'].strip())
    result[file.name] = {'valid': checked.returncode == 0, 'balances': balances}
expected = folder / 'reference.json'
if '--check' in sys.argv:
    if json.loads(expected.read_text()) != result:
        print('Beancount reference fixture drift:', json.dumps(result, indent=2), file=sys.stderr)
        sys.exit(1)
else:
    expected.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
print(f'Beancount reference: {len(result)} fixtures checked with bean-check and bean-query.')
