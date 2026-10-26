# HashBin storage

Sheets has a registered public client ID and saving is enabled. Public documents can be loaded without signing in; saving connects a HashBin account and asks for confirmation after showing the quote.

[HashBin](https://hashbin.org) is optional content-addressed storage. Open **HashBin** in the toolbar and paste a CID or saved link to load a document.

Accepted saved-link hosts are `hashbin.org`, `256t.us`, and `curtcox.github.io`, using HTTPS. CIDs containing at most 64 bytes are decoded locally. Larger payloads load from `https://256t.us/<cid>`. The editor accepts plain text and this JSON envelope:

```json
{"format":"sheets-document","version":1,"type":"numbat","src":"2 + 2","view":"split"}
```

Format IDs match the [URL format](url-format.md). Plain text uses Auto detection. The editor limits payloads to 5 MiB and rejects unsupported envelope versions. Unit tests round-trip every supported format through this envelope.

Version 1 retains the original language rules. Documents with an explicit
compatibility profile use version 2, which also requires a known profile matching
the format:

```json
{"format":"sheets-document","version":2,"type":"calca","src":"2 + 2 =>","view":"split","profile":"calca-blocks-v1"}
```

Calca supports Structured blocks (`calca-blocks-v1`) and Scoped definitions
(`calca-scopes-v1`); the latter adds immutable definitions, heading scopes, and
connected numeric constraint checks.

AsciiMath supports Formula list (`asciimath-formulas-v1`) and Mixed prose
(`asciimath-prose-v1`). These profiles use the same version-2 envelope; version-1
AsciiMath documents retain Auto's original document-structure heuristic.

Shared links and sign-in snapshots preserve the profile. Query parameters can
override it explicitly; a format override to a different format drops the stored
profile. Choosing a different mode creates a new source link and leaves the saved
content intact. Source downloads contain text only, so reselect the mode when
reusing downloaded text.

## Save a document

Choose **HashBin → Save to HashBin**. On first use, choose **Connect to HashBin**, sign in, and approve the requested permissions. Sign-in returns to the editor with the source, format, and view restored. Open **Save to HashBin** again to see the quote.

Saving connects your account with the HashBin OAuth SDK and PKCE. The callback returns to `index.html`, and a session-storage snapshot preserves your source and format during sign-in. The editor requests `content:write` and `balance:read` permissions.

The save dialog shows source size, retention months, price, and account balance. You confirm the save before a charge. If you edit while the quote is open, the dialog prepares a fresh snapshot and quote. Failed or timed-out requests show a message. Editing during a load prevents its older result from replacing your document.

## Operator setup

The deployed Sheets registration uses public client ID `app_8e03e133-83b4-4ee2-b3d5-39397f573879` and redirect URI `https://curtcox.github.io/sheets/index.html`. HashBin has accepted a real PKCE authorization request for this combination and rejects an unregistered redirect.

For another deployment, register its exact callback URI and set its public client ID in the `hashbin-client-id` meta tag in `index.html`. The ID is public configuration; no client secret belongs in this repository. Removing the ID disables saving while preserving public loads. Automated tests cover callbacks, quote confirmation, and source round-trips with controlled responses.

Live verification on 2026-10-18 completed account authorization and an explicitly approved $0.01 save of the public Calca gallery example for 12 months. A fresh browser loaded its CID link without signing in and restored the exact source, Calca format, Split view, and calculated answers.

The client and save panel are adapted from [ManimOnline](https://github.com/curtcox/ManimOnline).

## Org shared numeric inputs

Org models can declare `#+SHEETS_INPUT: v1 alias <cid>` and reference numeric file
constants as `$alias.name`. Save an Org assumptions document using the normal
confirmation flow, then use its bare CID in consumers. Reads require no sign-in
or charge, verify byte length and SHA-512, and never execute dependency formulas.
The preview exposes values and provenance. Root saves preserve declarations,
not dependency payloads or their retention; input content must remain available.
See [the bounded input contract](formats/org.md#pinned-shared-inputs).
