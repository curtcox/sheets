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
  },
  {
    "id": "gfm-csv-presentations",
    "format": "gfm",
    "kind": "typical",
    "title": "One table, two presentations",
    "description": "The same outside table as editable Markdown and a bundled picture.",
    "path": "examples/gfm/csv-presentations.sheets.json",
    "tags": [
      "gfm",
      "typical"
    ],
    "document": {
      "src": "# One table, two presentations\n\n## Editable values\n\n| Item | Quantity | Cost |\n| --- | --- | --- |\n| Notebooks | 12 | 48.00 |\n| Pencils | 24 | 24.00 |\n| Folders | 8 | 24.00 |\n\n## A picture of those values\n\n<figure><img src=\"sheets-asset:AAAAACxHlaFkI7KHQmM7m1Serwk1SYfKFFpqO3cz-qlHoUfziqAkxQklAPCPOFdDd9JkK2c070paH3-fSKgVJ4USbWfEtA\" alt=\"Office supply budget table\" width=\"640\"><figcaption>A static snapshot, bundled with this document.</figcaption></figure>\n\n## Try it\n\nChoose **Insert**, paste CSV or copied spreadsheet cells, and choose **Editable table** or **Picture**. Pictures use simple table formatting; a clipboard screenshot can preserve the original appearance. Edit caption, width and alternative text in source. Select an existing figure in source before inserting to replace it. Undo restores the previous source.\n",
      "type": "gfm",
      "view": "split",
      "attachments": [
        {
          "id": "AAAAACxHlaFkI7KHQmM7m1Serwk1SYfKFFpqO3cz-qlHoUfziqAkxQklAPCPOFdDd9JkK2c070paH3-fSKgVJ4USbWfEtA",
          "mime": "image/png",
          "data": "iVBORw0KGgoAAAANSUhEUgAAAPYAAACQCAYAAAA7v5aPAAAQAElEQVR4AexdBXzVNxc9j4-iA1rcHQYMZ8iwASsw3DoY7u6sOBSH4i5FiktxZ4xSnMHwIQNaSrEiQ4qMYYMv57bv8VoK9FUfbfj1xm6Sf3KSm9zcvC2x3HZveacp_DHYeOA3jWsY5pbGL2xzMhbUvzLfloCm8MOgRMFvFapA7P_F1riGYm5p_MI2F4lfLJmB2tEIaASiFQJasKPVcOrOaAT8EbBmwfZvoXY1AhoBixHQgm0xZLqARsD6EdCCbf1jpFuoEbAYAS3YFkOmC2gErB8BiwT79p27uHHL1_p7FfEtjLAv3H_wEEeOH8fG7Ttw7ORpMB5hH_tMxa9evYKX91W8ePHiMzmth805evD3I9i0_VccPX4C_zz_13oaF4ktsUiwZ8xfAKfRzqbmrVy7AecvXjTFdSD0CLz57z-4LFyCuk1boI_TcCxbtRq_DHKS-IKly0F-6GsPecm9Bw_Bfd9-KXD77j206tId3teug__MeYxbE3ERmu26EA1atcWAEaOxYOkK9HYahoat28sCGda2-j1-jIUrVuFvtfCGta7IKB8rLB9ZvGqVEuzLYalClw1AYOpsFyxfsxb9enaDx5YNWLtkIXZtXIsubVtj8Uo3TJ87PyBnxHr7D_-O3Xv3yUdSp0qJeVMmIWumjBI350mCFTlzFy0BNxqnvo7Yu3UjNq9cAjfXeciZLasskLdu3w5Ta_0eP8HCZSvwMLoLdv_ho_BcqTmr129QE3KdgEbwBo9yhkOzlujRfxD2HDgo6XS42rko8Ok3btsBjoOGqkXhIlat2wDGm3XojF_dPZg1xtFNX19RHVs0bICqFe0R-3__EwzixomD-nVqofqPlbBhyzbcu_8A-w4dFuwkQ4AzeeYcrNu8RWJv377Fui1bBf-aDZth-LgJOHnmT-HRIf5LlDawSC0WRtzXq7rJY9rhP47h1NlzGDJ6LPz8HmPekmW4e_8-gvJGT5oC7pAsZ6Q5rosxduo0YzTS_DtKs1i9cTMa_-QA--_LIlYs__0qTepU-KVLR5QvUwqcm2wQMWTffnRoIPOUc_LFy5dk4d27d9iwbTu69O4HYsc5zrrv3ruHERMmSh5n1b8_Tp6UsDU7_giEooXlSn0npXJ__TW-UeT32A-tu_aA5xVvNKhbB-nSpMGQMeOwe_8ByXfj5k0sX70W-9XEtC9fDpdVvo69-mCFUucZT2pnh9Fqsjx89EjyxyTnoqeXdLf0d_6YSsTMKV-6tMSuXb-BBw8fIejE8rx6Fb7K_sFM7nv3YersuciUMQO6tW-DJ0-eYfTEyXilzsvkcxzmK2H1UOq2Q60a-E8dAaYobcHb5xry5sqFdGnTIGXy5ChT8jtwwvNb__zz_AMe83CH_Pfff1kteA5fsXYdUqZIKfHIdLyvXZPPlSxeVHxzh8I9rH9fFCtcGC8VBp16OeLq9evo1bkjHGrVlDk5dY6LFDlz7gK4SHIhaN6oPq7fuIHh4yciQfwEKF2smOQpUfRbpEoZ-X2Uj1vghFqwK_9QAQkSxEe-b_KgYP68WL95m-zgsyeNw0-1a6J3t84oVbwo1m3eamoO888c74yWjX5G0wYOkt6zUzuJd23XRuI-avJKIAY5d9WOw-6mTJGM3geUIllSSXvk9_lF79Wr17Jz9ezYHvblyqJd86ay03t6e0sddDgOsyaMQ53q1TBzwlgmyWT_tlABZEqfXi3KqaWsMAKcoLzvS5cUzokAbeDEmbMSL1_KP10ikeT8rTQZfipFsuDxI4-0Z_9BwcKpjyMqqc3l53p10LlNK2zb6Y5Hfn44-PvvMqd_tLdHvRrVMbR_H-TLkwvx4sdD-bJlWAXKlSwpGEnEip1QC3bQPv3l6SmguK3fBKpkpMdPn8Hbx8eUNVeOHCpPAonb2dqKX6RgQfFtkyQW__m_X44FVhocDk7CrxJKLS8DVEKJmDl-T55KzNY2ififcqi2_2hfQQw9I8dPgqMyIDH_27fv6AnlURrWVwHftE3iX-eTJ0-EF1InR9asyJAuLQ4cPiJFDh75HZmVlpA54DwuiZHkJLW1lS9xR5bAR5wrPj5q_sVH1syZTDny5Ppawjd9b6NqpYqyOdVr1gLjp83E7dt30apJY9jEji15viQn3AT78eOniGMTF1TNjJQjSxZwZzcCkjChv1Ab4_TjxYtLL0ZTmgDV7opSh82BMF7VnL1wQZLTp0krflDnoVLPjWk8Lzdt3wknTp1GCqVSt2jUwMgy-fHVDmSKhCHwo_0P2Hf4sKjhew4cCjTWYajW4qJp06SWMlcDVHKJBDh-asEqW7Umlq1eg6fPnoFHCOMZnFnevXtLT53LDSLwrjOmolbVH3Hi9BkMGjUGPQcMFv6X5sQKrwZnTJ8Or16_RPeO7dCzcweh4kWLfBFqS3hhENp68uXJLTvJUmXUMl5rPVHaDq9qaBGntZxqNSfw_wIMa6_fvJHP8Wzre-eOhN8p48_qDZvEWDRDHXnat2yG7FkzCy8inLLKzkID6qIVbrLTlQtQzz_xrQhhpVeag20SW7it3_jBteBvu_fINwvkzYvUqVKBR73HT_01IDIuel6hh1TKNsC770fKYNixVUuscp0LWtjPXfgLlwPySMYvxAmTYHOH9lbqDVfFCt-XkcGdt3gZaEncudsDtMje_fvvLwSKqGtmggQJ1Fm4mboluIRufQeABqunz56iWJFC6j52ueDayKGeNJBnYAZoALuqdqhJs-YwKmQwGJDwqwRqZ_oHfure9bKXN6a6zBPe8-fPxf-cE0dZ4q_fvAVagoPmDcpjW3Jkz6oMoOvwjVJpaTANWiYy4rw96NO9s-DXb8gIHD91Rn5Ys2LtesyYt0AZAkuos3JufF-yhDRnmdsa-eHKNWXQXa9sQKWULSi5smPcf_AAU2bPwek_z4kWcvee_9ylAc7GJraUveTlJVqpRKzYsUiwYxliIdb_3hepXtke239zh8vCRShZrChaNmkE7i71W7bBqIlTULpECfAK51P9NxgMwjYYAvuSGIOcujWqgTsEF0peBXK3_s1jj5xjaewaN3UGHjx8iDy5copRcqWatM07dsVjdb-aV-34_ugBLRv-jAuXLqnrmqZo060H7Mt-D559-WMNWrc_CmkA_qVLFJdfF3Z27GvKajD41x4cr3L58pKvWuXK4keVw7b17toZ5y7-hV4DB8sPa-a4LhJD7mDHXtKsLJkywbFLJ9nZq6jrrqbtOiFxokTo2amj8KuoowXtHN36DUCluvVVvk3ooYyQiRJ9hbSpU4M4T5gxCwd-97crSCErdWJZ0q4RA_thwbQppiLtWjTDjrVuqvMdJI3W7q1uK-AyZSLWLFqAQY49ET9-fOHREjlq0AAJ06FquX_7ZpNhgtddjHP1JD8mEu9gt69eiVUL5oKq9Ir5c7Bs7mwsdZmNHNmyIl68-OCuOWbIYGxasQSbVy3D2GFOmKUs210CbhVKf1cCW1Ytx8KZ0-C-aR0aOtSBqwrzBy-0cQQdB-JM3OtUq8qgWoyLyw9jFs-eiUwZ0oO83DlzfMCTBOUkVNqG8kT9px-VVKNKZen70rmzwLMyf-DD25Z48eKZmlVTnZ85Z-dNmSRz1GXKBKRMkVz4POqsmO-CRbOmS_lNKxajrlpwyTQYDILzFrfl-EHdlTPNmskiwQ6uIwnVlRdVISMvsVrdOBFSpUxhTNK-BQjEihULnGD51TVi-rRpYTAYkEKpib3V9SGxNlbFWwXbxImN0UA-rbjZsmRWxkwbSecPXlIm__RVkGQMcDieXAQCooE8I8_vsZ8cGZYqtZY_ojFvW6ACkRxh33lEyJ41C9jW4D7Ptn6dM7u6j04h-AbkEY8LJ63mLG8wGCTN3EmidnijncM83drCYRZsa-uQbk_kIHDj1m35BVyhAnnRpL7_-T9yvqy_EhIEYoUkk86jEQiKAC35VNP7du8GWqSD8nU8ahHQgh21-OuvawQiBAEt2BECq65UIxCuCFhcmRZsiyHTBTQC1o-AFmzrHyPdQo2AxQhowbYYMl1AI2D9CGjBtv4x0i3UCFiMQCQKtsVt0wU0AhqBUCKgBTuUwOliGgFrRkALtjWPjm6bRiCUCGjBDiVwuphGwJoR0IIto6MdjUD0QkALdvQaT90bjYAgIIJ94PgRaAo_DI6cPi7gvvnvjcY1FHNL4xe2uUj8RLBlFmonXBHgf1cdrhXGsMo0fmEbcBHs-hWqQ1P4YVC7rP__Jsgmtk044Bp-7fpSxljjF7YxJ34i2GFbG3RpjYBGwNoQ0IJtbSOi26MRCAcEtGCHA4i6Co2AtSGgBdvaRuSLao9urLUioAXbWkdGt0sjEAYEtGCHATxdVCNgrQhYJNgXvbzgc-PGB3159s8_IO_Nf_99wAtrgpePD3zv3glrNcGW5_vPbLfxHaxgM-lEjcAXiECIBZsPpNdo0QwVGzbAX16egbp69NRJkPfg0aNA6R-LzF-xAqfPn_sYO1D60InjsXjNmkBp4RXhIsV237t_P7yqDHM9xKV49Wp49epVoLoOHTuGFj27o2Ale1So74DR06biWQjf4wpUUQyIEJuClewD9fSPU6cwwHk0iG2nAf2wbbd7IH7QyFb3XWjVqyfK1KmFboMHwevqVVMWbmAzFy1ErVYtRB6GTpyAp8-emfjWEAixYJs3dqCzMyjo5mmWhGcscsWp8-ctKRLt8565cAHL1q1Dr2FD8dDvEd6Z9ZhaBYX6zZs3GDdwMFr_3BALV7thodsqs1w6SAR2Hzwo2Pxjtujd-ftvNO7aGQkTJMSUYcPwddZs6DHECYeP-__0l-XMac_hQ-g5dAiKFyqEiU5DwV_BObRvizv37km2SS5zMG_FcrRt1BhOPXvh-J9n0LxHd7x7Zz5qkjXKHIsF26FadZy9-BdWbtz40UYTSK5y3F244k1QQFDtZYEO_fqCoLuuXIG5y5cxCddv3UKXgQNkdWzarSt27PGQdKPj9_gxHEcMl92Kq6Q5_6Xa2cbMmC5luRpzwPh9Y9nP8Y356FOAmqgJQI2C8QN_HJXVmv1o0LE9jp48yeQIoe0eu7HF_Te8fv36g_qPnDyhJmUCLJ02A5W-_x6N69ZD3SpVsUBh-Pbt2w_yx9SE23fv4pfhQ1GxbNlAEPy2b6_Eu7dug--KfItuyk-YIAF2Hzwg6UGdOUuXoEKpUmjftBmKKeEe7thb5uwWtYtzHlOou7dpi-r2FVGmWHH80r6DyMSZC-eDVhVlcYsFO2-uXGjTqBGGTZ4IcwEy9oCC9FO7NvC86o1hCpAW9RvARQE1XOVnnh_LlaOHAnm-QUFF3J1qtmyOC56X0bphI_DdJS4K5qrS-h3bpb5OzVuIykM-VVZWNNB5DFxXrUSHZs3Rp1Mn_PnXBTTt1gWvAgTkc3zWQaKq9XOnDogbNy6aOjiAdgOqYsmS2mFIz18QP148NFH1Mp35w5v6d-kKt9ku6NS85QdVGb188QAAEABJREFU58n5tezUBoPBxPNUqmHcOHFlNzElxuAA1WNqO43r1EXJIkUDIVG8UGGJT1swH5e9vTFr8SIR1FJFi0l6UOfSlStqt_YvQ17iRIlkYWX6zdu3mYQi-fKLT4dzlr7nVR96VkEWCzZb3blFKyS1tYNRWJlmpO27d4vATx46HLUqVRZh5aRds3UreAav_WMVAalIgQKyGi5du1ZAXuMyD1wERvbpK6vlkrVrjFUic4YMWDdvAdo1boLtS5dLutvmzeD7xpt-24mhvX5BYzWg9apWw5RhI8TAt_fwYXyOLxUpx_v6NaWqdUHBb77BzFFjEDdOHHCXVCzUrlwFdapUwQyV3kqpwPceRP55vFjBgrJTsz08e4-ePk12CKqCTNMEzFJnXr8nj2U3DorH19myiYbD40u1Zk0wZf485MmZE2WKFw-aFXwUnxplUlvbQLzc2XPgobIh3fC9Jem2SRKLTydd6jT08Oixn_ifdyI-R6gE-yulxlAAd-3f_4E6c_GKlwhuzqxZTa0v-E1eCVPQJGDm_KnUeqpF3HXHz54Fkt-TJ-DqaMxW_ruSiP2__0k0ntpRy5YoIcLr5eMjaUXyFxCfTu4cOejh6o3r-BxfMiqHOzM1h59r1QbrV0korVSs1ClSwEFpH9QQdihVuX2TJsiaMRPZUULHzpwWgw3P1tSGWjdsGCXtsLaPchGevtBVzsNclIO2b9POX0Gtj8cXl7HjZYO4cPkyeBwMmvfly5eSRA1AAgFO7NixkdTODlTFmfT2v_dHIOPrm3ZJAi8GzBdVFCrBZmN5juE5ZIAypJlbBJ88fYo0KVMGUhHfvvMHIVas96ok6yA98nusdsi4smtzpSRxdeQuSX5wZBy8p8-eCjtl8mTi03kXcOY0GAxKbf80n_lJNJIUzpcPo6ZOkXYwjQK-VmkJfTp1xu17d5VFdQx4hueKTn5kE-0RjTp3Utimws4VK9Godh0YDB_iGdntsobvLVq9WjaTcbNngkZGV7eV0iyGaSfZtHMnuEiP6T9AtMHeHTuhjFq4127fJvnMHTtbW4n63rkjvtG5__ABuFkls0sqSb7qPC8B5XDOKw85smSmZxUUasFm6wf36CUW3InKOMY4KV2aNLJTctdlnHT24kV6SJsqtfjmTtaMGfHy1UuxLg79xRGk77_7DtkyvgeJ529jGVoeac3MmimTqb7T5y8Y2XKGYiRD2rSf5TMfaXS_AfJd2gx4_mIaJ8ReZR2lustjgvuq1UzGBnXel0AkOkeV0W680ma6tWqNBRMnRanWEIndDvGnqtvby5GPmhspWyb_ucNw8qRJwbmYIlnyQJtN6pQp8PeDBx98w0btzNkzZ8b5y5dMPGpz1P5yZMmCbGrekXFJaab0SafOnaWHLFGozUkDzJwwCXZ6JcTc0SgQxjorK6stw7OXLJZ7Vp5fl6rzMnf3lMmTkyU79GVloHikrN3V1KBwl5401wW31Cq58dcdctXge_f9inlU3UHyKuiuum-mGsr8VKsKqDMxV-J5yrpO3kM_P8xQZy2q9uWU-v45vjRGOVSlqCU0c_hJLPW0jscyxMKgcWOxw8MD_754AeNVB89rqkik_u0-dFB2JC5mv-3fh5379grtUkehSG2IlX6surJOd23ZCkayL1NGWso4x_W7IkXEJsHbDhq_3A_sB20-9mX8ree8ruJxi_OPBevXrAWPQ4ewTu3oTBs-ebLgXyBPHiRT6jjn8lRliDt59iw8lZHYeeYMZWwrBD6Kz_LWQBYLtsEQoP4FtL75T_XBFS4gqtSRrBjRu49YqgtVskflRg1hmzgJhv3S25gF9WvUwNptW9V5eibKlywlBg-XZUtRzqEueo8cAXsFeBc1UMYCZZTaNMFlNkrXrglebTl26Igi-fOrBSIOpg4fCe_r14VXvHpVMXrNGz9BrNhU2T_FN9Zv7JLxGmTw-LEoUbiwoiLo5jQI-e0riEX8p-rVJc1YLiJ8Y1vMUT5-5owcEXiVx2tBI_GHFhHRhuhWJ-cSjy4zFrmi_E_10LF_P3yr7DJ91TGLfeWizStU45GyWT0HMbb1Gz1K5uTe3w9jjvNYJFUGY-Z3HjAI3NR4BVq1aRMmYdKQYeJbixNiweau5nnwsJztzBsfx8YGO5atAHmpAnZkGqFO_eaODfNdsX_dBqybNx-p1bnbWI73fuQP6eUoSVxZj-_YqfItkPwTBjshQfz4wls2fSZcJ03GCcX_dflKnFb1tm_SVHh0eDY-sGEjti5eCvJZT9ECBckS-hQ_V_bs0m7jEYErLuun6s3-Lpk6De5KBWf8vMdeUGU3GMxFTj4Rrg6xI5ZxlGXeWPH6-QuknUwPSsY82n-PQIOatQQvYwqvKmls5NwglrtXr8HyGTORIpm_bYY7PnHlfGAZjv3YgYNwdOt2bFm0ROZeicJFyBKyS5JE5ttutzUg7VrpBqM2KhmswAmxYFvaVlrO86o77zSpUgVr5CGfO6qxXgpV_ty5wfzGNHOfYPN8QzXbPJ1hLi5Ukck3Ws-ZbqTP8Y35gvoGgwG8o-Q1mLmgBc2n418GApwb-XLlRsa06cBfk32u1UltbUFh59wLLm_GdOlACo4X1WkRJthR3TH9fY1ATEYgegp2TB5R3XeNgEJAC7YCQf9pBKIbAlqwo9uI6v5oBBQCWrAVCPpPIxDdENCCHdkjqr-nEYgEBLRgRwLI-hMagchGQAt2ZCOuv6cRiAQEtGBHAsj6ExqByEZAC3ZkI27N39NtizYIaMGONkOpO6IReI-AFuz3WOiQRiDaIKAFO9oMpe6IRuA9Alqw32OhQ9aMgG6bRQiIYK_22ApN4YfBxv07ZRBev3mtcQ3F3NL4hW0uEj8RbJmF2tEIaASiDQIi2PUrVIem8MOgdtnKMkFsYttoXEMxtzR-YZuLxE8EW2ahdjQCGoHQIWCFpbRgW-Gg6CZpBMKKgBbssCKoy2sErBABLdhWOCi6SRqBsCKgBTusCOryGgErRMAk2FbYNt0kjYBGIJQIWCTYV65dA5-_MdKlK1fw-s2bUH7asmKvXr2Sb_O5HX6TbWDYslp0bo1AzEDAIsFu0aMbarRoZqLqzZuiaNUfMXzyJHmnKyIhu3H7tnz3sre3vKPFdlwyexgtIr8dGXXf8PUF348qXr2avOrJ53uu-9764NOvXr_GT-3bgk8PfcCMwQk3whm_re67wOeVy9SpJePidfWqCV0-sTtz0UJ50rhiwwYYOnECjM8DmTJFccAiwWZbHapVx9nde4T-2LZD3iReum4tZqmOkh9RxLeSNsx3ladMI-obUVUvJ4pDu7Y4d-kierZtC6eePeGpJlLfkSM_aNLkeS44ff483kSSpvRBA6wwIbzx23P4kDwMyeeVJzoNlVdDHNRiyje-2P1JLnMwb8Vy8CVWp569wEf9mvfoDr4ES741kMWCzadR-HY0iW8Y_VC6NPhk7ZVrPtIfdm7J2jWymlWo7wCnCePkGVMy-XJhw04dsf_IEVkNuTu17e0I89c6madDv74oWMkeTbp2Bl_ZZJ0PHz3CpLkuuH3vLoL-42o6bPJE2emoRbBM0DzWHL_k5YWHfo8wx3kcfq5VG9V-sEeHps1kwnhe9TY1fd-R37F--w7wPTJTog4gvPGbs3QJKpQqhfZqDIoVKoThjr3lUcQtahd_8fKlCHX3Nm3BN7_4YCTfojt78S-cuXDeakbDYsEO2vKTZ8-CalDZ4iWENUPt3COmTEaubNnRumEj7Dl0SFRHrqoEhatba8de-Dp7NtSqVAl8yXD09KlSlvyfO7YHF4n-XbrKu0gU2M27fsPzFy9w4I-jSuX5R_KaO0MnTcDV69cxqHsPFPwmL1jm8PHj5lmsOvxVwoTgC6VZM2UytdPnxg0J82epDHDx6-40GM4DBiBFUv_H5JiuCQhv_C4p21HxQoVN0CZOlAh8M47pN9WRkIwi-fLTE-L7bgx4XvXf3BiOarJYsN0PHJCdlLtpRXW-4FOi7HTFst_j8dOnmLZgPlo2-Bl8rbBxnbqYNcYZnKRHT5409dWxfQf07dQFA7p1R8v6DXDu4kXhbdvtLrv39BGj0KBmLXndkurQH6dOCT8456Ha6Y4qPlfOGhUrYmSfvujdsZMy6r0OLrtVpnFicKfmo3Fs4MZfd4C7RrnvSiJzhgzgoug4fKjsEHx2mHk0vUcgPPHjHP7n-XPwQb73XwByZ88Bao03AuwetkkSm9jpUqeR8KPHfuJbg2OxYCdO9BVy58gpVF5NvAFdu2HbkmXyjCh3TXbq5m1fjJ89S2iruzuT4HPTfwdipGjBQvSE0qdNq9RQf0C8fK7KysiXM4WpHD6jO6pvPxUK_i-prR2qVKgA55kzQDV_7vJlsC9TBt-X-C74AlacelPtBu379pY3wrkoThvhf8aevWQxrt28iX5Ki7Hi5kd508IDv5dK1WZHuJjSN1Ls2LGR1M4O1CqZ9va_t_SEjK9x2iWxlbg1OBYLdjEllAPVTkuSHVftzulSp5a-cKWTgHIYJhGoxmrnNn9ulOdzlUX-DIb37037PX6CpLa2wT67K5k_4owdMAjjBw0GFx0uKHxs__cTkaOKf6RJFicfOnYM1dUtg6cymi2aPBVDf3FE_HjxpB5qQQx0GdgfLXp2x8Fjf4BHDYbv3b9PVoyn8MLPztZWsPS9c0d8o3P_4QMx3CazSypJvnff23qeKE2ViTmyZKZnFWSxYH-q1WlSpRR2mWIlZGJyclItTqZWutQpUgjvU066NGnkvE712piv17AhsvMb40F97-vXMF9ZKKsqg5PL2PE4tXMX8uXKjcVr1gTNarVxvydP0FkJbZH8-bF18VKUKlo0UFt7tWuP-upoUiR_AZDSpEyJFMmSSThu3LiB8sbESHjiZ6N25uyZM-P85UsmKDkfvXx8kCNLFmQLsINcMrtqPXXurOTNkvG9jUQSotAJV8HOnD6DCJWr20oxdHkqi27_MaMxzXUBkiR6fyb5WH-rKpWaPKfx48H76pUbN2LLrl0CKNODI66grH-OUlc5ADwj_f3gPr7JmTO47FaZduLPM2J1LfVtUcFt5769MBL707FZc3Rt2cpEuXPkEEyYlkQZdqyyU5HYqLDiR4Muf0PAGxk2m4uohzL6rtu-DUwbPnmyHBEL5MkDblK0mE9VtiQajjnHeQykLciaxsIiwbaxsfmkmsyrsAlOTqARiJf7VZs2AVezuePGyxmcoAUlAwympKxqxRs3cLBM6mrNmmDK_Hlo17gJalaqbMpjMBhgMBhMcYLZrVVrTF_oKtdd5RzqqkmfVXY4UyYrD_Bemk0cM2M6ugwcEIhoeCQvKMUyWDR0QYtHq3hY8eP99I49HurG5Zng0qyeA-pWqYp-o0eB84k3N3Ocx6pjop3wndXRj7-roOGYc5yJk4YMo2c1ZNHs8Fi9FrQ6f6r1FE6qkztXrMQm10Vwd1sDoyWXaoznwVXkJgMAAAvkSURBVMPIY7abNqlXD6d_8zewsd46VargvMdeuK9ajcObNoOqPBcMY9n8uXODoLIeXm2xTFcl2Ic2bsYal7k4vmMnXCdNRqrkycn6Ioj3oOxPcMRdImgnOIlmjBodNPmDeExJCCt-vI8m9rmyZxfIaAzjrc7RrduxZdESnFBzqkThIsKjw99vcI7vVnObtGul20c3LuaPCrJIsEPaQAJDAacAx40TJ6TFTPniqDK8wmA9psTPBFIqQaagcwf_TFbN1giECAEacinsH5uHGdOlAylElUVypggR7Ejug_6cRkAjEAQBLdhBANFRjUB0QEALdnQYxS-wD7rJEYuAFuyIxVfXrhGIEgS0YEcJ7PqjGoGIRUALdsTiq2vXCEQJAlqwowR2_VFrRiA6tE0LdnQYRd0HjUAQBLRgBwFERzUC0QEBLdjRYRR1HzQCQRDQgh0EEB3VCFgzAiFtmxbskCKl82kEviAEtGB_QYOlm6oRCCkCWrBDipTOpxH4ghAQwV7tsRWawg-Djft3yhR4_ea1xjUUc0vjF7a5SPxEsGUWRp6jv6QR0AhEMAIi2PUrVIem8MOgdln__5WTTWwbjWso5pbGL2xzkfiJYEfw4qGr1whoBCIZAS3YkQy4_pxGIDIQ0IIdGGUd0whECwS0YEeLYdSd0AgERkALdmA8dEwjEC0Q0IIdLYZRd0IjEBgBiwT7yrVruOjlFSz9--JF4JqDifH9owePHgXD8U_6y8sT9x8-9I9oNygCOq4RCDECFgl2ix7dUKNFs2DJ_JGyj329Zc_u4HtIH-O36-2InXv3fIwdrdP5lM8ElzkoU6cW-HTM0nVr8fzff6N1n8Ozczd8fcH3t4pXryZPPXUa0A_XfW998IlXr1_jp_Zt0c1p0Ac884St7rvAZ6o4HqzX6-pVE_vNf_9h5qKFqNWqBSo2bIChEyeYngcyZYrigEWCzbbWqvwj-PRJUMqbKzfZmkKBwNu3b9Gxf19cuHQJo_r2h0O16piohJyviIaiuhhXhILm0K4tzl26iJ5t28KpZ094KkHsO3LkB1hMnucCvvX15s2bD3jGhD2HD6Hn0CHgQ3sTnYaCT0w5qMWAb3wxzyQ1NvNWLEfbRo3Vt3qBj_o179Ed7969I9sqyGLB5pM9fPokKPEhPvZo9ZbN8s5zwUr2aNK1M06fP8fkYGnZunWo26a10KLVboHyEKQla9fIqlihvgOcJowDn0tlJr4J3bBTR3AA2vftjanz5wmoyzesB9O5anfo11deSmR-a6fL3t7gMaVF_QYoW6IEfqpeQ_wtatew9rZbQ_sueXmBL63OcR6Hn2vVRrUf7NGhaTMROM-r3qYm7jvyO9Zv34HC-fKZ0oILzFm6BHxRs72qo1ihQhju2FteQ-V4vHj5EhTq7m3agm9-lSlWHHw77OzFv3DmwvngqouSNIsF--k_z3D91q1AZBS4NVu3YOBYZ5T7rqTaefohjk0cpfa0w7WbNz_o3IqNGzBs8kTY2MRGyW-_BV_WvPP336Z8M5SqM2LKZOTKlh2tGzbCnkOHVF1twdX55atXMmjt-vSG9_Xr-Obrr3HszBlRiapUqIAuLVviyjUf8G1tU4VWHMiWObM808rnh8-rXXuHhwdI9mXKWHGrAzUtSiNfJUyIEb37IGumTKZ28GjDCH_WS59zq7vTYDgPGIAUSZMx6aN06coVtVsXNvETJ0ok48P0m7dvS3qRfPnFp8N35uh7XvWhZxVksWBzwv3Q4CeY07zly6QzE-bMQZXyFeDYoaOsmrPGOAsgy9avE77R4W48df58cLVzm-0i-aePHGVk4_HTp5i2YD5aNvgZfPWwcZ26YF0crKMnT5ry8Viwc_lK2JcpC_f9--RbdatWQ9N6Dpg2YqSszK8_oXKZKorigE3s2BjcoycOHTuG2q1bms5_jevUi-KWfRmfp2BxpzZqjRt_3QHuutxgMmfIIJuB4_ChssOWL1nqk53i3Pvn-XMktbUNlC939hx4qAy_NwLO7bZJEpv46VKnkfCjx37iW4NjsWATrJWzZsOcCCp3bapDPJcYOxYvblwUzpsPV3x8jEni0_LNvGWU2ikJyjFfAa-qXVgl4eZtX4yfPUtoq7s7k-Bz84b4dGpUrCjnH4YdlPrKASlduyYGjRuLG7d80aNNO1BoyLdm8vLxQb_Ro_Bt_gKYNnwk-nXuIovUoHHO1txsq2vbTbWb8mjWe-QINFabARd3NnL2ksWg1tivS1dGP0kvlarNDNQM6Rsptlp8k9rZgao4097-95aekPE1TrskgRcDYUaRY7Fg87laTkBzypA2LZ48eypdSJk8hfhGJ7gdk-o8-anN8vLsnjBBAibLeUYCyqGwkgh4YzVYGdOlU6n-f-ZP5ubMmlXeMm5YuzYOHz-GzgP7o1n3rv4Zrdz1OHRQWjhu0GDwKMGjR6fmLWQHv3v_vvC082kEqO1Ub95UjGaLJk_F0F8cET9ePClE7Y-BLmpOtFA3MweP_aHmyHEwfC8Ivna2tswK3zt3xDc69x8-AOdYMrukkuR79674dJ4oDZN-jiyZ6VkFxQqvVqROkVKqOnnuT_HpcNU7cvIEMmVIz6iJ0qRMJeFT586KT-eyMnJQgBlOk8q_rjLFSsgAcZB6d-yEZGrFTJ0i8MLB_KSVGzeCd-R9O3WBx-q1mDx0GE6ePQueWcm3ZjJODJ7ljO1MlTy5BJ88fSK-dj6OALVFLuRF8ucHH6QvVbSoeWb0atce9WvWQhGlEZHSpEyJFMmSSTyu0irNM1PDy545M85fvmRKpnZJrSpHlizIFnCOv3TFy8Q3zuMsGd-f8U3MKAqEm2DHsbGRczWtjhQm3sEaz951q1QN1D2upNyZVitj2-nz53Hl2jWMnzXLlCdz-gzIp67PaEw68MdRtQp7o_-Y0ZjmugBJEr0_25gKqMDd-39j6KQJ-OPUKfDHMsYVldqEYlv1X5H8_oaY0dOmghZyLki0vHIRy5who1W33Road-LPM6Lllfq2KDhfdu7bCyPxzNyxWXN0bdnKRLlz5ACFlGnU-nhdxbvqWwG7NBcBD2Ws5W8umDZ88mQ5GhXIk0c2F1rMpyobEMeJVnfnmTOUsa2QmpuJrAEOaYNFgm2jhNdgMEjB4Jz-XbshY7q0YgAqUPEHTJrrgiE9fxEhNeY3GPzLD-zWAzR68McCPzZuKGwaOqD4vDec4OQEGkP4I4GqTZuAq-LcceORUu1kBoN_HVIowKmnjGYvXrxAY3XFlt--AhasXCnfTqwsmgFZrNajQYfn6mNnTqNasybyA5XHT56ABkXuIFbbcCtpGDcHNmXMjOnoMnBAIKLBlbygFMvwfurzfnrHHg_Tj0yaKeMrNyPaPco51MXe3w9jjvNYZVCzk2qcBwxC-jRpZJw4N5k4acgwelZD73sXgiZRxR3Zp-9Hc1J9pJV79-o12OS6CH-6e6BJvfeW3QMbNsmlPitg3vXzFmDH0uXYs2YdXCdNxq6VbmL0ID-rUmuoVu1csVLqcndbAwoAeQTV8-BhFPwmL6NC3Jl3qzzbliyTs_aRLVsDfVsyWbHDc7WHOkIQj-1Ll2G3Cpv3z4qbHuVN4z0y50NwxF02aAMphDNGjTYl8z6aZXNlzy5pNIbxNoY_wtqyaAlO7NiJEoWLCI-OXZIkovJzvpE4b7nhkGctZJFgh6TR3G0zpk2HPDlzmowXHytHALOrcwsFNbg85FPAWReNa8HlMU-LEyeOGDg4QAbDh7u6eV5rDROPHFmygkcba21jTGkXr7w4lzgPg-tzRmXIJQXHC2FahGULd8GOsJbqijUCGoEQI6AFO8RQ6YwagS8HAS3YX85Y6ZZqBEKMgBbsEEOlM2oEvhwEwkGwv5zO6pZqBGIKAlqwY8pI637GKAS0YMeo4dadjSkIaMGOKSOt-xmjEIjmgh2jxlJ3ViNgQkALtgkKHdAIRB8EtGBHn7HUPdEImBDQgm2CQgc0AtEHAS3YUTaW-sMagYhDQAt2xGGra9YIRBkCItirPbZCU_hhsHH_ThnQ129ea1xDMbc0fmGbi8Tv_wAAAP__00ZMOQAAAAZJREFUAwAh-wI26vHIHwAAAABJRU5ErkJggg"
        }
      ],
      "format": "gfm"
    }
  },
  {
    "id": "gfm-spreadsheet-excerpt",
    "format": "gfm",
    "kind": "typical",
    "title": "Excel or Google Sheets excerpt",
    "description": "Copy cells, review values, and choose an editable table or picture.",
    "path": "examples/gfm/spreadsheet-excerpt.md",
    "tags": [
      "gfm",
      "typical"
    ],
    "document": {
      "src": "# Excel or Google Sheets excerpt\n\n| Code | Department | Amount |\n| --- | --- | --- |\n| 001 | Research | 1200.00 |\n| 002 | Operations | 950.50 |\n\n## Try it\n\nCopy a rectangular cell range from Excel or Google Sheets, then paste into the source editor. Review the preview and choose **Editable table** or **Picture**. A single copied row also works.\n\nRich clipboard tables are read as values; scripts and formatting are discarded. For merged cells, copy a rectangular range without merges or paste a screenshot instead. If the clipboard includes an image, **Picture** uses it to preserve appearance.\n\nYou can always use **Insert** and choose a CSV file or paste tab-separated values. Spreadsheet formulas and live connections are not imported.\n",
      "format": "gfm"
    }
  },
  {
    "id": "gfm-hashbin-picture",
    "format": "gfm",
    "kind": "typical",
    "title": "A HashBin/256t picture link",
    "description": "A verified inline CID chart: keep linked or include the bytes.",
    "path": "examples/gfm/hashbin-picture.md",
    "tags": [
      "gfm",
      "typical"
    ],
    "document": {
      "src": "# A HashBin/256t picture link\n\n<figure><img src=\"https://256t.us/AAAAAAA8UklGRjQAAABXRUJQVlA4TCcAAAAvH8ADAA_wwP-X_J_tf_7jAWoaSYGGCv9OEUD9OYjo_wQYdtxUfgAA\" alt=\"A tiny two-bar chart: the second bar is taller\" width=\"320\"><figcaption>A small chart carried by an inline CID.</figcaption></figure>\n\n## Try it\n\nChoose **Insert → Picture** and paste this URL:\n\nhttps://256t.us/AAAAAAA8UklGRjQAAABXRUJQVlA4TCcAAAAvH8ADAA_wwP-X_J_tf_7jAWoaSYGGCv9OEUD9OYjo_wQYdtxUfgAA\n\nChoose **Keep linked** or **Include in document**. Bare CIDs and HashBin links such as https://hashbin.org/#AAAAAAA8UklGRjQAAABXRUJQVlA4TCcAAAAvH8ADAA_wwP-X_J_tf_7jAWoaSYGGCv9OEUD9OYjo_wQYdtxUfgAA work too.\n\nThis tiny synthetic WebP fits in a CID, so it needs no upload and never expires. Full-sized chart CIDs download from 256t.us and need a connection. Sheets verifies their bytes before showing them. A CID for a saved Sheets document is not a picture payload.\n",
      "format": "gfm"
    }
  },
  {
    "id": "org-outside-chart",
    "format": "org",
    "kind": "typical",
    "title": "Outside chart beside a Sheets model",
    "description": "Compare a fixed imported chart with a live Org chart.",
    "path": "examples/org/outside-chart.sheets.json",
    "tags": [
      "org",
      "typical"
    ],
    "document": {
      "src": "#+TITLE: Compare outside results with a Sheets model\n\n#+CAPTION: Synthetic chart imported as a picture; it does not recalculate.\n#+ATTR_HTML: :width 640\n[[sheets-asset:AAAAAEcz1D__a3CMuInIm6XZ_d-i9Sz93NQ7U-1vhX9Gpdd61UxqfmmSiQMmp6qaXF8Ahig601EwgvXtkjttKpxuXpCuHw][Quarterly revenue: 80, 110, 95, 145]]\n\n* A live Sheets model\n\n#+PLOT: type:2d with:histograms ind:1 deps:(2)\n| Quarter | Revenue |\n|---------+---------|\n| Q1      |      80 |\n| Q2      |     110 |\n| Q3      |      95 |\n| Q4      |     145 |\n\n* Try it\n\nChange the model values: the native chart changes while the imported picture stays fixed. Choose *Insert → Picture* to add your own exported Excel or Google Sheets chart. Choose a file, paste a screenshot, or enter a hosted image URL. Files travel with the document.\n",
      "type": "org",
      "view": "split",
      "attachments": [
        {
          "id": "AAAAAEcz1D__a3CMuInIm6XZ_d-i9Sz93NQ7U-1vhX9Gpdd61UxqfmmSiQMmp6qaXF8Ahig601EwgvXtkjttKpxuXpCuHw",
          "mime": "image/png",
          "data": "iVBORw0KGgoAAAANSUhEUgAAAtAAAAEsCAYAAADq74RjAAAQAElEQVR4AezdCZxN5f_A8e8Q2SrJkqKI0r9FKvmVSitFhISIsoSQqJBEpMi-ZDf2LWRfkjU7KcpWVPa9bGXJEv73-5hz55w7c8fMnTtzt4-X56zPOc_zvJ9z537vueecm-b02dOXSRhwDHAMcAxwDHAMcAxwDHAMcAwk7hhII_xDAAEEQlKASiOAAAIIIBAYAQLowLhTKgIIIIAAAghEqgDtDnkBAuiQ70IagAACCCCAAAIIIJCaAgTQqalNWcEkQF0QQAABBBBAAAGfBAigfWJjIwQQQAABBAIlQLkIIBBoAQLoQPcA5SOAAAIIIIAAAgiElAABtI_dxWYIIIAAAggggAACkSlAAB2Z_U6rEUAgcgVoOQIIIIBAMgUIoJMJyOYIIIAAAggggAACqSEQPGUQQAdPX1ATBBBAAAEEEEAAgRAQIIAOgU6iiggEkwB1QQABBBBAINIFCKAj_Qig_QgggAACCESGAK1EwG8CBNB-o2RHCCCAAAIIIIAAApEgQAAdCb0cTG2kLggggAACCCCAQIgLEECHeAdSfQQQQACB1BGgFAQQQMASIIC2JBgjgAACCCCAAAIIIJAIgRALoBPRIrIggAACCCCAAAIIIJCCAgTQKYjLrhFAAAG3ABMIIIAAAmEjQAAdNl1JQxBAAAEEEEAAAf8LsMe4AgTQcU1YggACCCCAAAIIIICAV4GgDKBPnznjtcKsQCAyBWg1AggggAACCASLQFAE0PsPHZJuAwZK7WbvSfFyL7tTg5YtpXd0tPx55GiweAV9PWbMmyf9Roww6avp04O-vlQQgeQKfLdypbTt0tWd_j55MtG7XPXjjzJo9BiTBo8ZK-cvXEj0tqmRcfbChTJy4iSTvlm0ODWKpAwE_C_AHhEIQ4GABtDnzp-XIa43rTKv15CxU6bI-k2bxDr7rOM169bLiAkTpWTVqjJxxgz57-LFkOiCf8-eNfXWumv6ZdtvqVbvbxYtkuix40z6ahoBdKrBU1CiBHbu3eN4bRw9fjxR2yWUadv2HTJz_nx3-vfMvwlld6xbtfYHGThqlEkDRo6Us67XriNDgGfGT50mvYYMMemr6dMCXJvY4qfN_dbdj4uWr4hdwRQCCCAQIQIBDaC7u84693e9aSXGutOXfaVP9NDEZA14nlOnTpsz53r2XNP6zZsCXSfKRyAoBH7fsdPx2vjzryNBUS8qkTSBERMmuPtRP7wkbWtyI4AAAqEvELAAeqXrzM-kWbMcgkXuu1eaN3xb-nz2mbxXv74Uvuf_HOtHf_21OUvtWMgMAghEtMAdt90mpZ56yp0yZMwQ0R7h13hahAACCASfQEACaL1GsU2Xrg6NutWrybCePaXmq6_K08Ufk1pVq8iI3r2lWoUKjnx6reOZf_91Lzt77pzovKbz58-7l1sTukzXadK81nL7WK971K-WV6xdK3pN5G87dsiF__6zZ3FP6z50X5rsefbs3y9r1q9350vshF7usfX3P2T-kqWyees20f3Ht-3Fixfd7dSyrTyaf_W6dQleJ6711G2sFN-lMJ55Ll26ZBXhdWztT8daP82o2236dats275dZx1J-10v05m_dKls371brG3smfSyHt2flXR_9vU67ZlHl3mmw3_-Zfpy6eo1cujwn56r3fNqof2vSaetFQcPHxbdVvtG-8habh9bddSxfVsrj26n6zSpr7XcPtY8WsbV-t--TUpMa9_8vHmLTJs71xyL23ft8no9sFppmzRp_T3roxa6zkqe6xMzr16_79wpS1atltkLFpjX1r6DB-Pd9Nknn5BPWzR3p6zXXx9vvn9OnpQff94g6zZulPjqHe9GMQsTezzFZL_qSMvXS7uWrFplXvdJuZRF_XVbvXTij107r3ppm76G9Hj-_qf1smzNGtFtT50-HW8d9e-J1W_aB1YmX_--WdszRgABBMJNIFEBtL8b_f269XLsROy1j3ffWVCa1Kkj16RN6yhK55s3aih5cud2L9c30R83bHDPl65eQx4rW86kRq0-ci-3JnSZtb5S3besxWasbxSd-nwpj7xYWirUqiONP2otDT9sJZXr1ZenKr5ivqK0v4noRlXqNzBl6T77DImWBcuWyav16km5N96U7gMHStW335bytWtrVnfSGyT15sjhX01wL9M30O4DB8mjL5U127RwnXV_vXFj-V-Zl6TeBy3kL48bJxetWOEuV8vevW-ftO7c2eR_u-WH8uvvv4u3f1qubmOlkRMmxsnaoUdPx_41eImTybZA62ftT8ffuQIBvRnrucpVpcY778icRQvduTX4aOhyLVGhorlRtEWHz-SVOnXloVIvSMfefRwfVlp17Oiox3crV7n3Y01UrlffkUevl7fWaRD4Uo2aUqpaNdOX77ZpIy9Ury7PVKosX8-aLZ7_ajdrZvpfj4GPOnWSuYsXm_58sfrrottqfz5XuUqcbfUDl7bbSsPHf-XYtQY52rfW-i79-jnWJ7X_HRv7cebYiROmndo3bzZtKu279xA9Fl9xvVbUZJLHt0RadPsePdz-2kbP18gwl4XVbh3rB5jDfx0xNwdr3-s-rFT3gw_Mcg1qrWX6waVCrdry6lv1pGnbtvJx5y7SoEVL0X596_0PZMu2bVZWMx46bry7PlqeHm9mRcxAg1M9_p50HX9aXp333jevuz7DhsXk8D5K6vHkfU9X1hw5esx4q1u1Ro1c7ftE9HX_7KuV5b127UQ_vF_JGf9QP-Brv-i277dvL5Xq1hPtO_0Q7bnF5cuXRfvvwZKlRI_n-s1bSpOP24hu-_jL5eXDzzvG-eBd5Sp_3_SyO_1bpn9_rPL0Q4Aue6f1x9YixggggEDYCwQkgN6xZ48DtuEbb0hUVJRjmTWjQXTt16pas2a8Y3fs9ufOnzPLvA0u2s6kXvgv9g57PSvzxrvvysSZM-PdVIOyEa5As3WnL-JdrwvXb94szT_tIHpdp85rOn7ihPtGSJ23ku7v7LmzZlbP_lRt8LaMmTzZzHsO1v78k7z-TmPRIM297rJ7yky06dJF5iyIDVLNQi-DZx4v7lizeOVKx7xaaIBuLdQPLHfdcYc1G-_YozoyatIkcyPWMdsHI93w199-l4p165qzwRLPP32D1yDpVMyjC_WreHu21et-tM_K3gMHxP7mrfkzZ8pk8ujZUw0C98VzplLr9bnrG43-I0eKBhZmA9fg4sXYM-0btmyRVh07OfrTlcX0p26rZ-90Pr7k6eGZ59Kl2Bw-9b_nDv0wr98CaACmAau33ekHHP1gYTeLim1KvJvZ82qGy3LZdZb0P-Oo8_akrwtN-oFDl6uxfnCJrw91_Q-uD8_1mrdwvjZ0hS3Zyz9w6LArEK8f7_GnH3rGTJli29I56cvx5NyDc06D45dr1TLfbEg8_xavWCm1mjYTfSpRPKtl-67d5kOh5zr10w_Rq13fRNnX6Qd07T_7Mvv0t9995_pA20z02wf7cms6vr9vp86c9tqPJ0-fsjZljAACCIS9QJpAtHC76-the7l3Fyhon40zfe9dhRzL_ti90zHvy8zmrVvjBEqPF3tEHrr_fsfu9HIDDb4cC2NmPM-E6eIniv1PihctqpPudHuePPJ08eKSL-9tZtmwr75yBIG6sLDH9d56xq5pm090Vbxp4y-_xrs8voUaDBe4_Xb3Kq23ngmzFvy2fYfjTbFcqVJeP9BY23iO46vPJdeHl059v3TsW7fzbKteD9835mxgiUcf1SzutGj5SkfA6xkkvPT8cyavtkfPnpqZmEG2rDeKvd3i-qdPfVmwdJlrKu5_NdelGpDr9fg6bU_6gco-7-u0P_rfXrYGnxoM9Rk6VPQrffu6hKa79u_v-CZI2_3k__4n9xZyvt708Wn6TUtC-7rauowZrjWvgbtd3zbZ8-rrTV8b2bJmNf3crlsP92qtz2sVyot-gM7m6ktrxWnXh62J0-P_4GvlscZDxo5xtFGX6351nFDyx_Hkuf9u_QfGeS3kypHdkU3b1rX_AMcya0bX6bR-wH304Yd00pFGT_raPX_23DnzZCP3AteE2mv_2tuvH1TWbdjoWhv3v_6d8Fx6d8E7TT_al-v-tA-1L-3LmUYAgeQKsH0wCwQkgPa8PjZ79psSNMrhsd5-xjfBDRNYOd8jiJrvCmoHfPGFjOjdS95-o6Zjy992JByw63XbX7RuLa3eaSKfvP-edGjRwrF9lZfLSZ_POkiZ5541X5nqJRVWBn0znON6kx_Tt68snz5N9A3OWqdnWvV6Ymvec6yBjt502bvDp66g5y7P1Y75l194wTG_2nZmd7XHmauSJZ505E3sjAY5jVxn2Hq0bycvu4Lw71auEntgrWeLl7vaqG39ZtxY0fzWvmfNX2Cu_9Y343IvlLQWm-DHfjnJstVr3Os0r_VhZcTEie7lOtGsXj2ZP_ErmTp8mAzs0lkXuVNCTw3Qeq-YMV1G9ekjU4ZFu7fRCc_jVpclNf155Kj4q_-tsvURj_p1vO5Xzyh7O6No5dex9rk-JlKnNWlwNXPUSOnXqaOMH9Bfun3SVhe7kz4B57-Lvj9GUvtaXwN1q1Vz71MnWjZqZF4bhQoUkAOHD5v-1uWaypUqKR81aSLalwsnTRD9IKrLNS3__nsdJZj2Hjwg-rg1e6ZBXbvIqlkzZfaY0fL8k96Pc38dT1bZen_EWtc3S9a8vu4XT_5a5k-YIMN79RQ9lq11ekmE52Ux1rqKpV8U7afBXbvK5KHO43PDL79Y2WSNx2taX5MTBw0y_dvz0_bufDqxbfsfOvKa7H_fXnN9oNF-tPfFI0WKmD5s-pbzEjmvO2QFAgggEAYCAQmgT5467aBL4-XyDStThmuvtSb9NtbLGrq1bSuahnTvKrly5hC9OU3PutgvZ9ACz52Le3OiLtfUs3170SBWg-OiDxTWRQkmzzOEr1Ws4L7G-_rrrpOalSs5tp_n-prVsSBmRoPnYT17iL65PfP445I9W7aYNfGPSj5VwrFi2ZrYAGTl2rXudXfekV8K5Mvnnk_shAYAo_v1kQY1a5jApGC-_LLlt22OzWtXrSraRl146803S9WXy-mkSXp2bdUPP5rpMs9eOatsZlyD72NuztTrhu2BU9nnn5f06dO7coj8tHmzGetA61LN5Zrummt01nwjYD-jrPs4cuyYWec5aNGooaRJc-VloW2wny3XOnoLbDz3423eX_1v37_e_Gqf_2lTrIV9uX3aM8B6v0F9xzGkH3b0rKK1jZ6p1BvJrPmUGJ-_4HydTZg-w1ynO2veAtHyR7u-zVjg-qCkSaevVoctW53HX9WXX5bHHn7YbJb3llvkkw_edwSuZkXMwF_HU8zuZOOW2OBWl7Vs3FhuuvFGnZSHCxc2rxt9TVvpyNGjZp3noHK5cpI25l6RO_Pnd3yo0OPTyn973jzmb5v-fdMPQ88ULy56065eFuZ56de_MZeWWdvax0n9-2bflmkEEEAgnAWuwMzW-AAAEABJREFURAqp3MKC-fI5SvzraPzBjJXpr2PON5OCtzu3t_IlZaxvWo8VfVj-OXVSJs2YJaVee02KlS4j1Rs1jnNpR0L7ffLR_yW0Os66vfv3O5ZZN-XoTTia3vukvWP9rn37HPPWzLOuoDljhgzW7FXHGrDag8j5S5eKPqHk5KlToteVWjsoVzL27K-1LDFjvcwmb-5bHFn37j_gmH-reXNzw5i2U9PA0aMd6_e5zhjqgmIPPug4O20FiPagRvOVee45HZm0a-9eM9aBBhJ6U5aWYSW9GUzXWenQn39Zk-6xfp1uBfjWwjy5c1uTfhn7q__tlXnh6afds_rh4ZEiD7jnvU1s37XbserhwnG3Kf5IUUeePfucx65jpR9m8riOn2y2SzV0l3ppShvXWeOX36wlFWvXlXFTp4jey2AFn5rHWzpw6LBj1UOF73fM3-D6wKqXbTkWxsz443iK2ZUZ6bX7ZiJmUDC_82_Ym1WqmDP_evZfU-5cuWJyxo60bwsVdF7upkF0bI7Yqfx5b5Nnn3zC9QEznSx3fVjWG2_1pt0KtepIQt_AxO7hylRS_75d2YphkAhQDQQQSEGBgATQBfLd7miSZ1ChK_UpD2-9_4F5HJrnJRt5b71VsyQr6RnI1xu_I5_16i0Lly8X6_rXpOxUr69Nny5dUjaRg3_-GSe_Bnz2ZM-gy-3z1vQdtmuarWVXG5d93hkc601C9qcf6PYlSzyloySnQgXuiLPNngPOgEvbYk-eG5z598pNlnrjaNmSz7tX66UGepOh_mqctVCD3cIx143rmWndr7VOxzpvT7rMns6cPWOfNdO5cuQwY_sgTZR_XyL-6n97HSuWLm0uPdLLHWaOHOn1rKp9m2MnTrhnNTBTc_eCmIkbb7ghZurK6PCRuB86rqzxz1C_MdCzpZ5BtLV3vRdh5MRJor9cumxN7KU81nrPsT66zb6sUMEC9lkzrR8szYRt4K_jybZLOepxc218x5o9f3zT-nfTs5-sb0s88-vlNnrzZ9O2n4gGzHrDqGeeq8378vftavtkPQIIIBAuAv6NDhKpcodHAP3tku8cW-qbe4OWLc2Z0drN3pMhY8c61t_mJYC-cDHus5v_PHLEsa0183HnzqLXGFvzek1fvRqvS9-On8e5_tPK4znOljWr5yLnfDxzN3lcaqHXFOo1196SPZC07-76LFnss4mafvaJxx35Vq79QfRaWGuhnqG-5ea4Z76s9QmNr3OdzfNcnyu78wYpb220lj9w7z3uXZR-5hn3tE6s37hR9FF5Oq3pFde3BVbwcG3MZRy6XJO-8Vv79Da-OUdOzeq3dPlS7NM8dKfHjh3XUZzkr_637zgqKsrc_KrHUvabstlXeZ22H7v6QUMDLs_Mx__-27EoV_a4HzA0g94sqmMrHfH4xshanpixXgY1c9QIae_6tsLb2WHdjz4tRT9U6bS3lDnzlaezWOt37Yn9lsJatmXrb9ake5wSx1O6a5wftE-ccNq6C_fTxGjXB435S5a695bNdWa_Srly0vnj1jJ95HD38oQmsmXNmtBq1iGAAAIRLRCQALrw3c5fGNTn8-rzTa2e2H_wkFhnTPTN3X4GWs-W2d9Ys9jeJPfsc14yoNvui-eRZnqts57VtMrTr-mnDBsq79SuLfoUiNNnYn-oxcrjr3H-vHkduyrxv0el4ZtvOlLd6tXFShVefNGRPzkz-rW3_SbFxStWyHe2R9p5nqFOTlm6redZ8hqVKjna2aBmTXc7tb2PPvSQbmbSPYXuclzfqU8YsPdlqWdiL1vQQFpvgjMbugYZMmRwlKO-9WrUcJTl7UOYa_NE_c-Q3nldvuejx3bs3RPvfgLZ__YK6dlM-_y6jbHPVreWW9ekW_O35bnyzc-1HvckHP7LeWZ62_bt1iZJGut2-rQPveFOX9c927eXNXNmy7AePcwPK-lr39rh6TNn5I-r3Nx7ex7na83zaRP6HPi1thv7rH2nxPHkebzt3r_PKs6Mew4ZbJ5V_kylymasz842K3wcrF633rHlqC97y8fNmkrpZ591LE9ohnUIIIAAAt4FAhJAa7CjwZS9Ws0_7SDTv_3W3Mh3___dHefJCVbehrXeFL120ZrPnu0ma9Lcwa-_dKcL9IxatwEDdDJOOnD4kGNZ8aJFJV3MDWe63cx58xzrL1--7JhP6swp202Tt-fJ49i8V_QQx6OtJs6YIY-8WNqdoseNd-RP7kwZ23XDGpDaL13xPEOd3LIK3Oa8zrPXkGjzqDLdrzrrtwD2tv64wRnElbc9OcR-nfa9hQrJHbfdprtxp7vy3-Ge3rJtm8xeuNA9r0-lKP9mLbeplqlf07sz-DDhecZ9hetsvj76THel5fUcPFgn46RA979VoWJFHrQmzbjn4CGilzWZGddAA1l9GoRr0vzPlSO76I13OnPDDdfryJ3m2850zpg3T-xPXnFn8jLxz-mT7jX6jYj-HbCSPnFFr_MvWuQBea9-fala_mV3Xp1Ikyb-Z8frOk2FPJ5lPmfRYve3TvqaHjnR-eQW3cZK_j6e7rojv7VrM_5y2DDR14DO_HnkqEyeNcf8_Tp24rjrb-A5yeny1nW-pt3797o31RME9gBen3jjXumauOz88sS1JGn_T_yTsmfTk1YbciOAAAKSKgQBCaC1ZY1r1xL9w67TmvSMUrtu3c2NfM-4zsLoL4fpcs904_XON--H7rvPkUUv-Xi1Xj3z61yej7CyMnp-fa8_5qHP-NVf0tNfyLOCcCu_51fU1nJv43TpnV_XTpw5S9p26Sp63aYGIRVLx55V1rPrJau-JvoLbXqjVKcv-zp26-sj5Rw7sc2UeOxR21zspJ7V1zPUsUuSP1Xy6RKOs8hT5syRZ1-tYp6sUKJCRdHnC1ulaID2wD2xl3Do8lLPxH89tj5qTtfbU53qr9ln5eMvOoseB--1a2eOBf2wYGV4qeTzooGZNe_LOEumTI5nTGvg81yVKqZMbZv2a3z7DXT_W3XS_rYH0Vt__0P0-Hu3TRtzI60GsVZeHb_foIH7Q-b9he7WRe7Ud_hws62-bj_p2s29PL6J9OnSOxZ36dtf9HWvl1PpB2f7yhaffSZf9O1rfnCoc99-MnHGTPtqKZjfGZQ6Vrpm7nF9i_GU7XjXPtI26o_tvFCtmgwe47w0zLWJ-7-_j6dSTz8teoxbBfy8eYs5Lt96_wMpWbWq40O03lCoZ8GtvL6M7Tch6rGvfl9Nny5anv5SpH2fnpcf2dd5m05v-xunbfnw847mx5S85Wc5AgggEG4CAQugM2XMKF3btnG8qVi4-kZnTXuOP-7cRaZ-8417caVyL8W5aUqDFw3INZP9a1-d16TBkz6mS6et1Ds62vyS3u59--Lsb4_HkzOsbbyNs7qCfD3Lbq3X9uiNPJu3bjWLPnj7bUe7ta76VAwt22SIGegzpQvkyxcz55-RBn5lnov7NW6ZFPhqN4Prq_7OrVs7Kq4W-mQFbbO1QvuoR7v2kt7jWua8uW8RvS7bymeNn4_nOdX61IHW7zaxspixHgeLV6w009ZAH9Onzx625pMzfvuNN-JsrmXGWeixIJD9b6_Kh00aOZ52on2iv0q4xXUG356v1NNPif318ljRh0W_BbDn0WNX-1aXaX-KTsSTPPtTL9XSb54OHD4sjxQpImWfj715VDefMH2G6C_qafCn9dNlmpo3aij6N0SnE0rvNagf5_WsAZ_1zYs9qLXvx9_H07WuY7v52w3tRZig2f7Niq4s7vo2rOarlXQyWamM7Zsm3ZH6aRDtWZ6u83a5ka7zlp4oVsyxSl_Ti22XgzlWMoMAAgiEoUCaQLZJ34RnjBxpnoHqrR76Zqw399nf6PRN3sqvb3TR3bs5znTqumxZb5Qe7duZHy_ReU3pbDfytG76ruNHS3S9Jn327dShQ3XSnXoNGSLnL1xwz1sTUQk8oUF__MFeZ2sbHV-XJYtMdX2Fq7-wpvOeKU_u3KI_NlLppZfcq6I8vq72nLcy2p8a4XnHvpXnxWfiBtBPPfaYtTpR4zRRzq_PPeetnehZwNljRou6WsvsYw0Ypo8YIff_n_OsppXH82yzXsOd3eNGTCtv1fLlZWiP7o4zw9Y6Heszs8f17y_6AUfnNaVNG_sSSJMmdlrXabocpcPYFBUVu0ADy_bNmzuCUM2px_WkIYNF-1HnNaVJE7udL_2v-_B3Kpgvv0wZFu21b7S8Ns2amecJ2230A2j_LzqJ_Qy25tXUpE4d-fCdxjrpTvZjUu0_eLuBe53nRJv3mpl7EfR177lO5_V13daVp8Yrr-isSVFRsba6ICpNbD_q3wftC_sHWs2jqU71avLW66_rpDvZ2-nL8eTeUTwTpVwfRPQHerQN8ayW6hUrSt9OHR0fDK52fIqz6e7dVi5b1lw37l4QM6EfIPUHVey_ZKiXzvzsOiMek8U9ioqKdXQvjJmoVPYl8fwwFLOKEQIhL0ADEEiMgPe_kInZ2g959M24Ua1a8sPcb1xB5VDp2b69-fUxHesf-kVfTzJvqPrGowGJ_uHv0uZjR8kasOivcy2bPs38gpxOz5_4lflBDw0ANixaKJrmjB3j3k4f0dXP9WY1ddiVMgd36yqrZ88S_ZWtm3PlNPl1GyulT5fObKv7tpZF9_D-dbX-YIP-ytiSqVPMXe8aRGoAZ3biGmTJnFk0yF45c4aM7ddPOrb60Fz3PW_8ePMraYVjHtHmymr-lyxRwlGnhwsXNss9B_qre1b99Ff4PNfr_EP3Oy970UsaNKjTdYlN-rQHqxwd64ccb9vqZQvqumjSJBPgaltH9O4lS6dNNW3O6fFLk_b96IcI3b-VtM_s6z2n9Sym_kLb7LGjzRNV9BciJwwcKHozmv7gjZ4JtG-jH1SsfesxZl-n051atXK4e34o0ctxvpvytWi_6fb6i5Zj-_WVQgUKiB5v1r71ONT9WSmp_W9t5-9xtqxZzTG_3PXaGdP3S-nQsoV5DU4fOVzWzZ8nlcuVjbdIff3o8f_9N3PM84s1SNXXz1uvVxe9dt1qt471R4rsO3mjcmVZ79q3_iDKtBHDjdND999vsujfAz2W5k-cINpv-iubn7ZobvpSy5j31Th51RUcRkXFRo4NatZw9JHnB1f9u6F_S7Q_9EO1_vKf1rVp3bpSpVw5x7baL6YiMYNHXGfFk3I8xWzmdaRB54JJE2TW6FHy5eefG299_evxqR88PI-vMX37uuunx5fnjvWHUtTYStZ6_SCg143r3yD9sKOO-suHk13ftOmHCf0lQ2sbHWu9dNvE_n3L6_p2SOujv-qo22jq0a6d7oKEAAIIRIRAwANoS1m_vi-QL5889-QT8lqF8masf-j1DVXz6DV94wb0l94dOoheGqDLPJPeXKhvBHqjVrqYmwI983jOW2U--tBDjjM_nvl8nddAQ8-CaRAZX5Cqb9h69rVsyZKiZ2M1eI-KivK1uERtZ3okgeQAABAASURBVL_BTjeo8OILOkrxpEG3BiTaVg2Y9Gxk_IUmb6kGD_oGr09UKfPcs_J_d92Z7Guer1Yj7Tc99jRY1PKvlt9aH4j-t8q2j_UHZArfc48JfvU1qMesZzBnz29N62tRP8DqB4bEXFJhbZc2bVrRD056M2ge1zcunh9s9FIj7bdnHn9c9Ek02pdahv6dsPaR1LGW8_yTT5pf_ktKXbU_87oCRq2DP44ndb3t1lvlqcceNd76-rf-ziW1TVfLrx8m9HILdfT3PQ5atn5ToH9vNXn7ZkjzkRBAAIFwEwiaADoxsBpwpdQbTWLKD_U8erPWSzVqil4LabUljyt4KRrPr9BZ6xkjgAACCCRBgKwIIBARAiEVQEdEj6RgI3_fuVP2eTwX-506tUXPsKVgsewaAQQQQAABBBAIK4FwDKDDqoNSsjF6rekLTz-dkkWwbwQQQAABBBBAIOwECKDDrku9N0ivH9ebffRmvp8WzDc3Z3L22bsXaxBIfQFKRAABBBAIBQEC6FDoJT_VUW_aMjf73JSNyzb8ZMpuEEAAAQQQQEBEIgyBADrCOpzmIoAAAggggAACCCRPgAA6eX5sjUAwCVAXBBBAAAEEEEgFAQLoVECmCAQQQAABBBBISIB1CISWAAF0aPUXtUUAAQQQQAABBBAIsAABdIA7IJiKpy4IIIAAAggggAACVxcggL66ETkQQAABBIJbgNohgAACqSpAAJ2q3BSGAAIIIIAAAgggEOoC_gugQ12C-iOAAAIIIIAAAgggkAgBAuhEIJEFAQTCW4DWIYAAAgggkBQBAuikaJEXAQQQQAABBBAIHgFqEiABAugAwVMsAggggAACCCCAQGgKEECHZr9R62ASoC4IIIAAAgggEFECBNAR1d00FgEEEEAAgVgBphBAwDcBAmjf3NgKAQQQQAABBBBAIEIFCKAD3vFUAAEEEEAAAQQQQCCUBAigQ6m3qCsCCCAQTALUBQEEEIhQAQLoCO14mo0AAggggAACCESqQHLbTQCdXEG2RwABBBBAAAEEEIgoAQLoiOpuGotAMAlQFwQQQAABBEJTgAA6NPuNWiOAAAIIIIBAoAQoN-IFCKAj_hAAAAEEEEAAAQQQQCApAgTQSdEibzAJUBcEEEAAAQQQQCAgAgTQAWGnUAQQQACByBWg5QggEOoCBNCh3oPUHwEEEEAAAQQQQCBVBSI2gE5VZQpDAAEEEEAAAQQQCBsBAuiw6UoaggACESJAMxFAAAEEAixAAB3gDqB4BBBAAAEEEEAgMgTCp5UE0OHTl7QEAQQQQAABBBBAIBUECKBTAZkiEAgmAeqCAAIIIIAAAskTIIBOnh9bI4AAAggggEDqCFAKAkEjQAAdNF1BRRBAAAEEEEAAAQRCQYAAOhR6KZjqSF0QQAABBBBAAIEIFyCAjvADgOYjgAACkSJAOxFAAAF_CRBA-0uS_SCAAAIIIIAAAghEhEAqB9ARYUojEUAAAQQQQAABBMJYgAA6jDuXpiGAgB8F2BUCCCCAAAIxAgTQMRCMEEAAAQQQQAABFZgyZ46MmDBRJ72my5cvS5d-_aXbgIGOPCvWrpXBY8bGSb_-9rsjX2rOUJb_BQig_W_KHhFAAAEEEEAgRAWOnTghPQYNljXr1yXYgmlz58r4adPkp82bHfk0-B4wcqR4pl__IIB2QIX4DAF0iHcg1Q8VAeqJAAIIIBDMAus3bTJnlCvVrSenz5xJsKp79u-XT3v0jDfP7r375JUyZeS7KZMd6aXnn483PwtDU4AAOjT7jVojgAACCCCQOgIRUsqGLb_IohXLJV26tAm2-L-LF-Xjzp3lzjvym2TPfOnSJdm-e7fcVeAOyZY1qyNdmz69PSvTIS5AAB3iHUj1EUAAAQQQQCD5ArVfqyrzJ0wwKXOmTF53OOKrCbLxl1_li9atJWOGDI58R44dN_Pnzp2Xr6ZPl34jRsg3ixbL-fPnzXIG4SNAAB0afUktEUAAAQQQQCDAAlu2bTNB8fsN6sud-fPHqc2BQ4fMsl5Dhkjnvv0keuw4-ahTJ3m1Xn3568hRs45BeAgQQIdHP9IKBBBAIEgFqBYC4SHw79mzrmD4C3no_vulRqVK8TbqyPFjZnmjWrVk9exZ5mx2TVfe3fv2SdeBA8w6BuEhQAAdHv1IKxBAAAEEEEAgBQWix40TDYQrlysnv_7-h2zeuk1Onz4jp06fNtNHjh2T5598UjYsWigNataQTBkzSq4c2aVxndqil4TMX7JU9BrpFKwiu_a3QAL7S5PAOlYhgAACCCCAAAIIuAT2H7xyeYZekvF648aiSW8Y1KBapxcuWy7_nDwpf7uSK7v7v14nfc-dd5r5i5cumTGD0BcggA79PqQFCISzAG1DAAEEgkLg3bfqysRBgxzp7jsLyu158phlpZ4uIW26dJESFSrKmX__FeufBtQ_bNhgntiR7pprrMWMQ1yAADrEO5DqI4AAAggggEDKC9x6882iAbM9ZcqQUbJkzmyWZ8t6ozz35JOmIs07dJAfN2yUnzZtFj1jrQtrVamiI1KYCBBAh0lH0gwEEEAAAQQQ8J9Amqirh0hp0zjzlH_hBWlat67oj6nUff99qdWsmaxc-4N88HYDKfPcc_6rHHsKuICz5wNeHSqAgH8F2BsCCCCAAAJJFVg1a6YM7NL5qpsN7dlDxg_o78hXp3o1mTN2jEwZFi2Th0bL2rnfyBuVK0saj2DbsREzISdAAB1yXUaFEUAAAQQiQIAmhrhAwXz5zbOi-QXCEO9IL9UngPYCw2IEEEAAAQQQQAABBOITIICOT8VaxhgBBBBAAAEEEEAAAQ8BAmgPEGYRQACBcBCgDQgggAACKSdAAJ1ytuwZAQQQQAABBBBAIGkCIZGbADokuolKIoAAAggggAACCASLAAF0sPQE9UAgmASoCwIIIIAAAgh4FSCA9krDCgQQQAABBBAINQHqi0BqCBBAp4YyZSCAAAIIIIAAAgiEjQABdNh0ZTA1hLoggAACCCDgu8ADnVsKKTAGvvdaZG1JAB1Z_U1rEUAAAQQSEmAdAgggkAgBAuhEIJEFAQQQQAABBBBAAAFLIBgDaKtujBFAAAEEEEAAAQQQCDoBAuig6xIqhAACoStAzRFAAAEEIkGAADoSepk2IoAAAggggAACCQmwLkkCBNBJ4iIzAggggAACCCCAQKQLEEBH-hFA-4NJgLoggAACCCCAQAgIEECHQCdRRQQQQAABBIJbgNohEFkCBNCR1d-0FgEEEEAAAQQQQCCZAgTQyQQMps2pCwIIIIAAAggggEDKCxBAp7wxJSCAAAIIJCzAWgQQQCCkBAigQ6q7qCwCCCCAAAIIIIBAoAViA-hA14TyEUAgVQSmzJkjIyZM9FpWtwEDZcmq1XHWnz9_XlasXSud-nwpvaOjZdWPP8bJwwIEEEAAAQQiQYAAOhJ6mTYiECNw7MQJ6TFosKxZvy5miXO0buNGGTtliuzYtcu5wjXXoXcvafxRa5m9cKEJwBt-2Mrkda0K-H8qgAACCCCAQGoKEECnpjZlIRAggfWbNkmXfv2lUt16cvrMmTi1mL1ggbTu3FnqvPd-nHW6QM82z5q3QKq-_LIsnz5Nfpj7jRQr8qDo2eqde_doFhICCCCAQNIF2CJEBQigQ7TjqDYCSRHYsOUXWbRiuaRLlzbezRYsWy4__vyzZMt6Y7zrZ82fb5Y3qVtH0qZNK-nTp5fa1aqK_vtuxSodkRBAAAEEEIgYAQLoiOlqGupVIAJW1H6tqsyfMMGkzJkyxWlxn886mHXDevWIs04X7NizR4rcd69clyWLzpqU95ZbzPj3nTvMmAECCCCAAAKRIkAAHSk9TTsR8FHg8uXLsvX3PyRn9uyOPdycM6eZP3L0uBkzQACB1BegRAQQCIwAAXRg3CkVgZAR-OfUKVPXTBkymrE1SHfNNaJns8__d95axBgBBBBAAIGIECCATnY3swMEwlsgS8wlHwcOHY7TUL0hMVvWrHGWswABBBBAAIFwFiCADufepW0I-EFAbxrMlvVG2b1_r2NvR44dM_O35rrZjBmEoABVRgABBBDwSYAA2ic2NkIgsgSeeby4HP7riGzftcvd8CWrrjx949GiD7uXMYEAAggggEBqCAS6DALoQPcA5SMQAgIVS5c2tdRnRS9bs0b0mdCf9eot9xYqJMWKFDHrGCCAAAIIIBApAgTQkdLTtBMBm0CaqPhf-lFRMZncE1fm7_-_u6Xzx63N0ziafNxG2nTtIgVuv116ffqpeSb0lVwMEUAAAQQQiAyB-N9FI6PttBKBiBRYNWumDOzSOd625897m2xYtFDqVHstzvrSzz4rP3w7V8b26ydzx42TqcOHSa4czkfbxdmIBQgggEAwClAnBJIpQACdTEA2RyCSBNKnSyd6NvqWm3NFUrNpKwIIIIAAAg4BAmgHBzOpKEBRCCCAAAIIIIBASAoQQIdkt1FpBBBAIPQFlq5eI5379hO9OXXGvHly7ITzVy31qS-Dx4wVz7Ro-YoAN57iEUAg0gUIoCP9CKD9CCCAQAAEBo0eI--2aSNfTZ8uS1aukk-6dpO33m8u_549667NDz9vkAEjR8ZJC5cvc-dhAgEEEAiEQMgG0IHAokwEEEAAgeQL7Dt4UAaOGiV331lQpg4bKsumT5PPP2wp23fvln7DR7gL2HfggOTJnVu-mzLZkdo0a-bOwwQCCCAQCAEC6ECoUyYCCESyQMS3_adNm4zBa-XLS4F8-eSatGmlbMmS5qkuy7__3qzTwa59--SuAndItqxZHSlzpky6moQAAggETIAAOmD0FIwAAghEpsDR4ydMwwvmy2_GOoiKipIH77tfdruC5nPnz-si2blnj2TJlFmmzf1W-gwbJpNnz5YjR4-ZdQwQQCAQApRpCRBAWxKMEUAAAQRSReDW3DebctZt3GjGOtCgefPWrTopeunGfxcvil7qMXP-fGnfvbsMH_-V6K9fvlyrlvy4IXY7swEDBBBAIJUFCKBTGZziEEiuANsjEOoCjz_yiGTLeqP0GjJEPu_dWybOmCG1m71nAmZtm551PnrsuE7K08WLy6KvJ4n-ANCnLZrL6TNnpEWHz0QDbpOBAQIIIBAAAQLoAKBTZGQLPNC5pZACYxDZR17wtD5TxowypHtXcxPh17NmS6cv-8r5C-el1NNPmUrmzJHdXA-tv4rZ57MOkj1bNtHrniu8-KI8XuwR87i7nbv3mLwMQkqAyiIQNgIE0GHTlTQEAQQQCB2BO_Pnl4mDBsny6dNk6bSpMjk6Ws6dOydF7rtXoqKizOPs9LnQly5dcjSqyD33mnn74-7MAgYIIIBAKgoQQKcidlAURSUQQACBAAusXPuDFC_3skycOVOuv-46yXr99XL4z79Ef1jl_kJ3m9pNnjNHnqlUWdZv2mzmrcGS1avN5O15bzVjBggggEAgBAigA6FOmQgggEAECxQ3RAqxAAAQAElEQVTMl89cy9wneqhs275dftuxQ1p2_NxcF12nejUjo9dJ60TrLzrJklWr5Zdtv4leM71l2zapWPpFk1fXkxBAAIFACBBAB0KdMhFAAIEIFsiVM4f54RS9IbBK_QZSuV5983i6Tq1buQLjrEbmjttuE73-OVeOHNK0bVup1qiRjJw4Scq9UFKau6ZNJgYIIIBAgASSGEAHqJYUiwACCCAQVgLlSpUy1z-P6fulTB4aLXPGjpHHHn7Y0UZ9AseYvn1lwcSJMn5Af1kxY7p83vJDycIPqTicmEEAgdQXIIBOfXNKRACBQAhQZtAJ6PXPhe-5R_SGwoQqlzP7TXJvoUJyXZYsCWVjHQIIIJBqAgTQqUZNQQgggAACCCCAQNIF2CL4BAigU6hP9C7zTn2-lKZtP5HuAwfJH7t2xilp78EDMmbKFGnbpau5G_3PI0fj5GEBAggggAACCCCAQHAJEECnQH-MmTxZGn30kQmKN_7yq-h8pbr1HD8_u333bilb4w3pPmCgfP_TetFgu3azZnL0-JVf30qBarHLZAmwMQIIIIAAAgggcEWAAPqKg9-G5y9cED3jnCd3bpk3frwsnjxJ-nb83Ox_8OgxZnzx4kXp0LOn-WWtqcOHyfwJE2Rgl87mZ2x7DB5s8jBAAAEEEEDALwLsBAEE_C5AAO1n0r-OXrkM44n_FZObc-U0v6hV4tFHJVvWG-Xwkb9Mabv27ZOfN2-R1yqUlwK3326WFS9aVArf838yZ8FCOXvunFnGAAEEEEAAAQQQQCD4BAig_dwnt-TKJbfnySOz5i-QvQcOyH-us81zFy-WYyeOy9OPP2ZK23_woBkXe_BBM7YG-fLkNZMHDh82YwYIIIAAAggggAACwSdAAO3nPomKipKP3m1ifmWrbM03pESFitKqYyfRSzpqvPKqKW3P_v1mnD3bjWZsDfLlvRJAn_j7b2sRYwQQQCDAAhSPAAIIIOApQADtKZLMeT3j_N2KlWYvmTNlkofuv99M73OddV60YrmZti7zuPbaa828Nch245Vf4NLrqK1ljBFAAAEEEEAAAQR8EEjBTQig_Yyr1zZPnDlTSj39lCybPk36deooK2fOMNdADxkzTvQGwhuyXGdK_cvjsXX_nDxplme97nozZoAAAgikhsADnVsKKTAGqdG_lIEAAv4XIID2s-n6jRvNHiuWLi3XpE1rprNkziwVy7xoroPesu03uemmbGb5gUOHzNgaHPrzyk2GObLfZC1ijECoC1B_BBBAAAEEwk6AANrPXXrDDVfOHu_Yvdux55179pj5rK71jzxQxEyv_OEHM9aBXvrx7XdL5O47C8pNN96oi0gIIIAAAgggEDABCkbAuwABtHcbn9Y89vDDZrsBI0fJoNFj5MefN8iAkSNl8YqVUuS-e83NhLfcnEueeuxR-WbRYneeFh06mDPUDd94w2zPAAEEEEAAAQQQQCA4BQig_dwvt916q_T_opNkyZxJBo4aJXU_-EAGjxlrgueOrVpJmjRXyDu1bm1uMLTyaIDdtG5debp4cT_XKLR3R-0RQAABBBBAAIFgE7gSzQVbrUK8Pk8UKyazR4-WSUMGS3SPbjJr9CgZ0auXOftsNS1Lpkwyoncv8yuEY_p-KT_M_UbqVK9mrWaMAAIIIBDaAtQeAQTCWIAAOoU6N3369FKoQAEpVuRB0bPS1plnz-Jy5cguhe-5RzS_5zrmEUAAAQQQQAABBIJPILwD6ODzpkYIIIAAAggggAACIS5AAB3iHUj1EUAgPAVoFQIIIIBA8AoQQAdv31AzBBBAAAEEEEAg1AQior4E0BHRzTQSAQQQQAABBBBAwF8CBND-kmQ_CASTAHVBAAEEEEAAgRQTIIBOMVp2jAACCCCAAAJJFSA_AqEgQAAdCr1EHRFAAAEEEEAAAQSCRoAAOmi6IpgqQl0QQAABBBBAAAEEvAmEfQD9QOeWQgqMgbeDjuUIIIBAigmwYwQQQCAVBMI-gE4FQ4pAAAEEEEAAAQQQiCCBlAigI4iPpiKAAAIIIIAAAghEmgABdKT1OO1FAIEEBFiFAAIIIIDA1QUIoK9uRA4EEEAAAQQQQCC4BahdqgoQQKcqN4UhgAACCCCAAAIIhLoAAXSo9yD1DyYB6oIAAggggAACESBAAB0BnUwTEUAAAQQQSFiAtQggkBQBAuikaJEXAQQQQAABBBBAIOIFCKCD6BCgKggggAACCCCAAALBL0AAHfx9RA0RQACBYBegfggggEBECRBAR1R301gEEEAAAQQQQACBWAHfpgigfXNjKwQQQAABBBBAAIEIFSCAjtCOp9kIBJMAdUEAAQQQQCCUBAigQ6m3qCsCCCCAAAIIBJMAdYlQAQLoCO14mo0AAggggAACCCDgmwABtG9ubBVMAtQFAQQQQAABBBBIRQEC6FTEpigEEEAAAQTsAkwjgEBoChBAh2a_UWsEEEAAAQQQQACBAAkQQEuA5CkWAQQQQAABBBBAICQFCKBDstuoNAIIICAiICCAAAIIBESAADog7BSKAAIIIIAAAghErkCot5wAOtR7kPojgAACCCCAAAIIpKoAAXSqclMYAsEkQF0QQAABBBBAwBcBAmhf1NgGAQQQQAABBAInQMkIBFiAADrAHUDxCCCAAAIIIIAAAqElQAAdWv0VTLWlLggggAACCCCAQEQKEEBHZLfTaAQQQCCSBWg7AgggkDwBAujk-bE1AggggAACCCCAQIQJBCyAjjBnmosAAggggAACCCAQJgIE0GHSkTQDAQRSTYCCEEAAAQQiXIAAOsIPAJqPAAIIIIAAApEiQDv9JUAA7S9J9oMAAggggAACCCAQEQIE0BHRzTQymASoCwIIIIAAAgiEtgABdGj3H7VHAAEEEEAgtQQoBwEEYgQIoGMgGCGAAAIIIIAAAgggkBgBAujEKAVTHuqCAAIIIIAAAgggEFABAuiA8lM4AgggEDkCtBQBBBAIFwEC6HDpSdqBAAIIIIAAAgggkBICcfZJAB2HhAUIIIAAAggggAACCHgXIID2bsMaBBAIJgHqggACCCCAQJAIEEAHSUdQDQQQQAABBBAITwFaFX4CBNDh16e0CAEEEEAAAQQQQCAFBQigUxCXXQeTAHVBAAEEEEAAAQT8I0AA7R9H9oIAAggggEDKCLBXBBAIOgEC6KDrEiqEAAIIIIAAAgggEMwCBNCJ6x1yIYAAAggggAACCCBgBAigDQMDBBBAIFwFaBcCCCCAgL8FCKD9Lcr-EEAAAQQQQAABBJIvEMR7IIAO4s6haggggAACCCCAAALBJ0AAHXx9Qo0QCCYB6oIAAggggAACHgIE0B4gzCKAAAIIIIBAOAjQBgRSToAAOuVs2TMCCCCAAAIIIIBAGAoQQIdhpwZTk6gLAggggAACCCAQbgIE0OHWo7QHAQQQQMAfAuwDAQQQ8CpAAO2VhhUIIIAAAggggAACCMQVCO4AOm59WYIAAggggAACCCCAQEAFCKADyk_hCCAQrgK0CwEEEEAgfAUIoMO3b2kZAggggAACCCCQVAHyJ0KAADoRSGRBAAEEEEAAAQQQQMASIIC2JBgjEEwC1AUBBBBAAAEEglaAADpou4aKIYAAAgggEHoC1BiBSBAggI6EXqaNCCCAAAIIIIAAAn4TIID2G2Uw7Yi6IIAAAggggAACCKSUAAF0SsmyXwQQQACBpAuwBQIIIBACAgTQIdBJVBEBBBBAAAEEEEAgeATiC6CDp3bUBAEEEEAAAQQQQACBIBMggA6yDqE6CCCQHAG2RQABBBBAIOUFCKBT3pgSEEAAAQQQQACBhAVYG1ICBNAh1V1UFgEEEEAAAQQQQCDQAgTQge4Byg8mAeqCAAIIIIAAAghcVYAA-qpEZEAAAQQQQCDYBagfAgikpgABdGpqUxYCCCCAAAIIIIBAyAsQQPuxC9kVAggggAACCCCAQPgLEECHfx_TQgQQQOBqAqxHAAEEEEiCAAF0ErDIigACCCCAAAIIIBBMAoGpCwF0YNwpFQEEEEAAAQQQQCBEBQigQ7TjqDYCwSRAXRBAAAEEEIgkAQLoSOpt2ooAAggggAACdgGmEfBJgADaJzY2QgABBBBAAAEEEIhUgbAPoDe06iqkwBgk-kUVYRk5HgNzPKp7hB1qiW6u2pACc1wmupMiLCPHY2COR3WPsEPN5-aGfQDtswwbIoAAAgggcBUBViOAQGQKEEBHZr_TagQQQAABBBBAAAEfBcIggPax5WyGAAIIIIAAAggggIAPAgTQPqCxCQIIIOAXAXaCAAIIIBCSAgTQIdltVBoBBBBAAAEEEAicQKSXTAAd6UcA7UcAAQQQQAABBBBIkgABdJK4yIxAMAlQFwQQQAABBBAIhAABdCDUKRMBBBBAAIFIFqDtCIS4AAF0iHcg1UcAAQQQQAABBBBIXQEC6NT1DqbSqAsCCCCAAAIIIICADwIE0D6gsQkCCCCAQCAFKBsBBBAIrAABdGD9KR0BBBBAAAEEEEAgxAR8DqBDrJ1UFwEEEEAAAQQQQAABvwgQQPuF0ftOLl26JDv37pGNv_wqJ0-d8p6RNQikkgDHpKSSNMUkVoBjMrFS5EstAY7J1JIO3XIIoFOo7_49e1badO0iD5YsJRVq1ZGaTZrIE-UryEs1asqSVau9lnr0-HFp3bmz7N63z2seViDgi0BSj8lTZ87IxJkzpW2XrtLis89kyJixcuKff3wpmm0QiFcgqcfkgUOHZeTESfJRp04SPXacbNm2TS5evBjvvlmIgC8CST0m7WVs-nWrNProI3Nc2pf7d5q9BYsAAXQK9MTxv_-W-i1ayKx5C6R40aLSplkz6d7uE6lX43XZd_CgNG3bVkZMmBhvyVPnfCNzFiyU4yf-jnc9CxHwRSCpx-RpV_Dc2PVG0KnPl7Ji7Q-y0pX6jxwpFWvXlWMnjvtSBbZBwCGQ1GNy_6FD8nrjd6TXkCGybuNG6TdihFRv1FiatGkjerbQsXNmEPBBIKnHpL0I_ZvZqmNH87fyxN-caLDbhOs0AXQK9OzQcePNJRsNataQAZ2_kMrlykrJEiXkndq1ZeqwoZI5UybpHR0tew8cMKVf-O8_0W30k6u-KZiFDIJWIBQrpseXXkaU2GNy8fKV8vPmLdK4Vi1ZPHmSLPp6ktSqWsUEz2MmTwlFAuocZAJJPSYnz55tjr-BXTrL_AkTZNn0aVLkvntNwPLb9h1B1jqqE4oCST0m7W3sPSTanCCzL2M6vAUIoP3cv3-fPCljp0yRPLlzy1uvvy5RUVGOEgrkyydN671llukbgk5cuHBBJs2aKX_s3GmCa11GQsBfAr4ck5u2_mqK16A5KipKMmbIIDUrvWqWaWBtJhgg4KOAL8fk-k2b5O47C5pv9bTYG667Tl596SWdlD-PHjFjBlcVIIMXAV-OSWtXy9ascb2Hz5KXSj5vLWIcAQIE0H7u5N937DR7LP3cOC9_nAAABrhJREFUs5I-XToz7Tl48ZlnzCLrrEmmjBnNGRU9q9K84dtmHQME_CXgyzGZN8-t0sh19jl9-vTuahyNuXTjuiyZ3cuYQMAXAV-OSf0G79MPmruLu3z5sqz96Wcz_8C995oxAwR8FfDlmNSyjrn-Lrbr1kPKPv-8SbqMFBkCBNB-7ueDhw6bPd56881mHGfgWqBnTvQyjj3797vm-I9Aygr4ckzWrFRJ9HIPq2Z6dka_otT5Uk89pSMSAj4L-HJMPlKkiDkDfeToMXmn9cfyQrVqMnP-fGlSp47o31ThHwLJEPDlmNTiPuvVW0fS8p3GZswgcgQIoFOor69Nf63XPeuZE73hIGPGDF7zsAIBfwv4ekzq15OV69WTVT_-KNUqVJCXXGda_F039hcaAv6upU_HZJSYJ2-cOn3GVOfbJd_JwcNXTlyYBQwQSIZAUo7JGfPmyeIVK6VT61Z8iEuGeahuSgDt557LmfMms8f9Bw-acXwDPYOiy_PecouOSAikqICvx6Sedf6g_afS5OM2ku6adNL_i07Sqsk7ca7rT9HKs_OwFPD1mFSM7Nmyid5IuHz6NHOTq371PmPefF1FQsBngaQek3rpxiddu0mxIg_KdZmzyOat22TX3r2m_B1798ivv_1uphkEjYDfK0IA7WfSfHluM3uct3RJnEcrTf_2Wzl77pxMmzvX5Cnx6KNmzACBlBTw5ZjUH_2p3rCRLFy-3FwLPW34MHmiWLGUrCb7jiCBpB6Tfx45Ki06fCbzlyx1K6VNm1aqlH_ZzP-0eZMZM0DAV4GkHpPWo2bX_vyTvN64sUld-vU3xXcfMFBea9jQTDMIXwECaD_3ba4c2aXMc8-KnhXRp3FYu9_6-x_Srlt3ebNpUxk5aZJ5SkfZkiWt1YwRSDEBX47JcVOmij6z_POWH5proe03E_pcUTZEIEYgqcdkpkwZZf7Spe6TDzG7kT927jKTuXPmNGMGCPgqkNRjMo_rG-SJgwaJPbV9r5kp_qMmTWTSkMFmmkH4ChBAp0Dfvv3GG-ZxdD0GDZb32rVz_dH_Vk6c_EeefeJx0UBar3-uVKaM62vxa1KgdHaJQFyBpB6Tq9evMzvZf-igDBo9xpH0uj-zkgECyRBIyjGZJVMm0ZtX9Tp8fVa-Pkpx_LRp0qFnT1ODsiVLmTEDBJIjkNAx6fnefW369OamVn20opVuz5PHFK-XZxYqUMBMMwhfAQLoFOhbfRHNGDFCHi_2iLnBoH337tKgRUszres09Rk2TKznQNurEBUVZZ9lGgG_COgxl9hj8vyFC6IBihY8cPRoGThqlCPNnr9QV5EQSJZAUo5JLahFo0byyAMPSPTYceabPP26_MixY9KhZQsp-kBhzUJCIFkCST0mPQuLkiizKCrNlbGZYRC2AgTQKdS1ObLfJAO--EJWz54l4_r3l0Fdu8j0kcNlxsgRMnHwIKlY-kXJkjnu83Qrli4tGxYtFP2FrRSqWojulmonVyCxx2T6dOnMMajHYXwpuke35FaF7REwAok9JjVzTtff1Oge3eXb8eNkeK-eMnlotPmFzPIvvKCrSQj4RSApx6RngUWLPGD-dhYvWtRzFfNhKEAAncKdqj-Sct_dheSxhx-W_Hlvk6ioKPOrbu2bNxfrB1VSuArsHgGHAMekg4OZIBBI7DEZFRUluXPlkocLF5Y78-c3f0uDoPpXrwI5Qk4gscdkyDWMCvtNgADab5TsCAEEEEAAAQQQQCASBCIlgI6EvqSNCCCAAAIIIIAAAqkgQACdCsgUgQACCPguwJYIIIAAAsEmQAAdbD1CfRBAAAEEEEAAgXAQCOM2EECHcefSNAQQQAABBBBAAAH_CxBA-9-UPSIQTALUBQEEEEAAAQT8LEAA7WdQdocAAggggAAC_hBgHwgErwABdPD2DTVDAAEEEEAAAQQQCEIBAugg7JRgqhJ1QQABBBBAAAEEEHAKEEA7PZhDAAEEEAgPAVqBAAIIpJgAAXSK0bJjBBBAAAEEEEAAgXAUSNkAOhzFaBMCCCCAAAIIIIBARAsQQEd099N4BBDwJsByBBBAAAEEvAkQQHuTYTkCCCCAAAIIIBB6AtQ4FQQIoFMBmSIQQAABBBBAAAEEwkeAADp8-pKWBJMAdUEAAQQQQACBsBUggA7brqVhCCCAAAIIJF2ALRBA4OoCBNBXNyIHAggggAACCCCAAAJuAQJoN0UwTVAXBBBAAAEEEEAAgWAVIIAO1p6hXggggEAoClBnBBBAIAIECKAjoJNpIgIIIIAAAggggEDCAklZ-_8AAAD__4_hxoEAAAAGSURBVAMAM7QYVHi2Z1kAAAAASUVORK5CYII"
        }
      ],
      "format": "org"
    }
  },
  {
    "id": "gfm-bundled-report",
    "format": "gfm",
    "kind": "typical",
    "title": "A report you can take offline",
    "description": "Bundled pictures survive project downloads, sharing and HTML export.",
    "path": "examples/gfm/bundled-report.sheets.json",
    "tags": [
      "gfm",
      "typical"
    ],
    "document": {
      "src": "# A report you can take offline\n\nBoth pictures are included in this document. No outside image host is needed.\n\n<figure><img src=\"sheets-asset:AAAAAEcz1D__a3CMuInIm6XZ_d-i9Sz93NQ7U-1vhX9Gpdd61UxqfmmSiQMmp6qaXF8Ahig601EwgvXtkjttKpxuXpCuHw\" alt=\"Quarterly revenue chart\" width=\"640\"><figcaption>An exported chart, kept as a picture.</figcaption></figure>\n\n<figure><img src=\"sheets-asset:AAAAACxHlaFkI7KHQmM7m1Serwk1SYfKFFpqO3cz-qlHoUfziqAkxQklAPCPOFdDd9JkK2c070paH3-fSKgVJ4USbWfEtA\" alt=\"Office supply budget\" width=\"640\"><figcaption>A table snapshot alongside the chart.</figcaption></figure>\n\n## Try it\n\nUse **Download → Portable project** to save the complete report. Reopen it with **Open project snapshot**. Sharing and HashBin saves retain included pictures. **Rendered HTML** includes their bytes too.\n\nFor offline reopening, download the app's offline files first. A HashBin document link still needs a connection to retrieve its document. Plain source downloads contain references without the pictures.\n",
      "type": "gfm",
      "view": "split",
      "attachments": [
        {
          "id": "AAAAAEcz1D__a3CMuInIm6XZ_d-i9Sz93NQ7U-1vhX9Gpdd61UxqfmmSiQMmp6qaXF8Ahig601EwgvXtkjttKpxuXpCuHw",
          "mime": "image/png",
          "data": "iVBORw0KGgoAAAANSUhEUgAAAtAAAAEsCAYAAADq74RjAAAQAElEQVR4AezdCZxN5f_A8e8Q2SrJkqKI0r9FKvmVSitFhISIsoSQqJBEpMi-ZDf2LWRfkjU7KcpWVPa9bGXJEv73-5hz55w7c8fMnTtzt4-X56zPOc_zvJ9z537vueecm-b02dOXSRhwDHAMcAxwDHAMcAxwDHAMcAwk7hhII_xDAAEEQlKASiOAAAIIIBAYAQLowLhTKgIIIIAAAghEqgDtDnkBAuiQ70IagAACCCCAAAIIIJCaAgTQqalNWcEkQF0QQAABBBBAAAGfBAigfWJjIwQQQAABBAIlQLkIIBBoAQLoQPcA5SOAAAIIIIAAAgiElAABtI_dxWYIIIAAAggggAACkSlAAB2Z_U6rEUAgcgVoOQIIIIBAMgUIoJMJyOYIIIAAAggggAACqSEQPGUQQAdPX1ATBBBAAAEEEEAAgRAQIIAOgU6iiggEkwB1QQABBBBAINIFCKAj_Qig_QgggAACCESGAK1EwG8CBNB-o2RHCCCAAAIIIIAAApEgQAAdCb0cTG2kLggggAACCCCAQIgLEECHeAdSfQQQQACB1BGgFAQQQMASIIC2JBgjgAACCCCAAAIIIJAIgRALoBPRIrIggAACCCCAAAIIIJCCAgTQKYjLrhFAAAG3ABMIIIAAAmEjQAAdNl1JQxBAAAEEEEAAAf8LsMe4AgTQcU1YggACCCCAAAIIIICAV4GgDKBPnznjtcKsQCAyBWg1AggggAACCASLQFAE0PsPHZJuAwZK7WbvSfFyL7tTg5YtpXd0tPx55GiweAV9PWbMmyf9Roww6avp04O-vlQQgeQKfLdypbTt0tWd_j55MtG7XPXjjzJo9BiTBo8ZK-cvXEj0tqmRcfbChTJy4iSTvlm0ODWKpAwE_C_AHhEIQ4GABtDnzp-XIa43rTKv15CxU6bI-k2bxDr7rOM169bLiAkTpWTVqjJxxgz57-LFkOiCf8-eNfXWumv6ZdtvqVbvbxYtkuix40z6ahoBdKrBU1CiBHbu3eN4bRw9fjxR2yWUadv2HTJz_nx3-vfMvwlld6xbtfYHGThqlEkDRo6Us67XriNDgGfGT50mvYYMMemr6dMCXJvY4qfN_dbdj4uWr4hdwRQCCCAQIQIBDaC7u84693e9aSXGutOXfaVP9NDEZA14nlOnTpsz53r2XNP6zZsCXSfKRyAoBH7fsdPx2vjzryNBUS8qkTSBERMmuPtRP7wkbWtyI4AAAqEvELAAeqXrzM-kWbMcgkXuu1eaN3xb-nz2mbxXv74Uvuf_HOtHf_21OUvtWMgMAghEtMAdt90mpZ56yp0yZMwQ0R7h13hahAACCASfQEACaL1GsU2Xrg6NutWrybCePaXmq6_K08Ufk1pVq8iI3r2lWoUKjnx6reOZf_91Lzt77pzovKbz58-7l1sTukzXadK81nL7WK971K-WV6xdK3pN5G87dsiF__6zZ3FP6z50X5rsefbs3y9r1q9350vshF7usfX3P2T-kqWyees20f3Ht-3Fixfd7dSyrTyaf_W6dQleJ6711G2sFN-lMJ55Ll26ZBXhdWztT8daP82o2236dats275dZx1J-10v05m_dKls371brG3smfSyHt2flXR_9vU67ZlHl3mmw3_-Zfpy6eo1cujwn56r3fNqof2vSaetFQcPHxbdVvtG-8habh9bddSxfVsrj26n6zSpr7XcPtY8WsbV-t--TUpMa9_8vHmLTJs71xyL23ft8no9sFppmzRp_T3roxa6zkqe6xMzr16_79wpS1atltkLFpjX1r6DB-Pd9Nknn5BPWzR3p6zXXx9vvn9OnpQff94g6zZulPjqHe9GMQsTezzFZL_qSMvXS7uWrFplXvdJuZRF_XVbvXTij107r3ppm76G9Hj-_qf1smzNGtFtT50-HW8d9e-J1W_aB1YmX_--WdszRgABBMJNIFEBtL8b_f269XLsROy1j3ffWVCa1Kkj16RN6yhK55s3aih5cud2L9c30R83bHDPl65eQx4rW86kRq0-ci-3JnSZtb5S3besxWasbxSd-nwpj7xYWirUqiONP2otDT9sJZXr1ZenKr5ivqK0v4noRlXqNzBl6T77DImWBcuWyav16km5N96U7gMHStW335bytWtrVnfSGyT15sjhX01wL9M30O4DB8mjL5U127RwnXV_vXFj-V-Zl6TeBy3kL48bJxetWOEuV8vevW-ftO7c2eR_u-WH8uvvv4u3f1qubmOlkRMmxsnaoUdPx_41eImTybZA62ftT8ffuQIBvRnrucpVpcY778icRQvduTX4aOhyLVGhorlRtEWHz-SVOnXloVIvSMfefRwfVlp17Oiox3crV7n3Y01UrlffkUevl7fWaRD4Uo2aUqpaNdOX77ZpIy9Ury7PVKosX8-aLZ7_ajdrZvpfj4GPOnWSuYsXm_58sfrrottqfz5XuUqcbfUDl7bbSsPHf-XYtQY52rfW-i79-jnWJ7X_HRv7cebYiROmndo3bzZtKu279xA9Fl9xvVbUZJLHt0RadPsePdz-2kbP18gwl4XVbh3rB5jDfx0xNwdr3-s-rFT3gw_Mcg1qrWX6waVCrdry6lv1pGnbtvJx5y7SoEVL0X596_0PZMu2bVZWMx46bry7PlqeHm9mRcxAg1M9_p50HX9aXp333jevuz7DhsXk8D5K6vHkfU9X1hw5esx4q1u1Ro1c7ftE9HX_7KuV5b127UQ_vF_JGf9QP-Brv-i277dvL5Xq1hPtO_0Q7bnF5cuXRfvvwZKlRI_n-s1bSpOP24hu-_jL5eXDzzvG-eBd5Sp_3_SyO_1bpn9_rPL0Q4Aue6f1x9YixggggEDYCwQkgN6xZ48DtuEbb0hUVJRjmTWjQXTt16pas2a8Y3fs9ufOnzPLvA0u2s6kXvgv9g57PSvzxrvvysSZM-PdVIOyEa5As3WnL-JdrwvXb94szT_tIHpdp85rOn7ihPtGSJ23ku7v7LmzZlbP_lRt8LaMmTzZzHsO1v78k7z-TmPRIM297rJ7yky06dJF5iyIDVLNQi-DZx4v7lizeOVKx7xaaIBuLdQPLHfdcYc1G-_YozoyatIkcyPWMdsHI93w199-l4p165qzwRLPP32D1yDpVMyjC_WreHu21et-tM_K3gMHxP7mrfkzZ8pk8ujZUw0C98VzplLr9bnrG43-I0eKBhZmA9fg4sXYM-0btmyRVh07OfrTlcX0p26rZ-90Pr7k6eGZ59Kl2Bw-9b_nDv0wr98CaACmAau33ekHHP1gYTeLim1KvJvZ82qGy3LZdZb0P-Oo8_akrwtN-oFDl6uxfnCJrw91_Q-uD8_1mrdwvjZ0hS3Zyz9w6LArEK8f7_GnH3rGTJli29I56cvx5NyDc06D45dr1TLfbEg8_xavWCm1mjYTfSpRPKtl-67d5kOh5zr10w_Rq13fRNnX6Qd07T_7Mvv0t9995_pA20z02wf7cms6vr9vp86c9tqPJ0-fsjZljAACCIS9QJpAtHC76-the7l3Fyhon40zfe9dhRzL_ti90zHvy8zmrVvjBEqPF3tEHrr_fsfu9HIDDb4cC2NmPM-E6eIniv1PihctqpPudHuePPJ08eKSL-9tZtmwr75yBIG6sLDH9d56xq5pm090Vbxp4y-_xrs8voUaDBe4_Xb3Kq23ngmzFvy2fYfjTbFcqVJeP9BY23iO46vPJdeHl059v3TsW7fzbKteD9835mxgiUcf1SzutGj5SkfA6xkkvPT8cyavtkfPnpqZmEG2rDeKvd3i-qdPfVmwdJlrKu5_NdelGpDr9fg6bU_6gco-7-u0P_rfXrYGnxoM9Rk6VPQrffu6hKa79u_v-CZI2_3k__4n9xZyvt708Wn6TUtC-7rauowZrjWvgbtd3zbZ8-rrTV8b2bJmNf3crlsP92qtz2sVyot-gM7m6ktrxWnXh62J0-P_4GvlscZDxo5xtFGX6351nFDyx_Hkuf9u_QfGeS3kypHdkU3b1rX_AMcya0bX6bR-wH304Yd00pFGT_raPX_23DnzZCP3AteE2mv_2tuvH1TWbdjoWhv3v_6d8Fx6d8E7TT_al-v-tA-1L-3LmUYAgeQKsH0wCwQkgPa8PjZ79psSNMrhsd5-xjfBDRNYOd8jiJrvCmoHfPGFjOjdS95-o6Zjy992JByw63XbX7RuLa3eaSKfvP-edGjRwrF9lZfLSZ_POkiZ5541X5nqJRVWBn0znON6kx_Tt68snz5N9A3OWqdnWvV6Ymvec6yBjt502bvDp66g5y7P1Y75l194wTG_2nZmd7XHmauSJZ505E3sjAY5jVxn2Hq0bycvu4Lw71auEntgrWeLl7vaqG39ZtxY0fzWvmfNX2Cu_9Y343IvlLQWm-DHfjnJstVr3Os0r_VhZcTEie7lOtGsXj2ZP_ErmTp8mAzs0lkXuVNCTw3Qeq-YMV1G9ekjU4ZFu7fRCc_jVpclNf155Kj4q_-tsvURj_p1vO5Xzyh7O6No5dex9rk-JlKnNWlwNXPUSOnXqaOMH9Bfun3SVhe7kz4B57-Lvj9GUvtaXwN1q1Vz71MnWjZqZF4bhQoUkAOHD5v-1uWaypUqKR81aSLalwsnTRD9IKrLNS3__nsdJZj2Hjwg-rg1e6ZBXbvIqlkzZfaY0fL8k96Pc38dT1bZen_EWtc3S9a8vu4XT_5a5k-YIMN79RQ9lq11ekmE52Ux1rqKpV8U7afBXbvK5KHO43PDL79Y2WSNx2taX5MTBw0y_dvz0_bufDqxbfsfOvKa7H_fXnN9oNF-tPfFI0WKmD5s-pbzEjmvO2QFAgggEAYCAQmgT5467aBL4-XyDStThmuvtSb9NtbLGrq1bSuahnTvKrly5hC9OU3PutgvZ9ACz52Le3OiLtfUs3170SBWg-OiDxTWRQkmzzOEr1Ws4L7G-_rrrpOalSs5tp_n-prVsSBmRoPnYT17iL65PfP445I9W7aYNfGPSj5VwrFi2ZrYAGTl2rXudXfekV8K5Mvnnk_shAYAo_v1kQY1a5jApGC-_LLlt22OzWtXrSraRl146803S9WXy-mkSXp2bdUPP5rpMs9eOatsZlyD72NuztTrhu2BU9nnn5f06dO7coj8tHmzGetA61LN5Zrummt01nwjYD-jrPs4cuyYWec5aNGooaRJc-VloW2wny3XOnoLbDz3423eX_1v37_e_Gqf_2lTrIV9uX3aM8B6v0F9xzGkH3b0rKK1jZ6p1BvJrPmUGJ-_4HydTZg-w1ynO2veAtHyR7u-zVjg-qCkSaevVoctW53HX9WXX5bHHn7YbJb3llvkkw_edwSuZkXMwF_HU8zuZOOW2OBWl7Vs3FhuuvFGnZSHCxc2rxt9TVvpyNGjZp3noHK5cpI25l6RO_Pnd3yo0OPTyn973jzmb5v-fdMPQ88ULy56065eFuZ56de_MZeWWdvax0n9-2bflmkEEEAgnAWuwMzW-AAAEABJREFURAqp3MKC-fI5SvzraPzBjJXpr2PON5OCtzu3t_IlZaxvWo8VfVj-OXVSJs2YJaVee02KlS4j1Rs1jnNpR0L7ffLR_yW0Os66vfv3O5ZZN-XoTTia3vukvWP9rn37HPPWzLOuoDljhgzW7FXHGrDag8j5S5eKPqHk5KlToteVWjsoVzL27K-1LDFjvcwmb-5bHFn37j_gmH-reXNzw5i2U9PA0aMd6_e5zhjqgmIPPug4O20FiPagRvOVee45HZm0a-9eM9aBBhJ6U5aWYSW9GUzXWenQn39Zk-6xfp1uBfjWwjy5c1uTfhn7q__tlXnh6afds_rh4ZEiD7jnvU1s37XbserhwnG3Kf5IUUeePfucx65jpR9m8riOn2y2SzV0l3ppShvXWeOX36wlFWvXlXFTp4jey2AFn5rHWzpw6LBj1UOF73fM3-D6wKqXbTkWxsz443iK2ZUZ6bX7ZiJmUDC_82_Ym1WqmDP_evZfU-5cuWJyxo60bwsVdF7upkF0bI7Yqfx5b5Nnn3zC9QEznSx3fVjWG2_1pt0KtepIQt_AxO7hylRS_75d2YphkAhQDQQQSEGBgATQBfLd7miSZ1ChK_UpD2-9_4F5HJrnJRt5b71VsyQr6RnI1xu_I5_16i0Lly8X6_rXpOxUr69Nny5dUjaRg3_-GSe_Bnz2ZM-gy-3z1vQdtmuarWVXG5d93hkc601C9qcf6PYlSzyloySnQgXuiLPNngPOgEvbYk-eG5z598pNlnrjaNmSz7tX66UGepOh_mqctVCD3cIx143rmWndr7VOxzpvT7rMns6cPWOfNdO5cuQwY_sgTZR_XyL-6n97HSuWLm0uPdLLHWaOHOn1rKp9m2MnTrhnNTBTc_eCmIkbb7ghZurK6PCRuB86rqzxz1C_MdCzpZ5BtLV3vRdh5MRJor9cumxN7KU81nrPsT66zb6sUMEC9lkzrR8szYRt4K_jybZLOepxc218x5o9f3zT-nfTs5-sb0s88-vlNnrzZ9O2n4gGzHrDqGeeq8378vftavtkPQIIIBAuAv6NDhKpcodHAP3tku8cW-qbe4OWLc2Z0drN3pMhY8c61t_mJYC-cDHus5v_PHLEsa0183HnzqLXGFvzek1fvRqvS9-On8e5_tPK4znOljWr5yLnfDxzN3lcaqHXFOo1196SPZC07-76LFnss4mafvaJxx35Vq79QfRaWGuhnqG-5ea4Z76s9QmNr3OdzfNcnyu78wYpb220lj9w7z3uXZR-5hn3tE6s37hR9FF5Oq3pFde3BVbwcG3MZRy6XJO-8Vv79Da-OUdOzeq3dPlS7NM8dKfHjh3XUZzkr_637zgqKsrc_KrHUvabstlXeZ22H7v6QUMDLs_Mx__-27EoV_a4HzA0g94sqmMrHfH4xshanpixXgY1c9QIae_6tsLb2WHdjz4tRT9U6bS3lDnzlaezWOt37Yn9lsJatmXrb9ake5wSx1O6a5wftE-ccNq6C_fTxGjXB435S5a695bNdWa_Srly0vnj1jJ95HD38oQmsmXNmtBq1iGAAAIRLRCQALrw3c5fGNTn8-rzTa2e2H_wkFhnTPTN3X4GWs-W2d9Ys9jeJPfsc14yoNvui-eRZnqts57VtMrTr-mnDBsq79SuLfoUiNNnYn-oxcrjr3H-vHkduyrxv0el4ZtvOlLd6tXFShVefNGRPzkz-rW3_SbFxStWyHe2R9p5nqFOTlm6redZ8hqVKjna2aBmTXc7tb2PPvSQbmbSPYXuclzfqU8YsPdlqWdiL1vQQFpvgjMbugYZMmRwlKO-9WrUcJTl7UOYa_NE_c-Q3nldvuejx3bs3RPvfgLZ__YK6dlM-_y6jbHPVreWW9ekW_O35bnyzc-1HvckHP7LeWZ62_bt1iZJGut2-rQPveFOX9c927eXNXNmy7AePcwPK-lr39rh6TNn5I-r3Nx7ex7na83zaRP6HPi1thv7rH2nxPHkebzt3r_PKs6Mew4ZbJ5V_kylymasz842K3wcrF633rHlqC97y8fNmkrpZ591LE9ohnUIIIAAAt4FAhJAa7CjwZS9Ws0_7SDTv_3W3Mh3___dHefJCVbehrXeFL120ZrPnu0ma9Lcwa-_dKcL9IxatwEDdDJOOnD4kGNZ8aJFJV3MDWe63cx58xzrL1--7JhP6swp202Tt-fJ49i8V_QQx6OtJs6YIY-8WNqdoseNd-RP7kwZ23XDGpDaL13xPEOd3LIK3Oa8zrPXkGjzqDLdrzrrtwD2tv64wRnElbc9OcR-nfa9hQrJHbfdprtxp7vy3-Ge3rJtm8xeuNA9r0-lKP9mLbeplqlf07sz-DDhecZ9hetsvj76THel5fUcPFgn46RA979VoWJFHrQmzbjn4CGilzWZGddAA1l9GoRr0vzPlSO76I13OnPDDdfryJ3m2850zpg3T-xPXnFn8jLxz-mT7jX6jYj-HbCSPnFFr_MvWuQBea9-fala_mV3Xp1Ikyb-Z8frOk2FPJ5lPmfRYve3TvqaHjnR-eQW3cZK_j6e7rojv7VrM_5y2DDR14DO_HnkqEyeNcf8_Tp24rjrb-A5yeny1nW-pt3797o31RME9gBen3jjXumauOz88sS1JGn_T_yTsmfTk1YbciOAAAKSKgQBCaC1ZY1r1xL9w67TmvSMUrtu3c2NfM-4zsLoL4fpcs904_XON--H7rvPkUUv-Xi1Xj3z61yej7CyMnp-fa8_5qHP-NVf0tNfyLOCcCu_51fU1nJv43TpnV_XTpw5S9p26Sp63aYGIRVLx55V1rPrJau-JvoLbXqjVKcv-zp26-sj5Rw7sc2UeOxR21zspJ7V1zPUsUuSP1Xy6RKOs8hT5syRZ1-tYp6sUKJCRdHnC1ulaID2wD2xl3Do8lLPxH89tj5qTtfbU53qr9ln5eMvOoseB--1a2eOBf2wYGV4qeTzooGZNe_LOEumTI5nTGvg81yVKqZMbZv2a3z7DXT_W3XS_rYH0Vt__0P0-Hu3TRtzI60GsVZeHb_foIH7Q-b9he7WRe7Ud_hws62-bj_p2s29PL6J9OnSOxZ36dtf9HWvl1PpB2f7yhaffSZf9O1rfnCoc99-MnHGTPtqKZjfGZQ6Vrpm7nF9i_GU7XjXPtI26o_tvFCtmgwe47w0zLWJ-7-_j6dSTz8teoxbBfy8eYs5Lt96_wMpWbWq40O03lCoZ8GtvL6M7Tch6rGvfl9Nny5anv5SpH2fnpcf2dd5m05v-xunbfnw847mx5S85Wc5AgggEG4CAQugM2XMKF3btnG8qVi4-kZnTXuOP-7cRaZ-8417caVyL8W5aUqDFw3INZP9a1-d16TBkz6mS6et1Ds62vyS3u59--Lsb4_HkzOsbbyNs7qCfD3Lbq3X9uiNPJu3bjWLPnj7bUe7ta76VAwt22SIGegzpQvkyxcz55-RBn5lnov7NW6ZFPhqN4Prq_7OrVs7Kq4W-mQFbbO1QvuoR7v2kt7jWua8uW8RvS7bymeNn4_nOdX61IHW7zaxspixHgeLV6w009ZAH9Onzx625pMzfvuNN-JsrmXGWeixIJD9b6_Kh00aOZ52on2iv0q4xXUG356v1NNPif318ljRh0W_BbDn0WNX-1aXaX-KTsSTPPtTL9XSb54OHD4sjxQpImWfj715VDefMH2G6C_qafCn9dNlmpo3aij6N0SnE0rvNagf5_WsAZ_1zYs9qLXvx9_H07WuY7v52w3tRZig2f7Niq4s7vo2rOarlXQyWamM7Zsm3ZH6aRDtWZ6u83a5ka7zlp4oVsyxSl_Ti22XgzlWMoMAAgiEoUCaQLZJ34RnjBxpnoHqrR76Zqw399nf6PRN3sqvb3TR3bs5znTqumxZb5Qe7duZHy_ReU3pbDfytG76ruNHS3S9Jn327dShQ3XSnXoNGSLnL1xwz1sTUQk8oUF__MFeZ2sbHV-XJYtMdX2Fq7-wpvOeKU_u3KI_NlLppZfcq6I8vq72nLcy2p8a4XnHvpXnxWfiBtBPPfaYtTpR4zRRzq_PPeetnehZwNljRou6WsvsYw0Ypo8YIff_n_OsppXH82yzXsOd3eNGTCtv1fLlZWiP7o4zw9Y6Heszs8f17y_6AUfnNaVNG_sSSJMmdlrXabocpcPYFBUVu0ADy_bNmzuCUM2px_WkIYNF-1HnNaVJE7udL_2v-_B3Kpgvv0wZFu21b7S8Ns2amecJ2230A2j_LzqJ_Qy25tXUpE4d-fCdxjrpTvZjUu0_eLuBe53nRJv3mpl7EfR177lO5_V13daVp8Yrr-isSVFRsba6ICpNbD_q3wftC_sHWs2jqU71avLW66_rpDvZ2-nL8eTeUTwTpVwfRPQHerQN8ayW6hUrSt9OHR0fDK52fIqz6e7dVi5b1lw37l4QM6EfIPUHVey_ZKiXzvzsOiMek8U9ioqKdXQvjJmoVPYl8fwwFLOKEQIhL0ADEEiMgPe_kInZ2g959M24Ua1a8sPcb1xB5VDp2b69-fUxHesf-kVfTzJvqPrGowGJ_uHv0uZjR8kasOivcy2bPs38gpxOz5_4lflBDw0ANixaKJrmjB3j3k4f0dXP9WY1ddiVMgd36yqrZ88S_ZWtm3PlNPl1GyulT5fObKv7tpZF9_D-dbX-YIP-ytiSqVPMXe8aRGoAZ3biGmTJnFk0yF45c4aM7ddPOrb60Fz3PW_8ePMraYVjHtHmymr-lyxRwlGnhwsXNss9B_qre1b99Ff4PNfr_EP3Oy970UsaNKjTdYlN-rQHqxwd64ccb9vqZQvqumjSJBPgaltH9O4lS6dNNW3O6fFLk_b96IcI3b-VtM_s6z2n9Sym_kLb7LGjzRNV9BciJwwcKHozmv7gjZ4JtG-jH1SsfesxZl-n051atXK4e34o0ctxvpvytWi_6fb6i5Zj-_WVQgUKiB5v1r71ONT9WSmp_W9t5-9xtqxZzTG_3PXaGdP3S-nQsoV5DU4fOVzWzZ8nlcuVjbdIff3o8f_9N3PM84s1SNXXz1uvVxe9dt1qt471R4rsO3mjcmVZ79q3_iDKtBHDjdND999vsujfAz2W5k-cINpv-iubn7ZobvpSy5j31Th51RUcRkXFRo4NatZw9JHnB1f9u6F_S7Q_9EO1_vKf1rVp3bpSpVw5x7baL6YiMYNHXGfFk3I8xWzmdaRB54JJE2TW6FHy5eefG299_evxqR88PI-vMX37uuunx5fnjvWHUtTYStZ6_SCg143r3yD9sKOO-suHk13ftOmHCf0lQ2sbHWu9dNvE_n3L6_p2SOujv-qo22jq0a6d7oKEAAIIRIRAwANoS1m_vi-QL5889-QT8lqF8masf-j1DVXz6DV94wb0l94dOoheGqDLPJPeXKhvBHqjVrqYmwI983jOW2U--tBDjjM_nvl8nddAQ8-CaRAZX5Cqb9h69rVsyZKiZ2M1eI-KivK1uERtZ3okgeQAABAASURBVL_BTjeo8OILOkrxpEG3BiTaVg2Y9Gxk_IUmb6kGD_oGr09UKfPcs_J_d92Z7Guer1Yj7Tc99jRY1PKvlt9aH4j-t8q2j_UHZArfc48JfvU1qMesZzBnz29N62tRP8DqB4bEXFJhbZc2bVrRD056M2ge1zcunh9s9FIj7bdnHn9c9Ek02pdahv6dsPaR1LGW8_yTT5pf_ktKXbU_87oCRq2DP44ndb3t1lvlqcceNd76-rf-ziW1TVfLrx8m9HILdfT3PQ5atn5ToH9vNXn7ZkjzkRBAAIFwEwiaADoxsBpwpdQbTWLKD_U8erPWSzVqil4LabUljyt4KRrPr9BZ6xkjgAACCCRBgKwIIBARAiEVQEdEj6RgI3_fuVP2eTwX-506tUXPsKVgsewaAQQQQAABBBAIK4FwDKDDqoNSsjF6rekLTz-dkkWwbwQQQAABBBBAIOwECKDDrku9N0ivH9ebffRmvp8WzDc3Z3L22bsXaxBIfQFKRAABBBAIBQEC6FDoJT_VUW_aMjf73JSNyzb8ZMpuEEAAAQQQQEBEIgyBADrCOpzmIoAAAggggAACCCRPgAA6eX5sjUAwCVAXBBBAAAEEEEgFAQLoVECmCAQQQAABBBBISIB1CISWAAF0aPUXtUUAAQQQQAABBBAIsAABdIA7IJiKpy4IIIAAAggggAACVxcggL66ETkQQAABBIJbgNohgAACqSpAAJ2q3BSGAAIIIIAAAgggEOoC_gugQ12C-iOAAAIIIIAAAgggkAgBAuhEIJEFAQTCW4DWIYAAAgggkBQBAuikaJEXAQQQQAABBBAIHgFqEiABAugAwVMsAggggAACCCCAQGgKEECHZr9R62ASoC4IIIAAAgggEFECBNAR1d00FgEEEEAAgVgBphBAwDcBAmjf3NgKAQQQQAABBBBAIEIFCKAD3vFUAAEEEEAAAQQQQCCUBAigQ6m3qCsCCCAQTALUBQEEEIhQAQLoCO14mo0AAggggAACCESqQHLbTQCdXEG2RwABBBBAAAEEEIgoAQLoiOpuGotAMAlQFwQQQAABBEJTgAA6NPuNWiOAAAIIIIBAoAQoN-IFCKAj_hAAAAEEEEAAAQQQQCApAgTQSdEibzAJUBcEEEAAAQQQQCAgAgTQAWGnUAQQQACByBWg5QggEOoCBNCh3oPUHwEEEEAAAQQQQCBVBSI2gE5VZQpDAAEEEEAAAQQQCBsBAuiw6UoaggACESJAMxFAAAEEAixAAB3gDqB4BBBAAAEEEEAgMgTCp5UE0OHTl7QEAQQQQAABBBBAIBUECKBTAZkiEAgmAeqCAAIIIIAAAskTIIBOnh9bI4AAAggggEDqCFAKAkEjQAAdNF1BRRBAAAEEEEAAAQRCQYAAOhR6KZjqSF0QQAABBBBAAIEIFyCAjvADgOYjgAACkSJAOxFAAAF_CRBA-0uS_SCAAAIIIIAAAghEhEAqB9ARYUojEUAAAQQQQAABBMJYgAA6jDuXpiGAgB8F2BUCCCCAAAIxAgTQMRCMEEAAAQQQQAABFZgyZ46MmDBRJ72my5cvS5d-_aXbgIGOPCvWrpXBY8bGSb_-9rsjX2rOUJb_BQig_W_KHhFAAAEEEEAgRAWOnTghPQYNljXr1yXYgmlz58r4adPkp82bHfk0-B4wcqR4pl__IIB2QIX4DAF0iHcg1Q8VAeqJAAIIIBDMAus3bTJnlCvVrSenz5xJsKp79u-XT3v0jDfP7r375JUyZeS7KZMd6aXnn483PwtDU4AAOjT7jVojgAACCCCQOgIRUsqGLb_IohXLJV26tAm2-L-LF-Xjzp3lzjvym2TPfOnSJdm-e7fcVeAOyZY1qyNdmz69PSvTIS5AAB3iHUj1EUAAAQQQQCD5ArVfqyrzJ0wwKXOmTF53OOKrCbLxl1_li9atJWOGDI58R44dN_Pnzp2Xr6ZPl34jRsg3ixbL-fPnzXIG4SNAAB0afUktEUAAAQQQQCDAAlu2bTNB8fsN6sud-fPHqc2BQ4fMsl5Dhkjnvv0keuw4-ahTJ3m1Xn3568hRs45BeAgQQIdHP9IKBBBAIEgFqBYC4SHw79mzrmD4C3no_vulRqVK8TbqyPFjZnmjWrVk9exZ5mx2TVfe3fv2SdeBA8w6BuEhQAAdHv1IKxBAAAEEEEAgBQWix40TDYQrlysnv_7-h2zeuk1Onz4jp06fNtNHjh2T5598UjYsWigNataQTBkzSq4c2aVxndqil4TMX7JU9BrpFKwiu_a3QAL7S5PAOlYhgAACCCCAAAIIuAT2H7xyeYZekvF648aiSW8Y1KBapxcuWy7_nDwpf7uSK7v7v14nfc-dd5r5i5cumTGD0BcggA79PqQFCISzAG1DAAEEgkLg3bfqysRBgxzp7jsLyu158phlpZ4uIW26dJESFSrKmX__FeufBtQ_bNhgntiR7pprrMWMQ1yAADrEO5DqI4AAAggggEDKC9x6882iAbM9ZcqQUbJkzmyWZ8t6ozz35JOmIs07dJAfN2yUnzZtFj1jrQtrVamiI1KYCBBAh0lH0gwEEEAAAQQQ8J9Amqirh0hp0zjzlH_hBWlat67oj6nUff99qdWsmaxc-4N88HYDKfPcc_6rHHsKuICz5wNeHSqAgH8F2BsCCCCAAAJJFVg1a6YM7NL5qpsN7dlDxg_o78hXp3o1mTN2jEwZFi2Th0bL2rnfyBuVK0saj2DbsREzISdAAB1yXUaFEUAAAQQiQIAmhrhAwXz5zbOi-QXCEO9IL9UngPYCw2IEEEAAAQQQQAABBOITIICOT8VaxhgBBBBAAAEEEEAAAQ8BAmgPEGYRQACBcBCgDQgggAACKSdAAJ1ytuwZAQQQQAABBBBAIGkCIZGbADokuolKIoAAAggggAACCASLAAF0sPQE9UAgmASoCwIIIIAAAgh4FSCA9krDCgQQQAABBBAINQHqi0BqCBBAp4YyZSCAAAIIIIAAAgiEjQABdNh0ZTA1hLoggAACCCDgu8ADnVsKKTAGvvdaZG1JAB1Z_U1rEUAAAQQSEmAdAgggkAgBAuhEIJEFAQQQQAABBBBAAAFLIBgDaKtujBFAAAEEEEAAAQQQCDoBAuig6xIqhAACoStAzRFAAAEEIkGAADoSepk2IoAAAggggAACCQmwLkkCBNBJ4iIzAggggAACCCCAQKQLEEBH-hFA-4NJgLoggAACCCCAQAgIEECHQCdRRQQQQAABBIJbgNohEFkCBNCR1d-0FgEEEEAAAQQQQCCZAgTQyQQMps2pCwIIIIAAAggggEDKCxBAp7wxJSCAAAIIJCzAWgQQQCCkBAigQ6q7qCwCCCCAAAIIIIBAoAViA-hA14TyEUAgVQSmzJkjIyZM9FpWtwEDZcmq1XHWnz9_XlasXSud-nwpvaOjZdWPP8bJwwIEEEAAAQQiQYAAOhJ6mTYiECNw7MQJ6TFosKxZvy5miXO0buNGGTtliuzYtcu5wjXXoXcvafxRa5m9cKEJwBt-2Mrkda0K-H8qgAACCCCAQGoKEECnpjZlIRAggfWbNkmXfv2lUt16cvrMmTi1mL1ggbTu3FnqvPd-nHW6QM82z5q3QKq-_LIsnz5Nfpj7jRQr8qDo2eqde_doFhICCCCAQNIF2CJEBQigQ7TjqDYCSRHYsOUXWbRiuaRLlzbezRYsWy4__vyzZMt6Y7zrZ82fb5Y3qVtH0qZNK-nTp5fa1aqK_vtuxSodkRBAAAEEEIgYAQLoiOlqGupVIAJW1H6tqsyfMMGkzJkyxWlxn886mHXDevWIs04X7NizR4rcd69clyWLzpqU95ZbzPj3nTvMmAECCCCAAAKRIkAAHSk9TTsR8FHg8uXLsvX3PyRn9uyOPdycM6eZP3L0uBkzQACB1BegRAQQCIwAAXRg3CkVgZAR-OfUKVPXTBkymrE1SHfNNaJns8__d95axBgBBBBAAIGIECCATnY3swMEwlsgS8wlHwcOHY7TUL0hMVvWrHGWswABBBBAAIFwFiCADufepW0I-EFAbxrMlvVG2b1_r2NvR44dM_O35rrZjBmEoABVRgABBBDwSYAA2ic2NkIgsgSeeby4HP7riGzftcvd8CWrrjx949GiD7uXMYEAAggggEBqCAS6DALoQPcA5SMQAgIVS5c2tdRnRS9bs0b0mdCf9eot9xYqJMWKFDHrGCCAAAIIIBApAgTQkdLTtBMBm0CaqPhf-lFRMZncE1fm7_-_u6Xzx63N0ziafNxG2nTtIgVuv116ffqpeSb0lVwMEUAAAQQQiAyB-N9FI6PttBKBiBRYNWumDOzSOd625897m2xYtFDqVHstzvrSzz4rP3w7V8b26ydzx42TqcOHSa4czkfbxdmIBQgggEAwClAnBJIpQACdTEA2RyCSBNKnSyd6NvqWm3NFUrNpKwIIIIAAAg4BAmgHBzOpKEBRCCCAAAIIIIBASAoQQIdkt1FpBBBAIPQFlq5eI5379hO9OXXGvHly7ITzVy31qS-Dx4wVz7Ro-YoAN57iEUAg0gUIoCP9CKD9CCCAQAAEBo0eI--2aSNfTZ8uS1aukk-6dpO33m8u_549667NDz9vkAEjR8ZJC5cvc-dhAgEEEAiEQMgG0IHAokwEEEAAgeQL7Dt4UAaOGiV331lQpg4bKsumT5PPP2wp23fvln7DR7gL2HfggOTJnVu-mzLZkdo0a-bOwwQCCCAQCAEC6ECoUyYCCESyQMS3_adNm4zBa-XLS4F8-eSatGmlbMmS5qkuy7__3qzTwa59--SuAndItqxZHSlzpky6moQAAggETIAAOmD0FIwAAghEpsDR4ydMwwvmy2_GOoiKipIH77tfdruC5nPnz-si2blnj2TJlFmmzf1W-gwbJpNnz5YjR4-ZdQwQQCAQApRpCRBAWxKMEUAAAQRSReDW3DebctZt3GjGOtCgefPWrTopeunGfxcvil7qMXP-fGnfvbsMH_-V6K9fvlyrlvy4IXY7swEDBBBAIJUFCKBTGZziEEiuANsjEOoCjz_yiGTLeqP0GjJEPu_dWybOmCG1m71nAmZtm551PnrsuE7K08WLy6KvJ4n-ANCnLZrL6TNnpEWHz0QDbpOBAQIIIBAAAQLoAKBTZGQLPNC5pZACYxDZR17wtD5TxowypHtXcxPh17NmS6cv-8r5C-el1NNPmUrmzJHdXA-tv4rZ57MOkj1bNtHrniu8-KI8XuwR87i7nbv3mLwMQkqAyiIQNgIE0GHTlTQEAQQQCB2BO_Pnl4mDBsny6dNk6bSpMjk6Ws6dOydF7rtXoqKizOPs9LnQly5dcjSqyD33mnn74-7MAgYIIIBAKgoQQKcidlAURSUQQACBAAusXPuDFC_3skycOVOuv-46yXr99XL4z79Ef1jl_kJ3m9pNnjNHnqlUWdZv2mzmrcGS1avN5O15bzVjBggggEAgBAigA6FOmQgggEAECxQ3RAqxAAAQAElEQVTMl89cy9wneqhs275dftuxQ1p2_NxcF12nejUjo9dJ60TrLzrJklWr5Zdtv4leM71l2zapWPpFk1fXkxBAAIFACBBAB0KdMhFAAIEIFsiVM4f54RS9IbBK_QZSuV5983i6Tq1buQLjrEbmjttuE73-OVeOHNK0bVup1qiRjJw4Scq9UFKau6ZNJgYIIIBAgASSGEAHqJYUiwACCCAQVgLlSpUy1z-P6fulTB4aLXPGjpHHHn7Y0UZ9AseYvn1lwcSJMn5Af1kxY7p83vJDycIPqTicmEEAgdQXIIBOfXNKRACBQAhQZtAJ6PXPhe-5R_SGwoQqlzP7TXJvoUJyXZYsCWVjHQIIIJBqAgTQqUZNQQgggAACCCCAQNIF2CL4BAigU6hP9C7zTn2-lKZtP5HuAwfJH7t2xilp78EDMmbKFGnbpau5G_3PI0fj5GEBAggggAACCCCAQHAJEECnQH-MmTxZGn30kQmKN_7yq-h8pbr1HD8_u333bilb4w3pPmCgfP_TetFgu3azZnL0-JVf30qBarHLZAmwMQIIIIAAAgggcEWAAPqKg9-G5y9cED3jnCd3bpk3frwsnjxJ-nb83Ox_8OgxZnzx4kXp0LOn-WWtqcOHyfwJE2Rgl87mZ2x7DB5s8jBAAAEEEEDALwLsBAEE_C5AAO1n0r-OXrkM44n_FZObc-U0v6hV4tFHJVvWG-Xwkb9Mabv27ZOfN2-R1yqUlwK3326WFS9aVArf838yZ8FCOXvunFnGAAEEEEAAAQQQQCD4BAig_dwnt-TKJbfnySOz5i-QvQcOyH-us81zFy-WYyeOy9OPP2ZK23_woBkXe_BBM7YG-fLkNZMHDh82YwYIIIAAAggggAACwSdAAO3nPomKipKP3m1ifmWrbM03pESFitKqYyfRSzpqvPKqKW3P_v1mnD3bjWZsDfLlvRJAn_j7b2sRYwQQQCDAAhSPAAIIIOApQADtKZLMeT3j_N2KlWYvmTNlkofuv99M73OddV60YrmZti7zuPbaa828Nch245Vf4NLrqK1ljBFAAAEEEEAAAQR8EEjBTQig_Yyr1zZPnDlTSj39lCybPk36deooK2fOMNdADxkzTvQGwhuyXGdK_cvjsXX_nDxplme97nozZoAAAgikhsADnVsKKTAGqdG_lIEAAv4XIID2s-n6jRvNHiuWLi3XpE1rprNkziwVy7xoroPesu03uemmbGb5gUOHzNgaHPrzyk2GObLfZC1ijECoC1B_BBBAAAEEwk6AANrPXXrDDVfOHu_Yvdux55179pj5rK71jzxQxEyv_OEHM9aBXvrx7XdL5O47C8pNN96oi0gIIIAAAgggEDABCkbAuwABtHcbn9Y89vDDZrsBI0fJoNFj5MefN8iAkSNl8YqVUuS-e83NhLfcnEueeuxR-WbRYneeFh06mDPUDd94w2zPAAEEEEAAAQQQQCA4BQig_dwvt916q_T_opNkyZxJBo4aJXU_-EAGjxlrgueOrVpJmjRXyDu1bm1uMLTyaIDdtG5debp4cT_XKLR3R-0RQAABBBBAAIFgE7gSzQVbrUK8Pk8UKyazR4-WSUMGS3SPbjJr9CgZ0auXOftsNS1Lpkwyoncv8yuEY_p-KT_M_UbqVK9mrWaMAAIIIBDaAtQeAQTCWIAAOoU6N3369FKoQAEpVuRB0bPS1plnz-Jy5cguhe-5RzS_5zrmEUAAAQQQQAABBIJPILwD6ODzpkYIIIAAAggggAACIS5AAB3iHUj1EUAgPAVoFQIIIIBA8AoQQAdv31AzBBBAAAEEEEAg1AQior4E0BHRzTQSAQQQQAABBBBAwF8CBND-kmQ_CASTAHVBAAEEEEAAgRQTIIBOMVp2jAACCCCAAAJJFSA_AqEgQAAdCr1EHRFAAAEEEEAAAQSCRoAAOmi6IpgqQl0QQAABBBBAAAEEvAmEfQD9QOeWQgqMgbeDjuUIIIBAigmwYwQQQCAVBMI-gE4FQ4pAAAEEEEAAAQQQiCCBlAigI4iPpiKAAAIIIIAAAghEmgABdKT1OO1FAIEEBFiFAAIIIIDA1QUIoK9uRA4EEEAAAQQQQCC4BahdqgoQQKcqN4UhgAACCCCAAAIIhLoAAXSo9yD1DyYB6oIAAggggAACESBAAB0BnUwTEUAAAQQQSFiAtQggkBQBAuikaJEXAQQQQAABBBBAIOIFCKCD6BCgKggggAACCCCAAALBL0AAHfx9RA0RQACBYBegfggggEBECRBAR1R301gEEEAAAQQQQACBWAHfpgigfXNjKwQQQAABBBBAAIEIFSCAjtCOp9kIBJMAdUEAAQQQQCCUBAigQ6m3qCsCCCCAAAIIBJMAdYlQAQLoCO14mo0AAggggAACCCDgmwABtG9ubBVMAtQFAQQQQAABBBBIRQEC6FTEpigEEEAAAQTsAkwjgEBoChBAh2a_UWsEEEAAAQQQQACBAAkQQEuA5CkWAQQQQAABBBBAICQFCKBDstuoNAIIICAiICCAAAIIBESAADog7BSKAAIIIIAAAghErkCot5wAOtR7kPojgAACCCCAAAIIpKoAAXSqclMYAsEkQF0QQAABBBBAwBcBAmhf1NgGAQQQQAABBAInQMkIBFiAADrAHUDxCCCAAAIIIIAAAqElQAAdWv0VTLWlLggggAACCCCAQEQKEEBHZLfTaAQQQCCSBWg7AgggkDwBAujk-bE1AggggAACCCCAQIQJBCyAjjBnmosAAggggAACCCAQJgIE0GHSkTQDAQRSTYCCEEAAAQQiXIAAOsIPAJqPAAIIIIAAApEiQDv9JUAA7S9J9oMAAggggAACCCAQEQIE0BHRzTQymASoCwIIIIAAAgiEtgABdGj3H7VHAAEEEEAgtQQoBwEEYgQIoGMgGCGAAAIIIIAAAgggkBgBAujEKAVTHuqCAAIIIIAAAgggEFABAuiA8lM4AgggEDkCtBQBBBAIFwEC6HDpSdqBAAIIIIAAAgggkBICcfZJAB2HhAUIIIAAAggggAACCHgXIID2bsMaBBAIJgHqggACCCCAQJAIEEAHSUdQDQQQQAABBBAITwFaFX4CBNDh16e0CAEEEEAAAQQQQCAFBQigUxCXXQeTAHVBAAEEEEAAAQT8I0AA7R9H9oIAAggggEDKCLBXBBAIOgEC6KDrEiqEAAIIIIAAAgggEMwCBNCJ6x1yIYAAAggggAACCCBgBAigDQMDBBBAIFwFaBcCCCCAgL8FCKD9Lcr-EEAAAQQQQAABBJIvEMR7IIAO4s6haggggAACCCCAAALBJ0AAHXx9Qo0QCCYB6oIAAggggAACHgIE0B4gzCKAAAIIIIBAOAjQBgRSToAAOuVs2TMCCCCAAAIIIIBAGAoQQIdhpwZTk6gLAggggAACCCAQbgIE0OHWo7QHAQQQQMAfAuwDAQQQ8CpAAO2VhhUIIIAAAggggAACCMQVCO4AOm59WYIAAggggAACCCCAQEAFCKADyk_hCCAQrgK0CwEEEEAgfAUIoMO3b2kZAggggAACCCCQVAHyJ0KAADoRSGRBAAEEEEAAAQQQQMASIIC2JBgjEEwC1AUBBBBAAAEEglaAADpou4aKIYAAAgggEHoC1BiBSBAggI6EXqaNCCCAAAIIIIAAAn4TIID2G2Uw7Yi6IIAAAggggAACCKSUAAF0SsmyXwQQQACBpAuwBQIIIBACAgTQIdBJVBEBBBBAAAEEEEAgeATiC6CDp3bUBAEEEEAAAQQQQACBIBMggA6yDqE6CCCQHAG2RQABBBBAIOUFCKBT3pgSEEAAAQQQQACBhAVYG1ICBNAh1V1UFgEEEEAAAQQQQCDQAgTQge4Byg8mAeqCAAIIIIAAAghcVYAA-qpEZEAAAQQQQCDYBagfAgikpgABdGpqUxYCCCCAAAIIIIBAyAsQQPuxC9kVAggggAACCCCAQPgLEECHfx_TQgQQQOBqAqxHAAEEEEiCAAF0ErDIigACCCCAAAIIIBBMAoGpCwF0YNwpFQEEEEAAAQQQQCBEBQigQ7TjqDYCwSRAXRBAAAEEEIgkAQLoSOpt2ooAAggggAACdgGmEfBJgADaJzY2QgABBBBAAAEEEIhUgbAPoDe06iqkwBgk-kUVYRk5HgNzPKp7hB1qiW6u2pACc1wmupMiLCPHY2COR3WPsEPN5-aGfQDtswwbIoAAAgggcBUBViOAQGQKEEBHZr_TagQQQAABBBBAAAEfBcIggPax5WyGAAIIIIAAAggggIAPAgTQPqCxCQIIIOAXAXaCAAIIIBCSAgTQIdltVBoBBBBAAAEEEAicQKSXTAAd6UcA7UcAAQQQQAABBBBIkgABdJK4yIxAMAlQFwQQQAABBBAIhAABdCDUKRMBBBBAAIFIFqDtCIS4AAF0iHcg1UcAAQQQQAABBBBIXQEC6NT1DqbSqAsCCCCAAAIIIICADwIE0D6gsQkCCCCAQCAFKBsBBBAIrAABdGD9KR0BBBBAAAEEEEAgxAR8DqBDrJ1UFwEEEEAAAQQQQAABvwgQQPuF0ftOLl26JDv37pGNv_wqJ0-d8p6RNQikkgDHpKSSNMUkVoBjMrFS5EstAY7J1JIO3XIIoFOo7_49e1badO0iD5YsJRVq1ZGaTZrIE-UryEs1asqSVau9lnr0-HFp3bmz7N63z2seViDgi0BSj8lTZ87IxJkzpW2XrtLis89kyJixcuKff3wpmm0QiFcgqcfkgUOHZeTESfJRp04SPXacbNm2TS5evBjvvlmIgC8CST0m7WVs-nWrNProI3Nc2pf7d5q9BYsAAXQK9MTxv_-W-i1ayKx5C6R40aLSplkz6d7uE6lX43XZd_CgNG3bVkZMmBhvyVPnfCNzFiyU4yf-jnc9CxHwRSCpx-RpV_Dc2PVG0KnPl7Ji7Q-y0pX6jxwpFWvXlWMnjvtSBbZBwCGQ1GNy_6FD8nrjd6TXkCGybuNG6TdihFRv1FiatGkjerbQsXNmEPBBIKnHpL0I_ZvZqmNH87fyxN-caLDbhOs0AXQK9OzQcePNJRsNataQAZ2_kMrlykrJEiXkndq1ZeqwoZI5UybpHR0tew8cMKVf-O8_0W30k6u-KZiFDIJWIBQrpseXXkaU2GNy8fKV8vPmLdK4Vi1ZPHmSLPp6ktSqWsUEz2MmTwlFAuocZAJJPSYnz55tjr-BXTrL_AkTZNn0aVLkvntNwPLb9h1B1jqqE4oCST0m7W3sPSTanCCzL2M6vAUIoP3cv3-fPCljp0yRPLlzy1uvvy5RUVGOEgrkyydN671llukbgk5cuHBBJs2aKX_s3GmCa11GQsBfAr4ck5u2_mqK16A5KipKMmbIIDUrvWqWaWBtJhgg4KOAL8fk-k2b5O47C5pv9bTYG667Tl596SWdlD-PHjFjBlcVIIMXAV-OSWtXy9ascb2Hz5KXSj5vLWIcAQIE0H7u5N937DR7LP3cOC9_nAAABrhJREFUs5I-XToz7Tl48ZlnzCLrrEmmjBnNGRU9q9K84dtmHQME_CXgyzGZN8-t0sh19jl9-vTuahyNuXTjuiyZ3cuYQMAXAV-OSf0G79MPmruLu3z5sqz96Wcz_8C995oxAwR8FfDlmNSyjrn-Lrbr1kPKPv-8SbqMFBkCBNB-7ueDhw6bPd56881mHGfgWqBnTvQyjj3797vm-I9Aygr4ckzWrFRJ9HIPq2Z6dka_otT5Uk89pSMSAj4L-HJMPlKkiDkDfeToMXmn9cfyQrVqMnP-fGlSp47o31ThHwLJEPDlmNTiPuvVW0fS8p3GZswgcgQIoFOor69Nf63XPeuZE73hIGPGDF7zsAIBfwv4ekzq15OV69WTVT_-KNUqVJCXXGda_F039hcaAv6upU_HZJSYJ2-cOn3GVOfbJd_JwcNXTlyYBQwQSIZAUo7JGfPmyeIVK6VT61Z8iEuGeahuSgDt557LmfMms8f9Bw-acXwDPYOiy_PecouOSAikqICvx6Sedf6g_afS5OM2ku6adNL_i07Sqsk7ca7rT9HKs_OwFPD1mFSM7Nmyid5IuHz6NHOTq371PmPefF1FQsBngaQek3rpxiddu0mxIg_KdZmzyOat22TX3r2m_B1798ivv_1uphkEjYDfK0IA7WfSfHluM3uct3RJnEcrTf_2Wzl77pxMmzvX5Cnx6KNmzACBlBTw5ZjUH_2p3rCRLFy-3FwLPW34MHmiWLGUrCb7jiCBpB6Tfx45Ki06fCbzlyx1K6VNm1aqlH_ZzP-0eZMZM0DAV4GkHpPWo2bX_vyTvN64sUld-vU3xXcfMFBea9jQTDMIXwECaD_3ba4c2aXMc8-KnhXRp3FYu9_6-x_Srlt3ebNpUxk5aZJ5SkfZkiWt1YwRSDEBX47JcVOmij6z_POWH5proe03E_pcUTZEIEYgqcdkpkwZZf7Spe6TDzG7kT927jKTuXPmNGMGCPgqkNRjMo_rG-SJgwaJPbV9r5kp_qMmTWTSkMFmmkH4ChBAp0Dfvv3GG-ZxdD0GDZb32rVz_dH_Vk6c_EeefeJx0UBar3-uVKaM62vxa1KgdHaJQFyBpB6Tq9evMzvZf-igDBo9xpH0uj-zkgECyRBIyjGZJVMm0ZtX9Tp8fVa-Pkpx_LRp0qFnT1ODsiVLmTEDBJIjkNAx6fnefW369OamVn20opVuz5PHFK-XZxYqUMBMMwhfAQLoFOhbfRHNGDFCHi_2iLnBoH337tKgRUszres09Rk2TKznQNurEBUVZZ9lGgG_COgxl9hj8vyFC6IBihY8cPRoGThqlCPNnr9QV5EQSJZAUo5JLahFo0byyAMPSPTYceabPP26_MixY9KhZQsp-kBhzUJCIFkCST0mPQuLkiizKCrNlbGZYRC2AgTQKdS1ObLfJAO--EJWz54l4_r3l0Fdu8j0kcNlxsgRMnHwIKlY-kXJkjnu83Qrli4tGxYtFP2FrRSqWojulmonVyCxx2T6dOnMMajHYXwpuke35FaF7REwAok9JjVzTtff1Oge3eXb8eNkeK-eMnlotPmFzPIvvKCrSQj4RSApx6RngUWLPGD-dhYvWtRzFfNhKEAAncKdqj-Sct_dheSxhx-W_Hlvk6ioKPOrbu2bNxfrB1VSuArsHgGHAMekg4OZIBBI7DEZFRUluXPlkocLF5Y78-c3f0uDoPpXrwI5Qk4gscdkyDWMCvtNgADab5TsCAEEEEAAAQQQQCASBCIlgI6EvqSNCCCAAAIIIIAAAqkgQACdCsgUgQACCPguwJYIIIAAAsEmQAAdbD1CfRBAAAEEEEAAgXAQCOM2EECHcefSNAQQQAABBBBAAAH_CxBA-9-UPSIQTALUBQEEEEAAAQT8LEAA7WdQdocAAggggAAC_hBgHwgErwABdPD2DTVDAAEEEEAAAQQQCEIBAugg7JRgqhJ1QQABBBBAAAEEEHAKEEA7PZhDAAEEEAgPAVqBAAIIpJgAAXSK0bJjBBBAAAEEEEAAgXAUSNkAOhzFaBMCCCCAAAIIIIBARAsQQEd099N4BBDwJsByBBBAAAEEvAkQQHuTYTkCCCCAAAIIIBB6AtQ4FQQIoFMBmSIQQAABBBBAAAEEwkeAADp8-pKWBJMAdUEAAQQQQACBsBUggA7brqVhCCCAAAIIJF2ALRBA4OoCBNBXNyIHAggggAACCCCAAAJuAQJoN0UwTVAXBBBAAAEEEEAAgWAVIIAO1p6hXggggEAoClBnBBBAIAIECKAjoJNpIgIIIIAAAggggEDCAklZ-_8AAAD__4_hxoEAAAAGSURBVAMAM7QYVHi2Z1kAAAAASUVORK5CYII"
        },
        {
          "id": "AAAAACxHlaFkI7KHQmM7m1Serwk1SYfKFFpqO3cz-qlHoUfziqAkxQklAPCPOFdDd9JkK2c070paH3-fSKgVJ4USbWfEtA",
          "mime": "image/png",
          "data": "iVBORw0KGgoAAAANSUhEUgAAAPYAAACQCAYAAAA7v5aPAAAQAElEQVR4AexdBXzVNxc9j4-iA1rcHQYMZ8iwASsw3DoY7u6sOBSH4i5FiktxZ4xSnMHwIQNaSrEiQ4qMYYMv57bv8VoK9FUfbfj1xm6Sf3KSm9zcvC2x3HZveacp_DHYeOA3jWsY5pbGL2xzMhbUvzLfloCm8MOgRMFvFapA7P_F1riGYm5p_MI2F4lfLJmB2tEIaASiFQJasKPVcOrOaAT8EbBmwfZvoXY1AhoBixHQgm0xZLqARsD6EdCCbf1jpFuoEbAYAS3YFkOmC2gErB8BiwT79p27uHHL1_p7FfEtjLAv3H_wEEeOH8fG7Ttw7ORpMB5hH_tMxa9evYKX91W8ePHiMzmth805evD3I9i0_VccPX4C_zz_13oaF4ktsUiwZ8xfAKfRzqbmrVy7AecvXjTFdSD0CLz57z-4LFyCuk1boI_TcCxbtRq_DHKS-IKly0F-6GsPecm9Bw_Bfd9-KXD77j206tId3teug__MeYxbE3ERmu26EA1atcWAEaOxYOkK9HYahoat28sCGda2-j1-jIUrVuFvtfCGta7IKB8rLB9ZvGqVEuzLYalClw1AYOpsFyxfsxb9enaDx5YNWLtkIXZtXIsubVtj8Uo3TJ87PyBnxHr7D_-O3Xv3yUdSp0qJeVMmIWumjBI350mCFTlzFy0BNxqnvo7Yu3UjNq9cAjfXeciZLasskLdu3w5Ta_0eP8HCZSvwMLoLdv_ho_BcqTmr129QE3KdgEbwBo9yhkOzlujRfxD2HDgo6XS42rko8Ok3btsBjoOGqkXhIlat2wDGm3XojF_dPZg1xtFNX19RHVs0bICqFe0R-3__EwzixomD-nVqofqPlbBhyzbcu_8A-w4dFuwkQ4AzeeYcrNu8RWJv377Fui1bBf-aDZth-LgJOHnmT-HRIf5LlDawSC0WRtzXq7rJY9rhP47h1NlzGDJ6LPz8HmPekmW4e_8-gvJGT5oC7pAsZ6Q5rosxduo0YzTS_DtKs1i9cTMa_-QA--_LIlYs__0qTepU-KVLR5QvUwqcm2wQMWTffnRoIPOUc_LFy5dk4d27d9iwbTu69O4HYsc5zrrv3ruHERMmSh5n1b8_Tp6UsDU7_giEooXlSn0npXJ__TW-UeT32A-tu_aA5xVvNKhbB-nSpMGQMeOwe_8ByXfj5k0sX70W-9XEtC9fDpdVvo69-mCFUucZT2pnh9Fqsjx89EjyxyTnoqeXdLf0d_6YSsTMKV-6tMSuXb-BBw8fIejE8rx6Fb7K_sFM7nv3YersuciUMQO6tW-DJ0-eYfTEyXilzsvkcxzmK2H1UOq2Q60a-E8dAaYobcHb5xry5sqFdGnTIGXy5ChT8jtwwvNb__zz_AMe83CH_Pfff1kteA5fsXYdUqZIKfHIdLyvXZPPlSxeVHxzh8I9rH9fFCtcGC8VBp16OeLq9evo1bkjHGrVlDk5dY6LFDlz7gK4SHIhaN6oPq7fuIHh4yciQfwEKF2smOQpUfRbpEoZ-X2Uj1vghFqwK_9QAQkSxEe-b_KgYP68WL95m-zgsyeNw0-1a6J3t84oVbwo1m3eamoO888c74yWjX5G0wYOkt6zUzuJd23XRuI-avJKIAY5d9WOw-6mTJGM3geUIllSSXvk9_lF79Wr17Jz9ezYHvblyqJd86ay03t6e0sddDgOsyaMQ53q1TBzwlgmyWT_tlABZEqfXi3KqaWsMAKcoLzvS5cUzokAbeDEmbMSL1_KP10ikeT8rTQZfipFsuDxI4-0Z_9BwcKpjyMqqc3l53p10LlNK2zb6Y5Hfn44-PvvMqd_tLdHvRrVMbR_H-TLkwvx4sdD-bJlWAXKlSwpGEnEip1QC3bQPv3l6SmguK3fBKpkpMdPn8Hbx8eUNVeOHCpPAonb2dqKX6RgQfFtkyQW__m_X44FVhocDk7CrxJKLS8DVEKJmDl-T55KzNY2ififcqi2_2hfQQw9I8dPgqMyIDH_27fv6AnlURrWVwHftE3iX-eTJ0-EF1InR9asyJAuLQ4cPiJFDh75HZmVlpA54DwuiZHkJLW1lS9xR5bAR5wrPj5q_sVH1syZTDny5Ppawjd9b6NqpYqyOdVr1gLjp83E7dt30apJY9jEji15viQn3AT78eOniGMTF1TNjJQjSxZwZzcCkjChv1Ab4_TjxYtLL0ZTmgDV7opSh82BMF7VnL1wQZLTp0krflDnoVLPjWk8Lzdt3wknTp1GCqVSt2jUwMgy-fHVDmSKhCHwo_0P2Hf4sKjhew4cCjTWYajW4qJp06SWMlcDVHKJBDh-asEqW7Umlq1eg6fPnoFHCOMZnFnevXtLT53LDSLwrjOmolbVH3Hi9BkMGjUGPQcMFv6X5sQKrwZnTJ8Or16_RPeO7dCzcweh4kWLfBFqS3hhENp68uXJLTvJUmXUMl5rPVHaDq9qaBGntZxqNSfw_wIMa6_fvJHP8Wzre-eOhN8p48_qDZvEWDRDHXnat2yG7FkzCy8inLLKzkID6qIVbrLTlQtQzz_xrQhhpVeag20SW7it3_jBteBvu_fINwvkzYvUqVKBR73HT_01IDIuel6hh1TKNsC770fKYNixVUuscp0LWtjPXfgLlwPySMYvxAmTYHOH9lbqDVfFCt-XkcGdt3gZaEncudsDtMje_fvvLwSKqGtmggQJ1Fm4mboluIRufQeABqunz56iWJFC6j52ueDayKGeNJBnYAZoALuqdqhJs-YwKmQwGJDwqwRqZ_oHfure9bKXN6a6zBPe8-fPxf-cE0dZ4q_fvAVagoPmDcpjW3Jkz6oMoOvwjVJpaTANWiYy4rw96NO9s-DXb8gIHD91Rn5Ys2LtesyYt0AZAkuos3JufF-yhDRnmdsa-eHKNWXQXa9sQKWULSi5smPcf_AAU2bPwek_z4kWcvee_9ylAc7GJraUveTlJVqpRKzYsUiwYxliIdb_3hepXtke239zh8vCRShZrChaNmkE7i71W7bBqIlTULpECfAK51P9NxgMwjYYAvuSGIOcujWqgTsEF0peBXK3_s1jj5xjaewaN3UGHjx8iDy5copRcqWatM07dsVjdb-aV-34_ugBLRv-jAuXLqnrmqZo060H7Mt-D559-WMNWrc_CmkA_qVLFJdfF3Z27GvKajD41x4cr3L58pKvWuXK4keVw7b17toZ5y7-hV4DB8sPa-a4LhJD7mDHXtKsLJkywbFLJ9nZq6jrrqbtOiFxokTo2amj8KuoowXtHN36DUCluvVVvk3ooYyQiRJ9hbSpU4M4T5gxCwd-97crSCErdWJZ0q4RA_thwbQppiLtWjTDjrVuqvMdJI3W7q1uK-AyZSLWLFqAQY49ET9-fOHREjlq0AAJ06FquX_7ZpNhgtddjHP1JD8mEu9gt69eiVUL5oKq9Ir5c7Bs7mwsdZmNHNmyIl68-OCuOWbIYGxasQSbVy3D2GFOmKUs210CbhVKf1cCW1Ytx8KZ0-C-aR0aOtSBqwrzBy-0cQQdB-JM3OtUq8qgWoyLyw9jFs-eiUwZ0oO83DlzfMCTBOUkVNqG8kT9px-VVKNKZen70rmzwLMyf-DD25Z48eKZmlVTnZ85Z-dNmSRz1GXKBKRMkVz4POqsmO-CRbOmS_lNKxajrlpwyTQYDILzFrfl-EHdlTPNmskiwQ6uIwnVlRdVISMvsVrdOBFSpUxhTNK-BQjEihULnGD51TVi-rRpYTAYkEKpib3V9SGxNlbFWwXbxImN0UA-rbjZsmRWxkwbSecPXlIm__RVkGQMcDieXAQCooE8I8_vsZ8cGZYqtZY_ojFvW6ACkRxh33lEyJ41C9jW4D7Ptn6dM7u6j04h-AbkEY8LJ63mLG8wGCTN3EmidnijncM83drCYRZsa-uQbk_kIHDj1m35BVyhAnnRpL7_-T9yvqy_EhIEYoUkk86jEQiKAC35VNP7du8GWqSD8nU8ahHQgh21-OuvawQiBAEt2BECq65UIxCuCFhcmRZsiyHTBTQC1o-AFmzrHyPdQo2AxQhowbYYMl1AI2D9CGjBtv4x0i3UCFiMQCQKtsVt0wU0AhqBUCKgBTuUwOliGgFrRkALtjWPjm6bRiCUCGjBDiVwuphGwJoR0IIto6MdjUD0QkALdvQaT90bjYAgIIJ94PgRaAo_DI6cPi7gvvnvjcY1FHNL4xe2uUj8RLBlFmonXBHgf1cdrhXGsMo0fmEbcBHs-hWqQ1P4YVC7rP__Jsgmtk044Bp-7fpSxljjF7YxJ34i2GFbG3RpjYBGwNoQ0IJtbSOi26MRCAcEtGCHA4i6Co2AtSGgBdvaRuSLao9urLUioAXbWkdGt0sjEAYEtGCHATxdVCNgrQhYJNgXvbzgc-PGB3159s8_IO_Nf_99wAtrgpePD3zv3glrNcGW5_vPbLfxHaxgM-lEjcAXiECIBZsPpNdo0QwVGzbAX16egbp69NRJkPfg0aNA6R-LzF-xAqfPn_sYO1D60InjsXjNmkBp4RXhIsV237t_P7yqDHM9xKV49Wp49epVoLoOHTuGFj27o2Ale1So74DR06biWQjf4wpUUQyIEJuClewD9fSPU6cwwHk0iG2nAf2wbbd7IH7QyFb3XWjVqyfK1KmFboMHwevqVVMWbmAzFy1ErVYtRB6GTpyAp8-emfjWEAixYJs3dqCzMyjo5mmWhGcscsWp8-ctKRLt8565cAHL1q1Dr2FD8dDvEd6Z9ZhaBYX6zZs3GDdwMFr_3BALV7thodsqs1w6SAR2Hzwo2Pxjtujd-ftvNO7aGQkTJMSUYcPwddZs6DHECYeP-__0l-XMac_hQ-g5dAiKFyqEiU5DwV_BObRvizv37km2SS5zMG_FcrRt1BhOPXvh-J9n0LxHd7x7Zz5qkjXKHIsF26FadZy9-BdWbtz40UYTSK5y3F244k1QQFDtZYEO_fqCoLuuXIG5y5cxCddv3UKXgQNkdWzarSt27PGQdKPj9_gxHEcMl92Kq6Q5_6Xa2cbMmC5luRpzwPh9Y9nP8Y356FOAmqgJQI2C8QN_HJXVmv1o0LE9jp48yeQIoe0eu7HF_Te8fv36g_qPnDyhJmUCLJ02A5W-_x6N69ZD3SpVsUBh-Pbt2w_yx9SE23fv4pfhQ1GxbNlAEPy2b6_Eu7dug--KfItuyk-YIAF2Hzwg6UGdOUuXoEKpUmjftBmKKeEe7thb5uwWtYtzHlOou7dpi-r2FVGmWHH80r6DyMSZC-eDVhVlcYsFO2-uXGjTqBGGTZ4IcwEy9oCC9FO7NvC86o1hCpAW9RvARQE1XOVnnh_LlaOHAnm-QUFF3J1qtmyOC56X0bphI_DdJS4K5qrS-h3bpb5OzVuIykM-VVZWNNB5DFxXrUSHZs3Rp1Mn_PnXBTTt1gWvAgTkc3zWQaKq9XOnDogbNy6aOjiAdgOqYsmS2mFIz18QP148NFH1Mp35w5v6d-kKt9ku6NS85QdVGb188QAAEABJREFU58n5tezUBoPBxPNUqmHcOHFlNzElxuAA1WNqO43r1EXJIkUDIVG8UGGJT1swH5e9vTFr8SIR1FJFi0l6UOfSlStqt_YvQ17iRIlkYWX6zdu3mYQi-fKLT4dzlr7nVR96VkEWCzZb3blFKyS1tYNRWJlmpO27d4vATx46HLUqVRZh5aRds3UreAav_WMVAalIgQKyGi5du1ZAXuMyD1wERvbpK6vlkrVrjFUic4YMWDdvAdo1boLtS5dLutvmzeD7xpt-24mhvX5BYzWg9apWw5RhI8TAt_fwYXyOLxUpx_v6NaWqdUHBb77BzFFjEDdOHHCXVCzUrlwFdapUwQyV3kqpwPceRP55vFjBgrJTsz08e4-ePk12CKqCTNMEzFJnXr8nj2U3DorH19myiYbD40u1Zk0wZf485MmZE2WKFw-aFXwUnxplUlvbQLzc2XPgobIh3fC9Jem2SRKLTydd6jT08Oixn_ifdyI-R6gE-yulxlAAd-3f_4E6c_GKlwhuzqxZTa0v-E1eCVPQJGDm_KnUeqpF3HXHz54Fkt-TJ-DqaMxW_ruSiP2__0k0ntpRy5YoIcLr5eMjaUXyFxCfTu4cOejh6o3r-BxfMiqHOzM1h59r1QbrV0korVSs1ClSwEFpH9QQdihVuX2TJsiaMRPZUULHzpwWgw3P1tSGWjdsGCXtsLaPchGevtBVzsNclIO2b9POX0Gtj8cXl7HjZYO4cPkyeBwMmvfly5eSRA1AAgFO7NixkdTODlTFmfT2v_dHIOPrm3ZJAi8GzBdVFCrBZmN5juE5ZIAypJlbBJ88fYo0KVMGUhHfvvMHIVas96ok6yA98nusdsi4smtzpSRxdeQuSX5wZBy8p8-eCjtl8mTi03kXcOY0GAxKbf80n_lJNJIUzpcPo6ZOkXYwjQK-VmkJfTp1xu17d5VFdQx4hueKTn5kE-0RjTp3Utimws4VK9Godh0YDB_iGdntsobvLVq9WjaTcbNngkZGV7eV0iyGaSfZtHMnuEiP6T9AtMHeHTuhjFq4127fJvnMHTtbW4n63rkjvtG5__ABuFkls0sqSb7qPC8B5XDOKw85smSmZxUUasFm6wf36CUW3InKOMY4KV2aNLJTctdlnHT24kV6SJsqtfjmTtaMGfHy1UuxLg79xRGk77_7DtkyvgeJ529jGVoeac3MmimTqb7T5y8Y2XKGYiRD2rSf5TMfaXS_AfJd2gx4_mIaJ8ReZR2lustjgvuq1UzGBnXel0AkOkeV0W680ma6tWqNBRMnRanWEIndDvGnqtvby5GPmhspWyb_ucNw8qRJwbmYIlnyQJtN6pQp8PeDBx98w0btzNkzZ8b5y5dMPGpz1P5yZMmCbGrekXFJaab0SafOnaWHLFGozUkDzJwwCXZ6JcTc0SgQxjorK6stw7OXLJZ7Vp5fl6rzMnf3lMmTkyU79GVloHikrN3V1KBwl5401wW31Cq58dcdctXge_f9inlU3UHyKuiuum-mGsr8VKsKqDMxV-J5yrpO3kM_P8xQZy2q9uWU-v45vjRGOVSlqCU0c_hJLPW0jscyxMKgcWOxw8MD_754AeNVB89rqkik_u0-dFB2JC5mv-3fh5379grtUkehSG2IlX6surJOd23ZCkayL1NGWso4x_W7IkXEJsHbDhq_3A_sB20-9mX8ree8ruJxi_OPBevXrAWPQ4ewTu3oTBs-ebLgXyBPHiRT6jjn8lRliDt59iw8lZHYeeYMZWwrBD6Kz_LWQBYLtsEQoP4FtL75T_XBFS4gqtSRrBjRu49YqgtVskflRg1hmzgJhv3S25gF9WvUwNptW9V5eibKlywlBg-XZUtRzqEueo8cAXsFeBc1UMYCZZTaNMFlNkrXrglebTl26Igi-fOrBSIOpg4fCe_r14VXvHpVMXrNGz9BrNhU2T_FN9Zv7JLxGmTw-LEoUbiwoiLo5jQI-e0riEX8p-rVJc1YLiJ8Y1vMUT5-5owcEXiVx2tBI_GHFhHRhuhWJ-cSjy4zFrmi_E_10LF_P3yr7DJ91TGLfeWizStU45GyWT0HMbb1Gz1K5uTe3w9jjvNYJFUGY-Z3HjAI3NR4BVq1aRMmYdKQYeJbixNiweau5nnwsJztzBsfx8YGO5atAHmpAnZkGqFO_eaODfNdsX_dBqybNx-p1bnbWI73fuQP6eUoSVxZj-_YqfItkPwTBjshQfz4wls2fSZcJ03GCcX_dflKnFb1tm_SVHh0eDY-sGEjti5eCvJZT9ECBckS-hQ_V_bs0m7jEYErLuun6s3-Lpk6De5KBWf8vMdeUGU3GMxFTj4Rrg6xI5ZxlGXeWPH6-QuknUwPSsY82n-PQIOatQQvYwqvKmls5NwglrtXr8HyGTORIpm_bYY7PnHlfGAZjv3YgYNwdOt2bFm0ROZeicJFyBKyS5JE5ttutzUg7VrpBqM2KhmswAmxYFvaVlrO86o77zSpUgVr5CGfO6qxXgpV_ty5wfzGNHOfYPN8QzXbPJ1hLi5Ukck3Ws-ZbqTP8Y35gvoGgwG8o-Q1mLmgBc2n418GApwb-XLlRsa06cBfk32u1UltbUFh59wLLm_GdOlACo4X1WkRJthR3TH9fY1ATEYgegp2TB5R3XeNgEJAC7YCQf9pBKIbAlqwo9uI6v5oBBQCWrAVCPpPIxDdENCCHdkjqr-nEYgEBLRgRwLI-hMagchGQAt2ZCOuv6cRiAQEtGBHAsj6ExqByEZAC3ZkI27N39NtizYIaMGONkOpO6IReI-AFuz3WOiQRiDaIKAFO9oMpe6IRuA9Alqw32OhQ9aMgG6bRQiIYK_22ApN4YfBxv07ZRBev3mtcQ3F3NL4hW0uEj8RbJmF2tEIaASiDQIi2PUrVIem8MOgdtnKMkFsYttoXEMxtzR-YZuLxE8EW2ahdjQCGoHQIWCFpbRgW-Gg6CZpBMKKgBbssCKoy2sErBABLdhWOCi6SRqBsCKgBTusCOryGgErRMAk2FbYNt0kjYBGIJQIWCTYV65dA5-_MdKlK1fw-s2bUH7asmKvXr2Sb_O5HX6TbWDYslp0bo1AzEDAIsFu0aMbarRoZqLqzZuiaNUfMXzyJHmnKyIhu3H7tnz3sre3vKPFdlwyexgtIr8dGXXf8PUF348qXr2avOrJ53uu-9764NOvXr_GT-3bgk8PfcCMwQk3whm_re67wOeVy9SpJePidfWqCV0-sTtz0UJ50rhiwwYYOnECjM8DmTJFccAiwWZbHapVx9nde4T-2LZD3iReum4tZqmOkh9RxLeSNsx3ladMI-obUVUvJ4pDu7Y4d-kierZtC6eePeGpJlLfkSM_aNLkeS44ff483kSSpvRBA6wwIbzx23P4kDwMyeeVJzoNlVdDHNRiyje-2P1JLnMwb8Vy8CVWp569wEf9mvfoDr4ES741kMWCzadR-HY0iW8Y_VC6NPhk7ZVrPtIfdm7J2jWymlWo7wCnCePkGVMy-XJhw04dsf_IEVkNuTu17e0I89c6madDv74oWMkeTbp2Bl_ZZJ0PHz3CpLkuuH3vLoL-42o6bPJE2emoRbBM0DzWHL_k5YWHfo8wx3kcfq5VG9V-sEeHps1kwnhe9TY1fd-R37F--w7wPTJTog4gvPGbs3QJKpQqhfZqDIoVKoThjr3lUcQtahd_8fKlCHX3Nm3BN7_4YCTfojt78S-cuXDeakbDYsEO2vKTZ8-CalDZ4iWENUPt3COmTEaubNnRumEj7Dl0SFRHrqoEhatba8de-Dp7NtSqVAl8yXD09KlSlvyfO7YHF4n-XbrKu0gU2M27fsPzFy9w4I-jSuX5R_KaO0MnTcDV69cxqHsPFPwmL1jm8PHj5lmsOvxVwoTgC6VZM2UytdPnxg0J82epDHDx6-40GM4DBiBFUv_H5JiuCQhv_C4p21HxQoVN0CZOlAh8M47pN9WRkIwi-fLTE-L7bgx4XvXf3BiOarJYsN0PHJCdlLtpRXW-4FOi7HTFst_j8dOnmLZgPlo2-Bl8rbBxnbqYNcYZnKRHT5409dWxfQf07dQFA7p1R8v6DXDu4kXhbdvtLrv39BGj0KBmLXndkurQH6dOCT8456Ha6Y4qPlfOGhUrYmSfvujdsZMy6r0OLrtVpnFicKfmo3Fs4MZfd4C7RrnvSiJzhgzgoug4fKjsEHx2mHk0vUcgPPHjHP7n-XPwQb73XwByZ88Bao03AuwetkkSm9jpUqeR8KPHfuJbg2OxYCdO9BVy58gpVF5NvAFdu2HbkmXyjCh3TXbq5m1fjJ89S2iruzuT4HPTfwdipGjBQvSE0qdNq9RQf0C8fK7KysiXM4WpHD6jO6pvPxUK_i-prR2qVKgA55kzQDV_7vJlsC9TBt-X-C74AlacelPtBu379pY3wrkoThvhf8aevWQxrt28iX5Ki7Hi5kd508IDv5dK1WZHuJjSN1Ls2LGR1M4O1CqZ9va_t_SEjK9x2iWxlbg1OBYLdjEllAPVTkuSHVftzulSp5a-cKWTgHIYJhGoxmrnNn9ulOdzlUX-DIb37037PX6CpLa2wT67K5k_4owdMAjjBw0GFx0uKHxs__cTkaOKf6RJFicfOnYM1dUtg6cymi2aPBVDf3FE_HjxpB5qQQx0GdgfLXp2x8Fjf4BHDYbv3b9PVoyn8MLPztZWsPS9c0d8o3P_4QMx3CazSypJvnff23qeKE2ViTmyZKZnFWSxYH-q1WlSpRR2mWIlZGJyclItTqZWutQpUgjvU066NGnkvE712piv17AhsvMb40F97-vXMF9ZKKsqg5PL2PE4tXMX8uXKjcVr1gTNarVxvydP0FkJbZH8-bF18VKUKlo0UFt7tWuP-upoUiR_AZDSpEyJFMmSSThu3LiB8sbESHjiZ6N25uyZM-P85UsmKDkfvXx8kCNLFmQLsINcMrtqPXXurOTNkvG9jUQSotAJV8HOnD6DCJWr20oxdHkqi27_MaMxzXUBkiR6fyb5WH-rKpWaPKfx48H76pUbN2LLrl0CKNODI66grH-OUlc5ADwj_f3gPr7JmTO47FaZduLPM2J1LfVtUcFt5769MBL707FZc3Rt2cpEuXPkEEyYlkQZdqyyU5HYqLDiR4Muf0PAGxk2m4uohzL6rtu-DUwbPnmyHBEL5MkDblK0mE9VtiQajjnHeQykLciaxsIiwbaxsfmkmsyrsAlOTqARiJf7VZs2AVezuePGyxmcoAUlAwympKxqxRs3cLBM6mrNmmDK_Hlo17gJalaqbMpjMBhgMBhMcYLZrVVrTF_oKtdd5RzqqkmfVXY4UyYrD_Bemk0cM2M6ugwcEIhoeCQvKMUyWDR0QYtHq3hY8eP99I49HurG5Zng0qyeA-pWqYp-o0eB84k3N3Ocx6pjop3wndXRj7-roOGYc5yJk4YMo2c1ZNHs8Fi9FrQ6f6r1FE6qkztXrMQm10Vwd1sDoyWXaoznwVXkJgMAAAvkSURBVMPIY7abNqlXD6d_8zewsd46VargvMdeuK9ajcObNoOqPBcMY9n8uXODoLIeXm2xTFcl2Ic2bsYal7k4vmMnXCdNRqrkycn6Ioj3oOxPcMRdImgnOIlmjBodNPmDeExJCCt-vI8m9rmyZxfIaAzjrc7RrduxZdESnFBzqkThIsKjw99vcI7vVnObtGul20c3LuaPCrJIsEPaQAJDAacAx40TJ6TFTPniqDK8wmA9psTPBFIqQaagcwf_TFbN1giECAEacinsH5uHGdOlAylElUVypggR7Ejug_6cRkAjEAQBLdhBANFRjUB0QEALdnQYxS-wD7rJEYuAFuyIxVfXrhGIEgS0YEcJ7PqjGoGIRUALdsTiq2vXCEQJAlqwowR2_VFrRiA6tE0LdnQYRd0HjUAQBLRgBwFERzUC0QEBLdjRYRR1HzQCQRDQgh0EEB3VCFgzAiFtmxbskCKl82kEviAEtGB_QYOlm6oRCCkCWrBDipTOpxH4ghAQwV7tsRWawg-Djft3yhR4_ea1xjUUc0vjF7a5SPxEsGUWRp6jv6QR0AhEMAIi2PUrVIem8MOgdln__5WTTWwbjWso5pbGL2xzkfiJYEfw4qGr1whoBCIZAS3YkQy4_pxGIDIQ0IIdGGUd0whECwS0YEeLYdSd0AgERkALdmA8dEwjEC0Q0IIdLYZRd0IjEBgBiwT7yrVruOjlFSz9--JF4JqDifH9owePHgXD8U_6y8sT9x8-9I9oNygCOq4RCDECFgl2ix7dUKNFs2DJ_JGyj329Zc_u4HtIH-O36-2InXv3fIwdrdP5lM8ElzkoU6cW-HTM0nVr8fzff6N1n8Ozczd8fcH3t4pXryZPPXUa0A_XfW998IlXr1_jp_Zt0c1p0Ac884St7rvAZ6o4HqzX6-pVE_vNf_9h5qKFqNWqBSo2bIChEyeYngcyZYrigEWCzbbWqvwj-PRJUMqbKzfZmkKBwNu3b9Gxf19cuHQJo_r2h0O16piohJyviIaiuhhXhILm0K4tzl26iJ5t28KpZ094KkHsO3LkB1hMnucCvvX15s2bD3jGhD2HD6Hn0CHgQ3sTnYaCT0w5qMWAb3wxzyQ1NvNWLEfbRo3Vt3qBj_o179Ed7969I9sqyGLB5pM9fPokKPEhPvZo9ZbN8s5zwUr2aNK1M06fP8fkYGnZunWo26a10KLVboHyEKQla9fIqlihvgOcJowDn0tlJr4J3bBTR3AA2vftjanz5wmoyzesB9O5anfo11deSmR-a6fL3t7gMaVF_QYoW6IEfqpeQ_wtatew9rZbQ_sueXmBL63OcR6Hn2vVRrUf7NGhaTMROM-r3qYm7jvyO9Zv34HC-fKZ0oILzFm6BHxRs72qo1ihQhju2FteQ-V4vHj5EhTq7m3agm9-lSlWHHw77OzFv3DmwvngqouSNIsF--k_z3D91q1AZBS4NVu3YOBYZ5T7rqTaefohjk0cpfa0w7WbNz_o3IqNGzBs8kTY2MRGyW-_BV_WvPP336Z8M5SqM2LKZOTKlh2tGzbCnkOHVF1twdX55atXMmjt-vSG9_Xr-Obrr3HszBlRiapUqIAuLVviyjUf8G1tU4VWHMiWObM808rnh8-rXXuHhwdI9mXKWHGrAzUtSiNfJUyIEb37IGumTKZ28GjDCH_WS59zq7vTYDgPGIAUSZMx6aN06coVtVsXNvETJ0ok48P0m7dvS3qRfPnFp8N35uh7XvWhZxVksWBzwv3Q4CeY07zly6QzE-bMQZXyFeDYoaOsmrPGOAsgy9avE77R4W48df58cLVzm-0i-aePHGVk4_HTp5i2YD5aNvgZfPWwcZ26YF0crKMnT5ry8Viwc_lK2JcpC_f9--RbdatWQ9N6Dpg2YqSszK8_oXKZKorigE3s2BjcoycOHTuG2q1bms5_jevUi-KWfRmfp2BxpzZqjRt_3QHuutxgMmfIIJuB4_ChssOWL1nqk53i3Pvn-XMktbUNlC939hx4qAy_NwLO7bZJEpv46VKnkfCjx37iW4NjsWATrJWzZsOcCCp3bapDPJcYOxYvblwUzpsPV3x8jEni0_LNvGWU2ikJyjFfAa-qXVgl4eZtX4yfPUtoq7s7k-Bz84b4dGpUrCjnH4YdlPrKASlduyYGjRuLG7d80aNNO1BoyLdm8vLxQb_Ro_Bt_gKYNnwk-nXuIovUoHHO1txsq2vbTbWb8mjWe-QINFabARd3NnL2ksWg1tivS1dGP0kvlarNDNQM6Rsptlp8k9rZgao4097-95aekPE1TrskgRcDYUaRY7Fg87laTkBzypA2LZ48eypdSJk8hfhGJ7gdk-o8-anN8vLsnjBBAibLeUYCyqGwkgh4YzVYGdOlU6n-f-ZP5ubMmlXeMm5YuzYOHz-GzgP7o1n3rv4Zrdz1OHRQWjhu0GDwKMGjR6fmLWQHv3v_vvC082kEqO1Ub95UjGaLJk_F0F8cET9ePClE7Y-BLmpOtFA3MweP_aHmyHEwfC8Ivna2tswK3zt3xDc69x8-AOdYMrukkuR79674dJ4oDZN-jiyZ6VkFxQqvVqROkVKqOnnuT_HpcNU7cvIEMmVIz6iJ0qRMJeFT586KT-eyMnJQgBlOk8q_rjLFSsgAcZB6d-yEZGrFTJ0i8MLB_KSVGzeCd-R9O3WBx-q1mDx0GE6ePQueWcm3ZjJODJ7ljO1MlTy5BJ88fSK-dj6OALVFLuRF8ucHH6QvVbSoeWb0atce9WvWQhGlEZHSpEyJFMmSSTyu0irNM1PDy545M85fvmRKpnZJrSpHlizIFnCOv3TFy8Q3zuMsGd-f8U3MKAqEm2DHsbGRczWtjhQm3sEaz951q1QN1D2upNyZVitj2-nz53Hl2jWMnzXLlCdz-gzIp67PaEw68MdRtQp7o_-Y0ZjmugBJEr0_25gKqMDd-39j6KQJ-OPUKfDHMsYVldqEYlv1X5H8_oaY0dOmghZyLki0vHIRy5who1W33Road-LPM6Lllfq2KDhfdu7bCyPxzNyxWXN0bdnKRLlz5ACFlGnU-nhdxbvqWwG7NBcBD2Ws5W8umDZ88mQ5GhXIk0c2F1rMpyobEMeJVnfnmTOUsa2QmpuJrAEOaYNFgm2jhNdgMEjB4Jz-XbshY7q0YgAqUPEHTJrrgiE9fxEhNeY3GPzLD-zWAzR68McCPzZuKGwaOqD4vDec4OQEGkP4I4GqTZuAq-LcceORUu1kBoN_HVIowKmnjGYvXrxAY3XFlt--AhasXCnfTqwsmgFZrNajQYfn6mNnTqNasybyA5XHT56ABkXuIFbbcCtpGDcHNmXMjOnoMnBAIKLBlbygFMvwfurzfnrHHg_Tj0yaKeMrNyPaPco51MXe3w9jjvNYZVCzk2qcBwxC-jRpZJw4N5k4acgwelZD73sXgiZRxR3Zp-9Hc1J9pJV79-o12OS6CH-6e6BJvfeW3QMbNsmlPitg3vXzFmDH0uXYs2YdXCdNxq6VbmL0ID-rUmuoVu1csVLqcndbAwoAeQTV8-BhFPwmL6NC3Jl3qzzbliyTs_aRLVsDfVsyWbHDc7WHOkIQj-1Ll2G3Cpv3z4qbHuVN4z0y50NwxF02aAMphDNGjTYl8z6aZXNlzy5pNIbxNoY_wtqyaAlO7NiJEoWLCI-OXZIkovJzvpE4b7nhkGctZJFgh6TR3G0zpk2HPDlzmowXHytHALOrcwsFNbg85FPAWReNa8HlMU-LEyeOGDg4QAbDh7u6eV5rDROPHFmygkcba21jTGkXr7w4lzgPg-tzRmXIJQXHC2FahGULd8GOsJbqijUCGoEQI6AFO8RQ6YwagS8HAS3YX85Y6ZZqBEKMgBbsEEOlM2oEvhwEwkGwv5zO6pZqBGIKAlqwY8pI637GKAS0YMeo4dadjSkIaMGOKSOt-xmjEIjmgh2jxlJ3ViNgQkALtgkKHdAIRB8EtGBHn7HUPdEImBDQgm2CQgc0AtEHAS3YUTaW-sMagYhDQAt2xGGra9YIRBkCItirPbZCU_hhsHH_ThnQ129ea1xDMbc0fmGbi8Tv_wAAAP__00ZMOQAAAAZJREFUAwAh-wI26vHIHwAAAABJRU5ErkJggg"
        }
      ],
      "format": "gfm"
    }
  }
];
