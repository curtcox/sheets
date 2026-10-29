# Quarterly review

Mermaid draws these charts from the numbers written in each fence. They do not
read the table, so update both when the figures change.

```mermaid
xychart
  title "Revenue and costs by quarter"
  x-axis [Q1, Q2, Q3, Q4]
  y-axis "k$" 0 --> 200
  bar [120, 140, 165, 190]
  line [90, 110, 130, 170]
```

| Quarter | Revenue (k$) | Costs (k$) |
| --- | ---: | ---: |
| Q1 | 120 | 90 |
| Q2 | 140 | 110 |
| Q3 | 165 | 130 |
| Q4 | 190 | 170 |

```mermaid
pie title Where Q4 costs went
  "Staff" : 95
  "Hosting" : 40
  "Marketing" : 25
  "Other" : 10
```

```mermaid
radar-beta
  title Two vendors compared
  axis price["Price"], support["Support"], speed["Speed"], range["Range"]
  curve a["Vendor A"]{4, 3, 5, 2}
  curve b["Vendor B"]{2, 5, 3, 4}
  max 5
```
