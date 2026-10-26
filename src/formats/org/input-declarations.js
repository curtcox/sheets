import { HashBinDocuments } from "../../hashbin.js";

export const INPUT_LIMITS = Object.freeze({ declarations: 8, bytes: 65536, aggregate: 262144, constants: 128, valueLength: 1000, deadline: 10000 });
export function inputDeclarations(nodes) {
  const declarations = nodes.sort((a, b) => a.position.start.line - b.position.start.line).map((node) => {
    const match = /^v1\s+([A-Za-z][A-Za-z0-9_]{0,63})\s+(\S+)$/i.exec((node.value || "").trim()),
      entry = { line: node.position.start.line, alias: match?.[1], cid: match?.[2] };
    if (!match || !HashBinDocuments.isCID(entry.cid))
      entry.error = "Use SHEETS_INPUT: v1 alias <bare HashBin CID>; alias must be an ASCII name of at most 64 characters.";
    else if (HashBinDocuments.cidLength(entry.cid) > INPUT_LIMITS.bytes)
      entry.error = "Shared input exceeds the 64 KiB payload limit.";
    return entry;
  });
  const seen = new Set();
  for (const entry of declarations) {
    if (entry.alias && seen.has(entry.alias)) entry.error = `Duplicate shared-input alias ${entry.alias}.`;
    seen.add(entry.alias);
  }
  if (declarations.length > INPUT_LIMITS.declarations)
    declarations[0].error = "A document can declare at most 8 shared inputs.";
  return declarations;
}
