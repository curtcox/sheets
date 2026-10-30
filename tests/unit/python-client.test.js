import { test } from "node:test";
import assert from "node:assert/strict";
import { runPython } from "../../src/python-client.js";
import { pythonCell } from "../../src/workers/python-cell.js";

function sandbox(reply) {
  return {
    terminated: false,
    postMessage(data) {
      queueMicrotask(() => this.onmessage?.({ data: reply(data) }));
    },
    terminate() {
      this.terminated = true;
    },
  };
}

test("Python runs the capture code in a sandbox and closes it after the render", async () => {
  let started;
  const worker = sandbox(({ cells }) => ({
    outputs: cells.map((cell) => ({ stdout: cell.source })),
  }));
  const result = await runPython([{ source: "print(1)" }], {
    start: async (name, options) => {
      started = { name, ...options };
      return worker;
    },
  });
  assert.equal(started.name, "pyodide.worker.js");
  assert.equal(
    started.prefix,
    `const pythonCell = ${JSON.stringify(pythonCell)};\n`,
  );
  assert.deepEqual(result.outputs, [{ stdout: "print(1)" }]);
  assert.ok(worker.terminated);
});

test("Python cancellation while a sandbox starts closes that sandbox", async () => {
  const controller = new AbortController(),
    worker = sandbox(() => ({ outputs: [] }));
  const result = runPython([{ source: "x" }], {
    signal: controller.signal,
    start: async () => {
      controller.abort();
      return worker;
    },
  });
  await assert.rejects(result, { name: "AbortError" });
  assert.ok(worker.terminated);
});
