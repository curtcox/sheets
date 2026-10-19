import MarkdownIt from "../../../vendor/markdown-it.js";

// Keep linkify-it's host validation, length bound, and link normalization. GFM
// adds its host-underscore and path-ending rules: trim unmatched trailing ')',
// preserve internal ones, and exclude entity-like suffixes. See the pinned spec.
const hosts = new MarkdownIt().linkify;
const limit = 10_000; // linkify-it 6.1.0's default maximum candidate length

function pathEnd(text, start, end) {
  let opening = 0,
    closing = 0;
  for (let i = start; i < end; i++) {
    if (text[i] === "(") opening++;
    else if (text[i] === ")") closing++;
  }
  while (end > start) {
    const last = text[end - 1];
    if (last === ")" && closing > opening) {
      end--;
      closing--;
    } else if (/[?!.,:*_~'\"]/.test(last)) end--;
    else if (last === ";") {
      let amp = end - 2;
      while (amp >= start && /[a-zA-Z]/.test(text[amp])) amp--;
      // Match the pinned cmark-gfm renderer's alphabetic entity suffix rule.
      end = amp < end - 2 && text[amp] === "&" ? amp : end - 1;
    } else break;
  }
  return end;
}

export function gfmAutolinks(md) {
  for (const prefix of ["http:", "https:", "ftp:", "www."]) {
    md.linkify.add(prefix, {
      validate(text, pos) {
        const start = pos - prefix.length;
        if (
          prefix === "www." &&
          start > 0 &&
          !/[\s*_~(]/u.test(text[start - 1])
        )
          return 0;
        const candidate = text.slice(start, pos + limit);
        const hostStart = prefix === "www." ? 0 : prefix.length + 2;
        const path = candidate.slice(hostStart).search(/[/?#\s<]/u);
        const hostEnd = path < 0 ? candidate.length : hostStart + path;
        const host = candidate.slice(hostStart, hostEnd);
        // GFM permits underscores only before the last two host labels. The
        // same-length probe lets the existing validator check the rest without
        // changing the source or the URL that will actually be emitted.
        if (
          host
            .split(".")
            .slice(-2)
            .some((label) => label.includes("_"))
        )
          return 0;
        const hostProbe =
          candidate.slice(0, hostStart) +
          host.replaceAll("_", "a") +
          candidate.slice(hostEnd);
        const probe = hosts.matchAtStart(
          prefix === "www." ? "http://" + hostProbe : hostProbe,
        );
        if (!probe || (prefix === "www." && probe.lastIndex <= 11)) return 0;
        let end = pos;
        const max = Math.min(text.length, pos + limit);
        while (end < max && !/[\s<]/u.test(text[end])) end++;
        return Math.max(0, pathEnd(text, start, end) - pos);
      },
      normalize(match) {
        if (prefix === "www.") match.url = "http://" + match.url;
      },
    });
  }
  const match = md.linkify.match.bind(md.linkify);
  md.linkify.match = (text) =>
    (match(text) || []).filter((link) => {
      // Explicit mailto: URIs and <...> autolinks use their own grammar. Only
      // fuzzy email domains reject '+', while local parts continue to allow it.
      return (
        link.schema !== "mailto:" ||
        /^mailto:/i.test(link.raw) ||
        !link.raw.slice(link.raw.lastIndexOf("@") + 1).includes("+")
      );
    });
}
