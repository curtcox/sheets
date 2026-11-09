# CSV table in a report

Imported values stay as written, including leading zeros, commas and decimal places.

| ID | Department | Budget |
| --- | --- | --- |
| 001 | Research, development | 1200.00 |
| 002 | Operations | 950.50 |

## Try it

Choose **Insert**, paste this CSV, and review the table before inserting:

```csv
ID,Department,Budget
001,"Research, development",1200.00
002,Operations,950.50
```

You can also choose a `.csv` or `.tsv` file. For copied spreadsheet cells, choose
the Tab separator. Turn off **First row is a header** for data without headings.
Markdown requires a header row, so Sheets supplies an empty one in that case.
