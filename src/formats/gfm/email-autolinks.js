// Supplement linkify-it in plain text tokens using the pinned GFM email rules.
// Track local-part starts and scan each domain once; never retry a growing
// regex at every character of a long invalid address. MarkdownIt still owns
// code, existing links, HTML anchors, escaping, and final URL validation.
const alphanumeric = (code) =>
  (code >= 48 && code <= 57) ||
  (code >= 65 && code <= 90) ||
  (code >= 97 && code <= 122);

export function emailAutolinks(text, limit = 10_000) {
  const links = [];
  let localStart = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 64) {
      if (i > localStart) {
        let end = i + 1,
          dots = 0;
        while (end < text.length) {
          const next = text.charCodeAt(end);
          if (alphanumeric(next) || next === 45 || next === 95) end++;
          else if (next === 46 && alphanumeric(text.charCodeAt(end + 1))) {
            dots++;
            end++;
          } else break;
        }
        // Numeric final characters remain supported, as before. The native
        // reference's other domain endings (including '-'/'_') stay literal.
        if (
          dots &&
          alphanumeric(text.charCodeAt(end - 1)) &&
          end - localStart <= limit
        ) {
          const raw = text.slice(localStart, end);
          links.push({
            schema: "mailto:",
            index: localStart,
            lastIndex: end,
            raw,
            text: raw,
            url: "mailto:" + raw,
          });
          i = end - 1;
          localStart = end;
          continue;
        }
      }
      localStart = i + 1;
    } else if (
      !alphanumeric(code) &&
      code !== 46 &&
      code !== 45 &&
      code !== 95 &&
      code !== 43
    )
      localStart = i + 1;
  }
  return links;
}

// Existing URL/URI and email matches win overlapping ranges. This preserves
// normalizer behavior and Unicode addresses while adding missing GFM emails.
// Both inputs are ordered and nonoverlapping, so the merge is linear too.
export function supplementEmails(existing, additional) {
  const links = [];
  let i = 0;
  for (const link of additional) {
    while (i < existing.length && existing[i].lastIndex <= link.index)
      links.push(existing[i++]);
    if (i < existing.length && existing[i].index < link.lastIndex) continue;
    links.push(link);
  }
  while (i < existing.length) links.push(existing[i++]);
  return links;
}
