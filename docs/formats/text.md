# Plain text

The plain-text format escapes source and displays it in a preformatted block. It performs no calculations or markup rendering. Select it explicitly from the format menu.

Use **Plain text** to read source literally, inspect syntax from another format,
or share a document without evaluating it. Auto detection never chooses this
format; its fallback is GitHub Markdown. Source downloads use `.txt`.

## What stays literal

```text
# This is not a heading
2 + 2 =>
<strong>This is not HTML</strong>
$x^2$ is not typeset math
```

The preview preserves line breaks and spaces and displays the source characters,
including the angle brackets. It adds no answers, tables, diagrams, links, or
executable cells. Selecting Plain text can be useful before switching to Quarto
when you want to inspect code without running the notebook.

## Downloads and sharing

**Download → Source** saves the exact editor contents. **Rendered HTML** wraps the
escaped text as a standalone preview; **Print / PDF** prints that preview. Share
links and HashBin envelopes retain the explicit Plain text selection. A raw
plain-text HashBin payload without a Sheets envelope instead uses Auto detection
unless you override the format.

Displaying text needs no runtime download beyond the app's own assets and works
with offline files installed. To format the content, choose GitHub Markdown; to
calculate it, choose the appropriate language from the
[feature comparison and glossary](../format-comparison.md).

See [Limitations and compatibility](../limitations.md) for the consolidated disclosures across formats.
