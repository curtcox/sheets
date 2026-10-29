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
import datetime
import beanquery

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

def periods(first, last):
    """Daily under 62 days, Monday-to-Sunday weeks under 366, else months."""
    days = (last - first).days + 1
    one = datetime.timedelta(days=1)
    out = []
    if days < 62:
        kind, day = 'day', first
        while day <= last:
            out.append((day, day, day.isoformat()))
            day += one
    elif days < 366:
        kind, day = 'week', first - datetime.timedelta(days=first.weekday())
        while day <= last:
            out.append((day, day + 6 * one, day.isoformat()))
            day += 7 * one
    else:
        kind, year, month = 'month', first.year, first.month
        while (year, month) <= (last.year, last.month):
            start = datetime.date(year, month, 1)
            year, month = (year + 1, 1) if month == 12 else (year, month + 1)
            end = datetime.date(year, month, 1) - one
            out.append((start, end, start.isoformat()[:7]))
    return kind, out

def chart_reference(file):
    """Chart data from bean-query sums over periods computed here, not by Sheets."""
    connection = beanquery.connect('beancount:' + str(file))
    query = lambda sql: connection.execute(sql).fetchall()
    # An aggregate over no postings returns no row.
    total = lambda sql: next((row[0] for row in query(sql) if row[0] is not None), Decimal(0))
    span = query('SELECT min(date), max(date)')
    if not span or span[0][0] is None:
        return None
    (first, last), = span
    _, _, options = loader.load_file(str(file))
    used = sorted(query('SELECT currency, count(*) AS n GROUP BY currency'), key=lambda r: (-r[1], r[0]))
    currency = (options.get('operating_currency') or [used[0][0]])[0]
    worth = "account ~ '^(Assets|Liabilities):'"
    currencies = sorted({r[0] for r in query(f'SELECT DISTINCT currency WHERE {worth}')},
                        key=lambda c: (c != currency, c))
    kind, spans = periods(first, last)
    net_worth = {c: [] for c in currencies}
    income, expenses, net = [], [], []
    for start, end, _ in spans:
        sums = dict(query(f'SELECT currency, sum(number) WHERE {worth} AND date <= {end} GROUP BY currency'))
        for c in currencies:
            net_worth[c].append(canonical(sums.get(c) or Decimal(0)))
        window = f"currency = '{currency}' AND date >= {start} AND date <= {end}"
        earned = -total(f"SELECT sum(number) WHERE account ~ '^Income:' AND {window}")
        spent = total(f"SELECT sum(number) WHERE account ~ '^Expenses:' AND {window}")
        income.append(canonical(earned))
        expenses.append(canonical(spent))
        net.append(canonical(earned - spent))
    ranked = sorted(((a, n) for a, n in query(
        f"SELECT root(account, 2) AS a, sum(number) AS n WHERE account ~ '^Expenses:' AND currency = '{currency}' GROUP BY a")
        if n), key=lambda r: (-r[1], r[0]))
    spent = [{'account': a, 'amount': canonical(n)} for a, n in ranked[:8]]
    if len(ranked) > 8:
        spent.append({'account': 'Other', 'amount': canonical(sum(n for _, n in ranked[8:])), 'count': len(ranked) - 8})
    omitted = sorted({r[0] for r in query("SELECT DISTINCT currency WHERE account ~ '^(Income|Expenses):'")} - {currency})
    return {'currency': currency, 'period': kind,
            'periods': [{'start': a.isoformat(), 'end': b.isoformat(), 'label': label} for a, b, label in spans],
            'netWorth': net_worth, 'income': income, 'expenses': expenses, 'net': net,
            'spent': spent, 'omitted': omitted}

charts = {file.name: chart_reference(file) for file in sorted(folder.glob('*.bean')) if result[file.name]['valid']}
expected = folder / 'reference.json'
for path, values in ((expected, result), (folder / 'charts.json', charts)):
    if '--check' in sys.argv:
        if json.loads(path.read_text()) != values:
            print('Beancount reference fixture drift:', path.name, json.dumps(values, indent=2), file=sys.stderr)
            sys.exit(1)
    else:
        path.write_text(json.dumps(values, indent=2, sort_keys=True) + '\n')
print(f'Beancount reference: {len(result)} fixtures checked with bean-check and bean-query, '
      f'{len(charts)} with chart data.')
