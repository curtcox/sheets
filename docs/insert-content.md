# Outside tables and pictures

Use **Insert** in an **Org** or **GitHub Markdown** document. These workflows
work with exports from Excel, Google Sheets and other applications. They do not
import whole workbooks, formulas, live connections or editable chart objects.

## Start with CSV

Choose a UTF-8 `.csv` or `.tsv` file, or paste text into Insert. Choose comma,
semicolon or tab as the separator. The preview shows up to twelve rows; insertion
includes all rows. Select whether the first row contains headings. Quoted commas,
escaped quotes, multiline fields and blank cells are supported. Short rows are
padded with empty cells. Leading zeros, dates and decimal spelling remain text.

Choose **Editable table** to insert Org/Markdown source, or **Picture** for a static
image of the table. Tables copied from Excel, Google Sheets or a webpage also open
the preview when pasted into the source editor. Rich clipboard tables lose styling;
a clipboard image, when supplied, preserves the appearance with Picture. Merged
cells or multiple HTML tables need a rectangular unmerged selection, CSV, or a
screenshot. Ordinary text paste stays available for non-table text.

Org joins multiline cell text with spaces and escapes pipes/backslashes in its
source. Markdown renders line breaks and escapes formatting. Without a header,
Markdown requires an empty header row. Table picture formatting is deliberately
simple. Very large tables may fit as editable source but exceed picture limits.

See [CSV budget](../index.html?example=org-csv-budget),
[CSV report](../index.html?example=gfm-csv-report),
[two presentations](../index.html?example=gfm-csv-presentations), and
[spreadsheet excerpt](../index.html?example=gfm-spreadsheet-excerpt).

## Insert a picture

Select Picture, then choose a PNG, JPEG or WebP file, paste a screenshot into the
source editor, or drop a picture on that editor. Files and clipboard pictures are
included in the document. You can also enter an HTTPS picture URL and choose
**Keep linked** or **Include in document**. Including a remote image requires the
host to allow browser access (CORS); keep it linked or download it yourself if not.

HashBin/256t links and bare CIDs are accepted. Sheets resolves them to image bytes
and verifies the CID before display. This includes inline CIDs. A saved Sheets
document CID is not a raw image CID. Linked full-size CID images need a connection;
inline image CIDs contain their bytes. Verified CID picture retrieval is bounded
to 256 KiB and 15 seconds, including when kept linked. HTTP, credentials in URLs, SVG, and arbitrary
HTML embeds are unsupported. Missing or rejected CID images show a visible error.

Add alternative text, a caption and a display width (80–1,600 pixels). These are
editable in the source. Org uses `sheets-image:` or `sheets-asset:` links with
`#+CAPTION:` and `#+ATTR_HTML: :width`; these are Sheets extensions, not a promise
of native Org image-export compatibility. Markdown uses a figure with an image
and optional caption. Select an existing figure in source before inserting to
replace it; delete its source to remove it. Undo/redo restores the source and
picture while the document is open. Unused image bytes are omitted from snapshots,
so deleting a picture also removes it from subsequent saved documents.

See [HashBin/256t link](../index.html?example=gfm-hashbin-picture),
[outside chart and live model](../index.html?example=org-outside-chart), and
[bundled report](../index.html?example=gfm-bundled-report).

## Keep and share pictures

Included pictures travel in shared project links, HashBin saves, local drafts and
**Download → Portable project (.sheets.json)**. **Open project snapshot** restores
them in the editor. **Rendered HTML** embeds included pictures and verified CID
pictures. Ordinary hosted images remain linked in exports. Printing uses the
current preview. Plain **Source** downloads contain only references to included
pictures, so use a portable project for a complete editable backup.

Version-2 project files and version-4 saved envelopes add a separate attachment
collection; existing project and saved-document versions retain their meaning.
Images have content-based IDs, canonical base64url bytes and an explicit MIME
type. Original Org numeric input snapshots remain separate and keep their limits.

A document can include eight distinct pictures, at most 256 KiB each and 512 KiB
combined. Local files can be up to 8 MiB before conversion, with at most 16 million
pixels. Select **Resize local picture to fit** to create WebP up to 1,600 pixels;
if it still exceeds 256 KiB, resize it in its source app. Display width changes
layout only, not stored bytes. Failed imports leave the source unchanged.
The whole serialized document still has a 5 MiB limit, and compressed project
links have a 1,000,000-character limit. Insertion checks that the complete result
can be shared; it never silently drops pictures. Long links may still be truncated
by other apps: save to HashBin or download a project for a separate copy.

Install the app's offline files before going offline. Bundled pictures need no
image server. A HashBin document CID still needs a connection to retrieve the
document initially. Linked ordinary HTTPS pictures require their host. App offline
caches never capture private document or external image responses.
