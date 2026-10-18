# HashBin storage

[HashBin](https://hashbin.org) is optional content-addressed storage. Open **HashBin** in the toolbar and paste a CID or saved link to load a document.

Accepted saved-link hosts are `hashbin.org`, `256t.us`, and `curtcox.github.io`, using HTTPS. CIDs containing at most 64 bytes are decoded locally. Larger payloads load from `https://256t.us/<cid>`. The editor accepts plain text and this JSON envelope:

```json
{"format":"sheets-document","version":1,"type":"numbat","src":"2 + 2","view":"split"}
```

Format IDs match the [URL format](url-format.md). Plain text uses Auto detection. The editor limits payloads to 5 MiB and rejects unsupported envelope versions. Unit tests round-trip every supported format through this envelope.

## Save a document

The site must have a registered public HashBin client ID. Until the operator adds it to `<meta name="hashbin-client-id">` in `index.html`, **Save to HashBin** is disabled and public loading remains available.

When configured, saving connects your account with the HashBin OAuth SDK. The callback returns to `index.html`, and a session-storage snapshot preserves your source and format during sign-in. The editor requests `content:write` and `balance:read` permissions.

The save dialog shows source size, retention months, price, and account balance. You confirm the save before a charge. If you edit while the quote is open, the dialog prepares a fresh snapshot and quote. Failed or timed-out requests show a message. Editing during a load prevents its older result from replacing your document.

## Operator setup

Register `https://curtcox.github.io/sheets/` with a callback at `https://curtcox.github.io/sheets/index.html`. Set the returned public client ID in the meta tag, commit the change, and deploy. The ID is public configuration; no client secret belongs in this repository. Real account authorization and charged saves require this registration and are not exercised by automated tests.

The client and save panel are adapted from [ManimOnline](https://github.com/curtcox/ManimOnline).
