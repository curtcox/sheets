// Generated from the app-owned examples.
export const catalog=[
  {
    "id": "gfm-basic",
    "format": "gfm",
    "kind": "basic",
    "title": "A small, useful note",
    "description": "Tables, task lists, links, and a little math.",
    "path": "examples/gfm/basic.md",
    "tags": [
      "gfm",
      "basic"
    ],
    "document": {
      "src": "# A small, useful note\n\nWriting is thinking, with a place to put the numbers.\n\n- [x] Make a plan\n- [ ] Test the idea\n\n| Item | Cost |\n| --- | ---: |\n| Notebook | 4 |\n| Pencil | 1 |\n\nA circle has area $A = \\pi r^2$.\n",
      "format": "gfm"
    }
  },
  {
    "id": "gfm-typical",
    "format": "gfm",
    "kind": "typical",
    "title": "A research notebook",
    "description": "Alerts, footnotes, highlighted code, and a Mermaid diagram.",
    "path": "examples/gfm/typical.md",
    "tags": [
      "gfm",
      "typical"
    ],
    "document": {
      "src": "# Research notebook\n\n> [!NOTE]\n> Every result starts with a question.\n\n```python\nprint(sum(range(10)))\n```\n\n```mermaid\ngraph LR\n  Question --> Experiment --> Observation\n```\n\nKeep the source with the result.[^1]\n\n[^1]: A good habit for future you.\n",
      "format": "gfm"
    }
  },
  {
    "id": "gfm-charts",
    "format": "gfm",
    "kind": "typical",
    "title": "Charts in Markdown",
    "description": "Mermaid bar, line, pie and radar charts drawn from numbers written in the fence.",
    "path": "examples/gfm/charts.md",
    "tags": [
      "gfm",
      "typical"
    ],
    "document": {
      "src": "# Quarterly review\n\nMermaid draws these charts from the numbers written in each fence. They do not\nread the table, so update both when the figures change.\n\n```mermaid\nxychart\n  title \"Revenue and costs by quarter\"\n  x-axis [Q1, Q2, Q3, Q4]\n  y-axis \"k$\" 0 --> 200\n  bar [120, 140, 165, 190]\n  line [90, 110, 130, 170]\n```\n\n| Quarter | Revenue (k$) | Costs (k$) |\n| --- | ---: | ---: |\n| Q1 | 120 | 90 |\n| Q2 | 140 | 110 |\n| Q3 | 165 | 130 |\n| Q4 | 190 | 170 |\n\n```mermaid\npie title Where Q4 costs went\n  \"Staff\" : 95\n  \"Hosting\" : 40\n  \"Marketing\" : 25\n  \"Other\" : 10\n```\n\n```mermaid\nradar-beta\n  title Two vendors compared\n  axis price[\"Price\"], support[\"Support\"], speed[\"Speed\"], range[\"Range\"]\n  curve a[\"Vendor A\"]{4, 3, 5, 2}\n  curve b[\"Vendor B\"]{2, 5, 3, 4}\n  max 5\n```\n",
      "format": "gfm"
    }
  },
  {
    "id": "gfm-edge",
    "format": "gfm",
    "kind": "edge",
    "title": "Math in the margins",
    "description": "Display TeX, a fenced formula, strikethrough, and Unicode.",
    "path": "examples/gfm/edge.md",
    "tags": [
      "gfm",
      "edge"
    ],
    "document": {
      "src": "# Math in the margins\n\n~~A rough guess~~ A useful approximation.\n\n$$\n\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}\n$$\n\n```math\ne^{i\\pi} + 1 = 0\n```\n\nUnicode: ∞ · π · café · 日本語.\n\nA link with punctuation stays whole:\nwww.google.com/search?q=(business))+ok\n\nContact hello+xyz@mail.example.\n\nDomain underscores: a@b.c_d.\nValid prefix: a@b.c+notes.\n",
      "format": "gfm"
    }
  },
  {
    "id": "gfm-error",
    "format": "gfm",
    "kind": "error",
    "title": "Untrusted notes",
    "description": "A sanitization example: unsafe HTML becomes inert.",
    "path": "examples/gfm/error.md",
    "tags": [
      "gfm",
      "error"
    ],
    "document": {
      "src": "# Untrusted notes\n\nThis source tries to insert unsafe HTML. The preview removes it.\n\n<script>globalThis.sheetsUnsafe = true</script>\n\n<img src=\"missing-image\" onerror=\"globalThis.sheetsUnsafe = true\">\n\n[An unsafe link](javascript:alert(1))\n",
      "format": "gfm"
    }
  },
  {
    "id": "asciimath-basic",
    "format": "asciimath",
    "kind": "basic",
    "title": "Equations without backslashes",
    "description": "Write one AsciiMath display formula per line.",
    "path": "examples/asciimath/basic.am",
    "profile": "asciimath-formulas-v1",
    "tags": [
      "asciimath",
      "basic"
    ],
    "document": {
      "src": "sqrt(9) = 3\nx = (-b +- sqrt(b^2-4ac))/(2a)\n",
      "format": "asciimath",
      "profile": "asciimath-formulas-v1"
    }
  },
  {
    "id": "asciimath-typical",
    "format": "asciimath",
    "kind": "typical",
    "title": "Sums and sequences",
    "description": "Mix Markdown prose with inline and display AsciiMath.",
    "path": "examples/asciimath/typical.am",
    "profile": "asciimath-prose-v1",
    "tags": [
      "asciimath",
      "typical"
    ],
    "document": {
      "src": "# Sums and sequences\n\nThe first $n$ integers add to $n(n+1)/2$.\n\n```asciimath\nsum_(i=1)^n i = (n(n+1))/2\n```\n",
      "format": "asciimath",
      "profile": "asciimath-prose-v1"
    }
  },
  {
    "id": "asciimath-edge",
    "format": "asciimath",
    "kind": "edge",
    "title": "Matrices and limits",
    "description": "A small matrix and a limit in plain notation.",
    "path": "examples/asciimath/edge.am",
    "profile": "asciimath-formulas-v1",
    "tags": [
      "asciimath",
      "edge"
    ],
    "document": {
      "src": "((1,2),(3,4))\nlim_(x->oo) 1/x = 0\n",
      "format": "asciimath",
      "profile": "asciimath-formulas-v1"
    }
  },
  {
    "id": "asciimath-error",
    "format": "asciimath",
    "kind": "error",
    "title": "An incomplete expression",
    "description": "An unfinished formula keeps its TeX translation and reports a source-line warning.",
    "path": "examples/asciimath/error.am",
    "profile": "asciimath-prose-v1",
    "tags": [
      "asciimath",
      "error"
    ],
    "document": {
      "src": "# An incomplete expression\n\n```asciimath\nsqrt(\n```\n\nUse Show TeX to inspect the translation. A source-line warning identifies the missing expression; the permissive translation remains visible.\n",
      "format": "asciimath",
      "profile": "asciimath-prose-v1"
    }
  },
  {
    "id": "numbat-basic",
    "format": "numbat",
    "kind": "basic",
    "title": "A dimensional first step",
    "description": "A real unit-aware interpreter, running in a worker.",
    "path": "examples/numbat/basic.nbt",
    "tags": [
      "numbat",
      "basic"
    ],
    "document": {
      "src": "# Distance over time\nlet distance = 120 km\nlet duration = 2 h\ndistance / duration -> km/h\n",
      "format": "numbat"
    }
  },
  {
    "id": "numbat-typical",
    "format": "numbat",
    "kind": "typical",
    "title": "A falling object",
    "description": "Functions, constants, units, and conversions.",
    "path": "examples/numbat/typical.nbt",
    "tags": [
      "numbat",
      "typical"
    ],
    "document": {
      "src": "let gravity = 9.81 m/s^2\nfn fall(t) = 0.5 * gravity * t^2\nfall(3 s) -> m\n",
      "format": "numbat"
    }
  },
  {
    "id": "numbat-edge",
    "format": "numbat",
    "kind": "edge",
    "title": "Dimensions keep you honest",
    "description": "Define a new unit and convert it back.",
    "path": "examples/numbat/edge.nbt",
    "tags": [
      "numbat",
      "edge"
    ],
    "document": {
      "src": "unit sheetstep = 1.7018 m\nlet bridge = 364.4 sheetstep\nbridge -> m\n",
      "format": "numbat"
    }
  },
  {
    "id": "numbat-error",
    "format": "numbat",
    "kind": "error",
    "title": "Apples and seconds",
    "description": "A dimensional error is attached to the calculation line.",
    "path": "examples/numbat/error.nbt",
    "tags": [
      "numbat",
      "error"
    ],
    "document": {
      "src": "let length = 3 m\nlength + 2 s\n",
      "format": "numbat"
    }
  },
  {
    "id": "calcfile-basic",
    "format": "calcfile",
    "kind": "basic",
    "title": "The back of an envelope",
    "description": "Plain arithmetic with decimal precision.",
    "path": "examples/calcfile/basic.calc",
    "tags": [
      "calcfile",
      "basic"
    ],
    "document": {
      "src": "2 + 2\n0.1 + 0.2\n",
      "format": "calcfile"
    }
  },
  {
    "id": "calcfile-typical",
    "format": "calcfile",
    "kind": "typical",
    "title": "A weekend away",
    "description": "Friendly variable names and a running total.",
    "path": "examples/calcfile/typical.calc",
    "tags": [
      "calcfile",
      "typical"
    ],
    "document": {
      "src": "# A weekend away\nFlights = 240 EUR\nHotel = 120 EUR * 2\nDinner = 65 EUR\ntotal\n",
      "format": "calcfile"
    }
  },
  {
    "id": "calcfile-edge",
    "format": "calcfile",
    "kind": "edge",
    "title": "Locales, units, and exchange rates",
    "description": "German numbers, physical units, and EUR conversions using ECB rates.",
    "path": "examples/calcfile/edge.calc",
    "tags": [
      "calcfile",
      "edge"
    ],
    "document": {
      "src": "@locale de-DE\n1.234,50 + 5,50\n\n10 km in m\n\n# Euro reference conversions\n100 EUR in USD\n100 USD in EUR\n100 EUR in GBP\n100 EUR in JPY\n",
      "format": "calcfile"
    }
  },
  {
    "id": "calcfile-error",
    "format": "calcfile",
    "kind": "error",
    "title": "Convert before adding",
    "description": "Different currencies must be converted before addition.",
    "path": "examples/calcfile/error.calc",
    "tags": [
      "calcfile",
      "error"
    ],
    "document": {
      "src": "100 EUR + 10 USD\n",
      "format": "calcfile"
    }
  },
  {
    "id": "org-basic",
    "format": "org",
    "kind": "basic",
    "title": "Recalculate a table",
    "description": "A column formula, the way Org tables work.",
    "path": "examples/org/basic.org",
    "tags": [
      "org",
      "basic"
    ],
    "document": {
      "src": "#+TITLE: Recalculate a table\n\n| Quantity | Price | Total |\n|----------+-------+-------|\n| 3        | 4     | 0     |\n| 2        | 7     | 0     |\n#+TBLFM: $3=$1*$2\n",
      "format": "org"
    }
  },
  {
    "id": "org-typical",
    "format": "org",
    "kind": "typical",
    "title": "A small purchase order",
    "description": "Column and field formulas, ranges, and formatting.",
    "path": "examples/org/typical.org",
    "tags": [
      "org",
      "typical"
    ],
    "document": {
      "src": "* Purchase order\n\n| Quantity | Price | Total |\n|----------+-------+-------|\n| 3        | 4.5   | 0     |\n| 2        | 7     | 0     |\n|----------+-------+-------|\n| Total    |       | 0     |\n#+TBLFM: @2$3=$1*$2;%.2f::@3$3=$1*$2;%.2f::@4$3=vsum(@2$3..@3$3);%.2f\n",
      "format": "org"
    }
  },
  {
    "id": "org-edge",
    "format": "org",
    "kind": "edge",
    "title": "Named inputs and marked rows",
    "description": "Show file constants, use named inputs and marked rows, then summarize a named table.",
    "path": "examples/org/edge.org",
    "profile": "org-emacs-v1",
    "tags": [
      "org",
      "edge"
    ],
    "document": {
      "src": "#+TITLE: Named inputs and marked rows\n#+SHEETS_CONSTANTS: table\n#+CONSTANTS: tax=0.10\n\n#+NAME: order\n| ! | Qty | UnitPrice | Total |\n| # | 3 | 4 | 0 |\n| * | 2 | 7 | 0 |\n| $ | tax=0.20 | | |\n#+TBLFM: $4=$Qty*$UnitPrice*(1+$tax);%.2f\n\n* Summary\n\n| Grand total | 0 |\n#+TBLFM: @1$2=vsum(remote(order,@2$Total..@3$Total));%.2f\n",
      "format": "org",
      "profile": "org-emacs-v1"
    }
  },
  {
    "id": "org-what-if",
    "format": "org",
    "kind": "typical",
    "title": "Monthly or annual billing?",
    "description": "Slide churn and price to find where a discounted annual plan beats monthly billing.",
    "path": "examples/org/what-if.org",
    "tags": [
      "org",
      "typical"
    ],
    "document": {
      "src": "#+TITLE: Monthly or annual billing?\n#+CONSTANTS: price=25 users=400 churn=3 free=1\n\nDoes an annual plan with two months free earn more than monthly billing? Slide\nthe churn and read the last row of the comparison.\n\n#+SHEETS_CONTROL: price slider 5..100 step 5 label \"Monthly price ($)\"\n#+SHEETS_CONTROL: users text label \"Customers at launch\"\n#+SHEETS_CONTROL: churn slider 0..10 step 0.5 label \"Monthly churn (%)\"\n#+SHEETS_CONTROL: free checkbox label \"Annual plan gets two months free\"\n\n* Monthly plan\n\n#+NAME: monthly\n| ! | Month | Customers | Revenue |\n|---+-------+-----------+---------|\n| # |     1 |         0 |       0 |\n| # |     2 |         0 |       0 |\n| # |     3 |         0 |       0 |\n| # |     4 |         0 |       0 |\n| # |     5 |         0 |       0 |\n| # |     6 |         0 |       0 |\n| # |     7 |         0 |       0 |\n| # |     8 |         0 |       0 |\n| # |     9 |         0 |       0 |\n| # |    10 |         0 |       0 |\n| # |    11 |         0 |       0 |\n| # |    12 |         0 |       0 |\n|---+-------+-----------+---------|\n|   |  Year |           |       0 |\n#+TBLFM: $3=$users*(1-$churn/100)^($Month-1);%.0f::$4=$Customers*$price;%.2f::@>$4=vsum(@I..@II);%.2f\n\n* Which plan earns more in year one?\n\n#+PLOT: title:\"Year-one revenue\" ind:1 deps:(2) with:histograms\n| Plan                  | Year-one revenue |\n|-----------------------+------------------|\n| Monthly billing       |                0 |\n| Annual, paid up front |                0 |\n| Annual minus monthly  |                0 |\n#+TBLFM: @2$2=remote(monthly,@>$4);%.2f::@3$2=$users*$price*if($free,10,12);%.2f::@4$2=@3$2-@2$2;%.2f\n\n* What to try\n\nAnnual customers pay once, up front, and stay all year. Monthly customers pay as\nthey go, and some leave every month. With two months free, monthly billing earns\nmore in year one at 3% monthly churn, and the annual plan earns more at 3.5%.\nBelow the crossover the discount costs more than churn does. Clear the checkbox\nto see what the discount gives away, and change the price or launch customers to\nput dollars on the answer.\n",
      "format": "org"
    }
  },
  {
    "id": "org-mortgage",
    "format": "org",
    "kind": "typical",
    "title": "How much house can I afford?",
    "description": "Price, down payment, rate and term controls drive the payment, income needed and a rate-change table.",
    "path": "examples/org/mortgage.org",
    "tags": [
      "org",
      "typical"
    ],
    "document": {
      "src": "#+TITLE: How much house can I afford?\n#+SHEETS_CONSTANTS: table\n#+CONSTANTS: price=450000 down=10 rate=6.5 years=30 escrow=1\n#+CONSTANTS: taxrate=0.011 insurance=1800 pmi=0.006 share=0.28\n\nEnter a price and a rate quote, then read the monthly payment and the income a\nlender usually wants to see.\n\n#+SHEETS_CONTROL: price text label \"Home price ($)\"\n#+SHEETS_CONTROL: down slider 3..50 label \"Down payment (%)\"\n#+SHEETS_CONTROL: rate slider 3..9 step 0.125 label \"Interest rate (% a year)\"\n#+SHEETS_CONTROL: years slider 10..30 step 5 label \"Loan term (years)\"\n#+SHEETS_CONTROL: escrow checkbox label \"Include property tax and home insurance\"\n\n#+NAME: payment\n| Item                                | Amount |\n|-------------------------------------+--------|\n| Loan amount                         |      0 |\n| Principal and interest              |      0 |\n| Mortgage insurance (under 20% down) |      0 |\n| Property tax                        |      0 |\n| Home insurance                      |      0 |\n|-------------------------------------+--------|\n| Monthly payment                     |      0 |\n| Yearly income needed                |      0 |\n| Cash needed for the down payment    |      0 |\n#+TBLFM: @2$2=$price*(1-$down/100);%.0f::@3$2=@2$2*($rate/1200)/(1-(1+$rate/1200)^(-12*$years));%.2f::@4$2=if($down<20,@2$2*$pmi/12,0);%.2f::@5$2=if($escrow,$price*$taxrate/12,0);%.2f::@6$2=if($escrow,$insurance/12,0);%.2f::@7$2=vsum(@3..@6);%.2f::@8$2=@7$2*12/$share;%.0f::@9$2=$price*$down/100;%.0f\n\n* Over the life of the loan\n\n| Item           | Amount |\n|----------------+--------|\n| Payments       |      0 |\n| Total interest |      0 |\n#+TBLFM: @2$2=12*$years;%.0f::@3$2=@2$2*remote(payment,@3$2)-remote(payment,@2$2);%.0f\n\n* If the rate moves\n\nA rate quote can change before you lock it. Each row reprices the same loan.\n\n#+PLOT: title:\"Principal and interest by rate\" ind:2 deps:(3) with:linespoints\n| Change (points) | Rate | Principal and interest | Difference |\n|-----------------+------+------------------------+------------|\n|              -1 |    0 |                      0 |          0 |\n|            -0.5 |    0 |                      0 |          0 |\n|               0 |    0 |                      0 |          0 |\n|             0.5 |    0 |                      0 |          0 |\n|               1 |    0 |                      0 |          0 |\n#+TBLFM: $2=$rate+$1;%.3f::$3=$price*(1-$down/100)*($2/1200)/(1-(1+$2/1200)^(-12*$years));%.2f::$4=$3-remote(payment,@3$2);%.2f\n\n* What to try\n\n- Move the down payment to 20%: mortgage insurance disappears.\n- Choose a 15-year term: the payment rises by about $970 a month, and the total\n  interest falls by more than half.\n- Clear the checkbox to see the payment without property tax and home\n  insurance, the way many rate quotes show it.\n\nThe tax rate, insurance premium, mortgage-insurance rate and the 28% payment share\nare fixed assumptions in the second =#+CONSTANTS:= line, listed under *File\nconstants*. Edit them there for your area and lender.\n",
      "format": "org"
    }
  },
  {
    "id": "org-hire",
    "format": "org",
    "kind": "typical",
    "title": "Hire or contract?",
    "description": "Local controls over salary, hours and start month, priced with finance's pinned shared rates.",
    "path": "examples/org/hire.org",
    "tags": [
      "org",
      "typical"
    ],
    "document": {
      "src": "#+TITLE: Hire or contract?\n#+SHEETS_INPUT: v1 finance AAAAAAAyIytDT05TVEFOVFM6IGxvYWQ9MC4zIGxhcHRvcD0yNTAwIHdlZWtzPTQ2IGZlZT0wLjI\n#+CONSTANTS: salary=140000 start=7 hourly=95 hours=30 agency=1\n\nShould the team hire an engineer or bring in a contractor this fiscal year? Both\nare priced with finance's shared rates.\n\n#+SHEETS_CONTROL: salary text label \"Employee salary ($ a year)\"\n#+SHEETS_CONTROL: agency checkbox label \"Hire through a recruiter\"\n#+SHEETS_CONTROL: hourly text label \"Contractor rate ($ an hour)\"\n#+SHEETS_CONTROL: hours slider 10..40 step 5 label \"Contractor hours a week\"\n#+SHEETS_CONTROL: start slider 1..12 label \"Start in fiscal month\"\n\n* Cost this fiscal year\n\n| Item                     | Employee | Contractor |\n|--------------------------+----------+------------|\n| Months on the team       |        0 |          0 |\n| Pay                      |        0 |          0 |\n| Benefits and payroll tax |        0 |          0 |\n| Laptop and setup         |        0 |          0 |\n| Recruiter fee            |        0 |          0 |\n|--------------------------+----------+------------|\n| Total                    |        0 |          0 |\n#+TBLFM: @2$2=13-$start::@2$3=13-$start::@3$2=$salary*@2$2/12;%.0f::@3$3=$hourly*$hours*$finance.weeks*@2$3/12;%.0f::@4$2=@3$2*$finance.load;%.0f::@4$3=0::@5$2=$finance.laptop::@5$3=0::@6$2=if($agency,$salary*$finance.fee,0);%.0f::@6$3=0::@7$2=vsum(@3..@6);%.0f::@7$3=vsum(@3..@6);%.0f\n\n* A full year\n\n| Measure                                 | Amount |\n|-----------------------------------------+--------|\n| Employee pay, benefits and tax          |      0 |\n| Contractor at this rate and these hours |      0 |\n| Break-even contractor rate ($ an hour)  |      0 |\n#+TBLFM: @2$2=$salary*(1+$finance.load);%.0f::@3$2=$hourly*$hours*$finance.weeks;%.0f::@4$2=@2$2/($hours*$finance.weeks);%.2f\n\n* What to try\n\nMove the start month: pay shrinks for both, but the recruiter fee and setup do\nnot, so a late start favors the contractor. The break-even rate is the hourly\nrate at which a contractor working these hours costs the same as an employee for\na full year, before one-time costs.\n\nFinance's rates for benefits and payroll tax, equipment, working weeks and the\nrecruiter fee come from a pinned shared input, so every team's model uses the\nsame numbers. They show under *Shared inputs* and cannot be given controls here.\nThis example's inline CID holds load=0.3, laptop=2500, weeks=46 and fee=0.2, so\nit works offline; a real model would paste the CID of finance's saved\nassumptions document.\n",
      "format": "org"
    }
  },
  {
    "id": "org-error",
    "format": "org",
    "kind": "error",
    "title": "A formula outside the browser",
    "description": "Emacs Lisp gets a clear unsupported diagnostic.",
    "path": "examples/org/error.org",
    "tags": [
      "org",
      "error"
    ],
    "document": {
      "src": "| Value | Result |\n|-------+--------|\n| 2     | 0      |\n#+TBLFM: $2='(identity 42)\n",
      "format": "org"
    }
  },
  {
    "id": "calca-basic",
    "format": "calca",
    "kind": "basic",
    "title": "Answers in your notes",
    "description": "Each arrow asks for a calculation.",
    "path": "examples/calca/basic.calca",
    "tags": [
      "calca",
      "basic"
    ],
    "document": {
      "src": "# Answers in your notes\n\n2 + 2 =>\n12 * 7 =>\n",
      "format": "calca"
    }
  },
  {
    "id": "calca-typical",
    "format": "calca",
    "kind": "typical",
    "title": "Equations, functions, and scopes",
    "description": "Reverse definitions, constrained roots, and heading visibility.",
    "path": "examples/calca/typical.calca",
    "profile": "calca-scopes-v1",
    "tags": [
      "calca",
      "typical"
    ],
    "document": {
      "src": "# Equations, functions, and scopes\n\n```calca\n2*x + 3 = 11\nx =>\n\nwidth^2 - 5*width + 6 = 0\nwidth =>\n```\n\nDefinitions can also be used in reverse.\n\n```calca\ntempF = 1.8*tempC + 32\ntempF = 212\ntempC =>\n\nprice = 24\ntax = 0.08\nf(x) = x * (1 + tax)\nf(price) =>\n```\n\n## Child section\n\nParent definitions remain available here.\n\n```calca\nf(price) =>\nwidth+1 = 3\nwidth =>\n```\n\n# Independent section\n\nThe earlier heading's definitions are no longer available.\n\n```calca\nprice =>\n2+2 =>\n```\n",
      "format": "calca",
      "profile": "calca-scopes-v1"
    }
  },
  {
    "id": "calca-edge",
    "format": "calca",
    "kind": "edge",
    "title": "Units, matrices, and literal code",
    "description": "Structured blocks keep code and diagrams separate from Calca calculations.",
    "path": "examples/calca/edge.calca",
    "profile": "calca-blocks-v1",
    "tags": [
      "calca",
      "edge"
    ],
    "document": {
      "src": "# Units and matrices\n\n5 km in m =>\n[1, 2; 3, 4] * [2; 1] =>\nderivative(\"x^3\", \"x\") =>\n\n## Literal code stays literal\n\n```python\nprint(\"This is an example => not a Calca calculation\")\n```\n\n```mermaid\ngraph LR\n  Source --> Answer\n```\n",
      "format": "calca",
      "profile": "calca-blocks-v1"
    }
  },
  {
    "id": "calca-error",
    "format": "calca",
    "kind": "error",
    "title": "An unknown variable",
    "description": "A calculation error does not stop the rest of the note.",
    "path": "examples/calca/error.calca",
    "tags": [
      "calca",
      "error"
    ],
    "document": {
      "src": "# An unknown variable\n\nmissing + 3 =>\n\nCubic equations exceed the supported linear and quadratic subset.\n\n```calca\nunknown^3 = 8\nunknown =>\n```\n\nThe next calculation still runs.\n\n2 + 2 =>\n",
      "format": "calca"
    }
  },
  {
    "id": "hurmet-basic",
    "format": "hurmet",
    "kind": "basic",
    "title": "A calculation in a sentence",
    "description": "Hurmet calculation cells retain their mathematical typesetting.",
    "path": "examples/hurmet/basic.hurmet",
    "tags": [
      "hurmet",
      "basic"
    ],
    "document": {
      "src": "# A calculation in a sentence\n\nSet a value: ¢` x = 3 `.\n\nSquare it: ¢` x^2 = ? `.\n",
      "format": "hurmet"
    }
  },
  {
    "id": "hurmet-typical",
    "format": "hurmet",
    "kind": "typical",
    "title": "A simply supported beam",
    "description": "Variables, units, and an engineering calculation.",
    "path": "examples/hurmet/typical.hurmet",
    "tags": [
      "hurmet",
      "typical"
    ],
    "document": {
      "src": "# A simply supported beam\n\n¢` L = 12 'ft' `\n\n¢` w = 110 'lbf/ft' `\n\n¢` M = (w L^2)/8 = ?? lbf-ft `\n",
      "format": "hurmet"
    }
  },
  {
    "id": "hurmet-edge",
    "format": "hurmet",
    "kind": "edge",
    "title": "Calculations in a table",
    "description": "A tiny table containing dependent calculation cells.",
    "path": "examples/hurmet/edge.hurmet",
    "tags": [
      "hurmet",
      "edge"
    ],
    "document": {
      "src": "# Calculations in a table\n\n| Quantity | Calculation |\n| --- | --- |\n| Side | ¢` a = 4 ` |\n| Area | ¢` a^2 = ? ` |\n",
      "format": "hurmet"
    }
  },
  {
    "id": "hurmet-error",
    "format": "hurmet",
    "kind": "error",
    "title": "A missing value",
    "description": "Hurmet explains an undefined calculation variable.",
    "path": "examples/hurmet/error.hurmet",
    "tags": [
      "hurmet",
      "error"
    ],
    "document": {
      "src": "# A missing value\n\n¢` missing + 2 = ? `\n",
      "format": "hurmet"
    }
  },
  {
    "id": "beancount-basic",
    "format": "beancount",
    "kind": "basic",
    "title": "A balanced beginning",
    "description": "Open accounts, infer a posting, and inspect ledger reports.",
    "path": "examples/beancount/basic.bean",
    "tags": [
      "beancount",
      "basic"
    ],
    "document": {
      "src": "option \"title\" \"A balanced beginning\"\n\n2026-01-01 open Assets:Bank USD\n2026-01-01 open Equity:Opening USD\n\n2026-01-02 * \"Opening balance\"\n  Assets:Bank 1000 USD\n  Equity:Opening\n\n2026-01-03 balance Assets:Bank 1000 USD\n",
      "format": "beancount"
    }
  },
  {
    "id": "beancount-typical",
    "format": "beancount",
    "kind": "typical",
    "title": "A month in the ledger",
    "description": "Income, expenses, tags, links, metadata, and balance assertions.",
    "path": "examples/beancount/typical.bean",
    "tags": [
      "beancount",
      "typical"
    ],
    "document": {
      "src": "2026-01-01 open Assets:Bank USD\n2026-01-01 open Income:Salary USD\n2026-01-01 open Expenses:Food USD\n\n2026-01-02 * \"Employer\" \"Salary\" #work ^payroll\n  reference: \"January\"\n  Assets:Bank 3000 USD\n  Income:Salary\n\n2026-01-04 * \"Market\" \"Groceries\" #food\n  Expenses:Food 65.50 USD\n  Assets:Bank\n\n2026-01-05 balance Assets:Bank 2934.50 USD\n",
      "format": "beancount"
    }
  },
  {
    "id": "beancount-household",
    "format": "beancount",
    "kind": "typical",
    "title": "A year of household money",
    "description": "The Charts tab shows net worth, monthly income against expenses and where the money went, with no chart syntax.",
    "path": "examples/beancount/household.bean",
    "coverTab": "Charts",
    "tags": [
      "beancount",
      "typical"
    ],
    "document": {
      "src": "option \"title\" \"A year of household money\"\noption \"operating_currency\" \"USD\"\n\n2025-01-01 open Assets:Checking USD\n2025-01-01 open Assets:Savings USD\n2025-01-01 open Liabilities:CreditCard USD\n2025-01-01 open Equity:Opening USD\n2025-01-01 open Income:Salary USD\n2025-01-01 open Income:Interest USD\n2025-01-01 open Expenses:Housing:Rent USD\n2025-01-01 open Expenses:Food:Groceries USD\n2025-01-01 open Expenses:Food:Restaurants USD\n2025-01-01 open Expenses:Utilities USD\n2025-01-01 open Expenses:Transport USD\n2025-01-01 open Expenses:Travel USD\n\n2025-01-01 * \"Opening balances\"\n  Assets:Checking 1800.00 USD\n  Assets:Savings 5000.00 USD\n  Equity:Opening\n\n2025-01-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4350.00 USD\n  Income:Salary\n\n2025-01-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2025-01-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 388.20 USD\n  Expenses:Food:Restaurants 62.00 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2025-01-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 118.40 USD\n  Assets:Checking\n\n2025-01-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 546.20 USD\n  Assets:Checking\n\n2025-01-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2025-02-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4350.00 USD\n  Income:Salary\n\n2025-02-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2025-02-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 402.75 USD\n  Expenses:Food:Restaurants 48.50 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2025-02-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 109.75 USD\n  Assets:Checking\n\n2025-02-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 547.25 USD\n  Assets:Checking\n\n2025-02-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2025-03-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4350.00 USD\n  Income:Salary\n\n2025-03-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2025-03-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 371.10 USD\n  Expenses:Food:Restaurants 90.25 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2025-03-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 96.20 USD\n  Assets:Checking\n\n2025-03-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 557.35 USD\n  Assets:Checking\n\n2025-03-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2025-03-28 * \"Bank\" \"Interest\"\n  Assets:Savings 38.40 USD\n  Income:Interest\n\n2025-04-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4350.00 USD\n  Income:Salary\n\n2025-04-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2025-04-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 415.60 USD\n  Expenses:Food:Restaurants 55.00 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2025-04-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 81.30 USD\n  Assets:Checking\n\n2025-04-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 566.60 USD\n  Assets:Checking\n\n2025-04-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2025-05-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4350.00 USD\n  Income:Salary\n\n2025-05-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2025-05-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 399.95 USD\n  Expenses:Food:Restaurants 71.80 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2025-05-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 74.65 USD\n  Assets:Checking\n\n2025-05-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 567.75 USD\n  Assets:Checking\n\n2025-05-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2025-06-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4350.00 USD\n  Income:Salary\n\n2025-06-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2025-06-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 420.30 USD\n  Expenses:Food:Restaurants 120.40 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2025-06-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 92.10 USD\n  Assets:Checking\n\n2025-06-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 636.70 USD\n  Assets:Checking\n\n2025-06-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2025-06-28 * \"Bank\" \"Interest\"\n  Assets:Savings 38.40 USD\n  Income:Interest\n\n2025-07-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4560.00 USD\n  Income:Salary\n\n2025-07-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2025-07-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 433.05 USD\n  Expenses:Food:Restaurants 64.30 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2025-07-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 128.55 USD\n  Assets:Checking\n\n2025-07-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 593.35 USD\n  Assets:Checking\n\n2025-07-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2025-08-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4560.00 USD\n  Income:Salary\n\n2025-08-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2025-08-04 * \"Airline\" \"Summer trip\"\n  Expenses:Travel 1240.00 USD\n  Assets:Savings\n\n2025-08-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 405.40 USD\n  Expenses:Food:Restaurants 58.75 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2025-08-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 131.90 USD\n  Assets:Checking\n\n2025-08-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 560.15 USD\n  Assets:Checking\n\n2025-08-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2025-09-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4560.00 USD\n  Income:Salary\n\n2025-09-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2025-09-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 392.85 USD\n  Expenses:Food:Restaurants 83.10 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2025-09-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 99.40 USD\n  Assets:Checking\n\n2025-09-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 571.95 USD\n  Assets:Checking\n\n2025-09-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2025-09-28 * \"Bank\" \"Interest\"\n  Assets:Savings 38.40 USD\n  Income:Interest\n\n2025-10-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4560.00 USD\n  Income:Salary\n\n2025-10-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2025-10-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 410.15 USD\n  Expenses:Food:Restaurants 49.90 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2025-10-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 84.25 USD\n  Assets:Checking\n\n2025-10-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 556.05 USD\n  Assets:Checking\n\n2025-10-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2025-11-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4560.00 USD\n  Income:Salary\n\n2025-11-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2025-11-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 441.70 USD\n  Expenses:Food:Restaurants 77.25 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2025-11-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 97.80 USD\n  Assets:Checking\n\n2025-11-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 614.95 USD\n  Assets:Checking\n\n2025-11-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2025-12-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4560.00 USD\n  Income:Salary\n\n2025-12-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2025-12-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 468.90 USD\n  Expenses:Food:Restaurants 142.60 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2025-12-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 121.35 USD\n  Assets:Checking\n\n2025-12-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 707.50 USD\n  Assets:Checking\n\n2025-12-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2025-12-28 * \"Bank\" \"Interest\"\n  Assets:Savings 38.40 USD\n  Income:Interest\n\n2026-01-01 * \"Acme Co\" \"Salary\"\n  Assets:Checking 4560.00 USD\n  Income:Salary\n\n2026-01-02 * \"Landlord\" \"Rent\"\n  Expenses:Housing:Rent 1650.00 USD\n  Assets:Checking\n\n2026-01-10 * \"Credit card spending\"\n  Expenses:Food:Groceries 395.25 USD\n  Expenses:Food:Restaurants 51.40 USD\n  Expenses:Transport 96.00 USD\n  Liabilities:CreditCard\n\n2026-01-14 * \"City Power\" \"Electricity\"\n  Expenses:Utilities 124.10 USD\n  Assets:Checking\n\n2026-01-25 * \"Pay the card in full\"\n  Liabilities:CreditCard 542.65 USD\n  Assets:Checking\n\n2026-01-26 * \"Move savings\"\n  Assets:Savings 600.00 USD\n  Assets:Checking\n\n2026-01-31 balance Assets:Savings 11713.60 USD\n2026-01-31 balance Liabilities:CreditCard 0 USD\n",
      "format": "beancount"
    }
  },
  {
    "id": "beancount-edge",
    "format": "beancount",
    "kind": "edge",
    "title": "A cost lot and a pad",
    "description": "A padded opening balance, total-cost lots, and an explicit FIFO sale.",
    "path": "examples/beancount/edge.bean",
    "tags": [
      "beancount",
      "edge"
    ],
    "document": {
      "src": "2026-01-01 open Assets:Bank USD\n2026-01-01 open Assets:Shares HOOL \"FIFO\"\n2026-01-01 open Equity:Opening USD\n2026-01-01 commodity HOOL\n2026-01-02 pad Assets:Bank Equity:Opening\n2026-01-03 balance Assets:Bank 1000 USD\n2026-01-04 * \"Buy shares\"\n  Assets:Shares 2 HOOL {{200 USD, \"first\"}}\n  Assets:Bank -200 USD\n2026-01-05 price HOOL 110 USD\n2026-01-05 note Assets:Shares \"Long term holding\"\n2026-01-05 event \"location\" \"Home\"\n2026-01-06 * \"Buy a second lot\"\n  Assets:Shares 1 HOOL {120 USD, \"second\"}\n  Assets:Bank\n2026-01-07 * \"Sell oldest share\"\n  Assets:Shares -1 HOOL {}\n  Assets:Bank\n",
      "format": "beancount"
    }
  },
  {
    "id": "beancount-error",
    "format": "beancount",
    "kind": "error",
    "title": "Catch an unbalanced entry",
    "description": "An unbalanced transaction and a failed balance assertion.",
    "path": "examples/beancount/error.bean",
    "tags": [
      "beancount",
      "error"
    ],
    "document": {
      "src": "2026-01-01 open Assets:Bank USD\n2026-01-01 open Expenses:Food USD\n2026-01-02 * \"An incorrect entry\"\n  Expenses:Food 20 USD\n  Assets:Bank -15 USD\n2026-01-03 balance Assets:Bank 0 USD\n",
      "format": "beancount"
    }
  },
  {
    "id": "quarto-basic",
    "format": "quarto",
    "kind": "basic",
    "title": "Your first Python cell",
    "description": "Run Python in a worker, with the last expression as output.",
    "path": "examples/quarto/basic.qmd",
    "tags": [
      "quarto",
      "basic"
    ],
    "document": {
      "src": "---\ntitle: Your first Python cell\nformat: html\n---\n\nA note and a calculation, together.\n\n```{python}\n2 + 2\n```\n",
      "format": "quarto"
    }
  },
  {
    "id": "quarto-typical",
    "format": "quarto",
    "kind": "typical",
    "title": "A stateful notebook",
    "description": "Two Python cells share variables; options control echoed source.",
    "path": "examples/quarto/typical.qmd",
    "tags": [
      "quarto",
      "typical"
    ],
    "document": {
      "src": "---\ntitle: A stateful notebook\nauthor: Sheets\nexecute:\n  echo: true\n---\n\n```{python}\nvalues = [3, 7, 11]\nprint(\"Measurements:\", values)\n```\n\n::: {.callout-note}\nVariables carry over to the next cell.\n:::\n\n```{python}\n#| echo: false\nsum(values) / len(values)\n```\n",
      "format": "quarto"
    }
  },
  {
    "id": "quarto-edge",
    "format": "quarto",
    "kind": "edge",
    "title": "R statistics and plots",
    "description": "Hidden R setup, warning control, plot dimensions and accessible alt text.",
    "path": "examples/quarto/edge.qmd",
    "tags": [
      "quarto",
      "edge"
    ],
    "document": {
      "src": "---\ntitle: R statistics and plots\nformat: html\nfig-width: 5\nfig-height: 3.5\n---\n\n```{r}\n#| include: false\nmeasurements <- c(3, 7, 11)\nmean(measurements)\n```\n\n```{r}\n#| label: fig-measurements\n#| echo: false\n#| fig-cap: Measurements calculated in R\n#| fig-alt: Three measurements increasing from three to eleven\n#| fig-width: 4\n#| fig-height: 3\n#| warning: false\nplot(measurements, type = \"b\", col = \"steelblue\", pch = 19)\n```\n\nR cells share their own session. See @fig-measurements.\n\n```{julia}\nsum([1, 2, 3])\n```\n\n```{python}\n#| eval: false\nprint(\"This cell is deliberately skipped\")\n```\n",
      "format": "quarto"
    }
  },
  {
    "id": "quarto-error",
    "format": "quarto",
    "kind": "error",
    "title": "Errors stay with their cells",
    "description": "Python errors appear in the preview and editor diagnostics.",
    "path": "examples/quarto/error.qmd",
    "tags": [
      "quarto",
      "error"
    ],
    "document": {
      "src": "---\ntitle: Errors stay with their cells\nformat: html\n---\n\n```{python}\n1 / 0\n```\n\n```{python}\nprint(\"The next cell still runs\")\n```\n",
      "format": "quarto"
    }
  },
  {
    "id": "org-csv-budget",
    "format": "org",
    "kind": "typical",
    "title": "CSV budget to working table",
    "description": "Import CSV values, then add a deliberate Org calculation.",
    "path": "examples/org/csv-budget.org",
    "tags": [
      "org",
      "typical"
    ],
    "document": {
      "src": "#+TITLE: CSV budget to working table\n\n* Imported budget\n\nThese values came from CSV. The total formula was added deliberately in Sheets.\n\n| Item       | Quantity | Unit cost | Total |\n|------------+----------+-----------+-------|\n| Notebooks  |       12 |         4 |     0 |\n| Pencils    |       24 |         1 |     0 |\n| Folders    |        8 |         3 |     0 |\n#+TBLFM: $4=$2*$3\n\n* Try it\n\nChoose *Insert*, paste the CSV below, and inspect the preview. Choose comma as\nthe separator and keep the first row as a header. Insert the editable table.\nThen add a TBLFM line yourself to calculate with the imported values.\n\n#+BEGIN_EXAMPLE\nItem,Quantity,Unit cost\nNotebooks,12,4\nPencils,24,1\nFolders,8,3\n#+END_EXAMPLE\n\nInsertion preserves values. It does not import spreadsheet formulas or connections.\n",
      "format": "org"
    }
  },
  {
    "id": "gfm-csv-report",
    "format": "gfm",
    "kind": "typical",
    "title": "CSV table in a report",
    "description": "Preserve quoted commas, leading zeros and decimal text when importing CSV.",
    "path": "examples/gfm/csv-report.md",
    "tags": [
      "gfm",
      "typical"
    ],
    "document": {
      "src": "# CSV table in a report\n\nImported values stay as written, including leading zeros, commas and decimal places.\n\n| ID | Department | Budget |\n| --- | --- | --- |\n| 001 | Research, development | 1200.00 |\n| 002 | Operations | 950.50 |\n\n## Try it\n\nChoose **Insert**, paste this CSV, and review the table before inserting:\n\n```csv\nID,Department,Budget\n001,\"Research, development\",1200.00\n002,Operations,950.50\n```\n\nYou can also choose a `.csv` or `.tsv` file. For copied spreadsheet cells, choose\nthe Tab separator. Turn off **First row is a header** for data without headings.\nMarkdown requires a header row, so Sheets supplies an empty one in that case.\n",
      "format": "gfm"
    }
  }
];
