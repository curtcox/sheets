import { test } from "node:test";
import assert from "node:assert/strict";
import { runR } from "../../src/webr-client.js";
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};
function runtime({
  init = async () => {},
  capture = async () => ({ output: [], images: [] }),
} = {}) {
  const log = { created: 0, closed: 0, purged: 0, sources: [] };
  class WebR {
    constructor(options) {
      log.created++;
      assert.ok(options.baseUrl.endsWith("/src/workers/"));
      this.Shelter = class {
        async captureR(source) {
          log.sources.push(source);
          return capture(source);
        }
        async purge() {
          log.purged++;
        }
      };
    }
    init = init;
    close() {
      log.closed++;
    }
  }
  return {
    log,
    loadRuntime: async () => ({ WebR, ChannelType: { PostMessage: 1 } }),
  };
}
test("R controller closes successful and failing interpreters and continues after cell errors", async () => {
  const mock = runtime({
    capture: async (source) => {
      if (source === "bad") throw new Error("cell error");
      return { output: [{ type: "stdout", data: source }], images: [] };
    },
  });
  const result = await runR(
    [{ source: "one" }, { source: "bad" }, { source: "three" }],
    mock,
  );
  assert.deepEqual(
    result.outputs.map((o) => o.stdout || o.error),
    ["one", "cell error", "three"],
  );
  assert.equal(mock.log.closed, 1);
  assert.equal(mock.log.purged, 3);
  const failure = runtime({
    init: async () => {
      throw new Error("startup failed");
    },
  });
  await assert.rejects(
    runR([{ source: "x" }], failure),
    /R could not start: startup failed/,
  );
  assert.equal(failure.log.closed, 1);
});
test("R abort before or during CDN import cannot start a late interpreter", async () => {
  const controller = new AbortController(),
    loaded = deferred(),
    mock = runtime();
  const result = runR([{ source: "x" }], {
    signal: controller.signal,
    loadRuntime: () => loaded.promise,
  });
  controller.abort();
  await assert.rejects(result, { name: "AbortError" });
  loaded.resolve(await mock.loadRuntime());
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(mock.log.created, 0);
  assert.throws(
    () =>
      runR([], { signal: controller.signal, loadRuntime: mock.loadRuntime }),
    { name: "AbortError" },
  );
});
test("R abort closes a worker during initialization and ignores late initialization", async () => {
  const controller = new AbortController(),
    started = deferred(),
    initialized = deferred();
  const mock = runtime({
    init: () => {
      started.resolve();
      return initialized.promise;
    },
  });
  const result = runR([{ source: "never run" }], {
    ...mock,
    signal: controller.signal,
  });
  await started.promise;
  controller.abort();
  await assert.rejects(result, { name: "AbortError" });
  assert.equal(mock.log.closed, 1);
  initialized.resolve();
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(mock.log.sources, []);
});
test("R deadline closes a busy interpreter and ignores a late result", async () => {
  const started = deferred(),
    captured = deferred(),
    mock = runtime({
      capture: () => {
        started.resolve();
        return captured.promise;
      },
    });
  const result = runR([{ source: "repeat {}" }], { ...mock, timeout: 20 });
  await started.promise;
  await assert.rejects(result, /exceeded 0.02 seconds/);
  assert.equal(mock.log.closed, 1);
  captured.resolve({ output: [{ type: "stdout", data: "stale" }], images: [] });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(mock.log.closed, 1);
});
