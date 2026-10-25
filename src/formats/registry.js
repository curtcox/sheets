export const catalog = [
  {
    id: "gfm",
    label: "GitHub Markdown",
    extensions: [".md", ".markdown"],
    aceMode: "markdown",
  },
  {
    id: "asciimath",
    label: "AsciiMath",
    extensions: [".am"],
    aceMode: "markdown",
  },
  { id: "numbat", label: "Numbat", extensions: [".nbt"], aceMode: "numbat" },
  { id: "calcfile", label: "CalcFile", extensions: [".calc"], aceMode: "text" },
  { id: "org", label: "Org tables", extensions: [".org"], aceMode: "org" },
  { id: "calca", label: "Calca", extensions: [".calca"], aceMode: "markdown" },
  {
    id: "hurmet",
    label: "Hurmet",
    extensions: [".hurmet"],
    aceMode: "hurmet",
  },
  {
    id: "beancount",
    label: "Beancount",
    extensions: [".bean", ".beancount"],
    aceMode: "beancount",
  },
  { id: "quarto", label: "Quarto", extensions: [".qmd"], aceMode: "markdown" },
  { id: "text", label: "Plain text", extensions: [".txt"], aceMode: "text" },
];
// Detection is dependency-free. Heavy engines load only after selection.
export function confidence(id, src) {
  const fence = /^\s*```/m.test(src);
  switch (id) {
    case "gfm":
      return 0.1;
    case "asciimath":
      return /^\s*```asciimath\b/m.test(src)
        ? 0.98
        : !/\\[a-z]+/.test(src) &&
            /sum_\(|int_\(|sqrt\s*\(|\b(?:oo|xx)\b/.test(src)
          ? 0.7
          : 0;
    case "numbat":
      return !fence &&
        /^(?:let\s+\w+\s*=|fn\s+\w+\(|unit\s+\w+|dimension\s+\w+)|\s->\s/m.test(
          src,
        )
        ? 0.85
        : 0;
    case "calcfile":
      return 0.05;
    case "org":
      return /^\s*#\+(?:TBLFM|TITLE|CONSTANTS|SHEETS_CONSTANTS):|^\s*\|[-+]+\|/im.test(src) ? 0.95 : 0;
    case "calca":
      return /^.+=>.*$/m.test(src) ? 0.9 : 0;
    case "hurmet":
      return /¢(?:`|¢)|¢[^¢\n]+¢/.test(src) ? 0.99 : 0;
    case "beancount":
      return /^\d{4}-\d{2}-\d{2}\s+(?:open|close|balance|price|\*|!|txn)(?:\s|$)/m.test(
        src,
      )
        ? 0.97
        : 0;
    case "quarto":
      return /^\s*```\{(?:python|r|ojs|julia)\}/m.test(src) ||
        /^---\r?\n[\s\S]*?^(?:execute|format|jupyter):[\s\S]*?^---/m.test(src)
        ? 1
        : 0;
    default:
      return 0;
  }
}
export function detect(src) {
  let best = { id: "gfm", score: 0.3 };
  for (const { id } of catalog) {
    const score = confidence(id, src);
    if (score > best.score) best = { id, score };
  }
  return best.id;
}
export const fromExtension = (filename) =>
  catalog.find((f) =>
    f.extensions.some((ext) => filename.toLowerCase().endsWith(ext)),
  )?.id || "auto";
const loads = new Map();
export async function loadFormat(id) {
  if (!catalog.some((f) => f.id === id)) id = "gfm";
  if (!loads.has(id))
    loads.set(
      id,
      import(`./${id}/index.js`)
        .then(async ({ default: plugin }) => {
          await plugin.load?.();
          return plugin;
        })
        .catch((error) => {
          loads.delete(id);
          throw error;
        }),
    );
  return loads.get(id);
}
export function plugin(id, render, load = async () => {}) {
  const meta = catalog.find((f) => f.id === id);
  return {
    ...meta,
    aceMode: `ace/mode/${meta.aceMode}`,
    detect: (src) => confidence(id, src),
    load,
    render,
    docs: `docs/formats/${id}.md`,
  };
}
