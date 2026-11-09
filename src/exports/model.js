export const EXPORT_LIMITS = Object.freeze({
  document: 8 * 1024 * 1024,
  output: 32 * 1024 * 1024,
  cells: 100000,
  media: 16 * 1024 * 1024,
});
export function modelText(node) {
  if (Array.isArray(node)) return node.map(modelText).join("");
  if (node.text !== undefined) return node.text;
  if (node.type === "image" || node.type === "svg") return `[${node.alt}]`;
  const text = modelText(node.children || []);
  if (node.type === "cell") return text.trim() + "\t";
  if (
    ["heading", "paragraph", "code", "quote", "row", "item", "rule"].includes(
      node.type,
    )
  )
    return text.trim() + "\n\n";
  if (node.type === "break") return "\n";
  return text;
}
