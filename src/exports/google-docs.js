export const GOOGLE_SCOPE = "https://www.googleapis.com/auth/drive.file";
let loading;
export function loadGoogleIdentity() {
  if (globalThis.google?.accounts?.oauth2) return Promise.resolve();
  return (loading ||= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(
        Error(
          "Google sign-in could not load. Download Word and import it into Google Docs instead.",
        ),
      );
    };
    document.head.append(script);
  }));
}
export function googleToken(clientId, { signal } = {}) {
  if (!/^[\w.-]+\.apps\.googleusercontent\.com$/.test(clientId))
    throw Error(
      "Enter a Google OAuth web client ID configured for this website, or download Word for manual import.",
    );
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const finish = (fn, value) => {
      signal?.removeEventListener("abort", abort);
      fn(value);
    };
    const abort = () => finish(reject, signal.reason);
    signal?.addEventListener("abort", abort, { once: true });
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPE,
      include_granted_scopes: false,
      callback: (response) =>
        response.error ||
        !response.access_token ||
        (response.scope && !response.scope.split(/\s+/).includes(GOOGLE_SCOPE))
          ? finish(
              reject,
              Error(
                response.error_description ||
                  response.error ||
                  "Google did not grant permission to create this document.",
              ),
            )
          : finish(resolve, response.access_token),
      error_callback: (error) =>
        finish(reject, Error(error.message || "Google sign-in was cancelled.")),
    });
    client.requestAccessToken({ prompt: "select_account" });
  });
}
export async function uploadGoogleDoc(
  blob,
  title,
  token,
  { signal, fetchSource = fetch } = {},
) {
  signal?.throwIfAborted();
  const boundary = "sheets-" + crypto.randomUUID();
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: title, mimeType: "application/vnd.google-apps.document" })}\r\n--${boundary}\r\nContent-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n`,
    blob,
    `\r\n--${boundary}--\r\n`,
  ]);
  const response = await fetchSource(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
      signal,
    },
  );
  if (!response.ok)
    throw Error(
      `Google Docs export failed (HTTP ${response.status}). Check Drive before retrying; an interrupted upload may have created the document.`,
    );
  const result = await response.json();
  if (!/^[\w-]+$/.test(result.id || ""))
    throw Error(
      "Google did not return a document ID. Check Drive before retrying.",
    );
  return `https://docs.google.com/document/d/${result.id}/edit`;
}
