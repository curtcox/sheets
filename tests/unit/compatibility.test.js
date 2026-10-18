import { test } from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import {
  syncCompatibility,
  validateLedger,
} from "../../scripts/compatibility-docs.mjs";
test("compatibility disclosures are generated from one ledger without drift", async () => {
  const ledger = await syncCompatibility(true);
  assert.equal(Object.keys(ledger.targets).length, 11);
  assert.ok(
    ledger.items.some(
      (item) => item.status === "resolved" && item.id === "BEAN-04",
    ),
  );
  assert.ok(
    ledger.items.some(
      (item) => item.status === "audit" && item.reproducer === null,
    ),
  );
  for (const item of ledger.items) {
    for (const file of item.evidence)
      await access(new URL("../../" + file, import.meta.url));
    if (item.reproducer?.path)
      await access(new URL("../../" + item.reproducer.path, import.meta.url));
  }
});
test("a resolved compatibility claim requires a reproducer and independent evidence", () => {
  const item = {
    id: "TEST-01",
    format: "text",
    title: "Example",
    kind: "gap",
    status: "resolved",
    priority: "P1",
    milestone: "X",
    expected: "Expected",
    disclosure: "Current",
    baselineDisclosure: "Original",
  };
  assert.throws(
    () => validateLedger({ version: 1, targets: { text: {} }, items: [item] }),
    /reproducer and evidence/,
  );
  assert.throws(
    () =>
      validateLedger({
        version: 1,
        targets: { text: {} },
        items: [
          { ...item, status: "open" },
          { ...item, status: "open" },
        ],
      }),
    /duplicate/,
  );
});
