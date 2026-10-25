# Field report: a HashBin money model in Org tables (2026-10-24)

What went wrong, or got in the way, while building a small financial model in Sheets: costs,
pricing scenarios, break-even, reserve, and an insurance comparison. The model is three Org
documents, about 19 KB of source in total, in the HashBin repository under
`docs/business/*.org`. It ran against production (`curtcox.github.io/sheets`) and against the
Org engine in Node (`recalculateOrg`), with zero diagnostics.

**Sharing recovery, numeric conditionals and table wrapping are implemented;
other runtime issues remain open.** Triaged on 2026-10-25 into
`docs/compatibility.json` and the active field-report priorities in [PLAN.md](../PLAN.md#field-report-priorities--active-order-from-2026-10-25).
The missing disclosures are now in the generated limitations page and Org guide;
SHARE-1 subsequently reproduced old reload loss end to end against an enforcing
server and protects generated long-source links with fragments. See
[the implementation contract](long-source-links.md). The findings below describe
2026-10-24 behavior. ORG-1E now supplies numeric `if` and comparisons in both
calculation modes; see [the condition contract](org-conditions.md). ORG-TABLE-1
keeps narrow-table values intact with local scrolling; see
[the wrapping contract](org-table-wrapping.md). Other items remain open.

| # | Problem | Classification | Related |
|---|---------|----------------|---------|
| 1 | Documents over ~8 KB: links fail, and a reload loses the document | Mostly user workflow; **one bug risk**, one wording issue | SHARED-02/05; SHARE-1 |
| 2 | No inputs shared across documents | Known gap | ORG-02 (cross-file); FILE-1 |
| 3 | `#+CONSTANTS:` values are invisible in the preview | Missing feature | ORG-13; ORG-INPUT-1 |
| 4 | No `if()` or comparison operators in Org formulas | Numeric subset implemented; wider Calc behavior remains limited | ORG-10 (resolved); ORG-1E |
| 5 | `a/b*c` means `a/(b*c)` | Documented, Emacs-faithful; usability trap | ORG-09; ORG-HINT-1 |
| 6 | Money tables are hard to read | Wrapping fixed; header/alignment gap and grouping request remain open | ORG-11 (resolved), ORG-12, ORG-02; ORG-TABLE-1/2, ORG-MONEY-1 |
| 7 | No goal seek or what-if | Missing feature | ORG-04; UI-1 (CALCA-02 is a separate solver) |
| 8 | Inputs can't be marked apart from formulas; cells can't carry notes | Missing feature | ORG-04; UI-1 |
| 9 | No supported way to turn a file into a link | Missing tooling | SHARED-06; LINK-1, FILE-1 |

## 1. Documents over ~8 KB

**What happened.** The model began as one 17 KB Org document. Its link, which I built with a
Node script outside the app, was 8,656 characters. GitHub Pages answered `414 URI Too Long`, so
the document never loaded. I split it into three documents with links of about 2–5 KB.

**Classification.** Mostly user workflow, not a Sheets defect:

- The docs already say this. `docs/index.md` says links longer than about 8 KB get a reminder
  to use HashBin, and SHARED-02 says URL limits vary. The app shows "Long link · save to
  HashBin…" above 8,192 characters (`persist()` in `src/app.js`). I never saw that notice
  because I built the link outside the app.
- HashBin storage is the intended answer, but saving needs the owner's interactive OAuth sign-in
  and balance. An agent working for the owner can't save on their behalf, so it fell back to
  splitting the document. See item 9.

Three things remain that Sheets could change:

- **Bug: reloading a long document fails.** The editor keeps the document only in its own URL
  (`history.replaceState` in `persist()`); no local draft is stored. Once a document's URL
  passes the host limit, reloading the tab, restoring the browser session, or reopening it from
  history sends the same URL, gets the 414, and the text is gone unless it was saved to HashBin.
  The 414 itself was reproduced in the browser. The data-loss path follows from the code, but
  hasn't been run end to end.
  - *Reproducer:* open any document whose link is longer than about 8,220 characters, then
    reload the tab.
  - *Measured limit:* on 2026-10-24, GitHub Pages accepted a `?compressed=` value of 8,172
    characters (a URL of 8,218) and rejected 8,173 or more. The exact limit counts the whole
    request line, so other query parameters lower it.
- **Wording.** "Save to HashBin for easier sharing" understates the problem. On the app's own
  host, a link past the limit doesn't open at all, and the open editor tab can't be reloaded.
  The 8,192-character threshold is about right, but it sits within roughly 25 characters of
  failure.
- **Option:** keep compressed source in the fragment (`#src=…`), which never reaches the server.
  The fragment already carries CIDs, so this needs a design decision. That makes it a proposal,
  not a fix.

## 2. No inputs shared across documents

After the split, each of the three documents carries the same 7-line `#+CONSTANTS:` block, so
changing one price means three edits. Org would use cross-file references, which ORG-02
discloses as unsupported and FILE-1 plans to address. Including another document by HashBin CID
would fit Sheets well, because CIDs are immutable and so the result is reproducible.

## 3. Constants are invisible in the preview

`#+CONSTANTS:` keywords don't render, so readers of the preview can't see the inputs that drive
every table. Org's own HTML export also hides keywords, so this is faithful to Org, but it hides
a model's assumptions. The workaround was an "Inputs" table that echoes each constant through 19
field formulas (`@2$2=$price::@3$2=$depositSize::…`).

*Requests:*

- An option to render constants as a table.
- Editing an input cell directly in the preview (today only the source can be edited; ORG-04).

## 4. No `if()` or comparisons

```org
| a | b |
|---+---|
| 3 | 0 |
#+TBLFM: $2=if($1>2,10,20)
```

Emacs Calc gives **10**. Sheets reports `Unsupported Calc syntax near ">2,10,20)"` and leaves the
cell unchanged. At the time of the report, neither the Org guide nor ORG-02's
disclosure listed relational operators or `if` among the unsupported Calc features.
The 2026-10-25 triage adds that disclosure as ORG-10. The workaround for a step function ("free up to
50,000 users, then $25 a month") was `min(1, max(0, $users - 50000))`.

*Expected:* support Calc's `if(c, a, b)` and `<`, `>`, `<=`, `>=`, `==`, `!=`, checked against
Emacs fixtures. Until then, disclose the gap in ORG-02 and in the guide.

## 5. `a/b*c` means `a/(b*c)`

This matches Emacs Calc and is documented in the Org guide (ORG-09). It's still the
easiest mistake to make when coming from spreadsheets: every division in the model had to be
parenthesized defensively. *Request:* an optional hint diagnostic when `*` directly follows a
`/` operand without parentheses.

## 6. Money tables are hard to read

- **CSS bug.** In Split view at an 800 px window, narrow numeric columns wrap in the middle of a
  number or word: `0.03` shows as "0.0 / 3" and "Value" as "Val / ue". *Expected:* numbers
  never break.
- **Compatibility gap.** The preview renders every row as `<td>` and left-aligns every column.
  Org's HTML export puts rows above the first separator in `<thead>`/`<th>` and right-aligns
  numeric columns. (`renderOrg` in `src/formats/org/index.js` builds the table.) It's related to
  ORG-02's "native layout" item, but concerns HTML output rather than source width.
- **Feature request.** Org's printf modes have no thousands grouping, so `2877.12` can't be shown
  as `2,877.12` or `$2,877.12`.

## 7. No goal seek or what-if

The questions being modeled were "how much must I charge?" and "how much paid storage breaks
even?". Both are a solve for one input that makes an output zero. Org has no solver, so I
tabulated candidate prices instead. Calca has a scalar solver (CALCA-02), but no tables.
*Request:* a one-variable goal seek on an Org cell, or a what-if column.

## 8. No input styling, no cell notes

Nothing distinguishes cells meant to be edited from computed ones. The model's prose had to say
"columns 2–7 are inputs", and one draft wrongly said "the white cells". Sources for numbers
(price pages, guesses) went into an extra text column. *Request:* a way to mark input cells, and
per-cell notes.

## 9. No supported way to turn a file into a link

To build links from the `.org` files kept in the HashBin repository, I imported
`vendor/lz-string.js` and called `compressToEncodedURIComponent` by hand. Nothing in `scripts/`
does this.

*Requests:*

- A documented `node scripts/link.mjs <file> [--format=org]`.
- Or a `?url=` loader for raw source (for example a GitHub raw file), so the repository stays
  the source of truth and links never go stale. This also gives agents a path for documents
  too large for a URL that doesn't need the owner's HashBin session (item 1).

## What worked well

- The Org engine is DOM-free. Importing `recalculateOrg` from `src/formats/org/engine.js` in Node
  recalculated every document, with diagnostics, before it was opened in a browser.
- Named constants, `remote()` with `@>` (last-row) references, `vsum`, `min`/`max`/`ceil`, and
  `;%.2f` formats covered the whole model once its workarounds were in place.
