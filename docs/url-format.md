# Sharing links

The URL is the document. Typing replaces the current history entry after a 300 ms pause; it does not add an entry for each keystroke.

| Parameter | Meaning |
| --- | --- |
| `?format=gfm` | Manual format. Omit it for Auto. |
| `?view=split` | Split, source, or preview. Split is the default and is normally omitted. |
| `?compressed=…` | Source compressed with lz-string's URI-safe encoding. |
| `#<cid>` | A HashBin content identifier. |
| `?example=<id>` | Load an example once, then replace this parameter with its compressed source. |

Loading precedence is **CID → compressed source → example → starter document**. A HashBin document supplies its stored format and view unless query parameters explicitly override them. Unknown formats and views safely default to Auto and Split. Invalid compressed links report an error. Decoding stops at 5 MiB to bound expansion.

Editing a loaded CID clears the CID and embeds the new source. Changing the view of an unchanged saved document retains the CID; the view query parameter overrides the saved document's view when the link is loaded. Share links clear stale example, source, and OAuth callback parameters. Unrelated query parameters are preserved.

The supported format IDs are `gfm`, `asciimath`, `numbat`, `calcfile`, `org`, `calca`, `hurmet`, `beancount`, `quarto`, and `text`.

## Optional short links

Choose **Shorten with is.gd** in the Share dialog. This explicitly sends the complete source link through AllOrigins to is.gd. The app validates the returned HTTPS is.gd URL. If shortening fails, the original source link remains ready to copy. HashBin provides a separate content-storage option for large documents.
