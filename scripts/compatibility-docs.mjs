import { readFile, writeFile } from "node:fs/promises";
export const ledgerPath = "docs/compatibility.json";
const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const status = {
  open: "Known gap",
  retained: "Intentional",
  resolved: "Resolved",
  audit: "Needs detailed audit",
};
export function validateLedger(ledger) {
  if (ledger.version !== 1 || !Array.isArray(ledger.items))
    throw new Error("Unsupported compatibility ledger.");
  const ids = new Set();
  for (const item of ledger.items) {
    if (ids.has(item.id) || !/^[A-Z]+-\d+$/.test(item.id))
      throw new Error(`Invalid/duplicate ID ${item.id}`);
    ids.add(item.id);
    if (
      !ledger.targets[item.format] ||
      !status[item.status] ||
      !["gap", "policy", "upstream", "environment", "mixed"].includes(item.kind)
    )
      throw new Error(`Invalid classification ${item.id}`);
    for (const key of [
      "title",
      "disclosure",
      "priority",
      "milestone",
      "expected",
      "baselineDisclosure",
    ])
      if (!item[key]) throw new Error(`Missing ${key} for ${item.id}`);
    if (
      item.status === "resolved" &&
      (!item.evidence?.length || !item.reproducer)
    )
      throw new Error(
        `Resolved item ${item.id} needs a reproducer and evidence.`,
      );
  }
}
function heading(item) {
  return `**${item.id} — ${item.title}** (${status[item.status]}).`;
}
export function centralPage(ledger) {
  const parts = [
    "# Limitations and compatibility",
    "This page is generated from the shared [compatibility ledger](compatibility.json). It preserves the known disclosures from the format guides and tracks resolved work separately. The baseline inventory is imported; items marked for detailed audit still need atomic reproducers and upstream verification. No full-compatibility claim is implied.",
    "See the [feature comparison and glossary](format-comparison.md) for capability definitions. The same ledger supplies the status summaries in each format guide.",
  ];
  for (const [format, target] of Object.entries(ledger.targets)) {
    const items = ledger.items.filter((item) => item.format === format);
    parts.push(`## ${target.label}`);
    if (target.guide)
      parts.push(
        `See the [${target.label} guide](${target.guide}). Compatibility target: ${target.version}.`,
      );
    for (const item of items.filter((item) => item.status !== "resolved"))
      parts.push(
        `- ${heading(item)} ${item.disclosure.replace(/\n\s*/g, " ")}`,
      );
    const resolved = items.filter((item) => item.status === "resolved");
    if (resolved.length) {
      parts.push("### Resolved compatibility gaps");
      for (const item of resolved)
        parts.push(
          `- ${heading(item)} ${item.disclosure.replace(/\n\s*/g, " ")}`,
        );
    }
    if (target.appendix) parts.push(target.appendix);
  }
  return parts.join("\n\n") + "\n";
}
export function guideStatus(ledger, format) {
  const items = ledger.items.filter((item) => item.format === format);
  return `<!-- compatibility:start -->\n## Tracked compatibility status\n\nThese entries share the [central limitations ledger](../limitations.md). “Needs detailed audit” means the disclosure is recorded, while its complete upstream case coverage is still being developed.\n\n| ID | Status | Area |\n| --- | --- | --- |\n${items.map((item) => `| ${item.id} | ${status[item.status]} | ${item.title.replaceAll("|", "\\|")} |`).join("\n")}\n<!-- compatibility:end -->`;
}
export async function syncCompatibility(check = false) {
  const ledger = JSON.parse(await read(ledgerPath));
  validateLedger(ledger);
  const outputs = new Map([["docs/limitations.md", centralPage(ledger)]]);
  for (const [format, target] of Object.entries(ledger.targets)) {
    if (!target.guide) continue;
    const path = "docs/" + target.guide,
      source = await read(path),
      section = guideStatus(ledger, format);
    outputs.set(
      path,
      /<!-- compatibility:start -->[\s\S]*?<!-- compatibility:end -->/.test(
        source,
      )
        ? source.replace(
            /<!-- compatibility:start -->[\s\S]*?<!-- compatibility:end -->/,
            section,
          )
        : source.trimEnd() + "\n\n" + section + "\n",
    );
  }
  for (const [path, output] of outputs) {
    if (check) {
      if ((await read(path)) !== output)
        throw new Error(
          `Compatibility disclosure drift in ${path}. Run node scripts/compatibility-docs.mjs.`,
        );
    } else await writeFile(new URL(path, root), output);
  }
  return ledger;
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const ledger = await syncCompatibility(process.argv.includes("--check"));
  console.log(
    `Compatibility ledger: ${ledger.items.length} disclosures synchronized.`,
  );
}
