#!/usr/bin/env python3
"""Independent bean-check / bean-query fixture oracle. Requires pinned tools in README."""
import csv
from decimal import Decimal
import io
import json
from pathlib import Path
import subprocess
import sys
from beancount import loader
from beancount.core import data, inventory

def canonical(number):
    text = format(number, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return "0" if number.is_zero() else text

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
        number = Decimal(row['sum(number)'].strip())
        # Formatting must not normalize through the 28-digit decimal context or
        # binary floats: both can discard digits from the independent oracle.
        balances.setdefault(row['account'], {})[row['currency']] = canonical(number)
    # Inspect native booked positions independently too: account balances alone
    # cannot distinguish FIFO from LIFO or detect a wrong cost/date/label match.
    entries, _, _ = loader.load_file(str(file))
    holdings = {}
    for entry in entries:
        if isinstance(entry, data.Transaction):
            for posting in entry.postings:
                if posting.cost is not None:
                    key = posting.account + "\0" + posting.units.currency
                    holdings.setdefault(key, inventory.Inventory()).add_position(posting)
    lots = {}
    for key, positions in holdings.items():
        rows = [{"quantity": canonical(p.units.number), "number": canonical(p.cost.number),
                 "currency": p.cost.currency, "date": str(p.cost.date), "label": p.cost.label}
                for p in positions if p.cost is not None]
        if rows:
            lots[key] = sorted(rows, key=lambda row: json.dumps(row, sort_keys=True))
    result[file.name] = {'valid': checked.returncode == 0, 'balances': balances, 'lots': lots}
expected = folder / 'reference.json'
if '--check' in sys.argv:
    if json.loads(expected.read_text()) != result:
        print('Beancount reference fixture drift:', json.dumps(result, indent=2), file=sys.stderr)
        sys.exit(1)
else:
    expected.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
print(f'Beancount reference: {len(result)} fixtures checked with bean-check and bean-query.')
