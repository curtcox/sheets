import { test } from "node:test";
import assert from "node:assert/strict";
import { RenderScheduler } from "../../src/render-scheduler.js";
import { runWorker } from "../../src/worker-client.js";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
test("debounce renders only the most recent source", async () => {
  const inputs = [];
  const scheduler = new RenderScheduler({
    delay: 8,
    render: async (s) => {
      inputs.push(s);
      return {};
    },
    onResult: () => {},
  });
  scheduler.schedule("old");
  scheduler.schedule("new");
  await pause(30);
  assert.deepEqual(inputs, ["new"]);
});
test("in-flight and stale results are discarded immediately on edit", async () => {
  const waiting = [],
    results = [];
  let oldSignal;
  const scheduler = new RenderScheduler({
    delay: 0,
    render: (src, { signal }) => {
      if (src === "old") oldSignal = signal;
      return new Promise((resolve) => waiting.push({ src, resolve }));
    },
    onResult: (r) => results.push(r),
  });
  scheduler.schedule("old");
  await pause(5);
  scheduler.schedule("new");
  assert.equal(oldSignal.aborted, true);
  await pause(5);
  waiting[0].resolve({ src: "old" });
  waiting[1].resolve({ src: "new" });
  await pause(5);
  assert.deepEqual(results, [{ src: "new" }]);
});
test("cancelling pending render produces no result", async () => {
  let count = 0;
  const s = new RenderScheduler({
    delay: 10,
    render: async () => count++,
    onResult: () => {},
  });
  s.schedule("x");
  s.cancel();
  await pause(20);
  assert.equal(count, 0);
});
test("worker termination on success, error, timeout, and cancellation", async () => {
  const instances = [];
  class Worker {
    constructor() {
      instances.push(this);
    }
    postMessage() {}
    terminate() {
      this.terminated = true;
    }
  }
  let task = runWorker("test", {}, { WorkerClass: Worker, timeout: 100 });
  instances.at(-1).onmessage({ data: { html: "done" } });
  assert.equal((await task).html, "done");
  assert.equal(instances.at(-1).terminated, true);
  task = runWorker("test", {}, { WorkerClass: Worker, timeout: 100 });
  instances.at(-1).onmessage({ data: { error: "bad" } });
  await assert.rejects(task, /bad/);
  assert.equal(instances.at(-1).terminated, true);
  await assert.rejects(
    runWorker("test", {}, { WorkerClass: Worker, timeout: 5 }),
    /exceeded/,
  );
  assert.equal(instances.at(-1).terminated, true);
  const controller = new AbortController();
  task = runWorker(
    "test",
    {},
    { WorkerClass: Worker, signal: controller.signal },
  );
  controller.abort();
  await assert.rejects(task, { name: "AbortError" });
  assert.equal(instances.at(-1).terminated, true);
});
