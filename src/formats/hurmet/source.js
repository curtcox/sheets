// Accept the plan's simple paired delimiters as well as native Hurmet syntax.
export function normalizeHurmet(src) {
  return src.replace(
    /(?<!¢)¢(?![`¢])([^¢\n]+)¢(?!¢)/g,
    (_, entry) => `¢\` ${entry.trim()} \``,
  );
}

export function hurmetDocument(src) {
  const normalized = normalizeHurmet(src);
  return /^-{3,}\r?\n[\s\S]*?decimalFormat:/m.test(normalized)
    ? normalized
    : "---------------\ndecimalFormat: 1,000,000.\nfontSize: 12\npageSize: letter\ndateFormat: yyyy-mm-dd\nsaveDate: 2026-01-01\n---------------\n\n" +
        normalized;
}
