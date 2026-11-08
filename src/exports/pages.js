import { compress } from "../../vendor/fragment-kit-v0.3.5/src/index.js";
// Match Pages' legacy envelope, accepted by its current Fragment Kit reader.
export function pagesLink(snapshot) {
  const text = snapshot.html;
  if (new TextEncoder().encode(text).length > 5 * 1024 * 1024)
    throw Error("Pages accepts at most 5 MiB. Download HTML instead.");
  const pages = {
    files: [{ name: "index.html", text }],
    entry: "index.html",
    active: "index.html",
  };
  const envelope = JSON.stringify({
    format: "hashbin-diagram",
    version: 1,
    type: "pages",
    src: text,
    pages,
  });
  if (new TextEncoder().encode(envelope).length > 5 * 1024 * 1024)
    throw Error(
      "Pages link envelope exceeds 5 MiB. Download HTML and import that file in Pages.",
    );
  // The established reader accepts a URI-encoded envelope in the fragment.
  const url = new URL("https://pages.hashbin.page/");
  url.searchParams.set("run", "0");
  url.searchParams.set("doc", compress(envelope));
  if (url.href.length > 7000) {
    url.searchParams.delete("doc");
    url.hash = encodeURIComponent(envelope);
  }
  if (url.href.length > 100000)
    throw Error(
      "This Pages link is too large for a reliable handoff. Download HTML and import that file in Pages.",
    );
  return url.href;
}
