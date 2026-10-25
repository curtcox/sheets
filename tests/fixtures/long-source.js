import { createHash } from "node:crypto";

// Deterministic, varied model notes keep compression above a host request limit.
export const longSource =
  "#+TITLE: Reloadable model 日本語 😀\n" +
  Array.from({ length: 260 }, (_, i) =>
    `#+COMMENT: ${createHash("sha256").update(String(i)).digest("hex")}`,
  ).join("\n") +
  "\n\n| 3 | 0 | 0 |\n#+TBLFM: $3=$2+1::$2=$1+10\n";
