import { test } from "node:test";
import assert from "node:assert/strict";
import { guardWorker, runR } from "../../src/webr-client.js";
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};
function runtime({
  init = async () => {},
  capture = async () => ({ output: [], images: [] }),
} = {}) {
  const log = { created: 0, closed: 0, purged: 0, sources: [], sandboxes: [] };
  class WebR {
    constructor(options) {
      log.created++;
      assert.ok(options.baseUrl.endsWith("/src/workers/"));
      // The controller receives the sandbox in place of the Worker it constructs.
      this.worker = new globalThis.Worker(options.baseUrl + "webr-worker.js");
      assert.ok(this.worker.postMessage);
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
    start: async (name) => {
      assert.equal(name, "webr-worker.js");
      const sandbox = {
        terminated: false,
        postMessage() {},
        terminate() {
          this.terminated = true;
        },
      };
      log.sandboxes.push(sandbox);
      return sandbox;
    },
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
  assert.ok(mock.log.sandboxes[0].terminated);
  assert.equal(globalThis.Worker, undefined);
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
    start: mock.start,
  });
  controller.abort();
  await assert.rejects(result, { name: "AbortError" });
  loaded.resolve(await mock.loadRuntime());
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(mock.log.created, 0);
  assert.ok(mock.log.sandboxes.every((sandbox) => sandbox.terminated));
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
test("R sandbox passes webR's own messages but drops requests to act on this origin", () => {
  const sandbox = {
    posted: [],
    postMessage(data) {
      this.posted.push(data);
    },
    terminate() {
      this.terminated = true;
    },
  };
  const worker = guardWorker(sandbox),
    received = [];
  worker.onmessage = ({ data }) => received.push(data);
  const send = (data) => sandbox.onmessage({ data });
  send({ type: "response", data: { uuid: "1" } });
  send({ type: "system", data: { type: "console.log", data: "hi" } });
  send({ type: "system", data: { type: "setTimeoutWasm", data: {} } });
  for (const type of [
    "proxyWorker",
    "postMessageWorker",
    "terminateWorker",
    "proxyWebSocket",
    "sendWebSocket",
    "closeWebSocket",
    "unknown",
  ])
    send({
      type: "system",
      data: { type, data: { url: "https://example.invalid/w.js" } },
    });
  assert.deepEqual(
    received.map((data) => data.data?.type || data.type),
    ["response", "console.log", "setTimeoutWasm"],
  );
  worker.postMessage({ type: "init" });
  worker.terminate();
  assert.deepEqual(sandbox.posted, [{ type: "init" }]);
  assert.ok(sandbox.terminated);
});

test("R reports startup, cell progress and the stalled stage on timeout", async () => {
  const messages = [], mock = runtime();
  await runR([{ source: "1", line: 7 }, { source: "2", line: 11 }], {
    ...mock, onProgress: (message) => messages.push(message),
  });
  assert.match(messages[0], /R: Starting sandbox.*90s until timeout/);
  assert.ok(messages.some((message) => /Initializing R/.test(message)));
  assert.ok(messages.some((message) => /Running cell 2 of 2 \(line 11\)/.test(message)));

  const blocked = runtime({ init: () => new Promise(() => {}) });
  await assert.rejects(runR([{ source: "never run" }], { ...blocked, timeout: 20 }), /exceeded 0.02 seconds while R: Initializing R/);
  assert.deepEqual(blocked.log.sources, []);
  assert.ok(blocked.log.sandboxes[0].terminated);
});

test("R sandbox startup errors reject immediately rather than waiting for timeout", async () => {
  const initializing = deferred();
  const mock = runtime({ init: () => {
    initializing.resolve();
    return new Promise(() => {});
  } });
  const result = runR([{ source: "never run" }], mock);
  await initializing.promise;
  mock.log.sandboxes[0].onerror({ message: "SDK download failed" });
  await assert.rejects(result, /R sandbox failed: SDK download failed/);
  assert.ok(mock.log.sandboxes[0].terminated);
  assert.deepEqual(mock.log.sources, []);
});
